"use client"

import { SidebarNav } from "@/components/sidebar-nav"
import {
  Book,
  HelpCircle,
  Mail,
  MessageCircle,
  FileText,
  ChevronDown,
  ChevronRight,
  Ship,
  Compass,
  Award,
  Clock,
} from "lucide-react"
import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: "Wie funktioniert das Lernsystem?",
    answer:
      "Unser Lernsystem basiert auf dem Prinzip der Wiederholung. Jede Frage muss 3-mal richtig beantwortet werden, um als gelernt zu gelten. Der Fortschritt wird automatisch gespeichert.",
  },
  {
    question: "Was ist der Unterschied zwischen SBF See und SBF Binnen?",
    answer:
      "Der SBF See berechtigt zum Führen von Sportbooten auf den Seeschifffahrtsstraßen (Küstengewässer bis 3 Seemeilen). Der SBF Binnen gilt für Binnengewässer wie Flüsse, Kanäle und Seen.",
  },
  {
    question: "Wie läuft die Prüfungssimulation ab?",
    answer:
      "Die Prüfungssimulation besteht aus 30 Fragen: 7 Basisfragen und 23 spezifische Fragen (See oder Binnen). Um zu bestehen, müssen mindestens 5 Basisfragen und 18 spezifische Fragen richtig sein.",
  },
  {
    question: "Kann ich meinen Fortschritt auf mehreren Geräten nutzen?",
    answer:
      "Der Fortschritt wird mit Ihrer eindeutigen Session-ID gespeichert. Für geräteübergreifendes Lernen empfehlen wir, sich ein Profil anzulegen.",
  },
  {
    question: "Was bedeuten die Filter bei den Übungsfragen?",
    answer:
      "Mit den Filtern können Sie gezielt lernen: 'Alle Fragen' zeigt alle, 'Unbeantwortete' nur neue, 'Falsch beantwortet' Ihre Fehler, 'Richtig beantwortet' zur Wiederholung, und 'Markierte' Ihre Lesezeichen.",
  },
  {
    question: "Wie kann ich das Farbschema ändern?",
    answer:
      "Klicken Sie auf das Palette-Symbol in der linken Sidebar oder gehen Sie zu 'Farbpaletten'. Dort können Sie aus 20 verschiedenen maritimen Farbthemen wählen.",
  },
]

export default function HilfePage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--theme-bg)" }}>
      <SidebarNav />

      <main className="pl-16">
        {/* Header */}
        <div className="relative overflow-hidden border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-20 text-6xl opacity-20">⚓</div>
            <div className="absolute top-20 right-40 text-4xl opacity-20">🧭</div>
            <div className="absolute bottom-10 left-1/3 text-5xl opacity-20">⛵</div>
          </div>

          <div className="relative px-8 py-12">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--theme-primary)" }}
              >
                <HelpCircle className="h-6 w-6" style={{ color: "var(--theme-bg)" }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--theme-primary)" }}>
                  Support Center
                </p>
                <h1 className="text-3xl font-bold text-white">Hilfe & FAQ</h1>
              </div>
            </div>
            <p className="text-white/60 max-w-2xl">
              Hier findest du Antworten auf häufig gestellte Fragen und hilfreiche Informationen rund um die
              Bootsschule-Lernplattform.
            </p>
          </div>
        </div>

        <div className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Book, title: "Lernmodus", desc: "So funktioniert das Lernen" },
                { icon: FileText, title: "Prüfung", desc: "Prüfungssimulation erklärt" },
                { icon: Award, title: "Zertifikate", desc: "SBF See & Binnen Info" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{
                    backgroundColor: "var(--theme-card)",
                    borderColor: "rgba(255,255,255,0.1)",
                  }}
                >
                  <item.icon className="h-8 w-8 mb-3" style={{ color: "var(--theme-primary)" }} />
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/60">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* FAQ Section */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--theme-card)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" style={{ color: "var(--theme-primary)" }} />
                Häufig gestellte Fragen
              </h2>

              <div className="space-y-3">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="rounded-xl border overflow-hidden transition-all duration-300"
                    style={{ borderColor: "rgba(255,255,255,0.1)" }}
                  >
                    <button
                      onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                    >
                      <span className="font-medium text-white">{faq.question}</span>
                      {openFAQ === index ? (
                        <ChevronDown className="h-5 w-5 text-white/60" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-white/60" />
                      )}
                    </button>
                    {openFAQ === index && <div className="px-5 pb-4 text-white/70 animate-fade-in">{faq.answer}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Tips */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--theme-card)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Compass className="h-5 w-5" style={{ color: "var(--theme-primary)" }} />
                Lerntipps für die Prüfung
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Clock, tip: "Lerne regelmäßig in kurzen Einheiten von 20-30 Minuten" },
                  { icon: FileText, tip: "Nutze die Prüfungssimulation zur Vorbereitung" },
                  { icon: Ship, tip: "Wiederhole falsch beantwortete Fragen gezielt" },
                  { icon: Award, tip: "Markiere schwierige Fragen für späteres Wiederholen" },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-white/5">
                    <item.icon className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "var(--theme-primary)" }} />
                    <span className="text-white/80">{item.tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: "var(--theme-card)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5" style={{ color: "var(--theme-primary)" }} />
                Noch Fragen?
              </h2>
              <p className="text-white/70 mb-4">
                Du hast eine Frage, die hier nicht beantwortet wird? Kontaktiere uns gerne!
              </p>
              <button
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: "var(--theme-primary)",
                  color: "var(--theme-bg)",
                }}
              >
                Kontakt aufnehmen
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
