"use server"

import { createClient } from "@/lib/supabase"

export async function saveAnswer(userId: string, questionId: string, selectedOptionId: string, isCorrect: boolean) {
  const supabase = createClient()

  // Save the answer
  const { error } = await supabase.from("user_answers").insert({
    user_id: userId,
    question_id: questionId,
    selected_option_id: selectedOptionId,
    is_correct: isCorrect,
  })

  if (error) {
    console.error("Error saving answer:", error)
    return { success: false, error: error.message }
  }

  // Get current progress
  const { data: existingProgress } = await supabase
    .from("user_question_progress")
    .select("correct_streak")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle()

  const currentStreak = existingProgress?.correct_streak || 0
  let newStreak: number
  let isMastered: boolean

  if (isCorrect) {
    newStreak = Math.min(currentStreak + 1, 3)
  } else {
    newStreak = 0
  }
  isMastered = newStreak >= 3

  // Upsert progress
  const { error: progressError } = await supabase.from("user_question_progress").upsert(
    {
      user_id: userId,
      question_id: questionId,
      correct_streak: newStreak,
      is_mastered: isMastered,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,question_id",
    },
  )

  if (progressError) {
    console.error("Error updating progress:", progressError)
  }

  return { success: true, newStreak, isMastered }
}

export async function toggleBookmark(userId: string, questionId: string) {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from("bookmarked_questions")
    .select("id")
    .eq("user_id", userId)
    .eq("question_id", questionId)
    .maybeSingle()

  if (existing) {
    // Remove bookmark
    const { error } = await supabase.from("bookmarked_questions").delete().eq("id", existing.id)

    if (error) {
      console.error("Error removing bookmark:", error)
      return { success: false, bookmarked: true, error: error.message }
    }

    return { success: true, bookmarked: false }
  } else {
    // Add bookmark
    const { error } = await supabase.from("bookmarked_questions").insert({
      user_id: userId,
      question_id: questionId,
    })

    if (error) {
      console.error("Error adding bookmark:", error)
      return { success: false, bookmarked: false, error: error.message }
    }

    return { success: true, bookmarked: true }
  }
}

export async function getUserProgress(userId: string, moduleId: string) {
  const supabase = createClient()

  // Get all questions for this module - check both direct questions and shared questions via junction table
  const { data: directQuestions } = await supabase.from("questions").select("id").eq("module_id", moduleId)
  
  const { data: sharedQuestions } = await supabase
    .from("module_questions")
    .select("question_id")
    .eq("module_id", moduleId)

  const questionIds = [
    ...(directQuestions?.map((q) => q.id) || []),
    ...(sharedQuestions?.map((q) => q.question_id) || [])
  ]

  if (questionIds.length === 0) {
    return { answers: [], bookmarks: [], progress: [] }
  }

  // Get progress data for these questions
  const { data: progressData } = await supabase
    .from("user_question_progress")
    .select("question_id, correct_streak, is_mastered")
    .eq("user_id", userId)
    .in("question_id", questionIds)

  // Get all user answers for these questions
  const { data: answers, error: answersError } = await supabase
    .from("user_answers")
    .select("question_id, selected_option_id, is_correct, answered_at")
    .eq("user_id", userId)
    .in("question_id", questionIds)
    .order("answered_at", { ascending: false })

  if (answersError) {
    console.error("Error fetching answers:", answersError)
    return { answers: [], bookmarks: [], progress: [] }
  }

  // Get only the latest answer for each question
  const latestAnswers = new Map()
  answers?.forEach((answer) => {
    if (!latestAnswers.has(answer.question_id)) {
      latestAnswers.set(answer.question_id, answer)
    }
  })

  // Get all bookmarks for this user
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from("bookmarked_questions")
    .select("question_id")
    .eq("user_id", userId)
    .in("question_id", questionIds)

  if (bookmarksError) {
    console.error("Error fetching bookmarks:", bookmarksError)
    return { answers: Array.from(latestAnswers.values()), bookmarks: [], progress: progressData || [] }
  }

  return {
    answers: Array.from(latestAnswers.values()),
    bookmarks: bookmarks || [],
    progress: progressData || [],
  }
}

export async function getModuleProgress(
  userId: string,
  moduleId: string,
): Promise<{ total: number; mastered: number; percentage: number }> {
  const supabase = createClient()

  // Get all questions for this module - both direct and shared
  const { data: directQuestions } = await supabase.from("questions").select("id").eq("module_id", moduleId)
  
  const { data: sharedQuestions } = await supabase
    .from("module_questions")
    .select("question_id")
    .eq("module_id", moduleId)

  const questionIds = [
    ...(directQuestions?.map((q) => q.id) || []),
    ...(sharedQuestions?.map((q) => q.question_id) || [])
  ]

  const totalQuestions = questionIds.length

  if (totalQuestions === 0) {
    return { total: 0, mastered: 0, percentage: 0 }
  }

  // Get mastered questions for this module
  const { data: masteredData } = await supabase
    .from("user_question_progress")
    .select("question_id")
    .eq("user_id", userId)
    .eq("is_mastered", true)
    .in("question_id", questionIds)

  const mastered = masteredData?.length || 0

  return {
    total: totalQuestions,
    mastered,
    percentage: totalQuestions ? Math.round((mastered / totalQuestions) * 100) : 0,
  }
}

export async function getCategoryProgress(userId: string, category: string): Promise<Record<string, number>> {
  const supabase = createClient()

  // Get all modules for this category with their shared module relationships
  const { data: modules, error } = await supabase
    .from("modules")
    .select("id, name, slug, shared_with_module_id")
    .eq("category", category)

  if (error || !modules || modules.length === 0) {
    return {}
  }

  const moduleIds = modules.map((m) => m.id)
  
  // Also get shared module IDs
  const sharedModuleIds = modules
    .map((m) => m.shared_with_module_id)
    .filter((id): id is string => id !== null)
  
  const allModuleIds = [...moduleIds, ...sharedModuleIds]

  // Get all questions for all modules (including shared ones) in one query
  const { data: allQuestions } = await supabase.from("questions").select("id, module_id").in("module_id", allModuleIds)

  if (!allQuestions || allQuestions.length === 0) {
    return modules.reduce((acc, m) => ({ ...acc, [m.id]: 0 }), {})
  }

  const questionIds = allQuestions.map((q) => q.id)

  // Get all mastered progress in one query
  const { data: masteredData } = await supabase
    .from("user_question_progress")
    .select("question_id")
    .eq("user_id", userId)
    .eq("is_mastered", true)
    .in("question_id", questionIds)

  const masteredSet = new Set(masteredData?.map((m) => m.question_id) || [])

  // Calculate progress for each module
  const progressMap: Record<string, number> = {}

  for (const module of modules) {
    // Get questions for this module AND its shared module
    const relatedModuleIds = [module.id]
    if (module.shared_with_module_id) {
      relatedModuleIds.push(module.shared_with_module_id)
    }
    
    const moduleQuestions = allQuestions.filter((q) => relatedModuleIds.includes(q.module_id))
    const total = moduleQuestions.length
    const mastered = moduleQuestions.filter((q) => masteredSet.has(q.id)).length
    progressMap[module.id] = total > 0 ? Math.round((mastered / total) * 100) : 0
  }

  return progressMap
}

export async function getUserStats(userId: string) {
  const supabase = createClient()

  // Run all queries in parallel
  const [masteredResult, answeredResult, examsResult] = await Promise.all([
    // Get total mastered questions
    supabase
      .from("user_question_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_mastered", true),

    // Get total answered questions
    supabase
      .from("user_answers")
      .select("question_id")
      .eq("user_id", userId),

    // Get exam results
    supabase
      .from("exam_results")
      .select("passed", { count: "exact" })
      .eq("user_id", userId),
  ])

  const uniqueAnswered = answeredResult.data ? new Set(answeredResult.data.map((a) => a.question_id)).size : 0

  const passedExams = examsResult.data?.filter((e) => e.passed).length || 0

  return {
    totalMastered: masteredResult.count || 0,
    totalAnswered: uniqueAnswered,
    totalExams: examsResult.count || 0,
    passedExams,
  }
}

export async function getAllProgressStats(userId: string) {
  const supabase = createClient()

  // Run all queries in parallel
  const [modulesResult, questionsResult, progressResult, answersResult, examsResult] = await Promise.all([
    supabase.from("modules").select("id, name, slug, category"),
    supabase.from("questions").select("id, module_id"),
    supabase.from("user_question_progress").select("question_id, is_mastered").eq("user_id", userId),
    supabase.from("user_answers").select("question_id").eq("user_id", userId),
    supabase.from("exam_results").select("passed", { count: "exact" }).eq("user_id", userId),
  ])

  const modules = modulesResult.data || []
  const questions = questionsResult.data || []
  const progress = progressResult.data || []
  const answers = answersResult.data || []
  const exams = examsResult.data || []

  // Create lookup maps
  const masteredSet = new Set(progress.filter((p) => p.is_mastered).map((p) => p.question_id))
  const questionsByModule = new Map<string, string[]>()

  questions.forEach((q) => {
    const existing = questionsByModule.get(q.module_id) || []
    existing.push(q.id)
    questionsByModule.set(q.module_id, existing)
  })

  // Calculate module progress
  const moduleProgress: Record<string, number> = {}
  const categoryProgress: Record<string, number[]> = { see: [], binnen: [] }

  modules.forEach((module) => {
    const moduleQuestionIds = questionsByModule.get(module.id) || []
    const total = moduleQuestionIds.length
    const mastered = moduleQuestionIds.filter((id) => masteredSet.has(id)).length
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0

    moduleProgress[module.id] = percentage

    if (module.category === "see" || module.category === "binnen") {
      categoryProgress[module.category].push(percentage)
    }
  })

  // Calculate averages
  const seeAvg =
    categoryProgress.see.length > 0
      ? Math.round(categoryProgress.see.reduce((a, b) => a + b, 0) / categoryProgress.see.length)
      : 0
  const binnenAvg =
    categoryProgress.binnen.length > 0
      ? Math.round(categoryProgress.binnen.reduce((a, b) => a + b, 0) / categoryProgress.binnen.length)
      : 0

  const uniqueAnswered = new Set(answers.map((a) => a.question_id)).size
  const passedExams = exams.filter((e) => e.passed).length

  return {
    moduleProgress,
    seeProgress: seeAvg,
    binnenProgress: binnenAvg,
    totalMastered: masteredSet.size,
    totalAnswered: uniqueAnswered,
    totalExams: examsResult.count || 0,
    passedExams,
  }
}
