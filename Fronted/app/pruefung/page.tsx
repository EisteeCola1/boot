"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import { FileText, Info, Ship, Sailboat, CheckCircle, X, Clock } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { getUserId } from "@/lib/user-session"
import { createBrowserClient } from "@supabase/ssr"

interface ExamSheet {
  id: string
  sheet_number: number
  category: string
  lastScore?: number
  lastAttempt?: string
}

interface ExamResult {
  exam_sheet_id: string
  total_correct: number
  total_questions: number
  completed_at: string
  passed: boolean
}

export default function PruefungPage() {
  const [activeTab, setActiveTab] = useState<"see" | "binnen">("see")
  const [examSheets, setExamSheets] = useState<ExamSheet[]>([])
  const [results, setResults] = useState<Record<string, ExamResult>>({})

  useEffect(() => {
    loadExamSheets()
    loadResults()
  }, [])

  const loadExamSheets = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data } = await supabase.from("exam_sheets").select("*").order("sheet_number")

    if (data) {
      setExamSheets(data)
    }
  }

  const loadResults = async () => {
    const userId = getUserId()
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { data } = await supabase
      .from("exam_results")
      .select("exam_sheet_id, total_correct, total_questions, completed_at, passed")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (data) {
      // Group by exam_sheet_id and take the latest result
      const resultMap: Record<string, ExamResult> = {}
      data.forEach((result) => {
        if (!resultMap[result.exam_sheet_id]) {
          resultMap[result.exam_sheet_id] = result
        }
      })
      setResults(resultMap)
    }
  }

  const filteredSheets = examSheets.filter((sheet) => sheet.category === activeTab)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--theme-bg)" }}>
      <SidebarNav />

      <main className="pl-16">
        {/* Header */}
        <div className="relative overflow-hidden border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-20 text-8xl opacity-20">📋</div>
          </div>

          <div className="relative px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <FileText className="h-6 w-6" style={{ color: "var(--theme-bg)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--theme-primary)" }}>
                  Prüfungssimulation
                </p>
                <h1 className="text-3xl font-bold text-white">Herzlich willkommen zu den Prüfungsaufgaben!</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Info Box */}
          <div
            className="rounded-2xl border p-6 mb-8"
            style={{
              backgroundColor: "var(--theme-card)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "var(--theme-primary)" }} />
              <div className="text-white/80 space-y-2">
                <p>
                  Hier findest Du alle <strong className="text-white">15 offiziellen Prüfungsbögen</strong> für den
                  Sportbootführerschein Binnen und See. Diese Fragen kommen genau so in der Prüfung dran. Die Bögen
                  haben immer die gleiche Zusammensetzung, sodass Du Dich gezielt und effizient vorbereiten kannst.
                </p>
                <p>
                  Alle Prüfungsbögen enthalten <strong className="text-white">30 Multiple-Choice-Fragen</strong>. Jeder
                  Bogen beinhaltet <strong style={{ color: "var(--theme-primary)" }}>7 Basisfragen</strong>, bei denen
                  allgemeines Wissen abgefragt wird. Die anderen Fragen sind{" "}
                  <strong style={{ color: "var(--theme-primary)" }}>23 spezifische Fragen</strong> aus dem Bereich See
                  oder Binnen.
                </p>
                <p className="text-white/60">
                  <strong>Bestehensgrenze:</strong> Mindestens 5 von 7 Basisfragen und 18 von 23 spezifischen Fragen
                  müssen richtig sein.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("see")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "see" ? "" : "hover:bg-white/5"
              }`}
              style={
                activeTab === "see"
                  ? { backgroundColor: "var(--theme-primary)", color: "var(--theme-bg)" }
                  : { color: "white" }
              }
            >
              <Ship className="h-5 w-5" />
              SBF See
            </button>
            <button
              onClick={() => setActiveTab("binnen")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === "binnen" ? "" : "hover:bg-white/5"
              }`}
              style={
                activeTab === "binnen"
                  ? { backgroundColor: "var(--theme-primary)", color: "var(--theme-bg)" }
                  : { color: "white" }
              }
            >
              <Sailboat className="h-5 w-5" />
              SBF Binnen
            </button>
          </div>

          {/* Exam Sheets Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredSheets.map((sheet) => {
              const result = results[sheet.id]
              const percentage = result ? Math.round((result.total_correct / result.total_questions) * 100) : 0
              const hasAttempt = !!result

              return (
                <Link key={sheet.id} href={`/pruefung/${sheet.category}/${sheet.sheet_number}`} className="group">
                  <div
                    className="p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.03] hover:border-opacity-50 min-h-[140px] flex flex-col"
                    style={{
                      backgroundColor: "var(--theme-card)",
                      borderColor: hasAttempt ? "var(--theme-primary)" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    {/* Progress Circle */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative w-14 h-14">
                        <svg className="w-14 h-14 transform -rotate-90">
                          <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                          <circle
                            cx="28"
                            cy="28"
                            r="24"
                            fill="none"
                            stroke={hasAttempt ? "var(--theme-primary)" : "rgba(255,255,255,0.2)"}
                            strokeWidth="4"
                            strokeDasharray={`${percentage * 1.51} 151`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="text-sm font-bold"
                            style={{ color: hasAttempt ? "var(--theme-primary)" : "white" }}
                          >
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Bogen {sheet.sheet_number}</h3>
                        <p className="text-white/50 text-sm">{hasAttempt ? `${result.total_correct}/30` : "0/30"}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-center text-xs mt-auto">
                      {hasAttempt ? (
                        result.passed ? (
                          <div className="flex items-center gap-1" style={{ color: "rgb(34, 197, 94)" }}>
                            <CheckCircle className="w-[25px] h-[14px]" />
                            <span>Bestanden</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1" style={{ color: "rgb(239, 68, 68)" }}>
                            <X className="w-[25px] h-[16px]" />
                            <span>Nicht bestanden</span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                          <Clock className="w-[25px] h-[14px]" />
                          <span>Noch nicht gestartet</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
