"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  ArrowLeft,
  Save,
  CreditCard,
  Image as ImageIcon,
  Info,
  ToggleLeft,
  ToggleRight,
  Eye,
  ExternalLink,
} from "lucide-react";
import { apiService, Gym, SubscriptionListing } from "@/lib/api";
import GymCreationWizard from "@/components/admin/gym-creation-wizard";
import Link from "next/link";
import { toast } from "sonner";

interface PlanWithGym extends Omit<SubscriptionListing, "gymId"> {
  gymId: string | { _id: string; name: string };
}

export default function GymDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.id as string;

  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useWizard, setUseWizard] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Plans state
  const [plans, setPlans] = useState<PlanWithGym[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [togglingPlan, setTogglingPlan] = useState<string | null>(null);

  // Pictures state
  const [pictures, setPictures] = useState<Array<{ _id: string; gymId: string; filePath: string; fileName: string; isCover?: boolean }>>([]);
  const [picturesLoading, setPicturesLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contactPhone: "",
    contactEmail: "",
    contactWebsite: "",
    priceRange: "mid-range" as "budget" | "mid-range" | "premium",
    status: "draft" as "draft" | "published" | "archived",
  });

  useEffect(() => {
    fetchGym();
  }, [gymId]);

  useEffect(() => {
    if (activeTab === "plans") fetchPlans();
    if (activeTab === "images") fetchPictures();
  }, [activeTab, gymId]);

  const fetchGym = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGymById(gymId);
      if (response.data) {
        const g = response.data;
        setGym(g);
        setFormData({
          name: g.name || "",
          description: g.description || "",
          contactPhone: g.contact?.phone || "",
          contactEmail: g.contact?.email || "",
          contactWebsite: g.contact?.website || "",
          priceRange: g.priceRange || "mid-range",
          status: g.status || "draft",
        });
      }
    } catch {
      toast.error("Failed to load gym details");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await apiService.getSubscriptionListings({ gymId, limit: 100 });
      if (response.data) {
        setPlans((response.data.subscriptions || []) as PlanWithGym[]);
      }
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setPlansLoading(false);
    }
  };

  const fetchPictures = async () => {
    try {
      setPicturesLoading(true);
      const response = await apiService.getGymPictures(gymId);
      if (response.data) {
        setPictures(response.data);
      }
    } catch {
      toast.error("Failed to load pictures");
    } finally {
      setPicturesLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await apiService.updateGym(gymId, {
        name: formData.name,
        description: formData.description,
        contact: {
          phone: formData.contactPhone,
          email: formData.contactEmail,
          website: formData.contactWebsite,
        },
        priceRange: formData.priceRange,
      });

      if (formData.status !== gym?.status) {
        await apiService.updateGymStatus(gymId, formData.status);
      }

      toast.success("Gym updated successfully");
      fetchGym();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update gym");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlan = async (plan: PlanWithGym) => {
    try {
      setTogglingPlan(plan._id);
      await apiService.updateSubscriptionListing(plan._id, { isActive: !plan.isActive });
      toast.success(`Plan ${plan.isActive ? "deactivated" : "activated"}`);
      fetchPlans();
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setTogglingPlan(null);
    }
  };

  const handleWizardComplete = () => {
    toast.success("Gym updated successfully!");
    setUseWizard(false);
    fetchGym();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Gym not found</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/platform/gyms">Back to Gyms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (useWizard) {
    return (
      <div className="p-6">
        <GymCreationWizard
          onComplete={handleWizardComplete}
          onCancel={() => setUseWizard(false)}
          editGym={gym}
          mode="edit"
        />
      </div>
    );
  }

  const getOwnerName = () => {
    if (!gym.ownerId) return "Unassigned";
    if (typeof gym.ownerId === "object" && "name" in (gym.ownerId as any)) {
      return (gym.ownerId as any).name;
    }
    return "-";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/platform/gyms"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{gym.name}</h1>
              <Badge variant={gym.status === "published" ? "default" : gym.status === "archived" ? "destructive" : "secondary"}>
                {gym.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Owner: {getOwnerName()} &middot; Plans: {gym.subscriptionListings?.length || 0} &middot; Rating: {gym.rating ?? "—"}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setUseWizard(true)}>
          Full Edit Wizard
        </Button>
      </div>

      {/* Tabs: Details / Plans / Images */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details" className="gap-2">
            <Info className="h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Images
          </TabsTrigger>
        </TabsList>

        {/* ── Details Tab ── */}
        <TabsContent value="details">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update gym name and description</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Gym Name</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priceRange">Price Range</Label>
                  <Select value={formData.priceRange} onValueChange={(val) => setFormData((prev) => ({ ...prev, priceRange: val as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="mid-range">Mid-Range</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Update gym contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone</Label>
                  <Input id="contactPhone" value={formData.contactPhone} onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactWebsite">Website</Label>
                  <Input id="contactWebsite" value={formData.contactWebsite} onChange={(e) => setFormData((prev) => ({ ...prev, contactWebsite: e.target.value }))} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
                <CardDescription>Control gym visibility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData((prev) => ({ ...prev, status: val as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>Gym location details</CardDescription>
              </CardHeader>
              <CardContent>
                {gym.location ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{gym.location.name}</p>
                    <p className="text-muted-foreground">{gym.location.address?.street}</p>
                    <p className="text-muted-foreground">{gym.location.address?.city}, {gym.location.address?.state} {gym.location.address?.pinCode}</p>
                    <p className="text-muted-foreground">{gym.location.address?.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No location assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/platform/gyms">Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* ── Plans Tab ── */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Subscription Plans</CardTitle>
                  <CardDescription>
                    {plans.length} plan{plans.length !== 1 ? "s" : ""} for this gym
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setUseWizard(true)}>
                  Manage via Wizard
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
                </div>
              ) : plans.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No plans configured yet. Use the wizard to add plans.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            {plan.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">{plan.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {plan.type === "custom" ? plan.customTypeText || "Custom" : plan.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{plan.durationInDays} days</TableCell>
                        <TableCell className="font-medium">
                          {plan.currency} {plan.cost.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {plan.discount && plan.discount.amount > 0
                            ? `${plan.discount.amount}${plan.discount.type === "percentage" ? "%" : ""} off`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={plan.isActive ? "default" : "secondary"}>
                            {plan.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePlan(plan)}
                            disabled={togglingPlan === plan._id}
                            title={plan.isActive ? "Deactivate" : "Activate"}
                          >
                            {togglingPlan === plan._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : plan.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Images Tab ── */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gym Images</CardTitle>
                  <CardDescription>{pictures.length} image{pictures.length !== 1 ? "s" : ""}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setUseWizard(true)}>
                  Manage via Wizard
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {picturesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (<Skeleton key={i} className="aspect-square rounded-lg" />))}
                </div>
              ) : pictures.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No images uploaded. Use the wizard to add images.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {pictures.map((pic) => (
                    <div key={pic._id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "production" ? "http://api.neyofit.in/api/v1" : "http://localhost:5001/api/v1")}/gym-pictures/${pic._id}/image`}
                          alt={pic.fileName}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = "/placeholder.jpg"; }}
                        />
                      </div>
                      {pic.isCover && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white text-xs">Cover</Badge>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground truncate">{pic.fileName}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
