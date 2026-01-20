"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase"
import { getCategoryProgress, getAllProgressStats } from "@/lib/actions"
import { getUserId } from "@/lib/user-session"
import type { Module } from "@/lib/types"

// Fetcher für Module
const fetchModules = async (category: string): Promise<Module[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("category", category)
    .order("display_order", { ascending: true })

  if (error) throw error
  return data || []
}

// Fetcher für Kategorie-Fortschritt
const fetchCategoryProgress = async (category: string): Promise<Record<string, number>> => {
  const userId = getUserId()
  if (!userId) return {}
  return getCategoryProgress(userId, category)
}

// Hook für Module einer Kategorie - cached für 5 Minuten, da sich Module selten ändern
export function useModules(category: string) {
  const { data, error, isLoading, mutate } = useSWR(`modules-${category}`, () => fetchModules(category), {
    revalidateOnFocus: false, // Module ändern sich selten
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 Minuten Cache
  })

  return {
    modules: data || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook für Fortschritt - cached aber revalidiert öfter
export function useCategoryProgress(category: string) {
  const { data, error, isLoading, mutate } = useSWR(`progress-${category}`, () => fetchCategoryProgress(category), {
    revalidateOnFocus: true, // Fortschritt kann sich ändern
    dedupingInterval: 10000, // 10 Sekunden Dedupe
  })

  return {
    progress: data || {},
    isLoading,
    error,
    refresh: mutate,
  }
}

// Hook für Profil-Statistiken
export function useProfileStats() {
  const { data, error, isLoading, mutate } = useSWR(
    "profile-stats",
    async () => {
      const userId = getUserId()
      return getAllProgressStats(userId)
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000, // 5 Sekunden Dedupe
    },
  )

  return {
    stats: data || {
      totalAnswered: 0,
      totalMastered: 0,
      totalExams: 0,
      passedExams: 0,
      seeProgress: 0,
      binnenProgress: 0,
    },
    isLoading,
    error,
    refresh: mutate,
  }
}

// Kombinierter Hook für Module + Fortschritt
export function useModulesWithProgress(category: string) {
  const { modules, isLoading: modulesLoading, refresh: refreshModules } = useModules(category)
  const { progress, isLoading: progressLoading, refresh: refreshProgress } = useCategoryProgress(category)

  return {
    modules,
    progress,
    isLoading: modulesLoading || progressLoading,
    refresh: () => {
      refreshModules()
      refreshProgress()
    },
  }
}
