"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface ExamContextType {
  isExamActive: boolean
  setExamActive: (active: boolean) => void
  examCategory: string | null
  setExamCategory: (category: string | null) => void
  examBogen: number | null
  setExamBogen: (bogen: number | null) => void
}

const ExamContext = createContext<ExamContextType | undefined>(undefined)

export function ExamProvider({ children }: { children: ReactNode }) {
  const [isExamActive, setExamActive] = useState(false)
  const [examCategory, setExamCategory] = useState<string | null>(null)
  const [examBogen, setExamBogen] = useState<number | null>(null)

  return (
    <ExamContext.Provider
      value={{
        isExamActive,
        setExamActive,
        examCategory,
        setExamCategory,
        examBogen,
        setExamBogen,
      }}
    >
      {children}
    </ExamContext.Provider>
  )
}

export function useExam() {
  const context = useContext(ExamContext)
  if (context === undefined) {
    throw new Error("useExam must be used within an ExamProvider")
  }
  return context
}
