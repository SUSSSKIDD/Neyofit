"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Pencil,
  Search,
  User as UserIcon,
  IndianRupee,
  MapPin,
  Wrench,
} from "lucide-react";
import { apiService, User, Location, PlatformSettingsData } from "@/lib/api";
import { toast } from "sonner";

// ────────────────────────────────────────
// Indian States list for Location form
// ────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const emptyLocationForm = {
  name: "",
  street: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",
  latitude: "",
  longitude: "",
};

interface Facility {
  _id: string;
  name: string;
  description?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Platform Settings</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <UserIcon className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-2">
            <IndianRupee className="h-4 w-4" />
            Commission & Payouts
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="facilities" className="gap-2">
            <Wrench className="h-4 w-4" />
            Facilities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="commission">
          <CommissionTab />
        </TabsContent>
        <TabsContent value="locations">
          <LocationsTab />
        </TabsContent>
        <TabsContent value="facilities">
          <FacilitiesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ────────────────────────────────────────
// Profile Tab
// ────────────────────────────────────────
function ProfileTab() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await apiService.verifyToken();
        if (response.data) {
          const u = response.data.user;
          setUser(u);
          setFormData({ name: u.name || "", phone: u.phone || "" });
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const response = await apiService.updateUserProfile(user._id, {
        name: formData.name,
        phone: formData.phone,
      });
      if (response.data) {
        toast.success("Profile updated successfully");
        setUser(response.data);
      } else {
        toast.error(response.error || "Failed to update profile");
      }
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Profile</CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="settingsName">Name</Label>
          <Input
            id="settingsName"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settingsPhone">Phone</Label>
          <Input
            id="settingsPhone"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+91 9876543210"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────
// Commission & Payouts Tab
// ────────────────────────────────────────
function CommissionTab() {
  const [settingsForm, setSettingsForm] = useState({
    defaultCommissionRate: 15,
    defaultPayoutSchedule: "monthly" as "weekly" | "biweekly" | "monthly",
    minimumPayoutAmount: 500,
    timeFormat: "24h" as "12h" | "24h",
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await apiService.getPlatformSettings();
        if (response.data) {
          setSettingsForm({
            defaultCommissionRate: response.data.defaultCommissionRate,
            defaultPayoutSchedule: response.data.defaultPayoutSchedule,
            minimumPayoutAmount: response.data.minimumPayoutAmount,
            timeFormat: response.data.timeFormat || "24h",
          });
        }
      } catch {
        toast.error("Failed to load platform settings");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await apiService.updatePlatformSettings(settingsForm);
      if (response.success) {
        toast.success("Platform settings updated");
      } else {
        toast.error(response.message || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission & Payout Settings</CardTitle>
        <CardDescription>Configure default commission rates and payout rules</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="commissionRate">Default Commission Rate (%)</Label>
          <Input
            id="commissionRate"
            type="number"
            min={0}
            max={100}
            value={settingsForm.defaultCommissionRate}
            onChange={(e) =>
              setSettingsForm((f) => ({ ...f, defaultCommissionRate: Number(e.target.value) }))
            }
          />
          <p className="text-xs text-muted-foreground">Applied to all gyms without a custom rate</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="payoutSchedule">Default Payout Schedule</Label>
          <select
            id="payoutSchedule"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={settingsForm.defaultPayoutSchedule}
            onChange={(e) =>
              setSettingsForm((f) => ({
                ...f,
                defaultPayoutSchedule: e.target.value as "weekly" | "biweekly" | "monthly",
              }))
            }
          >
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minPayout">Minimum Payout Amount (INR)</Label>
          <Input
            id="minPayout"
            type="number"
            min={0}
            value={settingsForm.minimumPayoutAmount}
            onChange={(e) =>
              setSettingsForm((f) => ({ ...f, minimumPayoutAmount: Number(e.target.value) }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeFormat">Time Format</Label>
          <select
            id="timeFormat"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={settingsForm.timeFormat}
            onChange={(e) =>
              setSettingsForm((f) => ({
                ...f,
                timeFormat: e.target.value as "12h" | "24h",
              }))
            }
          >
            <option value="12h">12 Hour (AM/PM)</option>
            <option value="24h">24 Hour</option>
          </select>
          <p className="text-xs text-muted-foreground">Applied across the platform for displaying time slots</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────
// Locations Tab
// ────────────────────────────────────────
function LocationsTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(emptyLocationForm);
  const [editFormData, setEditFormData] = useState(emptyLocationForm);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getLocations({ page, limit: 20, search: search || undefined });
      if (response.data?.locations) {
        setLocations(response.data.locations);
        setTotalPages(response.data.pages || 1);
        setTotal(response.data.total || 0);
      } else if (Array.isArray(response.data)) {
        setLocations(response.data);
        setTotalPages(1);
        setTotal(response.data.length);
      } else if (Array.isArray(response)) {
        setLocations(response as unknown as Location[]);
        setTotalPages(1);
      }
    } catch {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLocations(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchLocations]);

  const handleCreate = async () => {
    if (!formData.name || !formData.city || !formData.state) {
      toast.error("Please fill in name, city, and state");
      return;
    }
    try {
      setCreating(true);
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (formData.latitude && isNaN(lat)) { toast.error("Invalid latitude"); return; }
      if (formData.longitude && isNaN(lng)) { toast.error("Invalid longitude"); return; }
      const response = await apiService.createLocation({
        name: formData.name,
        address: { street: formData.street, city: formData.city, state: formData.state, pinCode: formData.pinCode, country: formData.country },
        latitude: lat || 0,
        longitude: lng || 0,
      });
      if (response.data || !(response as any).error) {
        toast.success("Location created");
        setDialogOpen(false);
        setFormData(emptyLocationForm);
        fetchLocations();
      } else {
        toast.error((response as any).error || "Failed to create location");
      }
    } catch {
      toast.error("Failed to create location");
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (loc: Location) => {
    setEditLocation(loc);
    const coords = loc.coordinates?.coordinates;
    setEditFormData({
      name: loc.name,
      street: loc.address?.street || "",
      city: loc.address?.city || "",
      state: loc.address?.state || "",
      pinCode: loc.address?.pinCode || "",
      country: loc.address?.country || "India",
      latitude: coords?.[1]?.toString() || "",
      longitude: coords?.[0]?.toString() || "",
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editLocation) return;
    try {
      setSaving(true);
      await apiService.updateLocation(editLocation._id, {
        name: editFormData.name,
        address: { street: editFormData.street, city: editFormData.city, state: editFormData.state, pinCode: editFormData.pinCode, country: editFormData.country },
        latitude: parseFloat(editFormData.latitude) || undefined,
        longitude: parseFloat(editFormData.longitude) || undefined,
      });
      toast.success("Location updated");
      setEditDialogOpen(false);
      setEditLocation(null);
      fetchLocations();
    } catch {
      toast.error("Failed to update location");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;
    try {
      setDeleting(locationToDelete._id);
      await apiService.deleteLocation(locationToDelete._id);
      toast.success("Location deleted");
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch {
      toast.error("Failed to delete location");
    } finally {
      setDeleting(null);
    }
  };

  const LocationForm = ({
    data,
    setData,
  }: {
    data: typeof emptyLocationForm;
    setData: React.Dispatch<React.SetStateAction<typeof emptyLocationForm>>;
  }) => (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input value={data.name} onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Location name" />
      </div>
      <div className="space-y-2">
        <Label>Street</Label>
        <Input value={data.street} onChange={(e) => setData((prev) => ({ ...prev, street: e.target.value }))} placeholder="Street address" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>City *</Label>
          <Input value={data.city} onChange={(e) => setData((prev) => ({ ...prev, city: e.target.value }))} placeholder="City" />
        </div>
        <div className="space-y-2">
          <Label>State *</Label>
          <Select value={data.state} onValueChange={(val) => setData((prev) => ({ ...prev, state: val }))}>
            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Pin Code</Label>
          <Input value={data.pinCode} onChange={(e) => setData((prev) => ({ ...prev, pinCode: e.target.value }))} placeholder="110001" />
        </div>
        <div className="space-y-2">
          <Label>Country</Label>
          <Input value={data.country} disabled />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input type="number" step="any" value={data.latitude} onChange={(e) => setData((prev) => ({ ...prev, latitude: e.target.value }))} placeholder="28.6139" />
        </div>
        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input type="number" step="any" value={data.longitude} onChange={(e) => setData((prev) => ({ ...prev, longitude: e.target.value }))} placeholder="77.2090" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Locations</CardTitle>
              <CardDescription>{total} total locations</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Location</DialogTitle>
                    <DialogDescription>Create a new location for gym assignment.</DialogDescription>
                  </DialogHeader>
                  <LocationForm data={formData} setData={setFormData} />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={creating}>
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Location
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : locations.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No locations found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Pin Code</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((loc) => {
                  const coords = loc.coordinates?.coordinates;
                  return (
                    <TableRow key={loc._id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell>{loc.address?.city || "-"}</TableCell>
                      <TableCell>{loc.address?.state || "-"}</TableCell>
                      <TableCell>{loc.address?.pinCode || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {coords ? `${coords[1]?.toFixed(4)}, ${coords[0]?.toFixed(4)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(loc)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setLocationToDelete(loc); setDeleteDialogOpen(true); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>Update location details.</DialogDescription>
          </DialogHeader>
          <LocationForm data={editFormData} setData={setEditFormData} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{locationToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting === locationToDelete?._id}>
              {deleting === locationToDelete?._id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ────────────────────────────────────────
// Facilities Tab
// ────────────────────────────────────────
function FacilitiesTab() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState<Facility | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFacility, setEditFacility] = useState<Facility | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await apiService.getGymFacilities();
      const data = response.data || (response as any).facilities || [];
      if (Array.isArray(data)) setFacilities(data);
    } catch {
      toast.error("Failed to load facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) { toast.error("Facility name is required"); return; }
    try {
      setCreating(true);
      const response = await apiService.createGymFacility({ name: formData.name, description: formData.description || undefined });
      const created = response.data || (response as any).facility;
      if (created) {
        toast.success("Facility created");
        setDialogOpen(false);
        setFormData({ name: "", description: "" });
        fetchFacilities();
      } else {
        toast.error(response.error || "Failed to create facility");
      }
    } catch {
      toast.error("Failed to create facility");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!facilityToDelete) return;
    try {
      setDeleting(facilityToDelete._id);
      await apiService.deleteGymFacility(facilityToDelete._id);
      toast.success("Facility deleted");
      setDeleteDialogOpen(false);
      setFacilityToDelete(null);
      fetchFacilities();
    } catch {
      toast.error("Failed to delete facility");
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (facility: Facility) => {
    setEditFacility(facility);
    setEditName(facility.name);
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editFacility || !editName.trim()) return;
    try {
      setSaving(true);
      await apiService.updateGymFacility(editFacility._id, { name: editName.trim() });
      toast.success("Facility updated");
      setEditDialogOpen(false);
      setEditFacility(null);
      fetchFacilities();
    } catch {
      toast.error("Failed to update facility");
    } finally {
      setSaving(false);
    }
  };

  const filteredFacilities = facilities.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Facilities</CardTitle>
              <CardDescription>{facilities.length} total facilities</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search facilities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Facility
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Facility</DialogTitle>
                    <DialogDescription>Create a new gym facility option.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="facilityName">Name *</Label>
                      <Input
                        id="facilityName"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Swimming Pool"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="facilityDesc">Description</Label>
                      <Input
                        id="facilityDesc"
                        value={formData.description}
                        onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Optional description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={creating}>
                      {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {search ? "No facilities match your search" : "No facilities found. Add your first facility."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacilities.map((facility) => (
                  <TableRow key={facility._id}>
                    <TableCell className="font-medium">{facility.name}</TableCell>
                    <TableCell className="text-muted-foreground">{facility.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(facility)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setFacilityToDelete(facility); setDeleteDialogOpen(true); }}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Facility</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Facility</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{facilityToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting === facilityToDelete?._id}>
              {deleting === facilityToDelete?._id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
