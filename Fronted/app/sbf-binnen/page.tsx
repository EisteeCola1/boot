"use client"

import type React from "react"
import Link from "next/link"
import { SidebarNav } from "@/components/sidebar-nav"
import {
  ArrowLeft,
  Anchor,
  Compass,
  Navigation,
  CloudSun,
  Shield,
  Leaf,
  BookOpen,
  Ship,
  Lock,
  RefreshCw,
  MapPin,
  Volume2,
  Lightbulb,
  Flag,
} from "lucide-react"
import { useModulesWithProgress } from "@/lib/swr-hooks"
import { useEffect, useState, useRef } from "react"

const moduleIcons: Record<string, React.ReactNode> = {
  "binnen-vorschriften": <BookOpen className="h-10 w-10 text-white/30" />,
  "binnen-verkehrsregeln": <Navigation className="h-10 w-10 text-white/30" />,
  "binnen-fahrwasser": <Compass className="h-10 w-10 text-white/30" />,
  "binnen-markierungen": <MapPin className="h-10 w-10 text-white/30" />,
  "binnen-schleusen": <Lock className="h-10 w-10 text-white/30" />,
  "binnen-lichter-signale": <Ship className="h-10 w-10 text-white/30" />,
  "binnen-wetter": <CloudSun className="h-10 w-10 text-white/30" />,
  "binnen-sicherheit": <Shield className="h-10 w-10 text-white/30" />,
  "binnen-umweltschutz": <Leaf className="h-10 w-10 text-white/30" />,
  "binnen-basisfragen": <BookOpen className="h-10 w-10 text-white/30" />,
  "binnen-zeichen": <Flag className="h-10 w-10 text-white/30" />,
  "binnen-lichter-fahrzeuge": <Lightbulb className="h-10 w-10 text-white/30" />,
  "binnen-schallsignale": <Volume2 className="h-10 w-10 text-white/30" />,
  "binnen-knoten": <Anchor className="h-10 w-10 text-white/30" />,
}

// Kategorien für die Module
const moduleCategories = {
  binnen: {
    title: "SBF Binnen Fragen",
    description: "Spezifische Fragen für den Sportbootführerschein Binnen",
    slugs: [
      "binnen-vorschriften",
      "binnen-verkehrsregeln",
      "binnen-fahrwasser",
      "binnen-markierungen",
      "binnen-schleusen",
      "binnen-lichter-signale",
      "binnen-wetter",
      "binnen-sicherheit",
      "binnen-umweltschutz"
    ]
  },
  basis: {
    title: "Basisfragen",
    description: "Allgemeine Grundlagen für alle Sportbootführerscheine",
    slugs: ["binnen-basisfragen"]
  },
  praxis: {
    title: "Praxisprüfung Training",
    description: "Praktische Übungen für die Praxisprüfung",
    slugs: [
      "binnen-zeichen",
      "binnen-lichter-fahrzeuge",
      "binnen-schallsignale",
      "binnen-knoten"
    ]
  }
}

function AnimatedProgress({ value, isUpdating }: { value: number; isUpdating: boolean }) {
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

  return (
    <span className={`text-white font-bold text-xs transition-opacity ${isUpdating ? "opacity-70" : "opacity-100"}`}>
      {displayValue}%
    </span>
  )
}

export default function SBFBinnenPage() {
  const { modules, progress, isLoading, isValidating, refresh } = useModulesWithProgress("binnen")
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isLoading && modules.length > 0) {
      setHasLoaded(true)
    }
  }, [isLoading, modules])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--theme-bg)" }}>
      <SidebarNav activeCategory="binnen" onCategoryChange={() => {}} />

      {isRefreshing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
              <div
                className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
                style={{ borderColor: "var(--theme-primary)", borderTopColor: "transparent" }}
              ></div>
            </div>
            <p className="text-white text-sm font-medium">Aktualisiere Daten...</p>
          </div>
        </div>
      )}

      <div className="pl-16">
        <header
          className="border-b sticky top-0 z-40 backdrop-blur-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--theme-bg) 90%, transparent)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <div className="container mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{ backgroundColor: "var(--theme-primary)", color: "black" }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-bold text-sm">ZURÜCK</span>
              </Link>
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
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-all ${isRefreshing ? "opacity-50" : ""}`}
                title="Aktualisieren"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <Link
                href="/hilfe"
                className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-all text-sm"
              >
                Hilfe
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-8 py-8">
          <div className="mb-8">
            <span style={{ color: "var(--theme-primary)" }} className="text-sm font-bold tracking-wider">
              SBF BINNEN
            </span>
            <h1 className="text-4xl font-black text-white mt-2 flex items-center gap-3">
              Sportbootführerschein Binnen
              <span className="text-white/20 text-2xl">ⓘ</span>
            </h1>
            <p className="text-white/50 mt-2">Wähle ein Modul um mit den Prüfungsfragen zu beginnen</p>
          </div>

          {/* Module Categories */}
          {isLoading && !hasLoaded ? (
            // Skeleton loading for first load
            <div className="space-y-8">
              {Array.from({ length: 3 }).map((_, catIndex) => (
                <div key={catIndex}>
                  <div className="h-6 w-40 bg-white/10 rounded mb-2 animate-pulse" />
                  <div className="h-4 w-64 bg-white/5 rounded mb-4 animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 2 }).map((_, i) => (
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
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(moduleCategories).map(([key, category]) => {
                const categoryModules = modules.filter(m => category.slugs.includes(m.slug))
                if (categoryModules.length === 0) return null
                
                return (
                  <div key={key}>
                    <h2 className="text-xl font-bold text-white mb-1">{category.title}</h2>
                    <p className="text-sm text-white/50 mb-4">{category.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryModules.map((module) => {
                        const moduleProgress = progress[module.id] || 0
                        return (
                          <Link key={module.id} href={`/module/${module.slug}`} className="group block">
                            <div
                              className="relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer min-h-[140px] flex items-center"
                              style={{
                                background:
                                  "linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 70%, var(--theme-accent)))",
                              }}
                            >
                              {/* Progress Circle with animated value */}
                              <div className="flex items-center gap-6 w-full">
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

                                {/* Content */}
                                <div className="flex-1">
                                  <h3 className="text-lg font-bold text-white">{module.name}</h3>
                                  {module.description && <p className="text-sm text-white/70 mt-1">{module.description}</p>}
                                </div>

                                {/* Icon */}
                                <div className="flex-shrink-0">
                                  {moduleIcons[module.slug] || <Anchor className="h-10 w-10 text-white/30" />}
                                </div>
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
