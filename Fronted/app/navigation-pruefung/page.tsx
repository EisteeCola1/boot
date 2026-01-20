"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import { Compass, Map, Navigation, Ruler, Clock, Target, ChevronRight, Info } from "lucide-react"
import Link from "next/link"

export default function NavigationPruefungPage() {
  const navigationModules = [
    {
      id: 1,
      title: "Kursberechnung",
      description: "Berechne Kurse und Peilungen",
      icon: Compass,
      questions: 15,
    },
    {
      id: 2,
      title: "Kartenarbeit",
      description: "Arbeiten mit Seekarten",
      icon: Map,
      questions: 20,
    },
    {
      id: 3,
      title: "Distanzberechnung",
      description: "Entfernungen und Geschwindigkeiten",
      icon: Ruler,
      questions: 12,
    },
    {
      id: 4,
      title: "Gezeitenberechnung",
      description: "Hoch- und Niedrigwasser berechnen",
      icon: Clock,
      questions: 18,
    },
    {
      id: 5,
      title: "Positionsbestimmung",
      description: "Standort auf der Karte bestimmen",
      icon: Target,
      questions: 15,
    },
    {
      id: 6,
      title: "Vollständige Simulation",
      description: "Komplette Navigationsprüfung",
      icon: Navigation,
      questions: 9,
      isSimulation: true,
    },
  ]

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--theme-bg)" }}>
      <SidebarNav />

      <div className="pl-16">
        {/* Header */}
        <header
          className="border-b sticky top-0 z-40 backdrop-blur-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--theme-bg) 90%, transparent)",
            borderColor: "rgba(255,255,255,0.1)",
          }}
        >
          <div className="container mx-auto px-8 py-6">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <Navigation className="h-7 w-7 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Navigationsprüfung</h1>
                <p className="text-sm text-white/50">Übe Navigationsaufgaben für die praktische Prüfung</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-8 py-8">
          {/* Info Box */}
          <div
            className="rounded-2xl p-6 border mb-8 flex items-start gap-4"
            style={{
              backgroundColor: "color-mix(in srgb, var(--theme-primary) 10%, var(--theme-card))",
              borderColor: "color-mix(in srgb, var(--theme-primary) 30%, transparent)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--theme-primary)" }}
            >
              <Info className="h-5 w-5 text-black" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Über die Navigationsprüfung</h3>
              <p className="text-white/70 text-sm">
                Die Navigationsprüfung ist Teil der praktischen Prüfung für den SBF See. Hier kannst du die verschiedenen
                Navigationsaufgaben üben, die in der Prüfung vorkommen können. Dazu gehören Kursberechnungen, Kartenarbeit,
                Distanz- und Gezeitenberechnungen sowie Positionsbestimmungen.
              </p>
            </div>
          </div>

          {/* Module Grid */}
          <h2 className="text-xl font-bold text-white mb-4">Navigationsmodule</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {navigationModules.map((module) => (
              <Link href={`/navigation-pruefung/${module.id}`} key={module.id} className="block group">
                <div
                  className="rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden h-full"
                  style={{
                    backgroundColor: module.isSimulation
                      ? "color-mix(in srgb, var(--theme-primary) 15%, var(--theme-card))"
                      : "var(--theme-card)",
                    borderColor: module.isSimulation
                      ? "color-mix(in srgb, var(--theme-primary) 40%, transparent)"
                      : "rgba(255,255,255,0.1)",
                  }}
                >
                  {module.isSimulation && (
                    <div
                      className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: "var(--theme-primary)", color: "black" }}
                    >
                      SIMULATION
                    </div>
                  )}

                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: module.isSimulation
                        ? "var(--theme-primary)"
                        : "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
                    }}
                  >
                    <module.icon
                      className="h-6 w-6"
                      style={{ color: module.isSimulation ? "black" : "var(--theme-primary)" }}
                    />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{module.title}</h3>
                  <p className="text-sm text-white/50 mb-3">{module.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">{module.questions} Aufgaben</span>
                    <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
