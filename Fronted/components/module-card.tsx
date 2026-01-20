import type { Module } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Mail } from "lucide-react"

interface ModuleCardProps {
  module: Module
  progress?: number
  variant?: "default" | "compact"
}

export function ModuleCard({ module, progress = 0, variant = "default" }: ModuleCardProps) {
  const gradientColors = ["from-teal-500 to-teal-600", "from-cyan-500 to-cyan-600"]

  const colorIndex = module.display_order % gradientColors.length
  const gradientClass = gradientColors[colorIndex]

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
          "hover:scale-[1.02] cursor-pointer",
          "bg-gradient-to-br",
          gradientClass,
        )}
      >
        <div className="relative z-10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{module.name}</h3>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 cursor-pointer",
        "hover:scale-[1.01]",
        "bg-gradient-to-br",
        gradientClass,
      )}
    >
      <div className="relative z-10 flex items-center gap-6">
        {/* Progress Circle */}
        <div className="relative h-16 w-16 flex-shrink-0">
          <svg className="h-16 w-16 -rotate-90">
            <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="none" />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(6, 182, 212, 1)"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${28 * 2 * Math.PI}`}
              strokeDashoffset={`${28 * 2 * Math.PI * (1 - progress / 100)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm">{progress}%</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{module.name}</h3>
          {module.description && <p className="text-sm text-white/70">{module.description}</p>}
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 opacity-30">
          <Mail className="h-12 w-12 text-white" />
        </div>
      </div>
    </div>
  )
}
