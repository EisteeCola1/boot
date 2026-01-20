"use client"

import Link from "next/link"
import { ArrowLeft, Anchor, Ship, Compass, Waves, Check } from "lucide-react"
import { useTheme, colorThemes } from "@/lib/theme-context"

export default function FarbpalettenPage() {
  const { currentTheme, setTheme } = useTheme()

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: "var(--theme-bg)" }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="waves" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M0 10 Q 25 0, 50 10 T 100 10"
                stroke="currentColor"
                fill="none"
                strokeWidth="1"
                style={{ color: "var(--theme-primary)" }}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#waves)" />
        </svg>
      </div>

      <header
        className="border-b backdrop-blur-sm sticky top-0 z-50"
        style={{
          backgroundColor: "color-mix(in srgb, var(--theme-bg) 95%, transparent)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold rounded-full px-6 py-2 transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: "var(--theme-primary)", color: "black" }}
          >
            <ArrowLeft className="h-4 w-4" />
            ZURÜCK
          </Link>

          <div className="flex items-center gap-3">
            <Anchor className="h-6 w-6" style={{ color: "var(--theme-primary)" }} />
            <span className="text-white/60 font-medium">20 Farbpaletten</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Farbpaletten</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Wähle eine Farbpalette für deine Bootsschule. Die Auswahl wird gespeichert.
          </p>
          <p className="mt-2" style={{ color: "var(--theme-primary)" }}>
            Aktiv: {currentTheme.name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {colorThemes.map((theme, index) => {
            const isActive = currentTheme.name === theme.name

            return (
              <button
                key={theme.name}
                onClick={() => setTheme(theme)}
                className="text-left rounded-2xl overflow-hidden border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl relative"
                style={{
                  backgroundColor: theme.bg,
                  borderColor: isActive ? theme.primary : "rgba(255,255,255,0.1)",
                  borderWidth: isActive ? "2px" : "1px",
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center z-10"
                    style={{ backgroundColor: theme.primary }}
                  >
                    <Check className="h-5 w-5 text-black" />
                  </div>
                )}

                {/* Header */}
                <div
                  className="p-5 border-b"
                  style={{ backgroundColor: theme.card, borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${theme.primary}30` }}
                    >
                      <Anchor className="h-5 w-5" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{theme.name}</h3>
                      <p className="text-xs text-white/50">{theme.description}</p>
                    </div>
                  </div>

                  {/* Color swatches */}
                  <div className="flex gap-2">
                    <div className="flex-1 h-6 rounded-lg" style={{ backgroundColor: theme.primary }} />
                    <div className="flex-1 h-6 rounded-lg" style={{ backgroundColor: theme.accent }} />
                    <div
                      className="flex-1 h-6 rounded-lg border border-white/20"
                      style={{ backgroundColor: theme.bg }}
                    />
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-5">
                  {/* Mini Module Card */}
                  <div
                    className="rounded-xl p-3 mb-3 border"
                    style={{ backgroundColor: theme.card, borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: `conic-gradient(${theme.primary} 75%, rgba(255,255,255,0.1) 75%)`,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: theme.bg }}
                        >
                          <span style={{ color: theme.primary, fontSize: "10px" }}>75%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">SBF See</p>
                        <p className="text-xs text-white/40">Videokurs</p>
                      </div>
                      <Ship className="h-6 w-6 text-white/10" />
                    </div>
                  </div>

                  {/* Mini Button */}
                  <div
                    className="py-2 px-4 rounded-lg text-center text-sm font-bold"
                    style={{ backgroundColor: theme.primary, color: "black" }}
                  >
                    AUFGABE LÖSEN
                  </div>

                  {/* Icons */}
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <Waves className="h-4 w-4" style={{ color: theme.accent }} />
                    <Anchor className="h-4 w-4" style={{ color: theme.primary }} />
                    <Compass className="h-4 w-4" style={{ color: theme.accent }} />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
