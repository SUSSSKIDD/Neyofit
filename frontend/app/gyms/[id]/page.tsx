"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Globe,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Share2,
  Heart,
  Loader2,
  Calendar,
  Users,
  Dumbbell,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import {
  apiService,
  Gym,
  SubscriptionListing,
  GymReview,
  TimeSlot,
  DaySchedule,
  OpeningHours,
  createDefaultOpeningHours,
  createDefaultTimeSlot,
} from "@/lib/api";
import TimeSlotManager from "@/components/time-slot-manager";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "production" ? "http://api.neyofit.in/api/v1" : "http://localhost:5001/api/v1");
function getGymImageUrl(pictureId: string) {
  return `${API_BASE_URL}/gym-pictures/${pictureId}/image`;
}

export default function GymDetailPage() {
  // Add/Edit Plans dialog state
  const [isPlansDialogOpen, setIsPlansDialogOpen] = useState(false);
  const [planForm, setPlanForm] = useState<Partial<SubscriptionListing>>({
    name: "",
    description: "",
    type: "monthly",
    customTypeText: "",
    durationInDays: 30,
    cost: 0,
    currency: "INR",
    isActive: true,
    features: [],
  });
  const [planEditId, setPlanEditId] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const gymId = params.id as string;
  const { user } = useAuth();

  const [gym, setGym] = useState<Gym | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionListing[]>([]);
  const [reviews, setReviews] = useState<GymReview[]>([]);
  const [gymSlots, setGymSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscription, setSelectedSubscription] =
    useState<SubscriptionListing | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Write Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Admin edit states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    priceRange: "mid-range",
    isActive: true,
    contact: {
      phone: "",
      email: "",
      website: "",
    },
  });

  const isAdmin = user?.userType === "superadmin";

  // Favorite state
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (gymId) {
      fetchGymDetails();
    }
  }, [gymId]);

  useEffect(() => {
    if (user && gymId) {
      fetchUserSubscriptions();
      // Check if gym is favorited
      apiService.checkFavorite(gymId).then((res) => {
        if (res.success && res.data) {
          setIsFavorite(res.data.isFavorite);
        }
      }).catch(() => {});
    }
  }, [user, gymId]);

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }
    setFavoriteLoading(true);
    try {
      const res = await apiService.toggleFavorite(gymId);
      if (res.success && res.data) {
        setIsFavorite(res.data.isFavorite);
        toast.success(res.data.isFavorite ? "Added to favorites" : "Removed from favorites");
      }
    } catch {
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    // Use saved location from localStorage, or try geolocation
    const { getSavedLocation: getSaved } = require("@/lib/user-location");
    const saved = getSaved();
    if (saved) {
      setUserLocation({ lat: saved.lat, lng: saved.lng });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          // No fallback to fake coordinates — distance just won't show
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  useEffect(() => {
    if (
      gym &&
      userLocation &&
      gym.locationId &&
      typeof gym.locationId === "object"
    ) {
      const gymCoords = (gym.locationId as any).coordinates?.coordinates;
      if (gymCoords && gymCoords.length === 2) {
        const { calculateDistance: calcDist } = require("@/lib/user-location");
        const dist = calcDist(
          userLocation.lat,
          userLocation.lng,
          gymCoords[1],
          gymCoords[0]
        );
        setDistance(dist);
      }
    }
  }, [gym, userLocation]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const fetchUserSubscriptions = async () => {
    try {
      const response = await apiService.getUserSubscriptions();
      if (response.success && response.data) {
        setUserSubscriptions(response.data);

        // Check if user has active subscription to this gym
        const activeSubForThisGym = response.data.find((sub: any) => {
          const subListing = sub.subscriptionListingId;
          if (!subListing) return false;

          // Check if subscription is for this gym and is active
          const isForThisGym =
            typeof subListing === "object" && subListing.gymId === gymId;
          const isActive =
            sub.status === "active" && new Date(sub.endDate) > new Date();

          return isForThisGym && isActive;
        });

        setHasActiveSubscription(!!activeSubForThisGym);
      }
    } catch (error) {
      console.error("Error fetching user subscriptions:", error);
    }
  };

  // Helper function to ensure opening hours are in new format
  const ensureNewFormat = (hours: any): OpeningHours => {
    if (!hours) return createDefaultOpeningHours();

    // Check if it's already in new format (has slots property)
    if (hours.monday && hours.monday.slots) {
      return hours as OpeningHours;
    }

    // If not in new format, create default
    return createDefaultOpeningHours();
  };

  const fetchGymDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch gym details
      const gymResponse = await apiService.getGymById(gymId);
      // If response is a plain gym object
      if (
        gymResponse &&
        typeof gymResponse === "object" &&
        "_id" in gymResponse
      ) {
        const gymData = gymResponse as Gym;
        setGym(gymData);
        // Populate edit form with current gym data
        setEditForm({
          name: gymData.name,
          description: gymData.description || "",
          priceRange: gymData.priceRange || "mid-range",
          isActive: gymData.isActive,
          contact: {
            phone: gymData.contact?.phone || "",
            email: gymData.contact?.email || "",
            website: gymData.contact?.website || "",
          },
        });
      } else if (
        gymResponse &&
        typeof gymResponse === "object" &&
        "data" in gymResponse &&
        gymResponse.data &&
        "_id" in gymResponse.data
      ) {
        const gymData = gymResponse.data as Gym;
        setGym(gymData);
        // Populate edit form with current gym data
        setEditForm({
          name: gymData.name,
          description: gymData.description || "",
          priceRange: gymData.priceRange || "mid-range",
          isActive: gymData.isActive,
          contact: {
            phone: gymData.contact?.phone || "",
            email: gymData.contact?.email || "",
            website: gymData.contact?.website || "",
          },
        });
      } else {
        setError("Gym not found");
        return;
      }

      // Fetch gym slots
      try {
        const slotsResponse = await apiService.getGymSlots(gymId);
        if (slotsResponse.success && (slotsResponse as any).gymSlots) {
          setGymSlots((slotsResponse as any).gymSlots);
        }
      } catch (error) {
        console.error("Error fetching gym slots:", error);
        // Don't fail the entire page if slots fail to load
      }

      // Fetch subscription listings
      const subscriptionsResponse = await apiService.getGymSubscriptionListings(
        gymId
      );
      let subscriptionsData: SubscriptionListing[] = [];
      if (Array.isArray(subscriptionsResponse)) {
        subscriptionsData = subscriptionsResponse;
      } else if (subscriptionsResponse.success && subscriptionsResponse.data) {
        subscriptionsData = subscriptionsResponse.data;
      }
      setSubscriptions(subscriptionsData);

      // Auto-select the first subscription plan if available
      if (subscriptionsData.length > 0 && !selectedSubscription) {
        setSelectedSubscription(subscriptionsData[0]);
      }

      // Fetch reviews
      const reviewsResponse = await apiService.getGymReviews(gymId);
      if (reviewsResponse.success && reviewsResponse.data) {
        setReviews(reviewsResponse.data);
      }
    } catch (error) {
      console.error("Error fetching gym details:", error);
      setError("Failed to load gym details");
    } finally {
      setLoading(false);
    }
  };

  const formatOpeningHours = () => {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    return days.map((day) => {
      const daySchedule = gymSlots.find((slot) => slot.dayOfWeek === day);
      const dayName = day.charAt(0).toUpperCase() + day.slice(1);

      if (!daySchedule) {
        return { day: dayName, hours: "Not specified" };
      }

      if (daySchedule.isClosed) {
        return { day: dayName, hours: "Closed" };
      }

      if (!daySchedule.slots || daySchedule.slots.length === 0) {
        return { day: dayName, hours: "Not specified" };
      }

      // Format active slots
      const activeSlots = daySchedule.slots.filter(
        (slot: any) => slot.isActive
      );
      if (activeSlots.length === 0) {
        return { day: dayName, hours: "No active slots" };
      }

      const slotTexts = activeSlots.map(
        (slot: any) => `${slot.name}: ${slot.startTime} - ${slot.endTime}`
      );

      return {
        day: dayName,
        hours: slotTexts.join(", "),
      };
    });
  };

  const handleEditSubmit = async () => {
    if (!gym) return;

    setIsEditLoading(true);
    try {
      const response = await apiService.updateGym(gym._id, {
        name: editForm.name,
        description: editForm.description,
        priceRange: editForm.priceRange,
        isActive: editForm.isActive,
        contact: editForm.contact,
      });

      if (response.success || response.data || "_id" in response) {
        // Refresh gym data
        await fetchGymDetails();
        setIsEditDialogOpen(false);
      } else {
        setError("Failed to update gym");
      }
    } catch (error) {
      console.error("Error updating gym:", error);
      setError("Failed to update gym");
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteGym = async () => {
    if (
      !gym ||
      !confirm(
        "Are you sure you want to delete this gym? This action cannot be undone."
      )
    )
      return;

    try {
      const response = await apiService.deleteGym(gym._id);
      if (response.success || (response as any).message) {
        router.push("/admin");
      } else {
        setError("Failed to delete gym");
      }
    } catch (error) {
      console.error("Error deleting gym:", error);
      setError("Failed to delete gym");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setReviewSubmitting(true);
    try {
      const res = await apiService.createGymReview({
        gymId,
        rating: reviewRating,
        comment: reviewComment,
      });
      if (res.success || (res.data && res.data._id)) {
        toast.success("Review submitted!");
        setReviewComment("");
        setReviewRating(5);
        setShowReviewForm(false);
        // Refresh reviews
        const reviewsResponse = await apiService.getGymReviews(gymId);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data);
        }
      } else {
        toast.error((res as any).message || "Failed to submit review");
      }
    } catch (err) {
      toast.error("Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency === "INR" ? "INR" : "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading gym details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !gym) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Gym not found</h1>
            <p className="mb-6">
              {error ||
                "The gym you are looking for does not exist or has been removed."}
            </p>
            <Link href="/gyms">
              <Button>Back to Gyms</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Admin Add/Edit Plans Button */}
        {isAdmin && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => {
                setIsPlansDialogOpen(true);
                setPlanEditId(null);
                setPlanForm({
                  name: "",
                  description: "",
                  type: "monthly",
                  customTypeText: "",
                  durationInDays: 30,
                  cost: 0,
                  currency: "INR",
                  isActive: true,
                  features: [],
                });
                setPlanError(null);
                setPlanSuccess(null);
              }}
            >
              Add/Edit Plans
            </Button>
          </div>
        )}
        {/* Admin Add/Edit Plans Dialog */}
        <Dialog open={isPlansDialogOpen} onOpenChange={setIsPlansDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {planEditId ? "Edit Plan" : "Add New Plan"}
              </DialogTitle>
              <DialogDescription>
                {planEditId
                  ? "Edit the details of this subscription plan."
                  : "Add a new subscription plan for this gym."}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPlanLoading(true);
                setPlanError(null);
                try {
                  let res;
                  if (planEditId) {
                    // Update existing plan
                    res = await apiService.updateSubscriptionListing(
                      planEditId,
                      { ...planForm, gymId }
                    );
                  } else {
                    // Ensure all required fields are present
                    const planPayload = {
                      name: planForm.name || "",
                      description: planForm.description || "",
                      type: planForm.type || "monthly",
                      customTypeText: planForm.customTypeText || undefined,
                      durationInDays: planForm.durationInDays || 1,
                      gymId,
                      cost: planForm.cost || 0,
                      currency: planForm.currency || "INR",
                      discount: planForm.discount || undefined,
                      isActive: planForm.isActive ?? true,
                      isRecurring: planForm.isRecurring ?? false,
                      features: planForm.features || [],
                      startDate: planForm.startDate || undefined,
                      endDate: planForm.endDate || undefined,
                    };

                    console.log("Creating plan with payload:", planPayload);
                    res = await apiService.createSubscriptionListing(
                      planPayload
                    );
                    console.log("Create plan response:", res);

                    // Handle the response format: {success: true, created: listing}
                    if (
                      res &&
                      res.success &&
                      (res as any).created &&
                      (res as any).created._id
                    ) {
                      const newPlanId = (res as any).created._id;
                      console.log(
                        "Plan created successfully, linking to gym:",
                        newPlanId
                      );

                      // Link the plan to the gym
                      const linkRes = await apiService.linkSubscriptionToGym(
                        gymId,
                        newPlanId
                      );
                      console.log("Link response:", linkRes);

                      if (linkRes && linkRes.success !== false) {
                        console.log("Plan linked to gym successfully");
                      } else {
                        console.warn(
                          "Plan created but linking failed:",
                          linkRes
                        );
                        // Don't fail the entire operation if linking fails
                        // The plan is still created and can be manually linked
                      }
                    } else {
                      const errorMsg =
                        (res as any)?.error || "Failed to create plan";
                      console.error("Plan creation failed:", errorMsg);
                      setPlanError(`Failed to create plan: ${errorMsg}`);
                      setPlanLoading(false);
                      return;
                    }
                  }
                  // Check if operation was successful
                  if (res && res.success) {
                    setPlanSuccess(
                      planEditId
                        ? "Plan updated successfully!"
                        : "Plan created successfully!"
                    );
                    setPlanError(null);
                    await fetchGymDetails(); // Refresh the gym details to show the new plan
                    setTimeout(() => {
                      setIsPlansDialogOpen(false);
                      setPlanSuccess(null);
                    }, 1500);
                  } else {
                    const errorMsg =
                      (res as any)?.message ||
                      res?.error ||
                      "Failed to save plan";
                    setPlanError(errorMsg);
                  }
                } catch (err) {
                  console.error("Plan operation error:", err);
                  setPlanError(
                    `Failed to save plan: ${
                      err instanceof Error ? err.message : "Unknown error"
                    }`
                  );
                } finally {
                  setPlanLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label>Name</Label>
                <Input
                  value={planForm.name || ""}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={planForm.description || ""}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Type</Label>
                  <Select
                    value={planForm.type || "monthly"}
                    onValueChange={(v) =>
                      setPlanForm((f) => ({
                        ...f,
                        type: v as any,
                        customTypeText: v === "custom" ? f.customTypeText : "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    value={planForm.durationInDays || ""}
                    min={1}
                    max={3650}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPlanForm((f) => ({
                        ...f,
                        durationInDays: value === "" ? 1 : Number(value),
                      }));
                    }}
                    required
                  />
                </div>
              </div>

              {/* Custom Type Text Input - Only show when custom is selected */}
              {planForm.type === "custom" && (
                <div>
                  <Label>Custom Type Name</Label>
                  <Input
                    value={planForm.customTypeText || ""}
                    onChange={(e) =>
                      setPlanForm((f) => ({
                        ...f,
                        customTypeText: e.target.value,
                      }))
                    }
                    placeholder="e.g., 6-Month Pass, Student Special, Weekend Only"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a descriptive name for your custom subscription type
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Cost (₹)</Label>
                  <Input
                    type="number"
                    value={planForm.cost || ""}
                    min={0}
                    max={999999}
                    step="0.01"
                    onChange={(e) => {
                      const value = e.target.value;
                      setPlanForm((f) => ({
                        ...f,
                        cost: value === "" ? 0 : Number(value),
                      }));
                    }}
                    required
                  />
                </div>
                <div className="flex-1">
                  <Label>Currency</Label>
                  <Input
                    value={planForm.currency || "INR"}
                    onChange={(e) =>
                      setPlanForm((f) => ({ ...f, currency: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Features (comma separated)</Label>
                <Input
                  value={planForm.features?.join(", ") || ""}
                  onChange={(e) =>
                    setPlanForm((f) => ({
                      ...f,
                      features: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="e.g., Pool access, Personal trainer, Steam room"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple features with commas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={planForm.isActive ?? true}
                  onChange={(e) =>
                    setPlanForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                <Label>Active</Label>
              </div>
              {planError && (
                <div className="text-red-600 text-sm">{planError}</div>
              )}
              {planSuccess && (
                <div className="text-green-600 text-sm font-medium">
                  {planSuccess}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsPlansDialogOpen(false)}
                  disabled={planLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={planLoading}>
                  {planEditId ? "Save Changes" : "Add Plan"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* List of plans with edit buttons for admin */}
        {isAdmin && subscriptions.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Subscription Plans</h3>
            <div className="grid gap-3">
              {subscriptions.map((plan) => (
                <Card
                  key={plan._id}
                  className="p-3 flex flex-col md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-bold">{plan.name}</div>
                    <div className="text-sm text-gray-600">
                      {plan.type === "custom" && plan.customTypeText
                        ? plan.customTypeText
                        : plan.type}{" "}
                      - {plan.durationInDays} days - ₹{plan.cost}
                    </div>
                    <div className="text-xs text-gray-500">
                      {plan.description}
                    </div>
                    {plan.features && plan.features.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Features: {plan.features.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setPlanEditId(plan._id);
                        setPlanForm({ ...plan });
                        setIsPlansDialogOpen(true);
                        setPlanError(null);
                        setPlanSuccess(null);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this plan? This cannot be undone."
                          )
                        ) {
                          try {
                            const res =
                              await apiService.deleteSubscriptionListing(
                                plan._id
                              );
                            if (res && (res.success || (res as any).message)) {
                              fetchGymDetails();
                            } else {
                              alert(
                                res && (res as any).message
                                  ? (res as any).message
                                  : "Failed to delete plan."
                              );
                            }
                          } catch (err) {
                            alert("Failed to delete plan.");
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/gyms">
            <Button variant="ghost" className="flex items-center text-gray-600">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Gyms
            </Button>
          </Link>
        </div>

        {/* Gym Header */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{gym.name}</h1>
            {gym.locationId && typeof gym.locationId === "object" && (
              <div className="mb-2">
                <div className="flex items-center">
                  <MapPin size={16} className="text-gray-500 mr-1" />
                  <span className="text-gray-600">
                    {(gym.locationId as any).address.street},{" "}
                    {(gym.locationId as any).address.city},{" "}
                    {(gym.locationId as any).address.state}
                  </span>
                </div>
                {/* Distance Badge */}
                {distance !== null ? (
                  <div className="mt-2 inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                    📍 {distance} km away from you
                  </div>
                ) : userLocation === null ? (
                  <div className="mt-2 inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                    📍 Enable location to see distance
                  </div>
                ) : (
                  <div className="mt-2 inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                    📍 Calculating distance...
                  </div>
                )}
              </div>
            )}
            <div className="flex items-center gap-3">
              {gym.rating && (
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                  <span className="ml-1 font-bold">{gym.rating}</span>
                  <span className="ml-1 text-gray-500">
                    ({reviews.length} reviews)
                  </span>
                </div>
              )}
              <Badge className={getPriceRangeColor(gym.priceRange)}>
                {getPriceRangeText(gym.priceRange)}
              </Badge>
              <Badge className="bg-green-500 text-white">Verified</Badge>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {isAdmin && (
              <>
                <Dialog
                  open={isEditDialogOpen}
                  onOpenChange={setIsEditDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Gym Details</DialogTitle>
                      <DialogDescription>
                        Update gym information and settings
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Gym Name</Label>
                            <Input
                              id="name"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="priceRange">Price Range</Label>
                            <Select
                              value={editForm.priceRange}
                              onValueChange={(value) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  priceRange: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="budget">Budget</SelectItem>
                                <SelectItem value="mid-range">
                                  Mid-Range
                                </SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={editForm.contact.phone}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    phone: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={editForm.contact.email}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    email: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              value={editForm.contact.website}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  contact: {
                                    ...prev.contact,
                                    website: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Opening Hours - Dynamic Time Slots */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Opening Hours - Time Slots
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Availability slots are managed separately. Use the
                          admin dashboard to edit gym slots.
                        </p>
                      </div>

                      {/* Status */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Status</h3>
                        <Label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                isActive: e.target.checked,
                              }))
                            }
                          />
                          <span>Gym is active</span>
                        </Label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleEditSubmit}
                        disabled={isEditLoading}
                      >
                        {isEditLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {isEditLoading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="destructive" onClick={handleDeleteGym}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            <Button variant="outline" size="icon">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Image Carousel */}
        {gym.pictures && gym.pictures.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Gallery</h2>
            <div className="relative">
              <div className="relative overflow-hidden rounded-lg">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{
                    transform: `translateX(-${currentImageIndex * 100}%)`,
                  }}
                >
                  {gym.pictures.map((pictureId, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <img
                        src={getGymImageUrl(pictureId)}
                        alt={`${gym.name} - Image ${index + 1}`}
                        className="w-full h-96 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg";
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                {gym.pictures.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === 0
                            ? (gym.pictures?.length || 1) - 1
                            : prev - 1
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                      onClick={() =>
                        setCurrentImageIndex((prev) =>
                          prev === (gym.pictures?.length || 1) - 1
                            ? 0
                            : prev + 1
                        )
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* Image Indicators */}
              {gym.pictures.length > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  {gym.pictures.map((_, index) => (
                    <button
                      key={index}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentImageIndex
                          ? "bg-blue-600"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Details */}
          <div className="lg:w-2/3">
            <Tabs defaultValue="overview">
              <TabsList className="w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="facilities">Facilities</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold mb-3">About {gym.name}</h2>
                    <p className="text-gray-700">
                      {gym.description || "No description available."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3">
                      Hours of Operation
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                      {formatOpeningHours().map(({ day, hours }) => (
                        <div key={day} className="flex flex-col">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{day}:</span>
                            <span className="text-sm text-gray-600">
                              {hours}
                            </span>
                          </div>
                          {hours.includes(":") &&
                            hours !== "Closed" &&
                            hours !== "Not specified" &&
                            hours !== "No active slots" && (
                              <div className="text-xs text-gray-500 ml-2">
                                Multiple time slots available
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3">
                      Contact Information
                    </h3>
                    <div className="space-y-2">
                      {gym.contact?.phone && (
                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-blue-900 mr-2" />
                          <a
                            href={`tel:${gym.contact.phone}`}
                            className="text-blue-900 hover:underline"
                          >
                            {gym.contact.phone}
                          </a>
                        </div>
                      )}
                      {gym.contact?.email && (
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-blue-900 mr-2" />
                          <a
                            href={`mailto:${gym.contact.email}`}
                            className="text-blue-900 hover:underline"
                          >
                            {gym.contact.email}
                          </a>
                        </div>
                      )}
                      {gym.contact?.website && (
                        <div className="flex items-center">
                          <Globe className="h-5 w-5 text-blue-900 mr-2" />
                          <a
                            href={
                              gym.contact.website.startsWith("http")
                                ? gym.contact.website
                                : `https://${gym.contact.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-900 hover:underline"
                          >
                            {gym.contact.website}
                          </a>
                        </div>
                      )}
                      {gym.locationId &&
                        typeof gym.locationId === "object" &&
                        (gym.locationId as any).coordinates?.coordinates && (
                          <div className="mt-4">
                            {user && hasActiveSubscription ? (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${
                                  (gym.locationId as any).coordinates
                                    .coordinates[1]
                                },${
                                  (gym.locationId as any).coordinates
                                    .coordinates[0]
                                }`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
                                  <MapPin className="h-5 w-5" />
                                  Get Directions
                                </Button>
                              </a>
                            ) : (
                              <div className="relative group">
                                <Button
                                  disabled
                                  className="w-full flex items-center justify-center gap-2 bg-gray-400 cursor-not-allowed opacity-60"
                                >
                                  <MapPin className="h-5 w-5" />
                                  Get Directions
                                </Button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                  {user
                                    ? "Subscribe to this gym to get directions"
                                    : "Login and subscribe to get directions"}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Facilities Tab */}
              <TabsContent value="facilities" className="mt-6">
                <h2 className="text-xl font-bold mb-4">
                  Facilities & Amenities
                </h2>
                {gym.facilities && gym.facilities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {gym.facilities.map((facility, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-blue-50 p-3 rounded-lg"
                      >
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                        <span>
                          {typeof facility === "string"
                            ? facility
                            : facility.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No facilities information available.
                  </p>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Customer Reviews</h2>
                  <div className="flex items-center gap-3">
                    {gym.rating && (
                      <div className="flex items-center">
                        <Star className="h-5 w-5 fill-orange-500 text-orange-500" />
                        <span className="ml-1 font-bold">{gym.rating}</span>
                        <span className="ml-1 text-gray-500">
                          ({reviews.length})
                        </span>
                      </div>
                    )}
                    {user && (
                      <Button
                        size="sm"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        variant={showReviewForm ? "outline" : "default"}
                      >
                        {showReviewForm ? "Cancel" : "Write a Review"}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Write Review Form */}
                {showReviewForm && user && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="mb-6 bg-blue-50 rounded-lg p-5 space-y-4"
                  >
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewRating(i + 1)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-7 w-7 cursor-pointer transition-colors ${
                                i < reviewRating
                                  ? "fill-orange-500 text-orange-500"
                                  : "text-gray-300 hover:text-orange-300"
                              }`}
                            />
                          </button>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">{reviewRating}/5</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Comment (optional)</label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience at this gym..."
                        rows={3}
                      />
                    </div>
                    <Button type="submit" disabled={reviewSubmitting}>
                      {reviewSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </form>
                )}

                {!user && (
                  <div className="mb-6 bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-600 text-sm mb-2">Want to leave a review?</p>
                    <Link href="/login">
                      <Button size="sm" variant="outline">Sign in to write a review</Button>
                    </Link>
                  </div>
                )}

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review._id}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {review.userId.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">
                              User {review.userId.slice(-4)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="ml-auto flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-orange-500 text-orange-500"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700">
                          {review.comment || "No comment provided."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No reviews yet. Be the first to review this gym!
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Subscription Plans */}
          <div className="lg:w-1/3">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>
                  Choose a plan that suits your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subscriptions.length > 0 ? (
                  subscriptions.map((subscription) => (
                    <div
                      key={subscription._id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedSubscription?._id === subscription._id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                      onClick={() => setSelectedSubscription(subscription)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center mt-1">
                          <input
                            type="radio"
                            name="subscription-plan"
                            value={subscription._id}
                            checked={
                              selectedSubscription?._id === subscription._id
                            }
                            onChange={() =>
                              setSelectedSubscription(subscription)
                            }
                            className="h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold">{subscription.name}</h3>
                            <span className="text-xl font-bold text-blue-900">
                              {formatCurrency(
                                subscription.cost,
                                subscription.currency
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {subscription.description ||
                              `${subscription.durationInDays} days access`}
                          </p>
                          {subscription.features &&
                            subscription.features.length > 0 && (
                              <div className="space-y-1">
                                {subscription.features
                                  .slice(0, 3)
                                  .map((feature, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center text-xs text-gray-600"
                                    >
                                      <Check className="h-3 w-3 text-green-500 mr-1" />
                                      {feature}
                                    </div>
                                  ))}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No subscription plans available
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                  <Check className="h-5 w-5 text-blue-900 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900">
                    All plans include access to all facilities and amenities.
                    Personal training sessions are available at an additional
                    cost.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Link
                  href={`/checkout?gym=${gymId}&subscription=${selectedSubscription?._id}`}
                  className="w-full"
                >
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    disabled={!selectedSubscription}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedSubscription ? "Book Now" : "Select a Plan First"}
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  By booking, you agree to our{" "}
                  <a href="/terms" className="text-blue-900 hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="text-blue-900 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
