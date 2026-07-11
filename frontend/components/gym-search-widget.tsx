"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  MapPin,
  Locate,
  Search,
  X,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { searchGyms, searchGymsByLocation } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Autocomplete,
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/google-maps-provider";
import {
  calculateDistance,
  getSavedLocation,
  saveLocation,
  type UserLocation,
} from "@/lib/user-location";

const getDayOfWeek = () => {
  const days = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
  ];
  return days[new Date().getDay()];
};

interface Gym {
  _id: string;
  name: string;
  description: string;
  locationId: string | {
    _id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
    coordinates: {
      type: string;
      coordinates: [number, number];
    };
  };
  facilities: string[];
  priceRange: string;
  isActive: boolean;
  openingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  subscriptionListings: any[];
  pictures: any[];
  distance?: number;
}

export default function GymSearchWidget() {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCoordinates, setUserCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Scroll state
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const { isLoaded } = useGoogleMaps();

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setIsAtTop(scrollTop < 10);
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
    setShowScrollTop(scrollTop > 100);
    setShowScrollBottom(scrollTop + clientHeight < scrollHeight - 100);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (scrollContainerRef.current && gyms.length > 0) {
      scrollContainerRef.current.scrollTop = 0;
      setTimeout(() => handleScroll(), 100);
    }
  }, [gyms, handleScroll]);

  // On mount, try to use saved location or auto-detect
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setUserCoordinates({ lat: saved.lat, lng: saved.lng });
      setLocation(saved.label || "Near You");
      searchNearby(saved.lat, saved.lng);
    } else {
      attemptAutoLocation();
    }
    // eslint-disable-next-line
  }, []);

  const searchNearby = async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await searchGymsByLocation(lat, lng, 5, 20);
      let gymsData: Gym[] = Array.isArray(response)
        ? response
        : response?.data?.gyms || response?.data || [];

      gymsData = gymsData
        .filter((gym) => gym.isActive)
        .map((gym) => {
          if (typeof gym.locationId === "object" && gym.locationId.coordinates) {
            const [gymLng, gymLat] = gym.locationId.coordinates.coordinates;
            const distance = calculateDistance(lat, lng, gymLat, gymLng);
            return { ...gym, distance };
          }
          return gym;
        })
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

      setGyms(gymsData);
      if (gymsData.length === 0) {
        await fetchAllGyms();
        toast({
          title: "No gyms nearby",
          description: "Showing all available gyms instead.",
          duration: 3000,
        });
      }
    } catch {
      await fetchAllGyms();
    } finally {
      setLoading(false);
    }
  };

  const attemptAutoLocation = async () => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000,
          });
        }
      );
      const { latitude, longitude } = position.coords;
      setUserCoordinates({ lat: latitude, lng: longitude });
      setLocation("Near You");
      saveLocation({ lat: latitude, lng: longitude, label: "Near You", timestamp: Date.now() });
      await searchNearby(latitude, longitude);
      toast({
        title: "Location detected!",
        description: "Showing gyms near you.",
        duration: 3000,
      });
    } catch {
      await fetchAllGyms();
      toast({
        title: "Location access needed",
        description: "Pick a location on the map or search a place.",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    setIsLocating(true);
    setError(null);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000,
          });
        }
      );
      const { latitude, longitude } = position.coords;
      setUserCoordinates({ lat: latitude, lng: longitude });
      setLocation("Near You");
      saveLocation({ lat: latitude, lng: longitude, label: "Near You", timestamp: Date.now() });
      await searchNearby(latitude, longitude);
      toast({
        title: "Location found!",
        description: "Showing gyms near you.",
        duration: 3000,
      });
    } catch {
      setError("Location access denied. Search a place instead.");
      await fetchAllGyms();
    } finally {
      setIsLocating(false);
    }
  };

  const handlePlaceSelect = async () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const label = place.formatted_address || place.name || "Selected Location";
      setUserCoordinates({ lat, lng });
      setLocation(label);
      saveLocation({ lat, lng, label, timestamp: Date.now() });
      if (inputRef.current) inputRef.current.value = "";
      await searchNearby(lat, lng);
    }
  };

  const fetchAllGyms = async () => {
    setLoading(true);
    try {
      const response = await searchGyms({});
      const gymsData: Gym[] = Array.isArray(response)
        ? response
        : response?.data?.gyms || response?.data || [];
      setGyms(gymsData);
      setLocation("All Locations");
      setError(null);
    } catch {
      setError("Failed to fetch gyms");
      setGyms([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md p-3 sm:p-6 rounded-2xl shadow-xl border border-white/50 max-w-3xl mx-auto max-h-[90vh] flex flex-col">
      <div className="mb-3 sm:mb-5 flex-shrink-0">
        <h3 className="text-base sm:text-xl font-bold text-blue-900">
          Find Your Perfect Gym, Near You
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1">
          Search for a place or use your current location
        </p>
      </div>

      <div className="relative w-full flex-shrink-0">
        <div className="flex flex-col space-y-3">
          {/* Google Places Autocomplete search */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              {isLoaded ? (
                <Autocomplete
                  onLoad={(ac) => (autocompleteRef.current = ac)}
                  onPlaceChanged={handlePlaceSelect}
                  options={{ componentRestrictions: { country: "in" } }}
                >
                  <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                    <div className="pl-3 sm:pl-4 pr-2 text-blue-900">
                      <Search className="h-5 w-5" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Search area, city, or landmark..."
                      className="flex-1 py-3 sm:py-4 px-2 bg-transparent border-0 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 text-sm sm:text-base min-w-0"
                    />
                  </div>
                </Autocomplete>
              ) : (
                <div className="flex items-center bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 sm:py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-400" />
                  <span className="text-sm text-gray-400">Loading search...</span>
                </div>
              )}
            </div>

            {/* Current location button */}
            <Button
              type="button"
              variant="outline"
              onClick={getUserLocation}
              disabled={isLocating}
              className="h-[46px] sm:h-[54px] px-3 sm:px-4 border-gray-200 flex-shrink-0"
              title="Use current location"
            >
              {isLocating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Locate className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Quick actions */}
          <div className="flex flex-row gap-2 items-center justify-center">
            <Link href="/gyms">
              <Button
                type="button"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm py-2"
              >
                View All Gyms
              </Button>
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-500 mt-2 text-center text-xs sm:text-sm">
            {error}
          </div>
        )}

        {/* Location indicator */}
        {location && !error && (
          <div className="text-xs sm:text-sm text-gray-600 mt-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                userCoordinates ? "bg-green-500" : "bg-gray-400"
              }`}></div>
              <span className="truncate max-w-[250px]">
                {location} ({gyms.length} gyms)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Gyms List */}
      <div className="relative flex-1 min-h-0 mt-3 sm:mt-6 flex flex-col">
        {!isAtTop && gyms.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white via-white/80 to-transparent z-10 pointer-events-none" />
        )}

        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={scrollToTop}
              className="absolute top-2 right-2 z-20 bg-blue-900 hover:bg-blue-800 text-white rounded-full p-2 shadow-lg"
            >
              <ChevronUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-h-0 p-2 scrollbar-blue"
        >
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-900 border-r-transparent"></div>
              <p className="mt-2 text-gray-600">Finding gyms near you...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {gyms.map((gym, index) => (
                <Link href={`/gyms/${gym._id}`} key={gym._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="group relative p-5 border-2 border-gray-200 rounded-xl hover:border-blue-900 hover:shadow-xl transition-all duration-300 bg-white overflow-visible"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

                    {gym.distance !== undefined && (
                      <div className="absolute -top-2 -left-2 z-20">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-md ${
                          gym.distance < 2 ? "bg-green-500 text-white" :
                          gym.distance < 4 ? "bg-blue-500 text-white" :
                          gym.distance < 6 ? "bg-yellow-500 text-white" :
                          "bg-gray-500 text-white"
                        }`}>
                          {gym.distance < 1.5 ? "Very close" :
                           gym.distance < 3 ? "Nearby" :
                           gym.distance < 5 ? "Close" : "Far"}
                        </span>
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h3 className="font-bold text-lg text-blue-900 group-hover:text-blue-700 transition-colors text-left">
                          {gym.name}
                        </h3>
                        {gym.distance !== undefined && (
                          <div className="flex items-center gap-1 bg-blue-900 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0">
                            <MapPin className="h-3 w-3" />
                            <span>{gym.distance} km</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-600 text-xs mb-3 line-clamp-2 text-left leading-relaxed">
                        {gym.description}
                      </p>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full capitalize">
                          {gym.priceRange}
                        </span>
                        {gym.isActive && (
                          <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            Active
                          </span>
                        )}
                        {gym.subscriptionListings && gym.subscriptionListings.length > 0 && (
                          <span className="px-2.5 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                            {gym.subscriptionListings.length} Plans
                          </span>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {gym.contact?.phone || "No phone"}
                          </span>
                          <span className="text-blue-900 font-semibold group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1">
                            View Details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
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

        {!isAtBottom && gyms.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
        )}

        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-2 right-2 z-20 bg-blue-900 hover:bg-blue-800 text-white rounded-full p-2 shadow-lg"
            >
              <ChevronDown className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
