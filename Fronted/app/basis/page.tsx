"use client"

import type React from "react"
import Link from "next/link"
import { SidebarNav } from "@/components/sidebar-nav"
import { ArrowLeft, BookOpen, Shield, Leaf, RefreshCw } from "lucide-react"
import { useModulesWithProgress } from "@/lib/swr-hooks"
import { useEffect, useState, useRef } from "react"

const moduleIcons: Record<string, React.ReactNode> = {
  "basis-vorschriften": <BookOpen className="h-10 w-10 text-white/30" />,
  "basis-umwelt": <Leaf className="h-10 w-10 text-white/30" />,
  "basis-sicherheit": <Shield className="h-10 w-10 text-white/30" />,
}

// Animated Progress Component
function AnimatedProgress({ value, isUpdating }: { value: number; isUpdating: boolean }) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValue = useRef(0)

  useEffect(() => {
    const startValue = previousValue.current
    const endValue = value
    const duration = 500
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + (endValue - startValue) * easeOut)
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        previousValue.current = endValue
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return (
    <span className={`text-xs font-bold text-white ${isUpdating ? "opacity-70" : ""}`}>
      {displayValue}%
    </span>
  )
}

export default function BasisPage() {
  const { modules, progress, isLoading, isValidating, mutate } = useModulesWithProgress("basis")
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isLoading && modules.length > 0) {
      setHasLoaded(true)
    }
  }, [isLoading, modules])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--theme-bg)" }}>
      {/* Refresh Loading Overlay */}
      {isRefreshing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
          <div className="flex flex-col items-center gap-3">
            <div 
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }}
            />
            <span className="text-white/80 text-sm">Aktualisiere...</span>
          </div>
        </div>
      )}

      <SidebarNav activeCategory="basis" onCategoryChange={() => {}} />

      <div className="pl-16">
        {/* Header */}
        <header
          className="border-b sticky top-0 z-40 backdrop-blur-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--theme-bg) 90%, transparent)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <div className="container mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <ArrowLeft className="h-5 w-5 text-white/70" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Basiskurs</h1>
                <p className="text-xs text-white/50">Grundlagen für alle Führerscheine</p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-white/10 disabled:opacity-50"
              style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            >
              <RefreshCw className={`h-4 w-4 text-white/70 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="text-sm text-white/70">Aktualisieren</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-8 py-8">
          {/* Info Card */}
          <div
            className="rounded-2xl p-6 border mb-8"
            style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)" }}
              >
                <BookOpen className="h-6 w-6" style={{ color: "var(--theme-primary)" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Gemeinsame Basisfragen</h2>
                <p className="text-sm text-white/60">
                  Diese Fragen sind Bestandteil sowohl des SBF See als auch des SBF Binnen. 
                  Wenn du beide Führerscheine machen möchtest, musst du diese Fragen nur einmal lernen.
                </p>
              </div>
            </div>
          </div>

          {/* Updating indicator */}
          {isValidating && hasLoaded && !isRefreshing && (
            <div className="flex items-center gap-2 mb-4 text-xs text-white/50">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "var(--theme-primary)" }} />
              <span>Aktualisiert...</span>
            </div>
          )}

          {/* Module Grid */}
          {isLoading && !hasLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl p-6 animate-pulse"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-3/4 rounded bg-white/10" />
                      <div className="h-4 w-1/2 rounded bg-white/10" />
                    </div>
                    <div className="h-10 w-10 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module) => {
                const moduleProgress = progress[module.id] || 0
                return (
                  <Link key={module.id} href={`/module/${module.slug}`} className="group block">
                    <div
                      className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 70%, var(--theme-accent)))",
                      }}
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative h-14 w-14 flex-shrink-0">
                          <svg className="h-14 w-14 -rotate-90">
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              stroke="rgba(255,255,255,0.2)"
                              strokeWidth="4"
                              fill="none"
                            />
                            <circle
                              cx="28"
                              cy="28"
                              r="24"
                              stroke="rgba(255,255,255,0.9)"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${24 * 2 * Math.PI}`}
                              strokeDashoffset={`${24 * 2 * Math.PI * (1 - moduleProgress / 100)}`}
                              strokeLinecap="round"
                              style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <AnimatedProgress value={moduleProgress} isUpdating={isValidating} />
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{module.name}</h3>
                          {module.description && <p className="text-sm text-white/70 mt-1">{module.description}</p>}
                        </div>

                        <div className="flex-shrink-0">
                          {moduleIcons[module.slug] || <BookOpen className="h-10 w-10 text-white/30" />}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
