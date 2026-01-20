"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import { Anchor, Wrench, LifeBuoy, Flag, Wind, Sailboat, ChevronRight, FileText, Video, BookOpen } from "lucide-react"
import Link from "next/link"

export default function PraxisPage() {
  const praxisCategories = [
    {
      id: "knoten",
      title: "Knoten",
      description: "Wichtige Seemannsknoten lernen und üben",
      icon: Anchor,
      items: 8,
      color: "var(--theme-primary)",
    },
    {
      id: "maneuver",
      title: "Manöver",
      description: "An- und Ablegemanöver, Wenden, Halsen",
      icon: Sailboat,
      items: 12,
      color: "var(--theme-accent)",
    },
    {
      id: "sicherheit",
      title: "Sicherheitsausrüstung",
      description: "Rettungsmittel und Sicherheitseinrichtungen",
      icon: LifeBuoy,
      items: 10,
      color: "var(--theme-primary)",
    },
    {
      id: "signale",
      title: "Signale & Flaggen",
      description: "Seezeichen, Flaggen und Signale",
      icon: Flag,
      items: 15,
      color: "var(--theme-accent)",
    },
    {
      id: "wetter",
      title: "Wetterkunde",
      description: "Wetterbeobachtung und -vorhersage",
      icon: Wind,
      items: 8,
      color: "var(--theme-primary)",
    },
    {
      id: "technik",
      title: "Motorenkunde",
      description: "Antrieb, Wartung und Fehlersuche",
      icon: Wrench,
      items: 10,
      color: "var(--theme-accent)",
    },
  ]

  const materialTypes = [
    {
      title: "Prüfungsbögen",
      description: "Alle offiziellen Prüfungsbögen als PDF",
      icon: FileText,
      count: 15,
    },
    {
      title: "Lernvideos",
      description: "Video-Anleitungen zu allen Themen",
      icon: Video,
      count: 24,
    },
    {
      title: "Zusammenfassungen",
      description: "Kompakte Lernhilfen zum Ausdrucken",
      icon: BookOpen,
      count: 9,
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
                <Anchor className="h-7 w-7 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Praxis & Prüfungssammlung</h1>
                <p className="text-sm text-white/50">Praktische Übungen und Lernmaterialien</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-8 py-8">
          {/* Praxis Categories */}
          <h2 className="text-xl font-bold text-white mb-4">Praktische Übungen</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {praxisCategories.map((category) => (
              <Link href={`/praxis/${category.id}`} key={category.id} className="block group">
                <div
                  className="rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] cursor-pointer relative overflow-hidden h-full"
                  style={{
                    backgroundColor: "var(--theme-card)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `color-mix(in srgb, ${category.color} 20%, transparent)` }}
                  >
                    <category.icon className="h-6 w-6" style={{ color: category.color }} />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">{category.title}</h3>
                  <p className="text-sm text-white/50 mb-3">{category.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">{category.items} Einheiten</span>
                    <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Materials Section */}
          <h2 className="text-xl font-bold text-white mb-4">Prüfungssammlung & Materialien</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {materialTypes.map((material, index) => (
              <div
                key={index}
                className="rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                style={{
                  backgroundColor: "var(--theme-card)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)" }}
                >
                  <material.icon className="h-6 w-6" style={{ color: "var(--theme-primary)" }} />
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{material.title}</h3>
                <p className="text-sm text-white/50 mb-3">{material.description}</p>

                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
                      color: "var(--theme-primary)",
                    }}
                  >
                    {material.count} verfügbar
                  </span>
                  <ChevronRight className="h-4 w-4 text-white/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
