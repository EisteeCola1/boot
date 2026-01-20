"use client"

import Link from "next/link"
import { SidebarNav } from "@/components/sidebar-nav"
import { Ship, Anchor, Compass, ChevronRight, ChevronLeft, Trophy, Target, BookOpen } from "lucide-react"
import { useState } from "react"

const courses = [
  {
    id: "sbf-see",
    href: "/sbf-see",
    title: "SBF See",
    description: "Sportbootführerschein für Küstengewässer und Seeschifffahrtsstraßen",
    modules: "9 Module",
    icon: Ship,
    gradient: "linear-gradient(135deg, var(--theme-primary), color-mix(in srgb, var(--theme-primary) 60%, var(--theme-accent)))",
  },
  {
    id: "sbf-binnen",
    href: "/sbf-binnen",
    title: "SBF Binnen",
    description: "Sportbootführerschein für Binnengewässer und Flüsse",
    modules: "8 Module",
    icon: Anchor,
    gradient: "linear-gradient(135deg, var(--theme-accent), color-mix(in srgb, var(--theme-accent) 60%, var(--theme-primary)))",
  },
  {
    id: "basis",
    href: "/basis",
    title: "Basiskurs",
    description: "Grundlagen für alle Sportbootführerscheine - gemeinsame Basisfragen",
    modules: "3 Module",
    icon: BookOpen,
    gradient: "linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 80%, white), var(--theme-primary))",
  },
]

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? courses.length - 1 : prev - 1))
  }
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === courses.length - 1 ? 0 : prev + 1))
  }
  
  // Create an infinite loop array with duplicates
  const extendedCourses = [...courses, ...courses, ...courses]
  const startIndex = courses.length + currentIndex
  
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--theme-bg)" }}>
      <SidebarNav activeCategory={null} onCategoryChange={() => {}} />

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
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <Ship className="h-6 w-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Bootsschule</h1>
                <p className="text-xs text-white/40">Sportbootführerschein</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/hilfe">
                <button className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 transition-all text-sm">
                  Hilfe
                </button>
              </Link>
              <Link href="/profil">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-black font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform"
                  style={{ backgroundColor: "var(--theme-primary)" }}
                >
                  N
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-8 py-8">
          {/* Hero Section */}
          <div
            className="rounded-3xl p-8 border mb-8 relative overflow-hidden"
            style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: "var(--theme-primary)" }}
            />
            <div className="absolute top-4 right-4 opacity-10">
              <Compass className="w-32 h-32" style={{ color: "var(--theme-primary)" }} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="px-3 py-1 text-xs font-bold rounded-full"
                  style={{ backgroundColor: "var(--theme-primary)", color: "black" }}
                >
                  WILLKOMMEN
                </span>
                <span className="text-yellow-400 text-sm">⭐ Beste Lernplattform</span>
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">Dein Weg zum Bootsführerschein</h2>
              <p className="text-white/60 mb-6 max-w-xl">
                Lerne mit echten Prüfungsfragen für den Sportbootführerschein See und Binnen. Tracke deinen Fortschritt
                und bestehe die Prüfung beim ersten Versuch.
              </p>

              <div className="flex flex-wrap gap-6 text-sm text-white/70">
                <span className="flex items-center gap-2">
                  <span style={{ color: "var(--theme-primary)" }}>✓</span> Alle Prüfungsfragen
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ color: "var(--theme-primary)" }}>✓</span> Hohe Bestehensquote
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ color: "var(--theme-primary)" }}>✓</span> Fortschritts-Tracking
                </span>
              </div>
            </div>
          </div>

          {/* Course Selection with Carousel */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Wähle deinen Kurs</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button
                onClick={handleNext}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-all hover:bg-white/10"
                style={{ borderColor: "rgba(255,255,255,0.2)" }}
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Infinite Carousel */}
          <div className="relative mb-8 overflow-hidden">
            <div 
              className="flex transition-transform duration-300 ease-out gap-6"
              style={{ 
                transform: `translateX(-${startIndex * (100 / 3)}%)`,
              }}
            >
              {extendedCourses.map((course, index) => {
                const IconComponent = course.icon
                return (
                  <Link 
                    key={`${course.id}-${index}`} 
                    href={course.href} 
                    className="group block flex-shrink-0"
                    style={{ width: "calc(33.333% - 16px)" }}
                  >
                    <div
                      className="relative overflow-hidden rounded-2xl p-6 cursor-pointer h-full min-h-[200px] transition-all duration-300 hover:scale-[1.02]"
                      style={{ 
                        background: course.gradient,
                      }}
                    >
                      <div className="absolute top-4 right-4 opacity-20">
                        <IconComponent className="w-20 h-20 text-white" />
                      </div>

                      <div className="relative z-10">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 bg-white/20">
                          <IconComponent className="h-7 w-7 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">{course.title}</h4>
                        <p className="text-white/80 text-sm mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex items-center gap-2 text-white/90 font-medium text-sm">
                          <span>{course.modules}</span>
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {courses.map((course, index) => (
              <button
                key={course.id}
                onClick={() => setCurrentIndex(index)}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: currentIndex === index ? "var(--theme-primary)" : "rgba(255,255,255,0.3)",
                  width: currentIndex === index ? "24px" : "8px",
                }}
              />
            ))}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Prüfungssimulation Card */}
            <Link href="/pruefung" className="group block">
              <div
                className="rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)" }}
                >
                  <Target className="h-6 w-6" style={{ color: "var(--theme-primary)" }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Prüfungssimulation</h3>
                <p className="text-sm text-white/50">Übe unter echten Prüfungsbedingungen</p>
                <ChevronRight className="absolute top-6 right-6 h-5 w-5 text-white/30" />
              </div>
            </Link>

            {/* Navigationsprüfung Card */}
            <Link href="/navigation-pruefung" className="group block">
              <div
                className="rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "color-mix(in srgb, var(--theme-accent) 20%, transparent)" }}
                >
                  <Compass className="h-6 w-6" style={{ color: "var(--theme-accent)" }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Navigationsprüfung</h3>
                <p className="text-sm text-white/50">Navigationsaufgaben simulieren</p>
                <ChevronRight className="absolute top-6 right-6 h-5 w-5 text-white/30" />
              </div>
            </Link>

            {/* Praxis & Prüfungssammlung Card */}
            <Link href="/praxis" className="group block">
              <div
                className="rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
                style={{ backgroundColor: "var(--theme-card)", borderColor: "rgba(255,255,255,0.1)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)" }}
                >
                  <Trophy className="h-6 w-6" style={{ color: "var(--theme-primary)" }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Praxis & Prüfungssammlung</h3>
                <p className="text-sm text-white/50">Praktische Übungen und Materialien</p>
                <ChevronRight className="absolute top-6 right-6 h-5 w-5 text-white/30" />
              </div>
            </Link>
          </div>


        </div>
      </div>
    </div>
  )
}
