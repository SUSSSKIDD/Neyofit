"use client"

import { useState, useCallback, useRef } from "react"
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin } from "lucide-react"
import Link from "next/link"
import { useGoogleMaps } from "@/components/google-maps-provider"

interface Gym {
  id: string
  name: string
  location: string
  coordinates: { lat: number; lng: number }
  rating: number
  image: string
  price: string
  features: string[]
  verified: boolean
}

interface MapViewProps {
  gyms: Gym[]
  userLocation: { lat: number; lng: number } | null
}

const containerStyle = {
  width: "100%",
  height: "100%",
}

export default function MapView({ gyms, userLocation }: MapViewProps) {
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded } = useGoogleMaps()

  const center = userLocation || { lat: 28.6139, lng: 77.209 }

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    // Fit bounds to show all markers
    if (gyms.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      if (userLocation) bounds.extend(userLocation)
      gyms.forEach((gym) => {
        if (gym.coordinates?.lat && gym.coordinates?.lng) {
          bounds.extend(gym.coordinates)
        }
      })
      map.fitBounds(bounds)
    }
  }, [gyms, userLocation])

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-r-transparent mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={12}
      onLoad={onLoad}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
    >
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#3B82F6",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
          }}
          title="Your Location"
        />
      )}

      {/* Gym markers */}
      {gyms.map((gym) =>
        gym.coordinates?.lat && gym.coordinates?.lng ? (
          <Marker
            key={gym.id}
            position={gym.coordinates}
            onClick={() => setSelectedGym(gym)}
            icon={{
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z",
              fillColor: selectedGym?.id === gym.id ? "#1E3A8A" : "#F97316",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
              scale: 1.5,
              anchor: new google.maps.Point(12, 24),
            }}
          />
        ) : null
      )}

      {/* InfoWindow for selected gym */}
      {selectedGym && selectedGym.coordinates?.lat && selectedGym.coordinates?.lng && (
        <InfoWindow
          position={selectedGym.coordinates}
          onCloseClick={() => setSelectedGym(null)}
        >
          <div className="max-w-[250px] p-1">
            <h3 className="font-bold text-base mb-1">{selectedGym.name}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
              <MapPin className="h-3 w-3" />
              {selectedGym.location}
            </div>
            <div className="flex items-center gap-2 mb-2">
              {selectedGym.rating > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {selectedGym.rating}
                </Badge>
              )}
              <span className="text-sm font-semibold text-blue-900">{selectedGym.price}/day</span>
            </div>
            <Link href={`/gyms/${selectedGym.id}`}>
              <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-xs">
                View Gym
              </Button>
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  )
}
