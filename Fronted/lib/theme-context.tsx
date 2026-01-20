"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface ColorTheme {
  name: string
  description: string
  primary: string
  accent: string
  bg: string
  card: string
  basis: string
  basisBg: string
  specific: string
  specificBg: string
}

export const colorThemes: ColorTheme[] = [
  {
    name: "Atlantic Deep",
    description: "Tiefer Atlantik mit Cyan",
    primary: "rgb(8, 145, 178)",
    accent: "rgb(34, 211, 238)",
    bg: "rgb(8, 18, 28)",
    card: "rgba(7, 89, 133, 0.3)",
    basis: "rgb(96, 165, 250)",
    basisBg: "rgba(59, 130, 246, 0.3)",
    specific: "rgb(34, 211, 238)",
    specificBg: "rgba(34, 211, 238, 0.3)",
  },
  {
    name: "Ocean Deep",
    description: "Tiefes Marineblau mit Türkis",
    primary: "rgb(14, 165, 233)",
    accent: "rgb(34, 211, 238)",
    bg: "rgb(2, 6, 23)",
    card: "rgba(30, 58, 138, 0.3)",
    basis: "rgb(129, 140, 248)",
    basisBg: "rgba(99, 102, 241, 0.3)",
    specific: "rgb(34, 211, 238)",
    specificBg: "rgba(34, 211, 238, 0.3)",
  },
  {
    name: "Sunset Sailing",
    description: "Warme Orange & Gold Töne",
    primary: "rgb(251, 146, 60)",
    accent: "rgb(250, 204, 21)",
    bg: "rgb(23, 13, 5)",
    card: "rgba(154, 52, 18, 0.3)",
    basis: "rgb(253, 186, 116)",
    basisBg: "rgba(251, 146, 60, 0.3)",
    specific: "rgb(250, 204, 21)",
    specificBg: "rgba(250, 204, 21, 0.3)",
  },
  {
    name: "Nordic Fjord",
    description: "Kühle Grautöne mit Eisblau",
    primary: "rgb(148, 163, 184)",
    accent: "rgb(186, 230, 253)",
    bg: "rgb(15, 23, 42)",
    card: "rgba(51, 65, 85, 0.5)",
    basis: "rgb(148, 163, 184)",
    basisBg: "rgba(148, 163, 184, 0.3)",
    specific: "rgb(186, 230, 253)",
    specificBg: "rgba(186, 230, 253, 0.3)",
  },
  {
    name: "Caribbean",
    description: "Lebendiges Türkis & Koralle",
    primary: "rgb(45, 212, 191)",
    accent: "rgb(251, 113, 133)",
    bg: "rgb(4, 25, 27)",
    card: "rgba(19, 78, 74, 0.4)",
    basis: "rgb(251, 113, 133)",
    basisBg: "rgba(251, 113, 133, 0.3)",
    specific: "rgb(45, 212, 191)",
    specificBg: "rgba(45, 212, 191, 0.3)",
  },
  {
    name: "Midnight Navy",
    description: "Klassisches Navy mit Gold",
    primary: "rgb(96, 165, 250)",
    accent: "rgb(253, 224, 71)",
    bg: "rgb(3, 7, 18)",
    card: "rgba(30, 64, 175, 0.3)",
    basis: "rgb(253, 224, 71)",
    basisBg: "rgba(253, 224, 71, 0.3)",
    specific: "rgb(96, 165, 250)",
    specificBg: "rgba(96, 165, 250, 0.3)",
  },
  {
    name: "Aurora Borealis",
    description: "Magisches Grün & Violett",
    primary: "rgb(74, 222, 128)",
    accent: "rgb(192, 132, 252)",
    bg: "rgb(5, 20, 15)",
    card: "rgba(22, 101, 52, 0.3)",
    basis: "rgb(192, 132, 252)",
    basisBg: "rgba(192, 132, 252, 0.3)",
    specific: "rgb(74, 222, 128)",
    specificBg: "rgba(74, 222, 128, 0.3)",
  },
  {
    name: "Mediterranean",
    description: "Helles Blau mit Terrakotta",
    primary: "rgb(56, 189, 248)",
    accent: "rgb(248, 113, 113)",
    bg: "rgb(8, 20, 30)",
    card: "rgba(7, 89, 133, 0.4)",
    basis: "rgb(248, 113, 113)",
    basisBg: "rgba(248, 113, 113, 0.3)",
    specific: "rgb(56, 189, 248)",
    specificBg: "rgba(56, 189, 248, 0.3)",
  },
  {
    name: "Stormy Seas",
    description: "Dramatisches Grau mit Blitzen",
    primary: "rgb(203, 213, 225)",
    accent: "rgb(250, 204, 21)",
    bg: "rgb(15, 15, 18)",
    card: "rgba(51, 51, 61, 0.5)",
    basis: "rgb(250, 204, 21)",
    basisBg: "rgba(250, 204, 21, 0.3)",
    specific: "rgb(203, 213, 225)",
    specificBg: "rgba(203, 213, 225, 0.3)",
  },
  {
    name: "Emerald Waters",
    description: "Smaragdgrün mit Aqua",
    primary: "rgb(52, 211, 153)",
    accent: "rgb(103, 232, 249)",
    bg: "rgb(4, 19, 14)",
    card: "rgba(6, 78, 59, 0.4)",
    basis: "rgb(103, 232, 249)",
    basisBg: "rgba(103, 232, 249, 0.3)",
    specific: "rgb(52, 211, 153)",
    specificBg: "rgba(52, 211, 153, 0.3)",
  },
  {
    name: "Coral Reef",
    description: "Korallenrosa mit Meeresblau",
    primary: "rgb(244, 114, 182)",
    accent: "rgb(56, 189, 248)",
    bg: "rgb(22, 10, 15)",
    card: "rgba(131, 24, 67, 0.3)",
    basis: "rgb(56, 189, 248)",
    basisBg: "rgba(56, 189, 248, 0.3)",
    specific: "rgb(244, 114, 182)",
    specificBg: "rgba(244, 114, 182, 0.3)",
  },
  {
    name: "Adriatic Blue",
    description: "Helles Adriatisches Blau",
    primary: "rgb(14, 165, 233)",
    accent: "rgb(6, 182, 212)",
    bg: "rgb(8, 15, 25)",
    card: "rgba(12, 74, 110, 0.3)",
    basis: "rgb(129, 140, 248)",
    basisBg: "rgba(99, 102, 241, 0.3)",
    specific: "rgb(14, 165, 233)",
    specificBg: "rgba(14, 165, 233, 0.3)",
  },
  {
    name: "Tropical Lagoon",
    description: "Tropisches Türkis mit Aquamarin",
    primary: "rgb(20, 184, 166)",
    accent: "rgb(94, 234, 212)",
    bg: "rgb(4, 20, 25)",
    card: "rgba(13, 94, 66, 0.35)",
    basis: "rgb(94, 234, 212)",
    basisBg: "rgba(94, 234, 212, 0.3)",
    specific: "rgb(20, 184, 166)",
    specificBg: "rgba(20, 184, 166, 0.3)",
  },
  {
    name: "Deep Pacific",
    description: "Tiefes Pazifikblau",
    primary: "rgb(59, 130, 246)",
    accent: "rgb(96, 165, 250)",
    bg: "rgb(3, 7, 18)",
    card: "rgba(29, 78, 216, 0.25)",
    basis: "rgb(167, 139, 250)",
    basisBg: "rgba(139, 92, 246, 0.3)",
    specific: "rgb(59, 130, 246)",
    specificBg: "rgba(59, 130, 246, 0.3)",
  },
  {
    name: "Cyan Harbor",
    description: "Hafencyan mit Stahlblau",
    primary: "rgb(6, 182, 212)",
    accent: "rgb(34, 211, 238)",
    bg: "rgb(8, 18, 25)",
    card: "rgba(8, 145, 178, 0.3)",
    basis: "rgb(129, 140, 248)",
    basisBg: "rgba(99, 102, 241, 0.3)",
    specific: "rgb(6, 182, 212)",
    specificBg: "rgba(6, 182, 212, 0.3)",
  },
  {
    name: "Aqua Marine",
    description: "Maritimes Aquamarin",
    primary: "rgb(34, 211, 238)",
    accent: "rgb(103, 232, 249)",
    bg: "rgb(6, 16, 23)",
    card: "rgba(14, 116, 144, 0.3)",
    basis: "rgb(129, 140, 248)",
    basisBg: "rgba(99, 102, 241, 0.3)",
    specific: "rgb(34, 211, 238)",
    specificBg: "rgba(34, 211, 238, 0.3)",
  },
  {
    name: "Baltic Sea",
    description: "Ostsee Blau-Grau",
    primary: "rgb(56, 189, 248)",
    accent: "rgb(125, 211, 252)",
    bg: "rgb(11, 15, 25)",
    card: "rgba(30, 64, 175, 0.25)",
    basis: "rgb(167, 139, 250)",
    basisBg: "rgba(139, 92, 246, 0.3)",
    specific: "rgb(56, 189, 248)",
    specificBg: "rgba(56, 189, 248, 0.3)",
  },
  {
    name: "Turquoise Bay",
    description: "Türkisbucht mit Kristallblau",
    primary: "rgb(45, 212, 191)",
    accent: "rgb(94, 234, 212)",
    bg: "rgb(4, 18, 20)",
    card: "rgba(17, 94, 89, 0.35)",
    basis: "rgb(129, 140, 248)",
    basisBg: "rgba(99, 102, 241, 0.3)",
    specific: "rgb(45, 212, 191)",
    specificBg: "rgba(45, 212, 191, 0.3)",
  },
  {
    name: "Ice Blue",
    description: "Eisblau mit Polartürkis",
    primary: "rgb(125, 211, 252)",
    accent: "rgb(186, 230, 253)",
    bg: "rgb(8, 18, 30)",
    card: "rgba(30, 58, 138, 0.25)",
    basis: "rgb(199, 210, 254)",
    basisBg: "rgba(165, 180, 252, 0.3)",
    specific: "rgb(125, 211, 252)",
    specificBg: "rgba(125, 211, 252, 0.3)",
  },
  {
    name: "Mediterranean Sky",
    description: "Mittelmeer Himmelblau",
    primary: "rgb(56, 189, 248)",
    accent: "rgb(14, 165, 233)",
    bg: "rgb(7, 14, 25)",
    card: "rgba(12, 74, 110, 0.3)",
    basis: "rgb(167, 139, 250)",
    basisBg: "rgba(139, 92, 246, 0.3)",
    specific: "rgb(56, 189, 248)",
    specificBg: "rgba(56, 189, 248, 0.3)",
  },
]

interface ThemeContextType {
  currentTheme: ColorTheme
  setTheme: (theme: ColorTheme) => void
  themeName: string
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(colorThemes[13]) // Deep Pacific as default
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = document.cookie
      .split("; ")
      .find((row) => row.startsWith("theme="))
      ?.split("=")[1]

    if (savedTheme) {
      const found = colorThemes.find((t) => t.name === decodeURIComponent(savedTheme))
      if (found) {
        setCurrentTheme(found)
      }
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      document.cookie = `theme=${encodeURIComponent(currentTheme.name)};path=/;max-age=31536000`
      document.documentElement.style.setProperty("--theme-primary", currentTheme.primary)
      document.documentElement.style.setProperty("--theme-accent", currentTheme.accent)
      document.documentElement.style.setProperty("--theme-bg", currentTheme.bg)
      document.documentElement.style.setProperty("--theme-card", currentTheme.card)
      document.documentElement.style.setProperty("--theme-basis", currentTheme.basis)
      document.documentElement.style.setProperty("--theme-basis-bg", currentTheme.basisBg)
      document.documentElement.style.setProperty("--theme-specific", currentTheme.specific)
      document.documentElement.style.setProperty("--theme-specific-bg", currentTheme.specificBg)
    }
  }, [currentTheme, mounted])

  const setTheme = (theme: ColorTheme) => {
    setCurrentTheme(theme)
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themeName: currentTheme.name }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}
