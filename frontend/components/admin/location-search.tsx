"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  MapPin,
  Loader2,
  CheckCircle,
  Plus,
  X,
  AlertCircle,
} from "lucide-react";
import { apiService, Location } from "@/lib/api";

interface LocationSearchProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation?: Location | null;
  placeholder?: string;
  label?: string;
  required?: boolean;
  allowCreate?: boolean; // New prop to control whether create button is shown
}

export default function LocationSearch({
  onLocationSelect,
  selectedLocation,
  placeholder = "Search for location...",
  label = "Location",
  required = false,
  allowCreate = false, // Default to false for security
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLocationData, setNewLocationData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
    latitude: "",
    longitude: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search — only depends on searchQuery to avoid unnecessary re-triggers
  useEffect(() => {
    // Don't search if a location is already selected
    if (selectedLocation) {
      setShowResults(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);

    try {
      const response = await apiService.searchLocations(query, 10);

      if (response.success && response.locations) {
        setSearchResults(response.locations);
        setShowResults(true);
      } else {
        setError(response.error || "Failed to search locations");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching locations:", error);
      setError("Failed to search locations");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateNewLocation = () => {
    setNewLocationData({
      name: searchQuery,
      street: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
      latitude: "",
      longitude: "",
    });
    setShowCreateDialog(true);
    setShowResults(false);
  };

  const handleCreateLocation = async () => {
    if (
      !newLocationData.name ||
      !newLocationData.street ||
      !newLocationData.city ||
      !newLocationData.state ||
      !newLocationData.latitude ||
      !newLocationData.longitude
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const response = await apiService.createLocation({
        name: newLocationData.name,
        address: {
          street: newLocationData.street,
          city: newLocationData.city,
          state: newLocationData.state,
          pinCode: newLocationData.pinCode,
          country: newLocationData.country,
        },
        latitude: parseFloat(newLocationData.latitude),
        longitude: parseFloat(newLocationData.longitude),
      });

      if (response.success && response.data) {
        onLocationSelect(response.data);
        setShowCreateDialog(false);
        setSearchQuery("");
        setNewLocationData({
          name: "",
          street: "",
          city: "",
          state: "",
          pinCode: "",
          country: "India",
          latitude: "",
          longitude: "",
        });
      } else {
        // Show detailed error message from backend
        const errorMsg = response.message || response.error || "Failed to create location";
        setError(errorMsg);
        console.error("Location creation error:", response);
      }
    } catch (err) {
      console.error("Error creating location:", err);
      setError("Failed to create location. Please check the console for details.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setSearchQuery(`${location.name} - ${location.address.city}`);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    onLocationSelect(null as any);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="location-search" className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {!allowCreate && (
          <span className="text-xs text-gray-500 ml-2 font-normal">
            (Select from existing locations only)
          </span>
        )}
      </Label>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
          <Input
            ref={inputRef}
            id="location-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder={placeholder}
            className="pl-10 pr-10"
            disabled={!!selectedLocation}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-blue-600 z-10" />
          )}
          {!isSearching && searchQuery && !selectedLocation && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1 h-8 w-8 p-0 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <Card className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto shadow-lg border-2 border-blue-100">
            <CardContent className="p-0">
              <div className="sticky top-0 bg-blue-50 px-3 py-2 border-b">
                <p className="text-xs font-medium text-blue-700">
                  {searchResults.length} location{searchResults.length !== 1 ? 's' : ''} found
                </p>
              </div>
              {searchResults.map((location, index) => (
                <div
                  key={location._id}
                  className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-all hover:shadow-sm"
                  onClick={() => handleLocationSelect(location)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {location.name}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {location.address.street}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {location.address.city}, {location.address.state}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        PIN: {location.address.pinCode}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Available
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {showResults &&
          searchResults.length === 0 &&
          !isSearching &&
          searchQuery.trim().length >= 2 && (
            <Card className="absolute z-50 w-full mt-1 shadow-lg">
              <CardContent className="p-4">
                <div className="text-center">
                  {allowCreate ? (
                    <>
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 text-orange-500" />
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        No available locations found
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        for "{searchQuery}"
                      </p>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleCreateNewLocation}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Location
                      </Button>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-10 w-10 mx-auto mb-3 text-orange-500" />
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        No available locations found
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        for "{searchQuery}"
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3">
                        <p className="text-xs text-gray-600">
                          All matching locations may already be allocated to other gyms, or the location doesn't exist yet. Please contact an administrator to add new locations.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Error Message */}
        {error && !showCreateDialog && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-green-900 text-sm">
                  {selectedLocation.name}
                </span>
                <Badge className="bg-green-600 text-white text-xs">
                  Selected
                </Badge>
              </div>
              <div className="text-xs text-green-700 space-y-0.5">
                <p>{selectedLocation.address.street}</p>
                <p>
                  {selectedLocation.address.city}, {selectedLocation.address.state} - {selectedLocation.address.pinCode}
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
      )}

      {/* Create New Location Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              Create New Location
            </DialogTitle>
            <DialogDescription className="text-base">
              Add a new location with complete address and coordinates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {error && (
              <Alert variant="destructive" className="border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location-name" className="text-sm font-semibold flex items-center gap-1">
                  Location Name
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location-name"
                  value={newLocationData.name}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Connaught Place Gym Location"
                  required
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-semibold flex items-center gap-1">
                  Street Address
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="street"
                  value={newLocationData.street}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      street: e.target.value,
                    })
                  }
                  placeholder="e.g., 24 Barakhamba Road"
                  required
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-semibold flex items-center gap-1">
                  City
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={newLocationData.city}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      city: e.target.value,
                    })
                  }
                  placeholder="e.g., New Delhi"
                  required
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-semibold flex items-center gap-1">
                  State
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  value={newLocationData.state}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      state: e.target.value,
                    })
                  }
                  placeholder="e.g., Delhi"
                  required
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pinCode" className="text-sm font-semibold">
                  PIN Code
                </Label>
                <Input
                  id="pinCode"
                  value={newLocationData.pinCode}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      pinCode: e.target.value,
                    })
                  }
                  placeholder="e.g., 110001"
                  className="border-gray-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-semibold">
                  Country
                </Label>
                <Input
                  id="country"
                  value={newLocationData.country}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      country: e.target.value,
                    })
                  }
                  placeholder="India"
                  className="border-gray-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm font-semibold flex items-center gap-1">
                  Latitude
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={newLocationData.latitude}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      latitude: e.target.value,
                    })
                  }
                  placeholder="28.6139"
                  required
                  className="border-gray-300 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm font-semibold flex items-center gap-1">
                  Longitude
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={newLocationData.longitude}
                  onChange={(e) =>
                    setNewLocationData({
                      ...newLocationData,
                      longitude: e.target.value,
                    })
                  }
                  placeholder="77.2090"
                  required
                  className="border-gray-300 font-mono text-sm"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
                <strong>Tip:</strong> You can find coordinates by searching the address on Google Maps, right-clicking the location, and selecting the coordinates shown.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setError(null);
              }}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLocation} 
              disabled={isCreating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Location...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Location
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
