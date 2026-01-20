"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import {
  Award,
  Ship,
  Sailboat,
  BookOpen,
  TrendingUp,
  Calendar,
  Edit2,
  Camera,
  Trophy,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useProfileStats } from "@/lib/swr-hooks"

function AnimatedNumber({ value, isUpdating }: { value: number; isUpdating: boolean }) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current !== value) {
      const start = prevValue.current
      const end = value
      const duration = 500
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(start + (end - start) * eased)
        setDisplayValue(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          prevValue.current = value
        }
      }
      requestAnimationFrame(animate)
    }
  }, [value])

  return <span className={`transition-opacity ${isUpdating ? "opacity-70" : "opacity-100"}`}>{displayValue}</span>
}

export default function ProfilPage() {
  const [userName, setUserName] = useState("Bootsfahrer")
  const [isEditing, setIsEditing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  const { stats, isLoading, isValidating, refresh } = useProfileStats()

  useEffect(() => {
    const savedName = localStorage.getItem("userName")
    if (savedName) setUserName(savedName)
  }, [])

  useEffect(() => {
    if (!isLoading && stats.totalAnswered >= 0) {
      setHasLoaded(true)
    }
  }, [isLoading, stats])

  const saveName = () => {
    localStorage.setItem("userName", userName)
    setIsEditing(false)
  }

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true)
    await refresh()
    setTimeout(() => {
      setIsManualRefreshing(false)
    }, 500)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--theme-bg)" }}>
      <SidebarNav />

      {isManualRefreshing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: "var(--theme-primary)" }} />
            <p className="text-white/80 text-sm">Aktualisiere Statistiken...</p>
          </div>
        </div>
      )}

      <main className="pl-16">
        <div className="relative overflow-hidden border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-20 text-8xl opacity-20">⚓</div>
          </div>

          <div className="relative px-8 py-12">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold border-4"
                  style={{
                    backgroundColor: "var(--theme-card)",
                    borderColor: "var(--theme-primary)",
                    color: "var(--theme-primary)",
                  }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                <button
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: "var(--theme-primary)" }}
                >
                  <Camera className="h-4 w-4" style={{ color: "var(--theme-bg)" }} />
                </button>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      onBlur={saveName}
                      onKeyDown={(e) => e.key === "Enter" && saveName()}
                      autoFocus
                      className="text-3xl font-bold bg-transparent border-b-2 outline-none text-white"
                      style={{ borderColor: "var(--theme-primary)" }}
                    />
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-white">{userName}</h1>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Edit2 className="h-4 w-4 text-white/60" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-white/60 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Zuletzt aktiv: {new Date().toLocaleDateString("de-DE")}
                  </p>
                  {isValidating && hasLoaded && (
                    <div className="flex items-center gap-2 text-white/40 text-sm">
                      <div
                        className="h-2 w-2 rounded-full animate-pulse"
                        style={{ backgroundColor: "var(--theme-primary)" }}
                      />
                      <span>Aktualisiert...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={handleManualRefresh}
                  disabled={isValidating || isManualRefreshing}
                  className={`p-3 rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-all ${isValidating || isManualRefreshing ? "opacity-50" : ""}`}
                  title="Statistiken aktualisieren"
                >
                  <RefreshCw className={`h-5 w-5 ${isValidating || isManualRefreshing ? "animate-spin" : ""}`} />
                </button>
                <div className="px-6 py-4 rounded-2xl text-center" style={{ backgroundColor: "var(--theme-card)" }}>
                  <div className="text-3xl font-bold" style={{ color: "var(--theme-primary)" }}>
                    <AnimatedNumber value={stats.totalMastered} isUpdating={isValidating} />
                  </div>
                  <div className="text-sm text-white/60">Gemeistert</div>
                </div>
                <div className="px-6 py-4 rounded-2xl text-center" style={{ backgroundColor: "var(--theme-card)" }}>
                  <div className="text-3xl font-bold" style={{ color: "var(--theme-primary)" }}>
                    <AnimatedNumber value={stats.passedExams} isUpdating={isValidating} />
                  </div>
                  <div className="text-sm text-white/60">Bestanden</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          {isLoading && !hasLoaded ? (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-5 rounded-2xl border animate-pulse"
                    style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    <div className="h-6 w-6 mb-3 rounded bg-white/10" />
                    <div className="h-8 w-16 rounded bg-white/10 mb-2" />
                    <div className="h-4 w-24 rounded bg-white/10" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl border animate-pulse"
                    style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    <div className="h-6 w-48 rounded bg-white/10 mb-6" />
                    <div className="h-4 w-full rounded bg-white/10 mb-2" />
                    <div className="h-3 w-full rounded bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: BookOpen, label: "Fragen beantwortet", value: stats.totalAnswered },
                  { icon: Trophy, label: "Fragen gemeistert", value: stats.totalMastered },
                  { icon: TrendingUp, label: "Prüfungen abgelegt", value: stats.totalExams },
                  { icon: Award, label: "Prüfungen bestanden", value: stats.passedExams },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-2xl border transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      backgroundColor: "var(--theme-card)",
                      borderColor: "rgba(255,255,255,0.1)",
                    }}
                  >
                    <stat.icon className="h-6 w-6 mb-3" style={{ color: "var(--theme-primary)" }} />
                    <div className="text-2xl font-bold text-white">
                      <AnimatedNumber value={stat.value} isUpdating={isValidating} />
                    </div>
                    <div className="text-sm text-white/60">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className="p-6 rounded-2xl border"
                  style={{
                    backgroundColor: "var(--theme-card)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Ship className="h-6 w-6" style={{ color: "var(--theme-primary)" }} />
                    <h3 className="text-lg font-semibold text-white">SBF See Fortschritt</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Gesamtfortschritt</span>
                      <span className="text-white font-medium">
                        <AnimatedNumber value={stats.seeProgress} isUpdating={isValidating} />%
                      </span>
                    </div>
                    <div
                      className="h-3 rounded-full overflow-hidden"
                      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${stats.seeProgress}%`,
                          backgroundColor: "var(--theme-primary)",
                          transition: "width 0.5s ease-out",
                        }}
                      />
                    </div>
                    <p className="text-xs text-white/40">Fortschritt basiert auf 3x richtig beantworteten Fragen</p>
                  </div>
                </div>

                <div
                  className="p-6 rounded-2xl border"
                  style={{
                    backgroundColor: "var(--theme-card)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Sailboat className="h-6 w-6" style={{ color: "var(--theme-primary)" }} />
                    <h3 className="text-lg font-semibold text-white">SBF Binnen Fortschritt</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Gesamtfortschritt</span>
                      <span className="text-white font-medium">
                        <AnimatedNumber value={stats.binnenProgress} isUpdating={isValidating} />%
                      </span>
                    </div>
                    <div
                      className="h-3 rounded-full overflow-hidden"
                      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${stats.binnenProgress}%`,
                          backgroundColor: "var(--theme-primary)",
                          transition: "width 0.5s ease-out",
                        }}
                      />
                    </div>
                    <p className="text-xs text-white/40">Fortschritt basiert auf 3x richtig beantworteten Fragen</p>
                  </div>
                </div>
              </div>

              <div
                className="p-6 rounded-2xl border"
                style={{
                  backgroundColor: "var(--theme-card)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5" style={{ color: "var(--theme-primary)" }} />
                  Prüfungsstatistik
                </h3>

                {stats.totalExams === 0 ? (
                  <p className="text-white/60 text-center py-8">
                    Du hast noch keine Prüfungen abgelegt. Starte jetzt mit deiner ersten Prüfungssimulation!
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                      <div className="text-2xl font-bold text-white">
                        <AnimatedNumber value={stats.totalExams} isUpdating={isValidating} />
                      </div>
                      <div className="text-sm text-white/60">Abgelegt</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                      <div className="text-2xl font-bold text-emerald-400">
                        <AnimatedNumber value={stats.passedExams} isUpdating={isValidating} />
                      </div>
                      <div className="text-sm text-white/60">Bestanden</div>
                    </div>
                    <div className="text-center p-4 rounded-xl" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                      <div className="text-2xl font-bold text-red-400">
                        <AnimatedNumber value={stats.totalExams - stats.passedExams} isUpdating={isValidating} />
                      </div>
                      <div className="text-sm text-white/60">Nicht bestanden</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
