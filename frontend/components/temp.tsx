"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Locate, Search, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { searchGyms, searchGymsByLocation } from "@/lib/api";
import { INDIAN_CITIES } from "@/data/indian-cities";

interface Gym {
  _id: string;
  name: string;
  description?: string;
  location: {
    address: string;
    city: string;
  };
}

export default function GymSearchWidget() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem("recentSearches");
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches).slice(0, 3));
      }
    } catch (e) {
      // Handle localStorage errors silently
    }
  }, []);

  const saveRecentSearch = (city: string) => {
    const updatedSearches = [
      city,
      ...recentSearches.filter((item) => item !== city),
    ].slice(0, 3);
    setRecentSearches(updatedSearches);
    try {
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    } catch (e) {
      // Handle localStorage errors silently
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await searchGyms({
        near: searchQuery,
        radius: 10,
        page: 1,
        limit: 20,
      });
      setGyms(response.data || []);
      setLocation(searchQuery);
      setError(null);
    } catch (err) {
      setError("Failed to fetch gyms for this location");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city: string) => {
    setQuery(city);
    setShowSuggestions(false);
    saveRecentSearch(city);
    handleSearch(city);
  };

  const getUserLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await searchGymsByLocation(latitude, longitude);
            setGyms(response.data || []);
            setLocation(
              `Near You (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`
            );
            setError(null);
          } catch (err) {
            setError("Failed to fetch nearby gyms");
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          setError("Failed to get location. Please enable location services.");
          setIsLocating(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
      setIsLocating(false);
    }
  };

  const fetchAllGyms = async () => {
    setLoading(true);
    try {
      const response = await searchGyms({ page: 1, limit: 20 });
      setGyms(response.data || []);
      setLocation("All Locations");
      setError(null);
    } catch (err) {
      setError("Failed to fetch gyms");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length > 1) {
      const filteredCities = INDIAN_CITIES.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6);

      setSuggestions(filteredCities);
      setShowSuggestions(filteredCities.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      handleSelectCity(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleClearInput = () => {
    setQuery("");
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/50 max-w-3xl mx-auto">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-blue-900">
          Find Your Perfect Gym
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          Search from 2000+ gyms across 20+ cities
        </p>
      </div>

      <div className="relative w-full">
        <div className="flex flex-col space-y-4">
          {/* Search input with suggestions */}
          <div className="relative">
            <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <div className="pl-4 pr-2 text-blue-900">
                <MapPin className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Enter your city or location"
                className="flex-1 py-4 px-2 bg-transparent border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
              {query && (
                <button
                  onClick={handleClearInput}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="pr-3">
                <Button
                  type="button"
                  onClick={() => handleSearch(query)}
                  className="bg-blue-900 hover:bg-blue-800 text-white rounded-lg px-5 py-2 h-10"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* City suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto border border-gray-100"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {suggestions.map((city, index) => (
                    <div
                      key={city}
                      className={`px-4 py-3 cursor-pointer hover:bg-blue-50 ${
                        index === selectedIndex ? "bg-blue-100" : ""
                      } transition-colors`}
                      onClick={() => handleSelectCity(city)}
                    >
                      <div className="flex items-center">
                        <MapPin className="text-blue-900 mr-3 flex-shrink-0 h-4 w-4" />
                        <div>
                          <span className="font-medium text-gray-900">
                            {city}
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Find gyms in {city}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Additional options */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Use my location button */}
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-900 hover:border-gray-400"
              onClick={getUserLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
                  Locating...
                </>
              ) : (
                <>
                  <Locate className="mr-2 h-4 w-4" />
                  Use my location
                </>
              )}
            </Button>

            <Link href="/gyms">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-blue-900 hover:border-gray-400"
                disabled={loading}
              >
                View All Gyms
              </Button>
            </Link>

            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  Recent:
                </span>
                <div className="flex gap-2 flex-wrap justify-center">
                  {recentSearches.map((city) => (
                    <Button
                      key={city}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-700 hover:text-blue-900 hover:bg-blue-50"
                      onClick={() => handleSelectCity(city)}
                    >
                      {city}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="text-red-500 mt-4 text-center">{error}</div>}

        {/* Location Display */}
        {location && !error && (
          <div className="text-sm text-gray-600 mt-4 text-center">
            Showing gyms in {location}
          </div>
        )}

        {/* Gyms List */}
        <div className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-900 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Loading gyms...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gyms.map((gym) => (
                <Link href={`/gyms/${gym._id}`} key={gym._id}>
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-lg">{gym.name}</h3>
                    <p className="text-gray-600">{gym.location.address}</p>
                    <p className="text-gray-500">{gym.location.city}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {!loading && gyms.length === 0 && !error && (
            <div className="text-center text-gray-500 py-8">
              No gyms found. Try another location or view all gyms.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
