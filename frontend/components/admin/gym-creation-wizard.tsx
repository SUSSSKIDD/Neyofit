"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Image,
  CheckCircle,
  Upload,
  X,
  Search,
  Loader2,
  Plus,
  Trash2,
  CreditCard,
  Star,
} from "lucide-react";
import {
  apiService,
  Gym,
  Location,
  TimeSlot,
  DaySchedule,
  OpeningHours,
  createDefaultTimeSlot,
  SubscriptionListing,
} from "@/lib/api";
import LocationSearch from "./location-search";
import GoogleMapLocationPicker from "./google-map-location-picker";

interface GymCreationWizardProps {
  onComplete: (gym: Gym) => void;
  onCancel: () => void;
  editGym?: Gym | null; // Add edit mode support
  mode?: "create" | "edit"; // Add mode prop
  allowLocationCreate?: boolean; // Control whether users can create new locations
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: WizardStep[] = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Gym name, description, and location",
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    id: "availability",
    title: "Availability Slots",
    description: "Configure opening hours and time slots",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    id: "plans",
    title: "Gym Plans",
    description: "Add subscription plans and pricing",
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    id: "images",
    title: "Images",
    description: "Upload gym photos and set cover image",
    icon: <Image className="h-5 w-5" />,
  },
  {
    id: "review",
    title: "Review & Publish",
    description: "Review details and publish the gym",
    icon: <CheckCircle className="h-5 w-5" />,
  },
];

export default function GymCreationWizard({
  onComplete,
  onCancel,
  editGym = null,
  mode = "create",
  allowLocationCreate = true, // Default to true for backward compatibility (admin can create)
}: GymCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [gymData, setGymData] = useState<{
    name: string;
    description: string;
    locationId: string;
    contact: {
      phone: string;
      email: string;
      website: string;
    };
    priceRange: "budget" | "mid-range" | "premium";
    rating: string;
  }>({
    name: "",
    description: "",
    locationId: "",
    contact: {
      phone: "",
      email: "",
      website: "",
    },
    priceRange: "mid-range",
    rating: "",
  });

  // Separate state for opening hours (for UI only)
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    tuesday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    wednesday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    thursday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    friday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    saturday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    sunday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
  });

  // Location search
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  // Image upload
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageCaptions, setImageCaptions] = useState<string[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState<number | null>(null);

  // Existing image management (for edit mode)
  const [existingImageCaptions, setExistingImageCaptions] = useState<
    Record<string, string>
  >({});
  const [existingCoverImageId, setExistingCoverImageId] = useState<
    string | null
  >(null);
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>(
    []
  );

  // Gym plans
  const [gymPlans, setGymPlans] = useState<Partial<SubscriptionListing>[]>([
    {
      name: "",
      description: "",
      type: "monthly",
      durationInDays: 30,
      cost: 0,
      currency: "INR",
      discount: {
        amount: 0,
        type: "percentage",
        validUntil: "",
      },
      isActive: true,
      isRecurring: false,
      features: [],
      startDate: "",
      endDate: "",
    },
  ]);

  // Track existing plan IDs for edit mode
  const [existingPlanIds, setExistingPlanIds] = useState<string[]>([]);

  // Draft gym ID for multi-stage creation
  const [draftGymId, setDraftGymId] = useState<string | null>(null);

  // Load existing slots for edit mode
  const loadExistingSlots = async (gymId: string) => {
    try {
      const response = await apiService.getGymSlots(gymId);
      if (response.success && (response as any).gymSlots) {
        const slotsMap: OpeningHours = {
          monday: { isClosed: false, slots: [] },
          tuesday: { isClosed: false, slots: [] },
          wednesday: { isClosed: false, slots: [] },
          thursday: { isClosed: false, slots: [] },
          friday: { isClosed: false, slots: [] },
          saturday: { isClosed: false, slots: [] },
          sunday: { isClosed: false, slots: [] },
        };

        (response as any).gymSlots.forEach((slot: any) => {
          slotsMap[slot.dayOfWeek as keyof OpeningHours] = {
            isClosed: slot.isClosed,
            slots: slot.slots.map((s: any) => ({
              id:
                s._id ||
                `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: s.name || "Slot",
              startTime: s.startTime,
              endTime: s.endTime,
              isActive: s.isActive !== false,
            })),
          };
        });

        setOpeningHours(slotsMap);
      }
    } catch (error) {
      console.error("Error loading existing slots:", error);
    }
  };

  // Pre-fill form data in edit mode
  useEffect(() => {
    if (editGym && mode === "edit") {
      console.log("Loading edit gym data:", editGym);
      setGymData({
        name: editGym.name,
        description: editGym.description || "",
        locationId: editGym.locationId,
        contact: {
          phone: editGym.contact?.phone || "",
          email: editGym.contact?.email || "",
          website: editGym.contact?.website || "",
        },
        priceRange: (editGym.priceRange || "mid-range") as
          | "mid-range"
          | "budget"
          | "premium",
        rating: editGym.rating?.toString() || "",
      });

      // Set selected location
      if (editGym.locationId && typeof editGym.locationId === "object") {
        setSelectedLocation(editGym.locationId as any);
      }

      // Set existing images if available
      if (editGym.pictures && editGym.pictures.length > 0) {
        // Note: We can't load existing images as File objects for editing
        // They will be shown in the review step but can't be re-uploaded
        // User can add new images alongside existing ones
        setSelectedImages([]); // Start with empty for new uploads
        setImageCaptions([]);
        setCoverImageIndex(null);
      }

      // Set gym plans if available
      if (
        editGym.subscriptionListings &&
        editGym.subscriptionListings.length > 0
      ) {
        console.log("Loading gym plans:", editGym.subscriptionListings);
        const plans = editGym.subscriptionListings.map((plan) => ({
          _id: plan._id, // Include the ID for tracking
          name: plan.name,
          description: plan.description || "",
          type: plan.type,
          durationInDays: plan.durationInDays,
          cost: plan.cost,
          currency: plan.currency,
          discount: plan.discount || {
            amount: 0,
            type: "percentage",
            validUntil: "",
          },
          isActive: plan.isActive,
          isRecurring: plan.isRecurring,
          features: plan.features || [],
          startDate: plan.startDate || "",
          endDate: plan.endDate || "",
        }));

        setGymPlans(plans);
        setExistingPlanIds(plans.map((p) => p._id).filter(Boolean) as string[]);
      }

      // Set draft gym ID for updates
      setDraftGymId(editGym._id);

      // Load existing slots
      loadExistingSlots(editGym._id);
    }
  }, [editGym, mode]);

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Handle image selection
  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    setSelectedImages((prev) => [...prev, ...newFiles]);
    setImageCaptions((prev) => [...prev, ...newFiles.map(() => "")]);
  };

  // Remove image
  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImageCaptions((prev) => prev.filter((_, i) => i !== index));
    if (coverImageIndex === index) {
      setCoverImageIndex(null);
    } else if (coverImageIndex !== null && coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1);
    }
  };

  // Existing image management functions
  const removeExistingImage = (pictureId: string) => {
    setRemovedExistingImages((prev) => [...prev, pictureId]);
    if (existingCoverImageId === pictureId) {
      setExistingCoverImageId(null);
    }
  };

  const setCoverImageFromExisting = (pictureId: string) => {
    setExistingCoverImageId(pictureId);
    setCoverImageIndex(null); // Clear new image cover selection
  };

  const updateExistingImageCaption = (pictureId: string, caption: string) => {
    setExistingImageCaptions((prev) => ({
      ...prev,
      [pictureId]: caption,
    }));
  };

  // Set cover image
  const setCoverImage = (index: number) => {
    setCoverImageIndex(index);
  };

  // Add time slot
  const addTimeSlot = (day: keyof OpeningHours) => {
    const newSlot = createDefaultTimeSlot(
      `Slot ${openingHours[day].slots.length + 1}`
    );
    setOpeningHours((prev: OpeningHours) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, newSlot],
      },
    }));
  };

  // Save slots to new schema
  const saveSlotsToNewSchema = async () => {
    if (!draftGymId) return false;

    try {
      const promises = Object.entries(openingHours).map(([day, schedule]) => {
        const typedSchedule = schedule as DaySchedule;
        const slots = typedSchedule.slots.map((slot: TimeSlot) => ({
          id: slot.id, // Include the slot ID
          name: slot.name, // Include the slot name
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxCapacity: (slot as any).maxCapacity || 10,
          price: (slot as any).price || 0,
          isActive: slot.isActive !== false,
        }));

        return apiService.createOrUpdateGymSlots(
          draftGymId,
          day,
          slots,
          typedSchedule.isClosed
        );
      });

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error saving slots:", error);
      return false;
    }
  }; // Remove time slot
  const removeTimeSlot = (day: keyof OpeningHours, slotIndex: number) => {
    setOpeningHours((prev: OpeningHours) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter(
          (_: TimeSlot, i: number) => i !== slotIndex
        ),
      },
    }));
  };

  // Update time slot
  const updateTimeSlot = (
    day: keyof OpeningHours,
    slotIndex: number,
    field: keyof TimeSlot,
    value: string | boolean
  ) => {
    setOpeningHours((prev: OpeningHours) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot: TimeSlot, i: number) =>
          i === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  // Toggle day closed
  const toggleDayClosed = (day: keyof OpeningHours) => {
    setOpeningHours((prev: OpeningHours) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isClosed: !prev[day].isClosed,
      },
    }));
  };

  // Create draft gym
  const createDraftGym = async () => {
    if (!gymData.name || !gymData.locationId) {
      setError("Name and location are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;

      if (mode === "edit" && draftGymId) {
        // Update existing gym
        response = await apiService.updateGym(draftGymId, {
          name: gymData.name,
          description: gymData.description,
          locationId: gymData.locationId,
          contact: gymData.contact,
          priceRange: gymData.priceRange,
          rating: gymData.rating ? parseFloat(gymData.rating) : undefined,
        });

        // Backend returns { success: true, data: gym }
        if (response?.success && response?.data) {
          setSuccess("Gym updated successfully");
          return true;
        } else {
          setError((response as any)?.error || "Failed to update gym");
          return false;
        }
      } else {
        // Create new gym draft
        response = await apiService.createGymDraft({
          name: gymData.name,
          description: gymData.description,
          locationId: gymData.locationId,
          contact: gymData.contact,
          priceRange: gymData.priceRange,
          rating: gymData.rating ? parseFloat(gymData.rating) : undefined,
        });

        if (response.success && response.gym) {
          setDraftGymId(response.gym._id);
          setSuccess("Gym draft created successfully");
          return true;
        } else {
          setError(response.error || "Failed to create gym draft");
          return false;
        }
      }
    } catch (error) {
      setError(
        mode === "edit" ? "Failed to update gym" : "Failed to create gym draft"
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Upload images
  const uploadImages = async () => {
    if (!draftGymId || selectedImages.length === 0) return true;

    setLoading(true);
    setError(null);

    try {
      const captions = imageCaptions.filter((caption) => caption.trim() !== "");
      const isCover = selectedImages.map(
        (_, index) => index === coverImageIndex
      );

      const response = await apiService.bulkUploadGymPictures(
        draftGymId,
        selectedImages,
        captions.length > 0 ? captions : undefined,
        isCover
      );

      if (response.success) {
        setSuccess("Images uploaded successfully");
        return true;
      } else {
        setError(response.error || "Failed to upload images");
        return false;
      }
    } catch (error) {
      setError("Failed to upload images");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Save gym plans
  const saveGymPlans = async () => {
    if (!draftGymId) return false;

    setLoading(true);
    setError(null);
    try {
      const currentPlanIds = gymPlans
        .filter((plan) => plan._id)
        .map((plan) => plan._id as string);

      // Delete plans that were removed
      const plansToDelete = existingPlanIds.filter(
        (id) => !currentPlanIds.includes(id)
      );

      console.log("Saving gym plans:", {
        totalPlans: gymPlans.length,
        plansToDelete: plansToDelete.length,
        existingPlanIds,
        currentPlanIds,
      });

      for (const planId of plansToDelete) {
        console.log("Deleting plan:", planId);
        await apiService.deleteSubscriptionListing(planId);
      }

      // Process each plan
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < gymPlans.length; i++) {
        const plan = gymPlans[i];

        if (plan.name && plan.name.trim() !== "") {
          const planData = {
            name: plan.name,
            description: plan.description || "",
            type: plan.type || "monthly",
            durationInDays: plan.durationInDays || 30,
            gymId: draftGymId,
            cost: plan.cost || 0,
            currency: plan.currency || "INR",
            discount: plan.discount || {
              amount: 0,
              type: "percentage",
              validUntil: "",
            },
            isActive: plan.isActive !== false,
            isRecurring: plan.isRecurring || false,
            features: plan.features || [],
            startDate: plan.startDate || "",
            endDate: plan.endDate || "",
          };

          console.log(
            `Processing plan ${i + 1}/${gymPlans.length}:`,
            planData.name
          );

          if (plan._id) {
            // Update existing plan
            console.log("Updating existing plan:", plan._id);
            const response = await apiService.updateSubscriptionListing(
              plan._id,
              planData
            );
            if (response.success) {
              successCount++;
              console.log("Plan updated successfully:", plan.name);
            } else {
              failCount++;
              console.error(
                "Failed to update plan:",
                plan.name,
                response.error
              );
            }
          } else {
            // Create new plan
            console.log("Creating new plan:", plan.name);
            const response = await apiService.createSubscriptionListing(
              planData
            );
            if (response.success && response.created) {
              // Link the subscription to the gym
              console.log("Linking plan to gym:", response.created._id);
              const linkResponse = await apiService.linkSubscriptionToGym(
                draftGymId,
                response.created._id
              );
              successCount++;
              console.log("Plan created and linked successfully:", plan.name);
            } else {
              failCount++;
              console.error(
                "Failed to create plan:",
                plan.name,
                response.error
              );
            }
          }
        } else {
          console.warn(`Skipping plan ${i + 1} - no name provided`);
        }
      }

      console.log(
        `Plan saving complete: ${successCount} succeeded, ${failCount} failed`
      );

      if (failCount > 0) {
        setError(
          `${successCount} plan(s) saved successfully, but ${failCount} failed`
        );
      } else {
        setSuccess(`All ${successCount} gym plan(s) saved successfully!`);
      }

      return failCount === 0;
    } catch (error) {
      console.error("Error saving gym plans:", error);
      setError("Failed to save gym plans: " + (error as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Publish gym
  const publishGym = async () => {
    if (!draftGymId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.updateGymStatus(
        draftGymId,
        "published"
      );
      if (response.success && response.gym) {
        setSuccess("Gym published successfully");
        onComplete(response.gym);
        return true;
      } else {
        setError(response.error || "Failed to publish gym");
        return false;
      }
    } catch (error) {
      setError("Failed to publish gym");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle next step
  const handleNext = async () => {
    if (currentStep === 0) {
      // Create draft gym after basic info
      const success = await createDraftGym();
      if (success) {
        setCurrentStep(1);
      }
    } else if (currentStep === 1) {
      // Save availability slots to new schema
      const success = await saveSlotsToNewSchema();
      if (success) {
        setCurrentStep(2);
      } else {
        setError("Failed to save availability slots");
      }
    } else if (currentStep === 2) {
      // Save gym plans before images
      const success = await saveGymPlans();
      if (success) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      // Upload images before review
      const success = await uploadImages();
      if (success) {
        setCurrentStep(4);
      }
    } else if (currentStep === 4) {
      // Publish gym
      await publishGym();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  // Check if current step is valid
  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return gymData.name.trim() !== "" && gymData.locationId !== "";
      case 1:
        return true; // Availability slots are optional
      case 2:
        return true; // Gym plans are optional
      case 3:
        return true; // Images are optional
      case 4:
        return draftGymId !== null;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gym-name">Gym Name *</Label>
                <Input
                  id="gym-name"
                  value={gymData.name}
                  onChange={(e) =>
                    setGymData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter gym name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price-range">Price Range</Label>
                <Select
                  value={gymData.priceRange}
                  onValueChange={(value: any) =>
                    setGymData((prev) => ({ ...prev, priceRange: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="mid-range">Mid-Range</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={gymData.description}
                onChange={(e) =>
                  setGymData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Enter gym description"
                rows={3}
              />
            </div>

            <GoogleMapLocationPicker
              onLocationSelect={(location) => {
                setSelectedLocation(location);
                setGymData((prev) => ({
                  ...prev,
                  locationId: location ? location._id : "",
                }));
              }}
              selectedLocation={selectedLocation}
              label="Location"
              required={true}
              allowCreate={allowLocationCreate}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={gymData.contact.phone}
                  onChange={(e) =>
                    setGymData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value },
                    }))
                  }
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={gymData.contact.email}
                  onChange={(e) =>
                    setGymData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value },
                    }))
                  }
                  placeholder="Email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={gymData.contact.website}
                  onChange={(e) =>
                    setGymData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, website: e.target.value },
                    }))
                  }
                  placeholder="Website URL"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">
                Configure Availability Slots
              </h3>
              <p className="text-gray-600">
                Set up opening hours and time slots for each day
              </p>
            </div>

            {Object.entries(openingHours).map(([day, schedule]) => (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize text-base">
                      {day}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={schedule.isClosed}
                        onChange={() =>
                          toggleDayClosed(day as keyof OpeningHours)
                        }
                        className="rounded"
                      />
                      <Label className="text-sm">Closed</Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!schedule.isClosed && (
                    <div className="space-y-3">
                      {schedule.slots.map(
                        (slot: TimeSlot, slotIndex: number) => (
                          <div
                            key={slot.id}
                            className="flex items-center gap-3 p-3 border rounded-md"
                          >
                            <div className="flex-1 grid grid-cols-4 gap-3">
                              <Input
                                value={slot.name}
                                onChange={(e) =>
                                  updateTimeSlot(
                                    day as keyof OpeningHours,
                                    slotIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Slot name"
                              />
                              <Input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) =>
                                  updateTimeSlot(
                                    day as keyof OpeningHours,
                                    slotIndex,
                                    "startTime",
                                    e.target.value
                                  )
                                }
                              />
                              <Input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateTimeSlot(
                                    day as keyof OpeningHours,
                                    slotIndex,
                                    "endTime",
                                    e.target.value
                                  )
                                }
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={slot.isActive}
                                  onChange={(e) =>
                                    updateTimeSlot(
                                      day as keyof OpeningHours,
                                      slotIndex,
                                      "isActive",
                                      e.target.checked
                                    )
                                  }
                                  className="rounded"
                                />
                                <Label className="text-sm">Active</Label>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                removeTimeSlot(
                                  day as keyof OpeningHours,
                                  slotIndex
                                )
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(day as keyof OpeningHours)}
                      >
                        Add Time Slot
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">Gym Plans</h3>
              <p className="text-gray-600">
                Add subscription plans and pricing
              </p>
            </div>

            <div className="space-y-4">
              {gymPlans.map((plan, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Plan {index + 1}
                      </CardTitle>
                      {gymPlans.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newPlans = gymPlans.filter(
                              (_, i) => i !== index
                            );
                            setGymPlans(newPlans);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Plan Name *</Label>
                        <Input
                          value={plan.name || ""}
                          onChange={(e) => {
                            const newPlans = [...gymPlans];
                            newPlans[index].name = e.target.value;
                            setGymPlans(newPlans);
                          }}
                          placeholder="e.g., Monthly Membership"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={plan.type || "monthly"}
                          onValueChange={(value) => {
                            const newPlans = [...gymPlans];
                            newPlans[index].type = value as
                              | "daily"
                              | "weekly"
                              | "monthly"
                              | "yearly"
                              | "custom";
                            setGymPlans(newPlans);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={plan.description || ""}
                        onChange={(e) => {
                          const newPlans = [...gymPlans];
                          newPlans[index].description = e.target.value;
                          setGymPlans(newPlans);
                        }}
                        placeholder="Describe what's included in this plan"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Duration (days)</Label>
                        <Input
                          type="number"
                          value={plan.durationInDays || 30}
                          onChange={(e) => {
                            const newPlans = [...gymPlans];
                            newPlans[index].durationInDays =
                              parseInt(e.target.value) || 30;
                            setGymPlans(newPlans);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cost *</Label>
                        <Input
                          type="number"
                          value={plan.cost || 0}
                          onChange={(e) => {
                            const newPlans = [...gymPlans];
                            newPlans[index].cost =
                              parseFloat(e.target.value) || 0;
                            setGymPlans(newPlans);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select
                          value={plan.currency || "INR"}
                          onValueChange={(value) => {
                            const newPlans = [...gymPlans];
                            newPlans[index].currency = value;
                            setGymPlans(newPlans);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Discount Amount</Label>
                        <Input
                          type="number"
                          value={plan.discount?.amount || 0}
                          onChange={(e) => {
                            const newPlans = [...gymPlans];
                            if (!newPlans[index].discount) {
                              newPlans[index].discount = {
                                amount: 0,
                                type: "percentage",
                                validUntil: "",
                              };
                            }
                            newPlans[index].discount!.amount =
                              parseFloat(e.target.value) || 0;
                            setGymPlans(newPlans);
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <Select
                          value={plan.discount?.type || "percentage"}
                          onValueChange={(value) => {
                            const newPlans = [...gymPlans];
                            if (!newPlans[index].discount) {
                              newPlans[index].discount = {
                                amount: 0,
                                type: "percentage",
                                validUntil: "",
                              };
                            }
                            newPlans[index].discount!.type = value as
                              | "percentage"
                              | "fixed";
                            setGymPlans(newPlans);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Features (comma separated)</Label>
                      <Input
                        value={
                          Array.isArray(plan.features)
                            ? plan.features.join(", ")
                            : ""
                        }
                        onChange={(e) => {
                          const newPlans = [...gymPlans];
                          newPlans[index].features = e.target.value
                            .split(",")
                            .map((f) => f.trim())
                            .filter(Boolean);
                          setGymPlans(newPlans);
                        }}
                        placeholder="e.g., Access to all equipment, Personal trainer, Locker"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={plan.isActive !== false}
                          onChange={(e) => {
                            const newPlans = [...gymPlans];
                            newPlans[index].isActive = e.target.checked;
                            setGymPlans(newPlans);
                          }}
                          className="rounded"
                        />
                        <Label>Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={plan.isRecurring || false}
                          onChange={(e) => {
                            const newPlans = [...gymPlans];
                            newPlans[index].isRecurring = e.target.checked;
                            setGymPlans(newPlans);
                          }}
                          className="rounded"
                        />
                        <Label>Recurring</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setGymPlans([
                    ...gymPlans,
                    {
                      name: "",
                      description: "",
                      type: "monthly",
                      durationInDays: 30,
                      cost: 0,
                      currency: "INR",
                      discount: {
                        amount: 0,
                        type: "percentage",
                        validUntil: "",
                      },
                      isActive: true,
                      isRecurring: false,
                      features: [],
                      startDate: "",
                      endDate: "",
                    },
                  ]);
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Plan
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">
                {mode === "edit" ? "Manage Gym Images" : "Upload Gym Images"}
              </h3>
              <p className="text-gray-600">
                {mode === "edit"
                  ? "View existing images and add new ones"
                  : "Add photos to showcase your gym"}
              </p>
            </div>

            {/* Show existing images in edit mode */}
            {mode === "edit" &&
              editGym?.pictures &&
              editGym.pictures.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">
                      Existing Images ({editGym.pictures.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {editGym.pictures.map((pictureId, index) => (
                        <div
                          key={`existing-${index}`}
                          className="relative group"
                        >
                          <div className="aspect-square rounded-lg overflow-hidden border relative">
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "production" ? "http://api.neyofit.in/api/v1" : "http://localhost:5001/api/v1")}/gym-pictures/${pictureId}/image`}
                              alt={`Existing image ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.jpg";
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeExistingImage(pictureId)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    setCoverImageFromExisting(pictureId)
                                  }
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {existingCoverImageId === pictureId && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-yellow-500 text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  Cover
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <Input
                              placeholder="Add caption..."
                              value={existingImageCaptions[pictureId] || ""}
                              onChange={(e) =>
                                updateExistingImageCaption(
                                  pictureId,
                                  e.target.value
                                )
                              }
                              className="text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Add New Images</h4>
                  </div>
                </div>
              )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Upload images
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </span>
                  </Label>
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e.target.files)}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-2">
                      <Input
                        value={imageCaptions[index] || ""}
                        onChange={(e) => {
                          const newCaptions = [...imageCaptions];
                          newCaptions[index] = e.target.value;
                          setImageCaptions(newCaptions);
                        }}
                        placeholder="Caption (optional)"
                        className="text-sm"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={coverImageIndex === index}
                          onChange={() => setCoverImage(index)}
                          className="rounded"
                        />
                        <Label className="text-sm">Cover Image</Label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium">Review & Publish</h3>
              <p className="text-gray-600">
                Review your gym details before publishing
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{gymData.name}</CardTitle>
                <CardDescription>{gymData.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  {selectedLocation && (
                    <div className="text-sm text-gray-600">
                      {selectedLocation.name} - {selectedLocation.address.city}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Contact</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    {gymData.contact.phone && (
                      <div>Phone: {gymData.contact.phone}</div>
                    )}
                    {gymData.contact.email && (
                      <div>Email: {gymData.contact.email}</div>
                    )}
                    {gymData.contact.website && (
                      <div>Website: {gymData.contact.website}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Price Range</h4>
                  <Badge variant="outline" className="capitalize">
                    {gymData.priceRange}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Availability</h4>
                  <div className="text-sm text-gray-600">
                    {Object.entries(openingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{day}:</span>
                        <span>
                          {hours.isClosed
                            ? "Closed"
                            : hours.slots && hours.slots.length > 0
                            ? `${hours.slots.length} slot${
                                hours.slots.length !== 1 ? "s" : ""
                              }`
                            : "No slots"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Gym Plans</h4>
                  <div className="text-sm text-gray-600">
                    {
                      gymPlans.filter(
                        (plan) => plan.name && plan.name.trim() !== ""
                      ).length
                    }{" "}
                    plan
                    {gymPlans.filter(
                      (plan) => plan.name && plan.name.trim() !== ""
                    ).length !== 1
                      ? "s"
                      : ""}{" "}
                    configured
                  </div>
                  {gymPlans.filter(
                    (plan) => plan.name && plan.name.trim() !== ""
                  ).length > 0 && (
                    <div className="mt-2 space-y-2">
                      {gymPlans
                        .filter((plan) => plan.name && plan.name.trim() !== "")
                        .map((plan, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <div className="font-medium text-sm">
                                {plan.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {plan.type} • {plan.cost} {plan.currency}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {plan.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Images</h4>
                  <div className="text-sm text-gray-600">
                    {mode === "edit" &&
                    editGym?.pictures &&
                    editGym.pictures.length > 0 ? (
                      <>
                        {editGym.pictures.length} existing image
                        {editGym.pictures.length !== 1 ? "s" : ""}
                        {selectedImages.length > 0 && (
                          <>
                            {" "}
                            + {selectedImages.length} new image
                            {selectedImages.length !== 1 ? "s" : ""}
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {selectedImages.length} image
                        {selectedImages.length !== 1 ? "s" : ""} selected
                      </>
                    )}
                    {coverImageIndex !== null && (
                      <span className="ml-2 text-green-600">
                        • Cover image set
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Indicators */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index < currentStep
                    ? "bg-green-100 text-green-700"
                    : index === currentStep
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block w-12 lg:w-20 h-0.5 mx-1 ${
                    index < currentStep ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
        <p className="text-sm text-muted-foreground mt-2">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert variant="destructive" className="mb-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-3 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {steps[currentStep].icon}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription className="text-sm">
            {steps[currentStep].description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button onClick={handleNext} disabled={!isStepValid() || loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {currentStep === 0
                ? "Creating..."
                : currentStep === 1
                ? "Saving slots..."
                : currentStep === 2
                ? "Saving plans..."
                : currentStep === 3
                ? "Uploading images..."
                : currentStep === 4
                ? "Publishing..."
                : "Loading..."}
            </>
          ) : (
            <>
              {currentStep === steps.length - 1
                ? mode === "edit"
                  ? "Update Gym"
                  : "Publish Gym"
                : "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
