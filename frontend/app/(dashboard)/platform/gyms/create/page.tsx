"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CreditCard,
  Image as ImageIcon,
  CheckCircle,
  Upload,
  X,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
  Building2,
  Search,
} from "lucide-react";
import {
  apiService,
  Gym,
  Location,
  User,
  TimeSlot,
  DaySchedule,
  OpeningHours,
  createDefaultTimeSlot,
  SubscriptionListing,
} from "@/lib/api";
import LocationSearch from "@/components/admin/location-search";
import { toast } from "sonner";

const STEPS = [
  { id: "basics", title: "Basics & Owner", icon: Building2, desc: "Name, location, and assign owner" },
  { id: "slots", title: "Availability", icon: Clock, desc: "Opening hours and time slots" },
  { id: "plans", title: "Plans", icon: CreditCard, desc: "Subscription plans and pricing" },
  { id: "images", title: "Images", icon: ImageIcon, desc: "Upload gym photos" },
  { id: "review", title: "Review", icon: CheckCircle, desc: "Review and publish" },
];

export default function CreateGymPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1: Basics ──
  const [gymData, setGymData] = useState({
    name: "",
    description: "",
    locationId: "",
    phone: "",
    email: "",
    website: "",
    priceRange: "mid-range" as "budget" | "mid-range" | "premium",
    ownerId: "",
  });
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [owners, setOwners] = useState<User[]>([]);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [draftGymId, setDraftGymId] = useState<string | null>(null);

  // ── Step 2: Slots ──
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    tuesday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    wednesday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    thursday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    friday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    saturday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
    sunday: { isClosed: false, slots: [createDefaultTimeSlot("Morning")] },
  });

  // ── Step 3: Plans ──
  const [gymPlans, setGymPlans] = useState<Partial<SubscriptionListing>[]>([
    { name: "", type: "monthly", durationInDays: 30, cost: 0, currency: "INR", isActive: true, features: [], description: "" },
  ]);

  // ── Step 4: Images ──
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState<number | null>(null);

  // Fetch gym owners for assignment
  useEffect(() => {
    (async () => {
      try {
        const res = await apiService.getUsers({ userType: "gym", limit: 100 });
        if (res.success && res.data) setOwners(res.data);
      } catch { /* ignore */ }
    })();
  }, []);

  const filteredOwners = ownerSearch
    ? owners.filter((o) =>
        o.name.toLowerCase().includes(ownerSearch.toLowerCase()) ||
        o.email.toLowerCase().includes(ownerSearch.toLowerCase())
      )
    : owners;

  // ── Navigation ──
  const canProceed = () => {
    if (step === 0) return gymData.name.trim() !== "" && gymData.locationId !== "";
    return true;
  };

  const handleNext = async () => {
    setError(null);

    if (step === 0) {
      // Create draft gym
      setLoading(true);
      try {
        const payload: any = {
          name: gymData.name,
          description: gymData.description,
          locationId: gymData.locationId,
          contact: { phone: gymData.phone, email: gymData.email, website: gymData.website },
          priceRange: gymData.priceRange,
        };
        if (gymData.ownerId) payload.ownerId = gymData.ownerId;

        const response = await apiService.createGymDraft(payload);
        if (response.success && response.gym) {
          setDraftGymId(response.gym._id);
          setStep(1);
        } else {
          setError(response.error || "Failed to create gym");
        }
      } catch {
        setError("Failed to create gym");
      } finally {
        setLoading(false);
      }
    } else if (step === 1) {
      // Save slots
      if (!draftGymId) return;
      setLoading(true);
      try {
        const promises = Object.entries(openingHours).map(([day, schedule]) => {
          const s = schedule as DaySchedule;
          return apiService.createOrUpdateGymSlots(
            draftGymId,
            day,
            s.slots.map((slot: TimeSlot) => ({
              id: slot.id,
              name: slot.name,
              startTime: slot.startTime,
              endTime: slot.endTime,
              maxCapacity: 10,
              price: 0,
              isActive: slot.isActive !== false,
            })),
            s.isClosed
          );
        });
        await Promise.all(promises);
        setStep(2);
      } catch {
        setError("Failed to save slots");
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      // Save plans
      if (!draftGymId) return;
      setLoading(true);
      try {
        for (const plan of gymPlans) {
          if (!plan.name?.trim()) continue;
          const res = await apiService.createSubscriptionListing({
            name: plan.name,
            description: plan.description || "",
            type: plan.type || "monthly",
            durationInDays: plan.durationInDays || 30,
            gymId: draftGymId,
            cost: plan.cost || 0,
            currency: plan.currency || "INR",
            isActive: plan.isActive !== false,
            isRecurring: false,
            features: plan.features || [],
          });
          if (res.success && res.created) {
            await apiService.linkSubscriptionToGym(draftGymId, res.created._id);
          }
        }
        setStep(3);
      } catch {
        setError("Failed to save plans");
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      // Upload images
      if (!draftGymId) { setStep(4); return; }
      if (selectedImages.length === 0) { setStep(4); return; }
      setLoading(true);
      try {
        const isCover = selectedImages.map((_, i) => i === coverIndex);
        await apiService.bulkUploadGymPictures(draftGymId, selectedImages, undefined, isCover);
        setStep(4);
      } catch {
        setError("Failed to upload images");
      } finally {
        setLoading(false);
      }
    } else if (step === 4) {
      // Publish
      if (!draftGymId) return;
      setLoading(true);
      try {
        const response = await apiService.updateGymStatus(draftGymId, "published");
        if (response.success) {
          toast.success("Gym created and published!");
          router.push("/platform/gyms");
        } else {
          setError(response.error || "Failed to publish gym");
        }
      } catch {
        setError("Failed to publish gym");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrev = () => setStep((s) => Math.max(0, s - 1));

  const addSlot = (day: keyof OpeningHours) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: [...prev[day].slots, createDefaultTimeSlot(`Slot ${prev[day].slots.length + 1}`)] },
    }));
  };

  const updateSlot = (day: keyof OpeningHours, idx: number, field: keyof TimeSlot, value: string | boolean) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: prev[day].slots.map((s: TimeSlot, i: number) => i === idx ? { ...s, [field]: value } : s) },
    }));
  };

  const removeSlot = (day: keyof OpeningHours, idx: number) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], slots: prev[day].slots.filter((_: TimeSlot, i: number) => i !== idx) },
    }));
  };

  const namedPlansCount = gymPlans.filter((p) => p.name?.trim()).length;
  const selectedOwner = owners.find((o) => o._id === gymData.ownerId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create New Gym</h1>
        <p className="text-muted-foreground">Follow the steps to set up a new gym listing</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i < step ? "bg-green-100 text-green-700" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i < step ? <CheckCircle className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`mx-1 h-px w-6 ${i < step ? "bg-green-400" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-5 w-5" />; })()}
            {STEPS[step].title}
          </CardTitle>
          <CardDescription>{STEPS[step].desc}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ── Step 0: Basics & Owner ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gym Name *</Label>
                  <Input value={gymData.name} onChange={(e) => setGymData((p) => ({ ...p, name: e.target.value }))} placeholder="Enter gym name" />
                </div>
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <Select value={gymData.priceRange} onValueChange={(v) => setGymData((p) => ({ ...p, priceRange: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="mid-range">Mid-Range</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={gymData.description} onChange={(e) => setGymData((p) => ({ ...p, description: e.target.value }))} placeholder="Describe this gym" rows={3} />
              </div>

              <LocationSearch
                onLocationSelect={(loc) => {
                  setSelectedLocation(loc);
                  setGymData((p) => ({ ...p, locationId: loc ? loc._id : "" }));
                }}
                selectedLocation={selectedLocation}
                placeholder="Search for location..."
                label="Location"
                required
                allowCreate
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={gymData.phone} onChange={(e) => setGymData((p) => ({ ...p, phone: e.target.value }))} placeholder="+91..." />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={gymData.email} onChange={(e) => setGymData((p) => ({ ...p, email: e.target.value }))} placeholder="gym@email.com" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={gymData.website} onChange={(e) => setGymData((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                </div>
              </div>

              {/* Owner Assignment */}
              <div className="space-y-3">
                <Label>Assign Gym Owner (optional)</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search gym owners..."
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                {selectedOwner && (
                  <div className="flex items-center gap-2 rounded-lg border p-3 bg-green-50">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{selectedOwner.name}</span>
                    <span className="text-xs text-muted-foreground">({selectedOwner.email})</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setGymData((p) => ({ ...p, ownerId: "" }))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                {!selectedOwner && (ownerSearch || owners.length <= 10) && (
                  <div className="max-h-40 overflow-auto rounded-lg border divide-y">
                    {filteredOwners.slice(0, 8).map((owner) => (
                      <button
                        key={owner._id}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                        onClick={() => { setGymData((p) => ({ ...p, ownerId: owner._id })); setOwnerSearch(""); }}
                      >
                        <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{owner.name}</span>
                        <span className="text-muted-foreground text-xs">{owner.email}</span>
                      </button>
                    ))}
                    {filteredOwners.length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">No gym owners found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 1: Availability ── */}
          {step === 1 && (
            <div className="space-y-4">
              {Object.entries(openingHours).map(([day, schedule]) => (
                <div key={day} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium capitalize">{day}</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={schedule.isClosed} onChange={() =>
                        setOpeningHours((prev) => ({ ...prev, [day]: { ...prev[day as keyof OpeningHours], isClosed: !prev[day as keyof OpeningHours].isClosed } }))
                      } className="rounded" />
                      Closed
                    </label>
                  </div>
                  {!schedule.isClosed && (
                    <div className="space-y-2">
                      {schedule.slots.map((slot: TimeSlot, idx: number) => (
                        <div key={slot.id} className="flex items-center gap-2">
                          <Input className="w-28" value={slot.name} onChange={(e) => updateSlot(day as keyof OpeningHours, idx, "name", e.target.value)} placeholder="Slot" />
                          <Input className="w-28" type="time" value={slot.startTime} onChange={(e) => updateSlot(day as keyof OpeningHours, idx, "startTime", e.target.value)} />
                          <span className="text-muted-foreground">to</span>
                          <Input className="w-28" type="time" value={slot.endTime} onChange={(e) => updateSlot(day as keyof OpeningHours, idx, "endTime", e.target.value)} />
                          <Button variant="ghost" size="sm" onClick={() => removeSlot(day as keyof OpeningHours, idx)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addSlot(day as keyof OpeningHours)}>
                        <Plus className="h-3 w-3 mr-1" /> Add Slot
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Plans ── */}
          {step === 2 && (
            <div className="space-y-4">
              {gymPlans.map((plan, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Plan {i + 1}</span>
                    {gymPlans.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => setGymPlans((p) => p.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Plan Name *</Label>
                      <Input value={plan.name || ""} onChange={(e) => { const np = [...gymPlans]; np[i].name = e.target.value; setGymPlans(np); }} placeholder="Monthly Membership" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={plan.type || "monthly"} onValueChange={(v) => { const np = [...gymPlans]; np[i].type = v as any; setGymPlans(np); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea value={plan.description || ""} onChange={(e) => { const np = [...gymPlans]; np[i].description = e.target.value; setGymPlans(np); }} placeholder="What's included" rows={2} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Duration (days)</Label>
                      <Input type="number" value={plan.durationInDays || 30} onChange={(e) => { const np = [...gymPlans]; np[i].durationInDays = parseInt(e.target.value) || 30; setGymPlans(np); }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price (INR) *</Label>
                      <Input type="number" value={plan.cost || 0} onChange={(e) => { const np = [...gymPlans]; np[i].cost = parseFloat(e.target.value) || 0; setGymPlans(np); }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Features</Label>
                      <Input value={Array.isArray(plan.features) ? plan.features.join(", ") : ""} onChange={(e) => { const np = [...gymPlans]; np[i].features = e.target.value.split(",").map((f) => f.trim()).filter(Boolean); setGymPlans(np); }} placeholder="Feature 1, Feature 2" />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setGymPlans((p) => [...p, { name: "", type: "monthly", durationInDays: 30, cost: 0, currency: "INR", isActive: true, features: [], description: "" }])}>
                <Plus className="h-4 w-4 mr-2" /> Add Another Plan
              </Button>
            </div>
          )}

          {/* ── Step 3: Images ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                <Label htmlFor="img-upload" className="cursor-pointer mt-3 block">
                  <span className="text-sm font-medium">Click to upload images</span>
                  <span className="block text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 10MB each</span>
                </Label>
                <input id="img-upload" type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files) setSelectedImages((p) => [...p, ...Array.from(e.target.files!)]);
                }} />
              </div>
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {selectedImages.map((file, i) => (
                    <div key={i} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button variant="destructive" size="sm" onClick={() => { setSelectedImages((p) => p.filter((_, idx) => idx !== i)); if (coverIndex === i) setCoverIndex(null); }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <label className="flex items-center gap-1 mt-1 text-xs">
                        <input type="radio" name="cover" checked={coverIndex === i} onChange={() => setCoverIndex(i)} />
                        Cover
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Gym Name</span>
                  <p className="font-medium">{gymData.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Price Range</span>
                  <p className="capitalize">{gymData.priceRange}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Location</span>
                  <p>{selectedLocation ? `${selectedLocation.name} — ${selectedLocation.address?.city}` : "—"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Owner</span>
                  <p>{selectedOwner ? selectedOwner.name : "Unassigned"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Plans</span>
                  <p>{namedPlansCount} plan{namedPlansCount !== 1 ? "s" : ""}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Images</span>
                  <p>{selectedImages.length} image{selectedImages.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              {gymData.description && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Description</span>
                  <p className="mt-1">{gymData.description}</p>
                </div>
              )}
              {namedPlansCount > 0 && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Plans</span>
                  {gymPlans.filter((p) => p.name?.trim()).map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded border p-2 text-sm">
                      <div>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2">{p.type} &middot; {p.durationInDays}d</span>
                      </div>
                      <span className="font-medium">INR {(p.cost || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/platform/gyms")}>Cancel</Button>
          {step > 0 && (
            <Button variant="outline" onClick={handlePrev} disabled={loading}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
        </div>
        <Button onClick={handleNext} disabled={!canProceed() || loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {step === 4 ? "Publishing..." : "Saving..."}</>
          ) : (
            <>{step === 4 ? "Publish Gym" : "Next"} <ChevronRight className="h-4 w-4 ml-1" /></>
          )}
        </Button>
      </div>
    </div>
  );
}
