"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  Filter,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { apiService, Gym, SubscriptionListing, searchGyms, searchGymsByLocation } from "@/lib/api";
import { getSavedLocation, saveLocation, calculateDistance } from "@/lib/user-location";
import { Autocomplete } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/google-maps-provider";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "production" ? "http://api.neyofit.in/api/v1" : "http://localhost:5001/api/v1");

function getGymImageUrl(pictureId: string) {
  return `${API_BASE_URL}/gym-pictures/${pictureId}/image`;
}

// Skeleton card for loading state
function GymCardSkeleton() {
  return (
    <Card className="overflow-visible border-2 border-gray-200 h-full animate-pulse">
      <div className="h-40 sm:h-48 bg-gray-200 rounded-t-lg" />
      <CardContent className="p-3 sm:p-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-5 bg-gray-200 rounded w-2/3" />
          <div className="h-5 bg-gray-200 rounded w-10" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="flex gap-1">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-16" />
        </div>
        <div className="pt-2 border-t border-gray-100 flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-5 bg-gray-200 rounded w-14" />
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0">
        <div className="h-5 bg-gray-200 rounded w-full" />
      </CardFooter>
    </Card>
  );
}

export default function GymsPage() {
  const searchParams = useSearchParams();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [priceFilter, setPriceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [gymImageIndices, setGymImageIndices] = useState<{
    [key: string]: number;
  }>({});
  const [imageOrientations, setImageOrientations] = useState<{
    [key: string]: "landscape" | "portrait";
  }>({});
  const [userCoordinates, setUserCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [initialParamsApplied, setInitialParamsApplied] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded: mapsLoaded } = useGoogleMaps();

  // Read URL params on mount, use saved location
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    const nearMe = searchParams.get("near");

    if (urlSearch) {
      setSearchTerm(urlSearch);
    }

    // Try saved location first
    const saved = getSavedLocation();
    if (saved) {
      setUserCoordinates({ lat: saved.lat, lng: saved.lng });
      setLocationLabel(saved.label || "");
    }

    if (nearMe === "me") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
            setUserCoordinates(coords);
            saveLocation({ ...coords, label: "Near You", timestamp: Date.now() });
            setInitialParamsApplied(true);
          },
          () => {
            setInitialParamsApplied(true);
          }
        );
      } else {
        setInitialParamsApplied(true);
      }
    } else {
      if (!saved && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserCoordinates({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {}
        );
      }
      setInitialParamsApplied(true);
    }
  }, [searchParams]);

  const handlePlaceSelect = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const label = place.formatted_address || place.name || "";
      setUserCoordinates({ lat, lng });
      setLocationLabel(label);
      setLocationSearch("");
      saveLocation({ lat, lng, label, timestamp: Date.now() });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserCoordinates(coords);
        setLocationLabel("Near You");
        setLocationSearch("");
        saveLocation({ ...coords, label: "Near You", timestamp: Date.now() });
      },
      () => {
        alert("Location access denied. Please search for a place instead.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!initialParamsApplied) return;
    fetchGyms();
    // eslint-disable-next-line
  }, [
    currentPage,
    sortBy,
    searchTerm,
    locationSearch,
    priceFilter,
    userCoordinates,
    initialParamsApplied,
  ]);

  const fetchGyms = async () => {
    try {
      setLoading(true);
      setError(null);
      let gyms: Gym[] = [];
      if (locationSearch) {
        const data = await searchGyms({
          near: locationSearch,
          page: currentPage,
          limit: 100,
        });
        gyms = Array.isArray(data) ? data : data.data?.gyms || [];
        gyms = gyms.filter((gym) => {
          const city = (gym.locationId as any)?.address?.city || "";
          const state = (gym.locationId as any)?.address?.state || "";
          return (
            city.toLowerCase().includes(locationSearch.toLowerCase()) ||
            state.toLowerCase().includes(locationSearch.toLowerCase())
          );
        });
      } else {
        const response = await apiService.getGyms({
          page: currentPage,
          limit: 100,
        });
        gyms = Array.isArray(response) ? response : response.data?.gyms || [];
      }
      if (searchTerm) {
        gyms = gyms.filter(
          (gym) =>
            gym.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            gym.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      if (priceFilter && priceFilter !== "all") {
        gyms = gyms.filter((gym) => gym.priceRange === priceFilter);
      }

      if (userCoordinates) {
        gyms = gyms.map((gym) => {
          const location = gym.locationId as any;
          let lat, lng;

          if (
            location?.coordinates?.coordinates &&
            Array.isArray(location.coordinates.coordinates)
          ) {
            lng = location.coordinates.coordinates[0];
            lat = location.coordinates.coordinates[1];
          } else if (Array.isArray(location?.coordinates)) {
            lng = location.coordinates[0];
            lat = location.coordinates[1];
          } else if (location?.coordinates?.lat && location?.coordinates?.lng) {
            lat = location.coordinates.lat;
            lng = location.coordinates.lng;
          } else if (
            location?.coordinates?.latitude &&
            location?.coordinates?.longitude
          ) {
            lat = location.coordinates.latitude;
            lng = location.coordinates.longitude;
          } else if (location?.lat && location?.lng) {
            lat = location.lat;
            lng = location.lng;
          } else if (location?.latitude && location?.longitude) {
            lat = location.latitude;
            lng = location.longitude;
          }

          if (lat && lng) {
            const distance = calculateDistance(
              userCoordinates.lat,
              userCoordinates.lng,
              lat,
              lng
            );
            return { ...gym, distance };
          }
          return gym;
        });

        gyms.sort((a: any, b: any) => {
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          return 0;
        });
      }

      setGyms(gyms);
      setTotalPages(1);
    } catch (error) {
      console.error("Error fetching gyms:", error);
      setError("Failed to fetch gyms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchGyms();
  };

  const getPriceRangeColor = (priceRange?: string) => {
    switch (priceRange) {
      case "budget":
        return "bg-green-100 text-green-800";
      case "mid-range":
        return "bg-yellow-100 text-yellow-800";
      case "premium":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriceRangeText = (priceRange?: string) => {
    switch (priceRange) {
      case "budget":
        return "Budget";
      case "mid-range":
        return "Mid-Range";
      case "premium":
        return "Premium";
      default:
        return "Not specified";
    }
  };

  const getCheapestPlan = (gym: Gym) => {
    if (!gym.subscriptionListings || gym.subscriptionListings.length === 0) {
      return null;
    }
    const activePlans = gym.subscriptionListings.filter(
      (plan) => plan.isActive
    );
    if (activePlans.length === 0) return null;
    return activePlans.reduce((cheapest, current) =>
      current.cost < cheapest.cost ? current : cheapest
    );
  };

  const formatPlanPrice = (plan: SubscriptionListing) => {
    if (!plan) return null;
    const typeText =
      plan.type === "custom" && plan.customTypeText
        ? plan.customTypeText
        : plan.type;
    return {
      price: `₹${plan.cost}`,
      type: typeText,
      duration:
        plan.durationInDays === 1 ? "session" : `${plan.durationInDays} days`,
    };
  };

  const handleImageNavigation = (gymId: string, direction: "prev" | "next") => {
    setGymImageIndices((prev) => {
      const currentIndex = prev[gymId] || 0;
      const gym = gyms.find((g) => g._id === gymId);
      if (!gym || !gym.pictures || gym.pictures.length === 0) return prev;

      const maxIndex = gym.pictures.length - 1;
      let newIndex;
      if (direction === "prev") {
        newIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
      } else {
        newIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
      }
      return { ...prev, [gymId]: newIndex };
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Top loading bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-orange-100">
          <div className="h-full bg-orange-500 animate-pulse" style={{ width: "60%" }} />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Find Your Perfect Gym
            <br />
            Near You
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Discover gyms near you, book instantly with secure online payment,
            and start your fitness journey
          </p>
        </div>

        {/* Payment Info Banner */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-center text-xs sm:text-sm text-blue-800">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="font-medium">Secure Online Payment</span>
              <span className="text-blue-600 hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">
                Instant Booking Confirmation
              </span>
              <span className="text-blue-600 hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">
                Full Refund on Cancellation
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <Input
                  placeholder="Search gyms by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <div className="flex-1">
              {mapsLoaded ? (
                <Autocomplete
                  onLoad={(ac) => (autocompleteRef.current = ac)}
                  onPlaceChanged={handlePlaceSelect}
                  options={{ componentRestrictions: { country: "in" } }}
                >
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search area, city, or landmark..."
                      className="w-full h-9 sm:h-10 pl-9 sm:pl-10 pr-3 border border-gray-200 rounded-md text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </Autocomplete>
              ) : (
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                  <Input
                    placeholder="Search by location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="pl-9 sm:pl-10 text-sm sm:text-base h-9 sm:h-10"
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              )}
            </div>
            <Button
              onClick={handleUseCurrentLocation}
              variant="outline"
              className="md:w-auto h-9 sm:h-10 text-sm sm:text-base"
              title="Use current location"
            >
              <MapPin className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Near Me</span>
            </Button>
            <Button
              onClick={handleSearch}
              className="md:w-auto h-9 sm:h-10 text-sm sm:text-base"
            >
              <Search className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Search
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
              <span className="text-xs sm:text-sm font-medium">Filters:</span>
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="-name">Name (Z-A)</SelectItem>
                <SelectItem value="rating">Rating (Low to High)</SelectItem>
                <SelectItem value="-rating">Rating (High to Low)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full sm:w-48 h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="mid-range">Mid-Range</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-300 rounded-lg flex flex-col items-center">
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Unable to load gyms
            </h3>
            <p className="text-red-700 mb-2">
              We couldn&apos;t fetch the list of gyms at this time.
            </p>
            <Button
              onClick={fetchGyms}
              variant="destructive"
              size="sm"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading Skeleton Grid */}
        {loading && gyms.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <GymCardSkeleton key={i} />
            ))}
          </div>
        ) : gyms.length === 0 && !loading ? (
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No gyms found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? `No gyms found for "${searchTerm}". Try a different search term or location.`
                : "No gyms have been added to this location yet. Check back later or try a different area."}
            </p>
            <Button variant="outline" onClick={() => { setSearchTerm(""); setLocationSearch(""); }}>
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {gyms.map((gym) => (
              <Link key={gym._id} href={`/gyms/${gym._id}`} className="block">
                <Card className="group overflow-visible hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-blue-900 cursor-pointer h-full">
                  <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-lg">
                    {gym.pictures && gym.pictures.length > 0 ? (
                      <div className="relative w-full h-full">
                        <div
                          className="flex h-full transition-transform duration-300 ease-in-out"
                          style={{
                            transform: `translateX(-${
                              (gymImageIndices[gym._id] || 0) * 100
                            }%)`,
                          }}
                        >
                          {gym.pictures.map((pictureId, index) => {
                            const key = `${gym._id}-${index}`;
                            const orientation = imageOrientations[key];
                            const fitClass = orientation === "portrait"
                              ? "object-contain bg-gray-100"
                              : "object-cover";
                            return (
                            <div key={index} className="w-full h-full flex-shrink-0">
                              <img
                                src={getGymImageUrl(pictureId)}
                                alt={`${gym.name} - Image ${index + 1}`}
                                className={`w-full h-full ${fitClass}`}
                                onLoad={(e) => {
                                  const img = e.currentTarget;
                                  const orientation = img.naturalHeight > img.naturalWidth * 1.2
                                    ? "portrait"
                                    : "landscape";
                                  setImageOrientations((prev) => ({ ...prev, [key]: orientation }));
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.jpg";
                                }}
                              />
                            </div>
                            );
                          })}
                        </div>

                        {gym.pictures.length > 1 && (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white h-6 w-6 sm:h-8 sm:w-8 z-20"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleImageNavigation(gym._id, "prev");
                              }}
                            >
                              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white h-6 w-6 sm:h-8 sm:w-8 z-20"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleImageNavigation(gym._id, "next");
                              }}
                            >
                              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </>
                        )}

                        {gym.pictures.length > 1 && (
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-20">
                            {gym.pictures.map((_, index) => (
                              <button
                                key={index}
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
                                  index === (gymImageIndices[gym._id] || 0)
                                    ? "bg-white"
                                    : "bg-white/50 hover:bg-white/75"
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setGymImageIndices((prev) => ({
                                    ...prev,
                                    [gym._id]: index,
                                  }));
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Dumbbell className="h-10 w-10 sm:h-12 sm:w-12 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-t-lg" />

                    <div className="absolute top-3 right-3 z-10">
                      <Badge
                        className={`${getPriceRangeColor(
                          gym.priceRange
                        )} text-[10px] sm:text-xs px-2 py-0.5`}
                      >
                        {getPriceRangeText(gym.priceRange)}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-blue-900 flex-1">
                          {gym.name}
                        </h3>
                        {gym.rating && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs sm:text-sm font-semibold">
                              {gym.rating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {(gym as any).distance !== undefined && (
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-900 border-blue-200 text-xs px-2 py-0.5"
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            {(gym as any).distance} km away
                          </Badge>
                        </div>
                      )}

                      {gym.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {gym.description}
                        </p>
                      )}

                      {gym.contact?.phone && (
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          <span>{gym.contact.phone}</span>
                        </div>
                      )}

                      {gym.facilities && gym.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {gym.facilities.slice(0, 3).map((facility, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                            >
                              {typeof facility === "string"
                                ? facility
                                : facility.name}
                            </Badge>
                          ))}
                          {gym.facilities.length > 3 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                            >
                              +{gym.facilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {(() => {
                        const cheapestPlan = getCheapestPlan(gym);
                        if (!cheapestPlan) {
                          return (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="text-xs sm:text-sm text-gray-600">
                                Pricing
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                Contact gym
                              </div>
                            </div>
                          );
                        }

                        const planInfo = formatPlanPrice(cheapestPlan);
                        if (!planInfo) {
                          return (
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <div className="text-xs sm:text-sm text-gray-600">
                                Pricing
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                Contact gym
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="text-xs sm:text-sm text-gray-600">
                                Starting from
                              </div>
                              <div className="text-base sm:text-lg font-bold text-green-600">
                                {planInfo.price}
                              </div>
                            </div>
                            <div className="text-[10px] sm:text-xs text-gray-500 text-right">
                              {planInfo.type} &bull; {planInfo.duration}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>

                  <CardFooter className="p-3 sm:p-4 pt-0">
                    <div className="w-full flex items-center justify-between text-blue-900 font-semibold text-sm sm:text-base">
                      <span>View Details</span>
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages || loading}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
