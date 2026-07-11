"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { INDIAN_CITIES } from "@/data/indian-cities"

interface CitySearchProps {
  onSearch: (city: string) => void
  placeholder?: string
  buttonText?: string
}

export default function CitySearch({
  onSearch,
  placeholder = "Enter your location or pincode",
  buttonText = "Find Gyms Near You",
}: CitySearchProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter cities based on user input
  useEffect(() => {
    if (query.trim().length > 1) {
      const filteredCities = INDIAN_CITIES.filter((city) => city.toLowerCase().includes(query.toLowerCase())).slice(
        0,
        8,
      ) // Limit to 8 suggestions for better UX

      setSuggestions(filteredCities)
      setShowSuggestions(filteredCities.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setSelectedIndex(-1)
  }, [query])

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        handleSelectCity(suggestions[selectedIndex])
      } else if (query) {
        handleSearch()
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleSelectCity = (city: string) => {
    setQuery(city)
    setShowSuggestions(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleSearch = () => {
    onSearch(query)
    setShowSuggestions(false)
  }

  return (
    <div className="relative w-full">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex items-center bg-white/20 backdrop-blur-sm rounded-md px-3 relative">
          <MapPin className="text-orange-500 mr-2 flex-shrink-0" size={20} />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="w-full py-3 px-2 bg-transparent border-0 text-white placeholder-blue-100 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
          />
        </div>
        <Button
          type="button"
          className="bg-orange-500 hover:bg-orange-600 text-white py-6 shadow-md hover:shadow-lg transition-all"
          onClick={handleSearch}
        >
          <Search className="mr-2" size={18} />
          {buttonText}
        </Button>
      </div>

      {/* City suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute left-0 right-0 mt-1 bg-white rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.map((city, index) => (
            <div
              key={city}
              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${index === selectedIndex ? "bg-blue-100" : ""}`}
              onClick={() => handleSelectCity(city)}
            >
              <div className="flex items-center">
                <MapPin className="text-blue-900 mr-2 flex-shrink-0" size={16} />
                <span className="truncate">{city}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
