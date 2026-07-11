"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { apiService, type Gym } from "@/lib/api"

interface GymSelectorContextType {
  gyms: Gym[]
  selectedGymId: string
  setSelectedGymId: (id: string) => void
  loading: boolean
}

const GymSelectorContext = createContext<GymSelectorContextType | undefined>(undefined)

const STORAGE_KEY = "Neyofit_selected_gym"

export function GymSelectorProvider({ children }: { children: ReactNode }) {
  const [gyms, setGyms] = useState<Gym[]>([])
  const [selectedGymId, setSelectedGymIdState] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSelectedGymIdState(stored)
    }

    async function fetchGyms() {
      try {
        const res = await apiService.getGymOwnerDashboard()
        if (res.data) {
          const d = res.data as Record<string, unknown>
          setGyms((d.gyms as Gym[]) || [])
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    fetchGyms()
  }, [])

  const setSelectedGymId = (id: string) => {
    setSelectedGymIdState(id)
    sessionStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <GymSelectorContext.Provider value={{ gyms, selectedGymId, setSelectedGymId, loading }}>
      {children}
    </GymSelectorContext.Provider>
  )
}

export function useGymSelector() {
  const context = useContext(GymSelectorContext)
  if (context === undefined) {
    throw new Error("useGymSelector must be used within a GymSelectorProvider")
  }
  return context
}
