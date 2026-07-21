"use client"

import { createContext, useContext } from "react"
import { useJsApiLoader } from "@react-google-maps/api"

// Single shared libraries array — MUST be the same reference everywhere
// Added 'marker' library for AdvancedMarkerElement support
const LIBRARIES = ["places", "marker"] as const

interface GoogleMapsContextType {
  isLoaded: boolean
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({ isLoaded: false })

export function GoogleMapsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
    // Use the weekly channel to get latest features
    version: "weekly",
    // Language and region
    language: "en",
    region: "IN",
  })

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  )
}

export function useGoogleMaps() {
  return useContext(GoogleMapsContext)
}
