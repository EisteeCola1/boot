import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { QuestionView } from "@/components/question-view"

export const dynamic = "force-dynamic"

async function getModuleData(slug: string) {
  const supabase = createClient()

  // Get module
  const { data: module, error: moduleError } = await supabase.from("modules").select("*").eq("slug", slug).single()

  if (moduleError || !module) {
    return null
  }

  // Get direct questions with answers
  const { data: directQuestions, error: questionsError } = await supabase
    .from("questions")
    .select(`
      *,
      answer_options (*)
    `)
    .eq("module_id", module.id)
    .order("question_number", { ascending: true })

  if (questionsError) {
    console.error("Error fetching questions:", questionsError)
  }

  // Get shared questions via junction table
  const { data: sharedQuestionIds } = await supabase
    .from("module_questions")
    .select("question_id")
    .eq("module_id", module.id)
  
  const sharedIds = sharedQuestionIds?.map((q: { question_id: any }) => q.question_id) || []
  
  let sharedQuestions = []
  if (sharedIds.length > 0) {
    const { data } = await supabase
      .from("questions")
      .select(`
        *,
        answer_options (*)
      `)
      .in("id", sharedIds)
      .order("question_number", { ascending: true })
    
    sharedQuestions = data || []
  }
  
  // Combine both and remove duplicates
  const allQuestions = [...(directQuestions || []), ...sharedQuestions]
  const uniqueQuestions = allQuestions.filter((q, index, self) => 
    index === self.findIndex(t => t.id === q.id)
  )

  return { module, questions: uniqueQuestions }
}

export default async function ModulePage({
                                           params,
                                         }: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const { slug } = await Promise.resolve(params)

  const data = await getModuleData(slug)

  if (!data) {
    notFound()
  }

  return <QuestionView module={data.module} questions={data.questions} />
}
