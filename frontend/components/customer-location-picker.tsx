"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  GoogleMap,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, LocateFixed, X, Search, ChevronDown } from "lucide-react";
import {
  getSavedLocation,
  saveLocation,
  type UserLocation,
} from "@/lib/user-location";
import { useGoogleMaps } from "@/components/google-maps-provider";

const defaultCenter = { lat: 28.6139, lng: 77.209 };

const mapContainerStyle = {
  width: "100%",
  height: "220px",
  borderRadius: "0.5rem",
};

interface CustomerLocationPickerProps {
  onLocationSelect: (location: UserLocation) => void;
  compact?: boolean;
  className?: string;
}

export default function CustomerLocationPicker({
  onLocationSelect,
  compact = false,
  className = "",
}: CustomerLocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [locationLabel, setLocationLabel] = useState("");
  const [detecting, setDetecting] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isLoaded } = useGoogleMaps();

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // On mount, load saved location or auto-detect
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setMarkerPosition({ lat: saved.lat, lng: saved.lng });
      setLocationLabel(saved.label || "");
    } else if (navigator.geolocation) {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const pos = { lat: latitude, lng: longitude };
          setMarkerPosition(pos);
          if (window.google) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: pos }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const components = results[0].address_components;
                let city = "", area = "";
                for (const comp of components) {
                  if (comp.types.includes("sublocality_level_1") || comp.types.includes("sublocality")) area = comp.long_name;
                  if (comp.types.includes("locality")) city = comp.long_name;
                }
                const label = [area, city].filter(Boolean).join(", ");
                setLocationLabel(label);
                const loc: UserLocation = { lat: latitude, lng: longitude, label, timestamp: Date.now() };
                saveLocation(loc);
                onLocationSelect(loc);
              }
              setDetecting(false);
            });
          } else {
            // Google not loaded yet — just save coords without label
            const loc: UserLocation = { lat: latitude, lng: longitude, timestamp: Date.now() };
            saveLocation(loc);
            setDetecting(false);
          }
        },
        () => setDetecting(false),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (!window.google) return;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const components = results[0].address_components;
          let city = "", area = "", state = "";
          for (const comp of components) {
            if (comp.types.includes("sublocality_level_1") || comp.types.includes("sublocality")) area = comp.long_name;
            if (comp.types.includes("locality")) city = comp.long_name;
            if (comp.types.includes("administrative_area_level_1")) state = comp.short_name;
          }
          const label = [area, city, state].filter(Boolean).join(", ");
          setLocationLabel(label);
        }
      });
    },
    []
  );

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const pos = { lat: latitude, lng: longitude };
        setMarkerPosition(pos);
        mapRef.current?.panTo(pos);
        mapRef.current?.setZoom(15);
        reverseGeocode(latitude, longitude);
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMarkerPosition({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(15);
      setLocationLabel(place.formatted_address || place.name || "");
    }
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const handleConfirm = () => {
    const loc: UserLocation = {
      lat: markerPosition.lat,
      lng: markerPosition.lng,
      label: locationLabel,
      timestamp: Date.now(),
    };
    saveLocation(loc);
    onLocationSelect(loc);
    setIsOpen(false);
  };

  // Auto-detect on first open if no saved location
  useEffect(() => {
    if (isOpen && !getSavedLocation()) {
      handleCurrentLocation();
    }
  }, [isOpen, handleCurrentLocation]);

  // --- Trigger button ---
  const triggerButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer min-w-0 ${className}`}
    >
      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
      {detecting ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 hidden sm:inline">Detecting...</span>
        </>
      ) : (
        <span className="text-xs font-medium text-gray-700 truncate max-w-[90px] sm:max-w-[180px]">
          {locationLabel || "Set Location"}
        </span>
      )}
      <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
    </button>
  );

  // --- Compact mode (navbar): button + true fullscreen overlay ---
  if (compact) {
    return (
      <div ref={dropdownRef}>
        {triggerButton}
        {isOpen && isLoaded && createPortal(
          <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
            {/* Top bar: search + current location + close */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white z-10">
              <div className="flex-1">
                <Autocomplete
                  onLoad={(ac) => (autocompleteRef.current = ac)}
                  onPlaceChanged={handlePlaceSelect}
                  options={{ componentRestrictions: { country: "in" } }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search a place..."
                      className="w-full h-11 pl-10 pr-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </Autocomplete>
              </div>
              <Button
                variant="outline"
                onClick={handleCurrentLocation}
                disabled={detecting}
                title="Use current location"
                className="h-11 px-3 flex-shrink-0 gap-1.5"
              >
                {detecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LocateFixed className="h-4 w-4" />
                )}
                <span className="hidden sm:inline text-sm">My Location</span>
              </Button>
              <button
                onClick={() => setIsOpen(false)}
                className="h-11 w-11 flex items-center justify-center rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-500 flex-shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Map — fills remaining screen */}
            <div className="flex-1 relative">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={markerPosition}
                zoom={13}
                onClick={handleMapClick}
                onLoad={(map) => { mapRef.current = map; }}
                options={{
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                <Marker
                  position={markerPosition}
                  draggable
                  onDragEnd={(e) => {
                    if (!e.latLng) return;
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    setMarkerPosition({ lat, lng });
                    reverseGeocode(lat, lng);
                  }}
                />
              </GoogleMap>
            </div>

            {/* Bottom bar: location label + confirm */}
            <div className="px-4 py-3 border-t border-gray-200 bg-white flex items-center gap-3">
              {locationLabel ? (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 truncate">{locationLabel}</span>
                </div>
              ) : (
                <div className="flex-1 text-sm text-gray-400">Tap on the map to select a location</div>
              )}
              <Button
                onClick={handleConfirm}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 h-11"
              >
                Confirm Location
              </Button>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // --- Inline mode (full picker, no dropdown) ---
  if (!isLoaded) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Loading map...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Autocomplete
              onLoad={(ac) => (autocompleteRef.current = ac)}
              onPlaceChanged={handlePlaceSelect}
              options={{ componentRestrictions: { country: "in" } }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search a place..."
                  className="w-full h-10 pl-9 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </Autocomplete>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCurrentLocation}
            disabled={detecting}
            title="Use current location"
            className="h-10 w-10 flex-shrink-0"
          >
            {detecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </Button>
        </div>
        <GoogleMap
          mapContainerStyle={{ ...mapContainerStyle, height: "250px" }}
          center={markerPosition}
          zoom={13}
          onClick={handleMapClick}
          onLoad={(map) => { mapRef.current = map; }}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
        >
          <Marker
            position={markerPosition}
            draggable
            onDragEnd={(e) => {
              if (!e.latLng) return;
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              setMarkerPosition({ lat, lng });
              reverseGeocode(lat, lng);
            }}
          />
        </GoogleMap>
        <div className="flex items-center gap-2">
          {locationLabel && (
            <div className="flex-1 text-sm text-gray-700 flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </div>
          )}
          <Button size="sm" onClick={handleConfirm} className="flex-shrink-0">
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
}
