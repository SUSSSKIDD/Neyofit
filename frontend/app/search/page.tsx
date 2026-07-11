"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, MapPin, Star, ArrowUpDown, Filter, ChevronDown, ChevronUp, CheckCircle, X, Locate, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import MapView from "@/components/map-view"
import { Autocomplete } from "@react-google-maps/api"
import { useGoogleMaps } from "@/components/google-maps-provider"
import { getSavedLocation, saveLocation, calculateDistance } from "@/lib/user-location"

import { searchGyms, searchGymsByLocation } from "@/lib/api"


// Helper to convert API gym data to UI format
const mapApiGymToUi = (gym: any) => {
  const loc = gym.locationId // populated Location document
  const coords = loc?.coordinates?.coordinates // GeoJSON [lng, lat]
  return {
    id: gym._id,
    name: gym.name,
    location: loc?.address?.city || loc?.name || "",
    address: loc?.address?.street || "",
    coordinates: coords ? { lat: coords[1], lng: coords[0] } : { lat: 0, lng: 0 },
    rating: gym.rating || 0,
    reviewCount: gym.reviewCount || 0,
    image: gym.pictures?.[0] || "/placeholder.svg",
    price: gym.priceRange ? (gym.priceRange === "budget" ? "₹299" : gym.priceRange === "mid-range" ? "₹499" : "₹999") : "₹499",
    distance: gym.distance ? `${gym.distance} km` : "-",
    features: (gym.facilities || []).map((f: any) => typeof f === "string" ? f : f?.name || ""),
    verified: gym.isActive || false,
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [location, setLocation] = useState(searchParams.get("location") || "")
  const [gyms, setGyms] = useState<any[]>([])
  const [filteredGyms, setFilteredGyms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedDistance, setSelectedDistance] = useState<string[]>([])
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([])
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [sortBy, setSortBy] = useState("recommended")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState("list")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const searchAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded: mapsLoaded } = useGoogleMaps()

  // Load saved location on mount
  useEffect(() => {
    const saved = getSavedLocation()
    if (saved) {
      setUserLocation({ lat: saved.lat, lng: saved.lng })
    }
  }, [])

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
          setUserLocation(coords)
          saveLocation({ ...coords, label: "Near You", timestamp: Date.now() })
          // Search gyms near this location
          handleSearchByCoords(coords.lat, coords.lng)
        },
        () => {
          alert("Unable to get your location. Please search a place instead.")
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    }
  }

  const handleSearchByCoords = async (lat: number, lng: number) => {
    setLoading(true)
    try {
      const data = await searchGymsByLocation(lat, lng, 10, 50)
      let result = Array.isArray(data) ? data : (data.data || [])
      const mapped = result.map((gym: any) => {
        const g = mapApiGymToUi(gym)
        if (g.coordinates?.lat && g.coordinates?.lng) {
          const dist = calculateDistance(lat, lng, g.coordinates.lat, g.coordinates.lng)
          return { ...g, distance: `${dist} km` }
        }
        return g
      })
      setGyms(mapped)
      setFilteredGyms(mapped)
    } catch {
      setError("Failed to fetch gyms nearby.")
    } finally {
      setLoading(false)
    }
  }

  const handlePlaceSelected = () => {
    if (!searchAutocompleteRef.current) return
    const place = searchAutocompleteRef.current.getPlace()
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat()
      const lng = place.geometry.location.lng()
      const label = place.formatted_address || place.name || ""
      setUserLocation({ lat, lng })
      setLocation(label)
      saveLocation({ lat, lng, label, timestamp: Date.now() })
      handleSearchByCoords(lat, lng)
    }
  }

  // Handle search form submission
  const handleSearch = async (city: string) => {
    setLocation(city)
    router.push(`/search?location=${encodeURIComponent(city)}`)
    setLoading(true)
    setError(null)
    try {
      const data = await searchGyms({ near: city })
      let gyms = (data.data?.gyms || []).map(mapApiGymToUi)
      // Filter gyms by city name (case-insensitive)
      gyms = gyms.filter((gym: any) => gym.location && gym.location.toLowerCase() === city.toLowerCase())
      setGyms(gyms)
      setFilteredGyms(gyms)
    } catch (err) {
      setError("Failed to fetch gyms. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const applyFilters = () => {
    let filtered = [...gyms]
    // Filter by price
    filtered = filtered.filter((gym) => {
      const price = Number.parseInt(gym.price.replace(/[^\d]/g, ""))
      return price >= priceRange[0] && price <= priceRange[1]
    })
    // Filter by distance
    if (selectedDistance.length > 0) {
      filtered = filtered.filter((gym) => {
        const distance = Number.parseFloat(gym.distance.split(" ")[0])
        return selectedDistance.some((range) => {
          const [min, max] = range.split("-").map(Number)
          return distance >= min && (max ? distance <= max : true)
        })
      })
    }
    // Filter by facilities
    if (selectedFacilities.length > 0) {
      filtered = filtered.filter((gym) => selectedFacilities.every((facility) => gym.features.includes(facility)))
    }
    // Filter by ratings
    if (selectedRatings.length > 0) {
      filtered = filtered.filter((gym) => selectedRatings.some((minRating) => gym.rating >= minRating))
    }
    // Sort results
    switch (sortBy) {
      case "price-low":
        filtered.sort(
          (a, b) => Number.parseInt(a.price.replace(/[^\d]/g, "")) - Number.parseInt(b.price.replace(/[^\d]/g, "")),
        )
        break
      case "price-high":
        filtered.sort(
          (a, b) => Number.parseInt(b.price.replace(/[^\d]/g, "")) - Number.parseInt(a.price.replace(/[^\d]/g, "")),
        )
        break
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case "distance":
        filtered.sort(
          (a, b) => Number.parseFloat(a.distance.split(" ")[0]) - Number.parseFloat(b.distance.split(" ")[0]),
        )
        break
      default:
        break
    }
    setFilteredGyms(filtered)
    setIsFilterOpen(false)
  }

  // Reset filters
  const resetFilters = () => {
    setPriceRange([0, 1000])
    setSelectedDistance([])
    setSelectedFacilities([])
    setSelectedRatings([])
    setSortBy("recommended")
    setFilteredGyms(gyms)
  }

  // Toggle distance selection
  const toggleDistance = (distance: string) => {
    setSelectedDistance((prev) => (prev.includes(distance) ? prev.filter((d) => d !== distance) : [...prev, distance]))
  }

  // Toggle facility selection
  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility],
    )
  }

  // Toggle rating selection
  const toggleRating = (rating: number) => {
    setSelectedRatings((prev) => (prev.includes(rating) ? prev.filter((r) => r !== rating) : [...prev, rating]))
  }

  // Initialize with search params
  useEffect(() => {
    const locationParam = searchParams.get("location")
    if (locationParam) {
      handleSearch(locationParam)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Search Header */}
      <section className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6">Find Gyms Near You</h1>

          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col md:flex-row gap-2 items-center">
            <div className="flex-1">
              {mapsLoaded ? (
                <Autocomplete
                  onLoad={(ac) => (searchAutocompleteRef.current = ac)}
                  onPlaceChanged={handlePlaceSelected}
                  options={{ componentRestrictions: { country: "in" } }}
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search area, city, or landmark..."
                      className="w-full h-10 pl-10 pr-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </Autocomplete>
              ) : (
                <div className="flex items-center h-10 px-4 border border-gray-300 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-400" />
                  <span className="text-sm text-gray-400">Loading search...</span>
                </div>
              )}
            </div>
            <Button type="button" variant="outline" className="md:w-auto" onClick={getUserLocation}>
              <Locate className="mr-2" size={18} />
              Use My Location
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 flex-1">
        {/* View Toggle */}
        <div className="mb-4">
          <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
            <TabsList className="grid w-full max-w-[200px] grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="map">Map View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="lg:w-1/4 hidden lg:block">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Filters</h2>
                <Button variant="ghost" size="sm" className="text-blue-900 h-auto p-1" onClick={resetFilters}>
                  Reset
                </Button>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Price Range</h3>
                <Slider
                  defaultValue={priceRange}
                  min={0}
                  max={1000}
                  step={50}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>₹{priceRange[0]}</span>
                  <span>₹{priceRange[1]}+</span>
                </div>
              </div>

              {/* Distance */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Distance</h3>
                <div className="space-y-2">
                  {["0-2", "2-5", "5-10", "10-"].map((option) => (
                    <div key={option} className="flex items-center">
                      <Checkbox
                        id={`distance-${option}`}
                        checked={selectedDistance.includes(option)}
                        onCheckedChange={() => toggleDistance(option)}
                      />
                      <label htmlFor={`distance-${option}`} className="ml-2 text-sm">
                        {option.includes("-")
                          ? option.endsWith("-")
                            ? `${option.split("-")[0]}+ km`
                            : `${option.split("-")[0]}-${option.split("-")[1]} km`
                          : `${option} km`}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Facilities</h3>
                <div className="space-y-2">
                  {[
                    "AC",
                    "Parking",
                    "Personal Trainer",
                    "Locker",
                    "Shower",
                    "Women's Hours",
                    "24/7",
                    "Pool",
                    "Spa",
                    "Group Classes",
                  ].map((facility) => (
                    <div key={facility} className="flex items-center">
                      <Checkbox
                        id={`facility-${facility}`}
                        checked={selectedFacilities.includes(facility)}
                        onCheckedChange={() => toggleFacility(facility)}
                      />
                      <label htmlFor={`facility-${facility}`} className="ml-2 text-sm">
                        {facility}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ratings */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Ratings</h3>
                <div className="space-y-2">
                  {[4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={selectedRatings.includes(rating)}
                        onCheckedChange={() => toggleRating(rating)}
                      />
                      <label htmlFor={`rating-${rating}`} className="ml-2 text-sm flex items-center">
                        {rating}+ <Star className="h-3 w-3 fill-orange-500 text-orange-500 ml-1" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>

          {/* Mobile Filters */}
          <div className="lg:hidden mb-4">
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                className="flex-1 justify-between"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </div>
                {isFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-between">
                    <div className="flex items-center">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0">
                  <div className="flex flex-col">
                    {[
                      { id: "recommended", label: "Recommended" },
                      { id: "price-low", label: "Price: Low to High" },
                      { id: "price-high", label: "Price: High to Low" },
                      { id: "rating", label: "Highest Rated" },
                      { id: "distance", label: "Nearest" },
                    ].map((option) => (
                      <Button
                        key={option.id}
                        variant="ghost"
                        className={`justify-start ${sortBy === option.id ? "bg-blue-50 text-blue-900" : ""}`}
                        onClick={() => {
                          setSortBy(option.id)
                          applyFilters()
                        }}
                      >
                        {option.label}
                        {sortBy === option.id && <CheckCircle className="ml-auto h-4 w-4" />}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {isFilterOpen && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Filters</h2>
                  <Button variant="ghost" size="sm" className="text-blue-900 h-auto p-1" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>

                {/* Mobile Price Range */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Price Range</h3>
                  <Slider
                    defaultValue={priceRange}
                    min={0}
                    max={1000}
                    step={50}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>₹{priceRange[0]}</span>
                    <span>₹{priceRange[1]}+</span>
                  </div>
                </div>

                {/* Mobile Distance */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Distance</h3>
                  <div className="flex flex-wrap gap-2">
                    {["0-2", "2-5", "5-10", "10-"].map((option) => (
                      <Badge
                        key={option}
                        variant={selectedDistance.includes(option) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          selectedDistance.includes(option) ? "bg-blue-900" : "hover:bg-blue-100 hover:text-blue-900"
                        }`}
                        onClick={() => toggleDistance(option)}
                      >
                        {option.includes("-")
                          ? option.endsWith("-")
                            ? `${option.split("-")[0]}+ km`
                            : `${option.split("-")[0]}-${option.split("-")[1]} km`
                          : `${option} km`}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Mobile Facilities */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "AC",
                      "Parking",
                      "Personal Trainer",
                      "Locker",
                      "Shower",
                      "Women's Hours",
                      "24/7",
                      "Pool",
                      "Spa",
                      "Group Classes",
                    ].map((facility) => (
                      <Badge
                        key={facility}
                        variant={selectedFacilities.includes(facility) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          selectedFacilities.includes(facility)
                            ? "bg-blue-900"
                            : "hover:bg-blue-100 hover:text-blue-900"
                        }`}
                        onClick={() => toggleFacility(facility)}
                      >
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Mobile Ratings */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Ratings</h3>
                  <div className="flex flex-wrap gap-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <Badge
                        key={rating}
                        variant={selectedRatings.includes(rating) ? "default" : "outline"}
                        className={`cursor-pointer ${
                          selectedRatings.includes(rating) ? "bg-blue-900" : "hover:bg-blue-100 hover:text-blue-900"
                        }`}
                        onClick={() => toggleRating(rating)}
                      >
                        {rating}+ <Star className="h-3 w-3 fill-orange-500 text-orange-500 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-blue-900 hover:bg-blue-800" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            )}
          </div>

          {/* Gym Listings */}
          <div className="lg:w-3/4">
            <TabsContent value="list" className="mt-0">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {loading ? "Loading..." : error ? error : `${filteredGyms.length} Gyms Found`}
                </h2>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden lg:flex items-center">
                      <ArrowUpDown className="mr-2 h-4 w-4" />
                      Sort by: {sortBy === "recommended" ? "Recommended" : sortBy.replace("-", " to ")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-0">
                    <div className="flex flex-col">
                      {[
                        { id: "recommended", label: "Recommended" },
                        { id: "price-low", label: "Price: Low to High" },
                        { id: "price-high", label: "Price: High to Low" },
                        { id: "rating", label: "Highest Rated" },
                        { id: "distance", label: "Nearest" },
                      ].map((option) => (
                        <Button
                          key={option.id}
                          variant="ghost"
                          className={`justify-start ${sortBy === option.id ? "bg-blue-50 text-blue-900" : ""}`}
                          onClick={() => {
                            setSortBy(option.id)
                            applyFilters()
                          }}
                        >
                          {option.label}
                          {sortBy === option.id && <CheckCircle className="ml-auto h-4 w-4" />}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Active Filters */}
              {(selectedDistance.length > 0 ||
                selectedFacilities.length > 0 ||
                selectedRatings.length > 0 ||
                priceRange[0] > 0 ||
                priceRange[1] < 1000) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {priceRange[0] > 0 || priceRange[1] < 1000 ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      ₹{priceRange[0]} - ₹{priceRange[1]}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          setPriceRange([0, 1000])
                          applyFilters()
                        }}
                      />
                    </Badge>
                  ) : null}

                  {selectedDistance.map((distance) => (
                    <Badge key={distance} variant="secondary" className="flex items-center gap-1">
                      {distance.includes("-")
                        ? distance.endsWith("-")
                          ? `${distance.split("-")[0]}+ km`
                          : `${distance.split("-")[0]}-${distance.split("-")[1]} km`
                        : `${distance} km`}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          toggleDistance(distance)
                          applyFilters()
                        }}
                      />
                    </Badge>
                  ))}

                  {selectedFacilities.map((facility) => (
                    <Badge key={facility} variant="secondary" className="flex items-center gap-1">
                      {facility}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          toggleFacility(facility)
                          applyFilters()
                        }}
                      />
                    </Badge>
                  ))}

                  {selectedRatings.map((rating) => (
                    <Badge key={rating} variant="secondary" className="flex items-center gap-1">
                      {rating}+ <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => {
                          toggleRating(rating)
                          applyFilters()
                        }}
                      />
                    </Badge>
                  ))}

                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={resetFilters}>
                    Clear All
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredGyms.length > 0 ? (
                  filteredGyms.map((gym) => (
                    <Card key={gym.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48">
                        <img
                          src={gym.image || "/placeholder.svg"}
                          alt={gym.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-white text-blue-900 flex items-center gap-1">
                            <Star className="fill-orange-500 text-orange-500" size={14} />
                            {gym.rating}
                          </Badge>
                        </div>
                        {gym.verified && (
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-green-500 text-white flex items-center gap-1">
                              <CheckCircle size={14} />
                              Verified
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle>{gym.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {gym.location}
                          <Badge variant="outline" className="ml-2 bg-blue-50">
                            {gym.distance}
                          </Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="flex flex-wrap gap-2 mb-3">
                          {gym.features.slice(0, 3).map((feature: string, i: number) => (
                            <Badge key={i} variant="outline" className="bg-blue-50">
                              {feature}
                            </Badge>
                          ))}
                          {gym.features.length > 3 && (
                            <Badge variant="outline" className="bg-blue-50">
                              +{gym.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                        <p className="font-bold text-blue-900">
                          Starting from <span className="text-lg">{gym.price}</span>/day
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Link href={`/gyms/${gym.id}`} className="w-full">
                          <Button className="w-full bg-orange-500 hover:bg-orange-600">View Gym</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">No gyms found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your filters or search for a different location</p>
                    <Button variant="outline" onClick={resetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>

              {filteredGyms.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" className="mx-1">
                    1
                  </Button>
                  <Button variant="outline" className="mx-1">
                    2
                  </Button>
                  <Button variant="outline" className="mx-1">
                    3
                  </Button>
                  <Button variant="ghost" className="mx-1">
                    ...
                  </Button>
                  <Button variant="outline" className="mx-1">
                    8
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="h-[600px]">
                  <MapView gyms={filteredGyms} userLocation={userLocation} />
                </div>
              </div>
            </TabsContent>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
