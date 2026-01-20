"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Module, QuestionWithAnswers } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Bookmark, Check, X, RotateCcw, Anchor, Ship, Waves, Compass } from "lucide-react"
import { cn } from "@/lib/utils"
import { saveAnswer, toggleBookmark, getUserProgress } from "@/lib/actions"
import { getUserId } from "@/lib/user-session"

interface QuestionViewProps {
  module: Module
  questions: QuestionWithAnswers[]
}

interface UserProgress {
  [questionId: string]: {
    selectedOptionId: string
    isCorrect: boolean
    isBookmarked: boolean
    correctStreak: number
  }
}

type FilterType = "all" | "unanswered" | "incorrect" | "correct" | "bookmarked"

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function QuestionView({ module, questions }: QuestionViewProps) {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all")
  const [userProgress, setUserProgress] = useState<UserProgress>({})
  const [userId, setUserId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isFilterChanging, setIsFilterChanging] = useState(false)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [shuffledQuestions, setShuffledQuestions] = useState<QuestionWithAnswers[]>([])
  const [frozenFilteredQuestions, setFrozenFilteredQuestions] = useState<QuestionWithAnswers[]>([])
  const [needsFilterRefresh, setNeedsFilterRefresh] = useState(false)

  useEffect(() => {
    setShuffledQuestions(shuffleArray(questions))
  }, [questions])

  const computeFilteredQuestions = useMemo(() => {
    switch (selectedFilter) {
      case "unanswered":
        return shuffledQuestions.filter((q) => !userProgress[q.id]?.selectedOptionId)
      case "incorrect":
        return shuffledQuestions.filter((q) => userProgress[q.id]?.selectedOptionId && !userProgress[q.id].isCorrect)
      case "correct":
        return shuffledQuestions.filter((q) => userProgress[q.id]?.isCorrect)
      case "bookmarked":
        return shuffledQuestions.filter((q) => userProgress[q.id]?.isBookmarked)
      default:
        return shuffledQuestions
    }
  }, [shuffledQuestions, userProgress, selectedFilter])

  useEffect(() => {
    if (shuffledQuestions.length > 0 && (frozenFilteredQuestions.length === 0 || needsFilterRefresh)) {
      setFrozenFilteredQuestions(computeFilteredQuestions)
      setNeedsFilterRefresh(false)
    }
  }, [computeFilteredQuestions, shuffledQuestions.length, needsFilterRefresh, frozenFilteredQuestions.length])

  useEffect(() => {
    async function loadUserProgress() {
      const currentUserId = getUserId()
      setUserId(currentUserId)

      const progressData = await getUserProgress(currentUserId, module.id)

      if (progressData) {
        const userProgressMap: UserProgress = {}

        progressData.progress?.forEach((p: any) => {
          userProgressMap[p.question_id] = {
            selectedOptionId: "",
            isCorrect: false,
            isBookmarked: false,
            correctStreak: p.correct_streak || 0,
          }
        })

        // Merge with latest answers
        progressData.answers?.forEach((answer: any) => {
          if (userProgressMap[answer.question_id]) {
            userProgressMap[answer.question_id].selectedOptionId = answer.selected_option_id
            userProgressMap[answer.question_id].isCorrect = answer.is_correct
          } else {
            userProgressMap[answer.question_id] = {
              selectedOptionId: answer.selected_option_id,
              isCorrect: answer.is_correct,
              isBookmarked: false,
              correctStreak: 0,
            }
          }
        })

        // Merge bookmarks
        progressData.bookmarks?.forEach((bookmark: any) => {
          if (userProgressMap[bookmark.question_id]) {
            userProgressMap[bookmark.question_id].isBookmarked = true
          } else {
            userProgressMap[bookmark.question_id] = {
              selectedOptionId: "",
              isCorrect: false,
              isBookmarked: true,
              correctStreak: 0,
            }
          }
        })

        setUserProgress(userProgressMap)
      }

      setIsLoading(false)
    }

    loadUserProgress()
  }, [module.id])

  const stats = useMemo(() => {
    const total = shuffledQuestions.length
    const answeredQuestions = Object.keys(userProgress).filter(
      (qId) => shuffledQuestions.some((q) => q.id === qId) && userProgress[qId].selectedOptionId,
    )
    const answered = answeredQuestions.length
    const correct = answeredQuestions.filter((qId) => userProgress[qId]?.isCorrect).length
    const incorrect = answeredQuestions.filter(
      (qId) => userProgress[qId]?.selectedOptionId && !userProgress[qId]?.isCorrect,
    ).length
    const bookmarked = Object.keys(userProgress).filter(
      (qId) => shuffledQuestions.some((q) => q.id === qId) && userProgress[qId]?.isBookmarked,
    ).length
    const mastered = Object.keys(userProgress).filter(
      (qId) => shuffledQuestions.some((q) => q.id === qId) && userProgress[qId]?.correctStreak >= 3,
    ).length

    return { total, answered, unanswered: total - answered, correct, incorrect, bookmarked, mastered }
  }, [shuffledQuestions, userProgress])

  const overallProgress = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0

  const currentQuestion = frozenFilteredQuestions[currentQuestionIndex]

  useEffect(() => {
    setSelectedOption(null)
    setIsSubmitted(false)
  }, [currentQuestionIndex])

  const handleOptionSelect = (optionId: string) => {
    if (!isSubmitted) {
      setSelectedOption(optionId)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion) return

    const option = currentQuestion.answer_options.find((o) => o.id === selectedOption)
    if (!option) return

    setIsSubmitted(true)

    const currentStreak = userProgress[currentQuestion.id]?.correctStreak || 0
    let newStreak = currentStreak
    if (option.is_correct) {
      newStreak = Math.min(currentStreak + 1, 3)
    } else {
      newStreak = 0
    }

    setUserProgress((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionId: option.id,
        isCorrect: option.is_correct,
        isBookmarked: prev[currentQuestion.id]?.isBookmarked || false,
        correctStreak: newStreak,
      },
    }))

    if (userId) {
      await saveAnswer(userId, currentQuestion.id, option.id, option.is_correct)
    }
  }

  const handleBookmark = async () => {
    if (!currentQuestion) return
    const currentBookmarkState = userProgress[currentQuestion.id]?.isBookmarked || false

    setUserProgress((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...prev[currentQuestion.id],
        selectedOptionId: prev[currentQuestion.id]?.selectedOptionId || "",
        isCorrect: prev[currentQuestion.id]?.isCorrect || false,
        isBookmarked: !currentBookmarkState,
        correctStreak: prev[currentQuestion.id]?.correctStreak || 0,
      },
    }))

    if (userId) {
      await toggleBookmark(userId, currentQuestion.id)
    }
  }

  const handleNext = () => {
    const nextIndex = currentQuestionIndex + 1

    let updatedFilteredQuestions: QuestionWithAnswers[]
    switch (selectedFilter) {
      case "unanswered":
        updatedFilteredQuestions = shuffledQuestions.filter((q) => !userProgress[q.id]?.selectedOptionId)
        break
      case "incorrect":
        updatedFilteredQuestions = shuffledQuestions.filter(
          (q) => userProgress[q.id]?.selectedOptionId && !userProgress[q.id].isCorrect,
        )
        break
      case "correct":
        updatedFilteredQuestions = shuffledQuestions.filter((q) => userProgress[q.id]?.isCorrect)
        break
      case "bookmarked":
        updatedFilteredQuestions = shuffledQuestions.filter((q) => userProgress[q.id]?.isBookmarked)
        break
      default:
        updatedFilteredQuestions = shuffledQuestions
    }

    setFrozenFilteredQuestions(updatedFilteredQuestions)

    if (updatedFilteredQuestions.length === 0) {
      return
    }

    if (selectedFilter === "correct" || selectedFilter === "bookmarked") {
      if (nextIndex >= updatedFilteredQuestions.length) {
        setShuffledQuestions(shuffleArray(questions))
        setCurrentQuestionIndex(0)
      } else {
        setCurrentQuestionIndex(nextIndex)
      }
    } else {
      if (nextIndex < updatedFilteredQuestions.length) {
        setCurrentQuestionIndex(nextIndex)
      } else if (updatedFilteredQuestions.length > 0) {
        setCurrentQuestionIndex(0)
      }
    }

    setSelectedOption(null)
    setIsSubmitted(false)
  }

  const handlePrevious = () => {
    if (frozenFilteredQuestions.length === 0) return
    if (currentQuestionIndex === 0) {
      setCurrentQuestionIndex(frozenFilteredQuestions.length - 1)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNavigateNext = () => {
    if (frozenFilteredQuestions.length === 0) return
    if (currentQuestionIndex >= frozenFilteredQuestions.length - 1) {
      setCurrentQuestionIndex(0)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleFilterChange = (filter: FilterType) => {
    setIsFilterChanging(true)
    setSelectedFilter(filter)
    setCurrentQuestionIndex(0)
    setNeedsFilterRefresh(true)
    setSelectedOption(null)
    setIsSubmitted(false)
    setTimeout(() => setIsFilterChanging(false), 300)
  }

  const handleStartOver = () => {
    setShuffledQuestions(shuffleArray(questions))
    setSelectedFilter("all")
    setCurrentQuestionIndex(0)
    setSelectedOption(null)
    setIsSubmitted(false)
    setNeedsFilterRefresh(true)
  }

  const getFilterDisplayName = () => {
    switch (selectedFilter) {
      case "incorrect":
        return "falsch beantworteten"
      case "unanswered":
        return "unbeantworteten"
      default:
        return ""
    }
  }

  const showCompletionMessage =
    computeFilteredQuestions.length === 0 && (selectedFilter === "unanswered" || selectedFilter === "incorrect")
  const showNoQuestionsYet =
    computeFilteredQuestions.length === 0 && (selectedFilter === "correct" || selectedFilter === "bookmarked")
  const correctStreak = currentQuestion ? userProgress[currentQuestion.id]?.correctStreak || 0 : 0
  const answerLabels = ["A", "B", "C", "D"]

  const filters: { type: FilterType; label: string; count: number; icon: React.ReactNode }[] = [
    { type: "all", label: "Alle Fragen", count: stats.total, icon: <Waves className="h-4 w-4" /> },
    {
      type: "unanswered",
      label: "Unbeantwortete Fragen",
      count: stats.unanswered,
      icon: <Compass className="h-4 w-4" />,
    },
    {
      type: "incorrect",
      label: "Falsch beantwortete Frag...",
      count: stats.incorrect,
      icon: <X className="h-4 w-4" />,
    },
    {
      type: "correct",
      label: "Richtig beantwortete Fra...",
      count: stats.correct,
      icon: <Check className="h-4 w-4" />,
    },
    { type: "bookmarked", label: "Markierte Fragen", count: stats.bookmarked, icon: <Bookmark className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "var(--theme-bg)" }}>
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-5 pointer-events-none">
        <Compass className="w-full h-full" style={{ color: "var(--theme-primary)" }} />
      </div>

      <header
        className="border-b backdrop-blur-sm sticky top-0 z-50"
        style={{
          backgroundColor: "color-mix(in srgb, var(--theme-bg) 95%, transparent)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              // Navigate back to the correct category overview page
              const categoryPath = module.category === "see" ? "/sbf-see" : module.category === "binnen" ? "/sbf-binnen" : "/basis"
              router.push(categoryPath)
            }}
            className="font-bold rounded-full px-6 transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "var(--theme-primary)", color: "black" }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            LEKTIONSÜBERSICHT
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white/40 text-xs">Gesamtfortschritt</p>
              <p className="text-white font-bold">{overallProgress}% gemeistert</p>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: "var(--theme-primary)" }}
            >
              <Anchor className="h-5 w-5" style={{ color: "var(--theme-primary)" }} />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Question Area */}
          <div className="lg:col-span-2">
            <div
              className={cn(
                "rounded-2xl p-8 border transition-all duration-300 relative overflow-hidden",
                isFilterChanging && "opacity-50 scale-[0.98]",
              )}
              style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
            >
              {isLoading ? (
                <div className="text-center text-white/60 py-12">
                  <div
                    className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-r-transparent"
                    style={{ borderColor: "var(--theme-primary)", borderRightColor: "transparent" }}
                  />
                  <p className="mt-4">Lade Fragen...</p>
                </div>
              ) : showCompletionMessage ? (
                <div className="text-center py-16 animate-fade-in">
                  <div
                    className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)" }}
                  >
                    <Ship className="h-12 w-12" style={{ color: "var(--theme-primary)" }} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Super! Alle {getFilterDisplayName()} Fragen abgeschlossen!
                  </h3>
                  <p className="text-white/60 text-lg mb-8">Weiter so, Kapitän!</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => {
                        const categoryPath = module.category === "see" ? "/sbf-see" : module.category === "binnen" ? "/sbf-binnen" : "/basis"
                        router.push(categoryPath)
                      }}
                      className="font-bold rounded-xl px-8 py-4 transition-all hover:scale-105"
                      style={{ backgroundColor: "var(--theme-primary)", color: "black" }}
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Zurück zum Kurs
                    </Button>
                    <Button
                      onClick={handleStartOver}
                      variant="outline"
                      className="rounded-xl px-8 py-4 transition-all hover:scale-105 bg-transparent border-white/20 text-white hover:bg-white/5"
                    >
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Alle Fragen von vorne
                    </Button>
                  </div>
                </div>
              ) : showNoQuestionsYet ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
                    {selectedFilter === "bookmarked" ? (
                      <Bookmark className="h-12 w-12 text-yellow-500" />
                    ) : (
                      <Check className="h-12 w-12 text-emerald-500" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {selectedFilter === "bookmarked"
                      ? "Noch keine Fragen markiert"
                      : "Noch keine Fragen richtig beantwortet"}
                  </h3>
                  <p className="text-white/60 text-lg mb-8">
                    {selectedFilter === "bookmarked"
                      ? "Markiere Fragen mit dem Lesezeichen-Symbol, um sie hier zu üben."
                      : "Beantworte Fragen richtig, um sie hier zu wiederholen."}
                  </p>
                  <Button
                    onClick={() => handleFilterChange("all")}
                    className="font-bold rounded-xl px-8 py-4 transition-all hover:scale-105"
                    style={{ backgroundColor: "var(--theme-primary)", color: "black" }}
                  >
                    Zu allen Fragen
                  </Button>
                </div>
              ) : currentQuestion ? (
                <div className="animate-fade-in">
                  <div className="mb-8 flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={handleBookmark}
                        className={cn(
                          "p-2 rounded-lg transition-all duration-200 hover:scale-110",
                          userProgress[currentQuestion.id]?.isBookmarked
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-white/5 text-white/40 hover:text-white/60",
                        )}
                      >
                        <Bookmark
                          className="h-5 w-5"
                          fill={userProgress[currentQuestion.id]?.isBookmarked ? "currentColor" : "none"}
                        />
                      </button>
                      <div>
                        <div
                          className="text-xs font-bold mb-2 tracking-wider flex items-center gap-2"
                          style={{ color: "var(--theme-primary)" }}
                        >
                          <Waves className="h-3 w-3" />
                          FRAGE {currentQuestion.question_number}
                        </div>
                        <h2 className="text-2xl font-bold text-white leading-relaxed">
                          {currentQuestion.question_text}
                        </h2>
                      </div>
                    </div>
                    {/* Streak counter */}
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-300",
                        correctStreak >= 3 ? "shadow-lg" : "",
                      )}
                      style={{
                        backgroundColor:
                          correctStreak >= 3
                            ? "color-mix(in srgb, var(--theme-primary) 20%, transparent)"
                            : correctStreak >= 1
                              ? "rgba(16, 185, 129, 0.1)"
                              : "rgba(255,255,255,0.05)",
                        borderColor:
                          correctStreak >= 3
                            ? "var(--theme-primary)"
                            : correctStreak >= 1
                              ? "rgba(16, 185, 129, 0.3)"
                              : "rgba(255,255,255,0.1)",
                      }}
                    >
                      <span
                        className={cn(
                          "text-sm font-bold",
                          correctStreak >= 3
                            ? "text-primary"
                            : correctStreak >= 1
                              ? "text-emerald-400"
                              : "text-white/40",
                        )}
                        style={correctStreak >= 3 ? { color: "var(--theme-primary)" } : {}}
                      >
                        {correctStreak}/3
                      </span>
                      {correctStreak >= 3 && <Check className="h-4 w-4" style={{ color: "var(--theme-primary)" }} />}
                    </div>
                  </div>

                  {/* Answer options */}
                  <div className="space-y-3 mb-8">
                    {currentQuestion.answer_options.slice(0, 4).map((option, index) => {
                      const isSelected = selectedOption === option.id
                      const isCorrectAnswer = option.is_correct
                      const showResult = isSubmitted

                      let optionStyle = {}
                      let optionClass = "bg-white/5 border-white/10 hover:bg-white/10"

                      if (showResult) {
                        if (isCorrectAnswer) {
                          optionClass = "border-emerald-500"
                          optionStyle = { backgroundColor: "rgba(16, 185, 129, 0.2)" }
                        } else if (isSelected && !isCorrectAnswer) {
                          optionClass = "border-red-500"
                          optionStyle = { backgroundColor: "rgba(239, 68, 68, 0.2)" }
                        }
                      } else if (isSelected) {
                        optionClass = ""
                        optionStyle = {
                          backgroundColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
                          borderColor: "var(--theme-primary)",
                        }
                      }

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleOptionSelect(option.id)}
                          disabled={isSubmitted}
                          className={cn(
                            "w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4",
                            optionClass,
                            !isSubmitted && "hover:scale-[1.01]",
                          )}
                          style={optionStyle}
                        >
                          <span
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0",
                              showResult && isCorrectAnswer
                                ? "bg-emerald-500 text-white"
                                : showResult && isSelected && !isCorrectAnswer
                                  ? "bg-red-500 text-white"
                                  : isSelected
                                    ? "text-black"
                                    : "bg-white/10 text-white/60",
                            )}
                            style={isSelected && !showResult ? { backgroundColor: "var(--theme-primary)" } : {}}
                          >
                            {answerLabels[index]}
                          </span>
                          <span className="text-white flex-1">{option.option_text}</span>
                          {showResult && isCorrectAnswer && (
                            <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          )}
                          {showResult && isSelected && !isCorrectAnswer && (
                            <X className="h-5 w-5 text-red-500 flex-shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-center">
                    {!isSubmitted ? (
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!selectedOption}
                        className="font-bold rounded-xl px-12 py-4 text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        style={{
                          backgroundColor: selectedOption ? "var(--theme-primary)" : "rgba(255,255,255,0.1)",
                          color: selectedOption ? "black" : "rgba(255,255,255,0.4)",
                        }}
                      >
                        AUFGABE LÖSEN
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        className="font-bold rounded-xl px-12 py-4 text-lg transition-all hover:scale-105"
                        style={{ backgroundColor: "var(--theme-primary)", color: "black" }}
                      >
                        Nächste Frage
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl p-6 border sticky top-24"
              style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5" style={{ color: "var(--theme-primary)" }} />
                Filter
              </h3>

              <div className="space-y-2">
                {filters.map((filter) => {
                  const isActive = selectedFilter === filter.type
                  const percentage = stats.total > 0 ? Math.round((filter.count / stats.total) * 100) : 0

                  return (
                    <button
                      key={filter.type}
                      onClick={() => handleFilterChange(filter.type)}
                      className={cn(
                        "w-full p-3 rounded-xl flex items-center justify-between transition-all duration-200",
                        isActive ? "scale-[1.02]" : "hover:bg-white/5",
                      )}
                      style={
                        isActive
                          ? {
                              backgroundColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
                              border: "1px solid var(--theme-primary)",
                            }
                          : { backgroundColor: "transparent", border: "1px solid transparent" }
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: isActive ? "var(--theme-primary)" : "rgba(255,255,255,0.4)" }}>
                          {filter.icon}
                        </span>
                        <div className="text-left">
                          <p className={cn("text-sm font-medium", isActive ? "text-white" : "text-white/70")}>
                            {filter.label}
                          </p>
                          <p className="text-xs text-white/40">
                            {filter.count} von {stats.total} Fragen
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-bold px-2 py-1 rounded-full",
                          isActive ? "text-black" : "text-white/60 bg-white/10",
                        )}
                        style={isActive ? { backgroundColor: "var(--theme-primary)" } : {}}
                      >
                        {percentage}%
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Navigation */}
              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="flex-1 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNavigateNext}
                  className="flex-1 rounded-xl bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
