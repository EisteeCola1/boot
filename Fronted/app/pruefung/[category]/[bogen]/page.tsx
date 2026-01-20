"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import { ArrowLeft, Clock, Flag, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getUserId } from "@/lib/user-session"
import { createBrowserClient } from "@supabase/ssr"
import { useExam } from "@/lib/exam-context"

interface Question {
  id: string
  question_number: string
  question_text: string
  options: { id: string; option_text: string; is_correct: boolean }[]
  isBasis: boolean
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const { setExamActive } = useExam()
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showBackWarning, setShowBackWarning] = useState(false)

  const category = params.category as string
  const bogenNumber = Number.parseInt(params.bogen as string)

  useEffect(() => {
    setExamActive(true)
    return () => {
      // Don't set to false on unmount - we handle this manually
    }
  }, [setExamActive])

  useEffect(() => {
    loadQuestions()
  }, [category])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = "Du bist noch in einer Prüfung. Wenn du die Seite verlässt, wird die Prüfung nicht gewertet."
      return e.returnValue
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  // Handle browser back button
  useEffect(() => {
    // Push a dummy state to history
    window.history.pushState(null, "", window.location.href)

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      // Push state back so we stay on the page
      window.history.pushState(null, "", window.location.href)
      // Show warning modal
      setShowBackWarning(true)
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  const loadQuestions = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data: modules } = await supabase.from("modules").select("id, name").eq("category", category)

    if (modules && modules.length > 0) {
      const moduleIds = modules.map((m) => m.id)

      const { data: questionsData } = await supabase
        .from("questions")
        .select(`
          id,
          question_number,
          question_text,
          module_id,
          answer_options (
            id,
            option_text,
            is_correct
          )
        `)
        .in("module_id", moduleIds)

      if (questionsData && questionsData.length > 0) {
        const shuffled = questionsData.sort(() => Math.random() - 0.5)

        const examQuestions: Question[] = []

        for (let i = 0; i < Math.min(7, shuffled.length); i++) {
          examQuestions.push({
            id: shuffled[i].id,
            question_number: shuffled[i].question_number,
            question_text: shuffled[i].question_text,
            options: shuffled[i].answer_options || [],
            isBasis: true,
          })
        }

        for (let i = 7; i < Math.min(30, shuffled.length); i++) {
          examQuestions.push({
            id: shuffled[i].id,
            question_number: shuffled[i].question_number,
            question_text: shuffled[i].question_text,
            options: shuffled[i].answer_options || [],
            isBasis: false,
          })
        }

        while (examQuestions.length < 30 && shuffled.length > 0) {
          const randomQ = shuffled[Math.floor(Math.random() * shuffled.length)]
          examQuestions.push({
            id: `${randomQ.id}-${examQuestions.length}`,
            question_number: randomQ.question_number,
            question_text: randomQ.question_text,
            options: randomQ.answer_options || [],
            isBasis: examQuestions.length < 7,
          })
        }

        setQuestions(examQuestions)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswer = (optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIndex].id]: optionId,
    }))
  }

  const handleSubmitClick = () => {
    const unansweredCount = questions.length - Object.keys(answers).length
    if (unansweredCount > 0) {
      setShowWarning(true)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setShowWarning(false)
    setExamActive(false)

    const userId = getUserId()
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data: sheetData } = await supabase
      .from("exam_sheets")
      .select("id")
      .eq("category", category)
      .eq("sheet_number", bogenNumber)
      .maybeSingle()

    let examSheetId = sheetData?.id

    if (!examSheetId) {
      const { data: newSheet } = await supabase
        .from("exam_sheets")
        .insert({ category, sheet_number: bogenNumber })
        .select()
        .single()
      examSheetId = newSheet?.id
    }

    if (!examSheetId) {
      setIsSubmitting(false)
      setExamActive(true)
      return
    }

    let basisCorrect = 0
    let specificCorrect = 0
    const examAnswers: {
      question_id: string
      selected_option_id: string | null
      is_correct: boolean
      is_basis: boolean
    }[] = []

    questions.forEach((question, index) => {
      const selectedOptionId = answers[question.id]
      const correctOption = question.options.find((o) => o.is_correct)
      const isCorrect = selectedOptionId === correctOption?.id

      if (isCorrect) {
        if (question.isBasis) basisCorrect++
        else specificCorrect++
      }

      const parts = question.id.split("-")
      const originalQuestionId = parts.length > 5 ? parts.slice(0, 5).join("-") : question.id

      examAnswers.push({
        question_id: originalQuestionId,
        selected_option_id: selectedOptionId || null,
        is_correct: isCorrect,
        is_basis: question.isBasis,
      })
    })

    const totalCorrect = basisCorrect + specificCorrect
    const passed = basisCorrect >= 5 && specificCorrect >= 18

    const { data: resultData, error: resultError } = await supabase
      .from("exam_results")
      .insert({
        user_id: userId,
        exam_sheet_id: examSheetId,
        category: category,
        basis_correct: basisCorrect,
        basis_total: 7,
        specific_correct: specificCorrect,
        specific_total: 23,
        total_correct: totalCorrect,
        total_questions: 30,
        passed: passed,
        time_seconds: timeElapsed,
      })
      .select()
      .single()

    if (resultData && !resultError) {
      const { error: answersError } = await supabase.from("exam_answers").insert(
        examAnswers.map((a) => ({
          exam_result_id: resultData.id,
          ...a,
        })),
      )

      router.push(`/pruefung/${category}/${bogenNumber}/ergebnis?resultId=${resultData.id}`)
    }

    setIsSubmitting(false)
  }

  const handleBackClick = () => {
    setShowBackWarning(true)
  }

  const handleConfirmBack = () => {
    setShowBackWarning(false)
    setExamActive(false)
    router.push("/pruefung")
  }

  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--theme-bg)" }}>
        <div className="text-white">Lade Fragen...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--theme-bg)" }}>
      <SidebarNav />

      {showBackWarning && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
        >
          <div
            className="rounded-2xl p-6 max-w-md mx-4 border shadow-2xl"
            style={{
              backgroundColor: "rgb(15, 25, 35)",
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white">Prüfung abbrechen?</h3>
            </div>
            <p className="text-white/90 mb-2">
              Wenn du die Prüfung jetzt verlässt, wird sie <span className="font-bold text-red-400">abgebrochen</span>{" "}
              und <span className="font-bold text-red-400">nicht gewertet</span>.
            </p>
            <p className="text-white/60 text-sm mb-6">
              Dein Fortschritt geht verloren und die Prüfung erscheint nicht in deiner Statistik.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBackWarning(false)}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-bg)" }}
              >
                Zurück zur Prüfung
              </button>
              <button
                onClick={handleConfirmBack}
                className="flex-1 px-4 py-3 rounded-xl border transition-all hover:bg-red-500/20"
                style={{ borderColor: "rgba(239, 68, 68, 0.5)", color: "rgb(239, 68, 68)" }}
              >
                Prüfung abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarning && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[100]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
        >
          <div
            className="rounded-2xl p-6 max-w-md mx-4 border shadow-2xl"
            style={{
              backgroundColor: "rgb(15, 25, 35)",
              borderColor: "rgba(255,255,255,0.2)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <h3 className="text-xl font-bold text-white">Achtung!</h3>
            </div>
            <p className="text-white/90 mb-6">
              Du hast noch{" "}
              <span className="font-bold text-yellow-500">
                {unansweredCount} {unansweredCount === 1 ? "Frage" : "Fragen"}
              </span>{" "}
              nicht beantwortet. Möchtest du die Prüfung trotzdem abgeben?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarning(false)}
                className="flex-1 px-4 py-3 rounded-xl border transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.3)", color: "white" }}
              >
                Zurück zur Prüfung
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-bg)" }}
              >
                Trotzdem abgeben
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pl-16 min-h-screen flex flex-col">
        {/* Header */}
        <div
          className="px-8 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-4">
            <button onClick={handleBackClick} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {category === "see" ? "SBF See" : "SBF Binnen"} - Bogen {bogenNumber}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div
                  className="h-2 w-48 rounded-full overflow-hidden"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, backgroundColor: "var(--theme-primary)" }}
                  />
                </div>
                <span className="text-sm text-white/60">{answeredCount}/30 beantwortet</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white/60">
              <Clock className="h-5 w-5" />
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 p-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl">
            {/* Question Number with Type Tag */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: "var(--theme-primary)" }}>
                  Frage {currentIndex + 1}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: currentQuestion.isBasis ? "var(--theme-basis-bg)" : "var(--theme-specific-bg)",
                    color: currentQuestion.isBasis ? "var(--theme-basis)" : "var(--theme-specific)",
                  }}
                >
                  {currentQuestion.isBasis ? "Basisfrage" : category === "see" ? "See-Frage" : "Binnen-Frage"}
                </span>
              </div>
              <span className="text-sm text-white/40">{answeredCount}/30</span>
            </div>

            {/* Question Card */}
            <div
              className="rounded-2xl border p-8 mb-6"
              style={{
                backgroundColor: "var(--theme-card)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <h2 className="text-xl font-semibold text-white mb-8">{currentQuestion.question_text}</h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.slice(0, 4).map((option, index) => {
                  const isSelected = answers[currentQuestion.id] === option.id
                  const letter = String.fromCharCode(65 + index)

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      className="w-full p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        backgroundColor: isSelected ? "var(--theme-primary)" : "rgba(255,255,255,0.05)",
                        borderColor: isSelected ? "var(--theme-primary)" : "rgba(255,255,255,0.1)",
                        color: isSelected ? "var(--theme-bg)" : "white",
                      }}
                    >
                      <span className="font-semibold mr-3">{letter}.</span>
                      {option.option_text}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : questions.length - 1))}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-white/5"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: "white" }}
              >
                <ChevronLeft className="h-5 w-5" />
                Zurück
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  onClick={handleSubmitClick}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--theme-primary)",
                    color: "var(--theme-bg)",
                  }}
                >
                  <Flag className="h-5 w-5" />
                  {isSubmitting ? "Wird abgegeben..." : "Prüfung abgeben"}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((prev) => (prev < questions.length - 1 ? prev + 1 : 0))}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                  style={{
                    backgroundColor: "var(--theme-primary)",
                    color: "var(--theme-bg)",
                  }}
                >
                  Weiter
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Question Grid */}
            <div className="mt-8 p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-white/60">Fragenübersicht</span>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: "var(--theme-basis-bg)" }}></span>
                    Basis (1-7)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: "var(--theme-specific-bg)" }}></span>
                    {category === "see" ? "See" : "Binnen"} (8-30)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-10 gap-2">
                {questions.map((q, index) => {
                  const isAnswered = !!answers[q.id]
                  const isCurrent = index === currentIndex
                  const isBasis = index < 7

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(index)}
                      className="w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: isCurrent
                          ? "var(--theme-primary)"
                          : isAnswered
                            ? isBasis
                              ? "var(--theme-basis-bg)"
                              : "var(--theme-specific-bg)"
                            : "rgba(255,255,255,0.1)",
                        color: isCurrent ? "var(--theme-bg)" : "white",
                        border: isBasis && !isCurrent ? `1px solid var(--theme-basis-bg)` : "none",
                      }}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
