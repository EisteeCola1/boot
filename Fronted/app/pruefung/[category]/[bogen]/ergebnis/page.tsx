"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Home } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

interface ExamResult {
  id: string
  basis_correct: number
  basis_total: number
  specific_correct: number
  specific_total: number
  total_correct: number
  total_questions: number
  passed: boolean
  time_seconds: number
  category: string
}

interface ExamAnswer {
  question_id: string
  selected_option_id: string | null
  is_correct: boolean
  is_basis: boolean
  question?: {
    id: string
    question_text: string
    answer_options: { id: string; option_text: string; is_correct: boolean }[]
  }
}

function ErgebnisContent() {
  const params = useParams()
  const category = params.category as string
  const bogenNumber = params.bogen as string

  const searchParams = useSearchParams()
  const resultId = searchParams.get("resultId")

  const [result, setResult] = useState<ExamResult | null>(null)
  const [answers, setAnswers] = useState<ExamAnswer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (resultId) {
      loadResult()
    }
  }, [resultId])

  const loadResult = async () => {
    setIsLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data: resultData, error: resultError } = await supabase
      .from("exam_results")
      .select("*")
      .eq("id", resultId)
      .single()

    if (resultData) {
      setResult(resultData)
    }

    const { data: answersData, error: answersError } = await supabase
      .from("exam_answers")
      .select(`
        question_id,
        selected_option_id,
        is_correct,
        is_basis
      `)
      .eq("exam_result_id", resultId)
      .order("created_at", { ascending: true })

    if (answersData && answersData.length > 0) {
      const realQuestionIds = answersData.map((a) => {
        const parts = a.question_id.split("-")
        if (parts.length > 5) {
          return parts.slice(0, 5).join("-")
        }
        return a.question_id
      })
      const uniqueQuestionIds = [...new Set(realQuestionIds)]

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
          id,
          question_text,
          answer_options (
            id,
            option_text,
            is_correct
          )
        `)
        .in("id", uniqueQuestionIds)

      const answersWithQuestions = answersData.map((answer, index) => {
        const parts = answer.question_id.split("-")
        const realQuestionId = parts.length > 5 ? parts.slice(0, 5).join("-") : answer.question_id

        const question = questionsData?.find((q) => q.id === realQuestionId)

        return {
          ...answer,
          question: question || undefined,
        }
      })

      setAnswers(answersWithQuestions)
    }
    setIsLoading(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (isLoading || !result) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-white">Lade Ergebnis...</div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="px-8 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <Link
          href="/pruefung"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Übersicht
        </Link>
        <h1 className="text-2xl font-bold text-white">Dein Prüfungsergebnis:</h1>
      </div>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {/* Result Summary */}
          <div
            className="rounded-2xl border p-8 mb-8"
            style={{
              backgroundColor: "var(--theme-card)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-center gap-8">
              {/* Smiley */}
              <div className="flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-6xl border-4"
                  style={{
                    borderColor: result.passed ? "#22c55e" : "#ef4444",
                  }}
                >
                  {result.passed ? "😊" : "😔"}
                </div>
              </div>

              {/* Status */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2" style={{ color: result.passed ? "#22c55e" : "#ef4444" }}>
                  {result.passed ? "Bestanden!" : "Nicht bestanden"}
                </h2>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{
                    backgroundColor: result.passed ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                    color: result.passed ? "#22c55e" : "#ef4444",
                  }}
                >
                  {result.total_correct} / {result.total_questions} Richtig
                </div>
              </div>

              {/* Stats Table */}
              <div className="text-right">
                <div className="text-sm text-white/40 mb-1">{formatTime(result.time_seconds)}</div>
                <table className="text-sm">
                  <thead>
                    <tr className="text-white/40">
                      <th className="pr-4 text-left">Kategorie</th>
                      <th className="pr-4">Richtig</th>
                      <th className="pr-4">Benötigt</th>
                      <th>Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-white">
                      <td className="pr-4 font-medium">Basis</td>
                      <td className="pr-4 text-center">{result.basis_correct}</td>
                      <td className="pr-4 text-center">5</td>
                      <td className="text-center">{result.basis_total}</td>
                    </tr>
                    <tr className="text-white">
                      <td className="pr-4 font-medium">{category === "see" ? "SBF See" : "SBF Binnen"}</td>
                      <td className="pr-4 text-center">{result.specific_correct}</td>
                      <td className="pr-4 text-center">18</td>
                      <td className="text-center">{result.specific_total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <Link
              href={`/pruefung/${category}/${bogenNumber}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border transition-all duration-200 hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "white" }}
            >
              <RotateCcw className="h-5 w-5" />
              Nochmal versuchen
            </Link>
            <Link
              href="/pruefung"
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: "var(--theme-primary)",
                color: "var(--theme-bg)",
              }}
            >
              <Home className="h-5 w-5" />
              Alle Prüfungsbögen
            </Link>
          </div>

          {/* Questions Review */}
          <h3 className="text-lg font-semibold text-white mb-4">Alle Fragen im Überblick:</h3>

          {answers.length === 0 ? (
            <div className="text-white/60 text-center py-8">Keine Antworten gefunden.</div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer, index) => {
                const question = answer.question
                if (!question) {
                  return (
                    <div
                      key={`missing-${index}`}
                      className="rounded-xl border p-6"
                      style={{
                        backgroundColor: "var(--theme-card)",
                        borderColor: "rgba(255,255,255,0.1)",
                      }}
                    >
                      <div className="text-white/60">Frage {index + 1} konnte nicht geladen werden.</div>
                    </div>
                  )
                }

                return (
                  <div
                    key={`${answer.question_id}-${index}`}
                    className="rounded-xl border p-6"
                    style={{
                      backgroundColor: "var(--theme-card)",
                      borderColor: answer.is_correct ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)",
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: answer.is_correct ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        }}
                      >
                        {answer.is_correct ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium" style={{ color: "var(--theme-primary)" }}>
                            Frage {index + 1}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: answer.is_basis ? "var(--theme-basis-bg)" : "var(--theme-specific-bg)",
                              color: answer.is_basis ? "var(--theme-basis)" : "var(--theme-specific)",
                            }}
                          >
                            {answer.is_basis ? "Basisfrage" : category === "see" ? "See-Frage" : "Binnen-Frage"}
                          </span>
                        </div>
                        <p className="text-white mb-4">{question.question_text}</p>

                        {/* Options */}
                        <div className="space-y-2">
                          {question.answer_options?.slice(0, 4).map((option, optIndex) => {
                            const isSelected = option.id === answer.selected_option_id
                            const isCorrect = option.is_correct
                            const letter = String.fromCharCode(65 + optIndex)

                            let bgColor = "rgba(255,255,255,0.05)"
                            let textColor = "white"
                            let borderColor = "transparent"

                            if (isCorrect) {
                              bgColor = "rgba(34, 197, 94, 0.2)"
                              textColor = "#22c55e"
                              borderColor = "#22c55e"
                            } else if (isSelected && !isCorrect) {
                              bgColor = "rgba(239, 68, 68, 0.2)"
                              textColor = "#ef4444"
                              borderColor = "#ef4444"
                            }

                            return (
                              <div
                                key={option.id}
                                className="p-3 rounded-lg border"
                                style={{
                                  backgroundColor: bgColor,
                                  color: textColor,
                                  borderColor: borderColor,
                                }}
                              >
                                <span className="font-semibold mr-2">{letter}.</span>
                                {option.option_text}
                                {isCorrect && <span className="ml-2 font-bold">✓ Richtig</span>}
                                {isSelected && !isCorrect && <span className="ml-2 font-bold">✗ Deine Antwort</span>}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function ErgebnisPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--theme-bg)" }}>
      <SidebarNav />

      <main className="pl-16">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-white">Lade Ergebnis...</div>
            </div>
          }
        >
          <ErgebnisContent />
        </Suspense>
      </main>
    </div>
  )
}
