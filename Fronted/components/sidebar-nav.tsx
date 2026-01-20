"use client"
import { usePathname, useRouter } from "next/navigation"
import {
  Anchor,
  Home,
  Ship,
  User,
  Settings,
  Palette,
  Sailboat,
  HelpCircle,
  FileText,
  AlertTriangle,
  Compass,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useExam } from "@/lib/exam-context"

interface SidebarNavProps {
  activeCategory?: "see" | "binnen" | null
  onCategoryChange?: (category: "see" | "binnen") => void
}

export function SidebarNav({ activeCategory, onCategoryChange }: SidebarNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isExamActive, setExamActive } = useExam()
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  const navItems = [
    { icon: Home, href: "/", label: "Home", category: null },
    { icon: Ship, href: "/sbf-see", label: "SBF See", category: "see" as const },
    { icon: Sailboat, href: "/sbf-binnen", label: "SBF Binnen", category: "binnen" as const },
    { icon: FileText, href: "/pruefung", label: "Prüfung", category: null },
    { icon: Compass, href: "/navigation-pruefung", label: "Navigation", category: null },
    { icon: User, href: "/profil", label: "Profil", category: null },
    { icon: HelpCircle, href: "/hilfe", label: "Hilfe", category: null },
  ]

  const bottomItems = [
    { icon: Palette, href: "/farbpaletten", label: "Farbpaletten" },
    { icon: Settings, href: "/einstellungen", label: "Einstellungen" },
  ]

  const handleNavClick = (href: string) => {
    // Don't block navigation to ergebnis page
    if (isExamActive && !pathname.includes("/ergebnis")) {
      setPendingHref(href)
      setShowExitWarning(true)
    } else {
      router.push(href)
    }
  }

  const handleConfirmExit = () => {
    setShowExitWarning(false)
    setExamActive(false)
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  const handleCancelExit = () => {
    setShowExitWarning(false)
    setPendingHref(null)
  }

  const isActive = (href: string) => {
    return (
      pathname === href ||
      (href === "/sbf-see" && pathname.startsWith("/sbf-see")) ||
      (href === "/sbf-binnen" && pathname.startsWith("/sbf-binnen")) ||
      (href === "/pruefung" && pathname.startsWith("/pruefung")) ||
      (href === "/profil" && pathname.startsWith("/profil")) ||
      (href === "/hilfe" && pathname.startsWith("/hilfe")) ||
      (href === "/farbpaletten" && pathname.startsWith("/farbpaletten")) ||
      (href === "/einstellungen" && pathname.startsWith("/einstellungen")) ||
      (href === "/navigation-pruefung" && pathname.startsWith("/navigation-pruefung"))
    )
  }

  return (
    <>
      {/* Exit Warning Modal */}
      {showExitWarning && (
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
                onClick={handleCancelExit}
                className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                style={{ backgroundColor: "var(--theme-primary)", color: "var(--theme-bg)" }}
              >
                Zurück zur Prüfung
              </button>
              <button
                onClick={handleConfirmExit}
                className="flex-1 px-4 py-3 rounded-xl border transition-all hover:bg-red-500/20"
                style={{ borderColor: "rgba(239, 68, 68, 0.5)", color: "rgb(239, 68, 68)" }}
              >
                Prüfung abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed left-0 top-0 h-full w-16 flex flex-col items-center py-4 border-r z-50"
        style={{
          backgroundColor: "var(--theme-bg)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-8 border-2"
          style={{ borderColor: "var(--theme-primary)" }}
        >
          <Anchor className="h-5 w-5" style={{ color: "var(--theme-primary)" }} />
        </div>

        {/* Nav Items - Using buttons instead of Links */}
        <div className="flex-1 flex flex-col items-center gap-2">
          {navItems.map((item, index) => {
            const active = isActive(item.href)

            return (
              <button
                key={index}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110",
                  active ? "" : "hover:bg-white/5",
                )}
                style={
                  active
                    ? { backgroundColor: "var(--theme-primary)", color: "var(--theme-bg)" }
                    : { color: "rgba(255,255,255,0.4)" }
                }
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>

        {/* Bottom section - Using buttons instead of Links */}
        <div className="flex flex-col items-center gap-2">
          {bottomItems.map((item, index) => {
            const active = isActive(item.href)

            return (
              <button
                key={index}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110",
                  active ? "" : "hover:bg-white/5",
                )}
                style={
                  active
                    ? { backgroundColor: "var(--theme-primary)", color: "var(--theme-bg)" }
                    : { color: "rgba(255,255,255,0.4)" }
                }
                title={item.label}
              >
                <item.icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
