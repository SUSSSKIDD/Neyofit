"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/google-maps-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Loader2,
  Navigation,
  CheckCircle,
  X,
  AlertCircle,
  LocateFixed,
} from "lucide-react";
import { apiService, Location } from "@/lib/api";



const defaultCenter = { lat: 28.6139, lng: 77.209 }; // Delhi

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "0.5rem",
};

interface GoogleMapLocationPickerProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location | null;
  label?: string;
  required?: boolean;
  allowCreate?: boolean;
}

interface AddressComponents {
  street: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
}

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): AddressComponents {
  const result: AddressComponents = {
    street: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
  };

  let streetNumber = "";
  let route = "";
  let sublocality = "";

  for (const comp of components) {
    const types = comp.types;
    if (types.includes("street_number")) {
      streetNumber = comp.long_name;
    } else if (types.includes("route")) {
      route = comp.long_name;
    } else if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
      sublocality = comp.long_name;
    } else if (types.includes("locality")) {
      result.city = comp.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      result.state = comp.long_name;
    } else if (types.includes("postal_code")) {
      result.pinCode = comp.long_name;
    } else if (types.includes("country")) {
      result.country = comp.long_name;
    }
  }

  // Build street from available parts
  const streetParts = [streetNumber, route, sublocality].filter(Boolean);
  result.street = streetParts.join(", ") || "";

  return result;
}

export default function GoogleMapLocationPicker({
  onLocationSelect,
  selectedLocation,
  label = "Location",
  required = false,
  allowCreate = true,
}: GoogleMapLocationPickerProps) {
  const { isLoaded } = useGoogleMaps();
  const loadError = !isLoaded && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? new Error("API key missing") : null;

  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [address, setAddress] = useState<AddressComponents>({
    street: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
  });
  const [locationName, setLocationName] = useState("");
  const [formattedAddress, setFormattedAddress] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialize geocoder when maps loads
  useEffect(() => {
    if (isLoaded) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  // If editing with existing location, populate the marker
  useEffect(() => {
    if (selectedLocation) {
      const coords = selectedLocation.coordinates?.coordinates;
      if (coords && coords.length === 2) {
        const pos = { lat: coords[1], lng: coords[0] }; // GeoJSON is [lng, lat]
        setMarkerPosition(pos);
        setMapCenter(pos);
        setAddress(selectedLocation.address);
        setLocationName(selectedLocation.name);
        setFormattedAddress(
          `${selectedLocation.address.street}, ${selectedLocation.address.city}, ${selectedLocation.address.state}`
        );
      }
    }
  }, [selectedLocation]);

  // Reverse geocode a position to get address
  const reverseGeocode = useCallback(
    async (position: google.maps.LatLngLiteral) => {
      if (!geocoderRef.current) return;

      try {
        const result = await geocoderRef.current.geocode({ location: position });
        if (result.results && result.results.length > 0) {
          const firstResult = result.results[0];
          const parsed = parseAddressComponents(firstResult.address_components);
          setAddress(parsed);
          setFormattedAddress(firstResult.formatted_address);
          setLocationName(parsed.city ? `${parsed.city} Location` : "New Location");
          setShowForm(true);
        }
      } catch (err) {
        console.error("Reverse geocode error:", err);
      }
    },
    []
  );

  // Handle map click — drop pin
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (selectedLocation) return; // Don't allow changes when location is already confirmed
      if (e.latLng) {
        const position = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarkerPosition(position);
        reverseGeocode(position);
        setError(null);
      }
    },
    [reverseGeocode, selectedLocation]
  );

  // Handle marker drag end
  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const position = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setMarkerPosition(position);
        reverseGeocode(position);
      }
    },
    [reverseGeocode]
  );

  // Handle place selection from autocomplete
  const handlePlaceSelect = useCallback(() => {
    if (!autocompleteRef.current) return;

    const place = autocompleteRef.current.getPlace();
    if (place.geometry?.location) {
      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setMarkerPosition(position);
      setMapCenter(position);
      mapRef.current?.panTo(position);
      mapRef.current?.setZoom(16);

      if (place.address_components) {
        const parsed = parseAddressComponents(place.address_components);
        setAddress(parsed);
        setFormattedAddress(place.formatted_address || "");
        setLocationName(
          place.name || (parsed.city ? `${parsed.city} Location` : "New Location")
        );
      }
      setShowForm(true);
      setError(null);
    }
  }, []);

  // Use current location
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setMarkerPosition(pos);
        setMapCenter(pos);
        mapRef.current?.panTo(pos);
        mapRef.current?.setZoom(16);
        reverseGeocode(pos);
        setIsLocating(false);
      },
      (err) => {
        setError("Unable to get your location. Please allow location access or search manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  // Confirm and create location
  const handleConfirmLocation = async () => {
    if (!markerPosition) {
      setError("Please select a location on the map");
      return;
    }
    if (!locationName.trim()) {
      setError("Please enter a location name");
      return;
    }
    if (!address.street && !address.city) {
      setError("Please enter at least a street or city");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await apiService.createLocation({
        name: locationName.trim(),
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          pinCode: address.pinCode,
          country: address.country || "India",
        },
        latitude: markerPosition.lat,
        longitude: markerPosition.lng,
      });

      if (response.success && response.data) {
        onLocationSelect(response.data);
      } else {
        setError(response.message || response.error || "Failed to create location");
      }
    } catch (err) {
      console.error("Error creating location:", err);
      setError("Failed to create location");
    } finally {
      setIsCreating(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    setMarkerPosition(null);
    setAddress({ street: "", city: "", state: "", pinCode: "", country: "India" });
    setLocationName("");
    setFormattedAddress("");
    setShowForm(false);
    setError(null);
    onLocationSelect(null as any);
  };

  // Loading state
  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load Google Maps. Please check your API key configuration.
        </AlertDescription>
      </Alert>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading map...</span>
      </div>
    );
  }

  // Already selected and confirmed
  if (selectedLocation) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-green-900 text-sm">
                  {selectedLocation.name}
                </span>
                <Badge className="bg-green-600 text-white text-xs">Selected</Badge>
              </div>
              <div className="text-xs text-green-700 space-y-0.5">
                <p>{selectedLocation.address.street}</p>
                <p>
                  {selectedLocation.address.city}, {selectedLocation.address.state} -{" "}
                  {selectedLocation.address.pinCode}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-red-100"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* Search bar + Current Location button */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Autocomplete
            onLoad={(autocomplete) => {
              autocompleteRef.current = autocomplete;
            }}
            onPlaceChanged={handlePlaceSelect}
            options={{
              componentRestrictions: { country: "in" },
              types: ["establishment", "geocode"],
            }}
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
              <Input
                placeholder="Search address, area, or place..."
                className="pl-10"
              />
            </div>
          </Autocomplete>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="shrink-0"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LocateFixed className="h-4 w-4" />
          )}
          <span className="ml-1.5 hidden sm:inline">
            {isLocating ? "Locating..." : "Current Location"}
          </span>
        </Button>
      </div>

      {/* Google Map */}
      <div className="border rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={12}
          onClick={handleMapClick}
          onLoad={(map) => {
            mapRef.current = map;
          }}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
          }}
        >
          {markerPosition && (
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={handleMarkerDragEnd}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      </div>

      <p className="text-xs text-gray-500">
        Click on the map to drop a pin, or search above. Drag the pin to adjust.
      </p>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {/* Address form (shown after pin drop) */}
      {showForm && markerPosition && (
        <Card className="border-blue-200">
          <CardContent className="pt-4 space-y-3">
            {formattedAddress && (
              <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-md">
                <Navigation className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-800">{formattedAddress}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="loc-name" className="text-sm font-medium">
                Location Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="loc-name"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Gold's Gym Connaught Place"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loc-street" className="text-sm font-medium">
                Street Address
              </Label>
              <Input
                id="loc-street"
                value={address.street}
                onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="loc-city" className="text-sm font-medium">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="loc-city"
                  value={address.city}
                  onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-state" className="text-sm font-medium">
                  State
                </Label>
                <Input
                  id="loc-state"
                  value={address.state}
                  onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="loc-pin" className="text-sm font-medium">
                  PIN Code
                </Label>
                <Input
                  id="loc-pin"
                  value={address.pinCode}
                  onChange={(e) => setAddress((prev) => ({ ...prev, pinCode: e.target.value }))}
                  placeholder="PIN Code"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Coordinates</Label>
                <p className="text-xs text-gray-500 mt-1 font-mono">
                  {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleConfirmLocation}
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Location...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Location
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
