"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useGoogleMaps } from "@/components/google-maps-provider"

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.Place) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  componentRestrictions?: google.maps.places.ComponentRestrictions
}

export function PlaceAutocomplete({
  onPlaceSelect,
  placeholder = "Search for a place...",
  className = "",
  disabled = false,
  componentRestrictions = { country: "in" },
}: PlaceAutocompleteProps) {
  const { isLoaded } = useGoogleMaps()
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [useLegacy, setUseLegacy] = useState(false)

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    // Check if the new element is supported
    const supportsNewElement = "gmp-place-autocomplete" in window.customElements ||
      typeof document.createElement("gmp-place-autocomplete") === "object"

    if (!supportsNewElement) {
      setUseLegacy(true)
      return
    }

    // Create the new PlaceAutocompleteElement
    const autocompleteElement = document.createElement(
      "gmp-place-autocomplete"
    ) as google.maps.places.PlaceAutocompleteElement

    autocompleteElement.placeholder = placeholder
    // New API uses locationRestriction with LatLngBounds, not componentRestrictions
    // For country restriction, we need to use bounds or skip for now
    // autocompleteElement.locationRestriction = { country: componentRestrictions.country } // This is invalid
    autocompleteElement.disabled = disabled

    // Insert after the input
    inputRef.current.parentNode?.insertBefore(autocompleteElement, inputRef.current.nextSibling)
    autocompleteRef.current = autocompleteElement

    // Listen for place selection
    autocompleteElement.addEventListener("gmp-placeselect", async (event: any) => {
      const place = event.place
      if (place) {
        // Fetch full place details
        try {
          setIsLoading(true)
          await place.fetchFields({
            fields: ["displayName", "formattedAddress", "location", "types", "addressComponents"]
          })
          onPlaceSelect(place)
        } catch (error) {
          console.error("Error fetching place details:", error)
        } finally {
          setIsLoading(false)
        }
      }
    })

    // Cleanup
    return () => {
      autocompleteElement.remove()
      autocompleteRef.current = null
    }
  }, [isLoaded, onPlaceSelect, placeholder, disabled, componentRestrictions])

  if (!isLoaded) {
    return (
      <div className={`flex items-center bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
        <div className="pl-4 pr-2 text-blue-900">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Loading search..."
          className="flex-1 py-3 px-2 bg-transparent border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 text-sm min-w-0"
          disabled
        />
      </div>
    )
  }

  // Use legacy autocomplete if new element not supported
  if (useLegacy) {
    return <LegacyPlaceAutocomplete
      onPlaceSelect={onPlaceSelect}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      componentRestrictions={componentRestrictions}
    />
  }

  return (
    <div className={`flex items-center bg-white rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ${className}`}>
      <div className="pl-4 pr-2 text-blue-900">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="flex-1 py-3 px-2 bg-transparent border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 text-sm min-w-0"
        disabled={disabled}
        aria-label={placeholder}
      />
      {isLoading && (
        <svg className="mr-3 h-5 w-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
    </div>
  )
}

// Fallback component using the legacy Autocomplete for browsers that don't support the new element
interface LegacyAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  componentRestrictions?: google.maps.places.ComponentRestrictions
}

export function LegacyPlaceAutocomplete({
  onPlaceSelect,
  placeholder = "Search for a place...",
  className = "",
  disabled = false,
  componentRestrictions = { country: "in" },
}: LegacyAutocompleteProps) {
  const { isLoaded } = useGoogleMaps()
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions,
      fields: ["place_id", "geometry", "name", "formatted_address", "address_components"],
    })

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        onPlaceSelect(place)
      }
    })

    autocompleteRef.current = autocomplete

    return () => {
      autocomplete.unbindAll()
      autocompleteRef.current = null
    }
  }, [isLoaded, onPlaceSelect, componentRestrictions])

  if (!isLoaded) {
    return (
      <div className={`flex items-center bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
        <div className="pl-4 pr-2 text-blue-900">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Loading search..."
          className="flex-1 py-3 px-2 bg-transparent border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 text-sm min-w-0"
          disabled
        />
      </div>
    )
  }

  return (
    <div className={`flex items-center bg-white rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all ${className}`}>
      <div className="pl-4 pr-2 text-blue-900">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="flex-1 py-3 px-2 bg-transparent border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 text-sm min-w-0"
        disabled={disabled}
        aria-label={placeholder}
      />
    </div>
  )
}