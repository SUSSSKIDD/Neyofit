"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { apiService } from "@/lib/api";
import { Gym, Location, SubscriptionListing } from "@/lib/api";
import GymCreationWizard from "./gym-creation-wizard";
import GymStatusManager from "./gym-status-manager";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Icons
import {
  Plus,
  Dumbbell,
  MapPin,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  Users,
  Star,
  Image as ImageIcon,
  Clock,
  Settings,
  BarChart3,
  TrendingUp,
  Activity,
  Building2,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Archive,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
} from "lucide-react";

interface AdminDashboardRedesignedProps {
  onGymUpdate?: (gym: Gym) => void;
  onRefresh?: () => void;
}

export default function AdminDashboardRedesigned({
  onGymUpdate,
  onRefresh,
}: AdminDashboardRedesignedProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "archived"
  >("all");
  const [showGymWizard, setShowGymWizard] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [wizardMode, setWizardMode] = useState<"create" | "edit">("create");
  const [updatingGym, setUpdatingGym] = useState<string | null>(null);

  // Gym details modal state
  const [selectedGymForView, setSelectedGymForView] = useState<Gym | null>(
    null
  );
  const [showGymDetailsModal, setShowGymDetailsModal] = useState(false);
  const [loadingGymDetails, setLoadingGymDetails] = useState(false);
  const [gymDetails, setGymDetails] = useState<Gym | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalGyms: 0,
    publishedGyms: 0,
    draftGyms: 0,
    archivedGyms: 0,
    totalLocations: 0,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [gymsResponse, locationsResponse] = await Promise.all([
        apiService.getGyms({ limit: 100 }),
        apiService.getLocations({ limit: 100 }),
      ]);

      // Handle both wrapped response and direct array response
      let gymsData: Gym[] = [];
      if (Array.isArray(gymsResponse)) {
        // Direct array response from backend
        gymsData = gymsResponse;
      } else if (gymsResponse.success && gymsResponse.data) {
        // Wrapped response
        gymsData = gymsResponse.data.gyms || [];
      }

      // Handle locations response
      let locationsData: Location[] = [];
      if (Array.isArray(locationsResponse)) {
        locationsData = locationsResponse;
      } else if (locationsResponse.success && locationsResponse.data) {
        locationsData = locationsResponse.data.locations || [];
      }

      if (gymsData.length > 0) {
        setGyms(gymsData);

        // Calculate stats
        const totalGyms = gymsData.length;
        const publishedGyms = gymsData.filter(
          (g) => g.status === "published"
        ).length;
        const draftGyms = gymsData.filter((g) => g.status === "draft").length;
        const archivedGyms = gymsData.filter(
          (g) => g.status === "archived"
        ).length;

        setStats({
          totalGyms,
          publishedGyms,
          draftGyms,
          archivedGyms,
          totalLocations: locationsData.length,
        });
      }

      if (locationsData.length > 0) {
        setLocations(locationsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Fetch full gym details
  const fetchGymDetails = async (gymId: string) => {
    setLoadingGymDetails(true);
    try {
      const token = localStorage.getItem("neyofit_auth_token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "production" ? "http://api.neyofit.in/api/v1" : "http://localhost:5001/api/v1")}/gyms/${gymId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      // Backend returns gym directly, not wrapped in { success, gym }
      if (data && data._id) {
        setGymDetails(data);
      }
    } catch (error) {
      console.error("Error fetching gym details:", error);
    } finally {
      setLoadingGymDetails(false);
    }
  };

  // Handle view gym details
  const handleViewGym = (gym: Gym) => {
    setSelectedGymForView(gym);
    setShowGymDetailsModal(true);
    fetchGymDetails(gym._id);
  };

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAuthenticated && user?.userType !== "superadmin") {
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, authLoading, router, user]);

  // Filter gyms
  const filteredGyms = gyms.filter((gym) => {
    const matchesSearch =
      gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gym.location?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || gym.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle gym status update
  const handleStatusUpdate = async (
    gymId: string,
    newStatus: "draft" | "published" | "archived"
  ) => {
    setUpdatingGym(gymId);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.updateGymStatus(gymId, newStatus);

      if (response.success && response.gym) {
        setGyms((prev) =>
          prev.map((gym) =>
            gym._id === gymId ? { ...gym, status: newStatus } : gym
          )
        );
        setSuccess(`Gym status updated to ${newStatus}`);
        fetchData(); // Refresh the entire data to update stats
      } else {
        setError(response.error || "Failed to update gym status");
      }
    } catch (error) {
      console.error("Error updating gym status:", error);
      setError("Failed to update gym status");
    } finally {
      setUpdatingGym(null);
    }
  };

  // Handle gym deletion
  const handleDeleteGym = async (gym: Gym) => {
    if (
      !confirm(
        `Are you sure you want to delete "${gym.name}"? This action cannot be undone.`
      )
    )
      return;

    try {
      setLoading(true);
      const response = await apiService.deleteGym(gym._id);

      if (response.success) {
        setGyms((prev) => prev.filter((g) => g._id !== gym._id));
        setSuccess("Gym deleted successfully");
        fetchData(); // Refresh the entire data
      } else {
        setError(response.error || "Failed to delete gym");
      }
    } catch (error) {
      console.error("Error deleting gym:", error);
      setError("Failed to delete gym");
    } finally {
      setLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Edit,
        label: "Draft",
      },
      published: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle2,
        label: "Published",
      },
      archived: {
        color: "bg-gray-100 text-gray-800",
        icon: Archive,
        label: "Archived",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Get price range badge
  const getPriceRangeBadge = (priceRange: string) => {
    const priceConfig = {
      budget: { color: "bg-green-100 text-green-800", label: "Budget" },
      "mid-range": { color: "bg-blue-100 text-blue-800", label: "Mid-Range" },
      premium: { color: "bg-purple-100 text-purple-800", label: "Premium" },
    };

    const config =
      priceConfig[priceRange as keyof typeof priceConfig] ||
      priceConfig["mid-range"];

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== "superadmin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Manage gyms, locations, and content
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setEditingGym(null);
                  setWizardMode("create");
                  setShowGymWizard(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start Creating Gym
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Dumbbell className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Gyms
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalGyms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.publishedGyms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Edit className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.draftGyms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Archive className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Archived</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.archivedGyms}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Locations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalLocations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Dumbbell className="mr-2 h-5 w-5" />
                  Gym Management
                </CardTitle>
                <CardDescription>
                  Manage all your gym listings and their status
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search gyms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value: any) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={fetchData}
                  disabled={loading}
                  variant="outline"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-3 text-gray-600">Loading gyms...</span>
              </div>
            ) : filteredGyms.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery || statusFilter !== "all"
                    ? "No gyms found"
                    : "No gyms yet"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first gym"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    onClick={() => {
                      setEditingGym(null);
                      setWizardMode("create");
                      setShowGymWizard(true);
                    }}
                    size="lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Gym
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gym</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price Range</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGyms.map((gym) => (
                      <TableRow
                        key={gym._id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleViewGym(gym)}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-gray-900 flex items-center gap-2">
                              {gym.name}
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {gym.description || "No description"}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {gym.contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {gym.contact.phone}
                                </span>
                              )}
                              {gym.contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {gym.contact.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const location = gym.locationId || gym.location;
                            if (
                              location &&
                              typeof location === "object" &&
                              "name" in location
                            ) {
                              return (
                                <div className="space-y-1">
                                  <div className="font-medium text-gray-900 flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-gray-500" />
                                    {location.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {location.address?.city &&
                                      location.address.city}
                                    {location.address?.city &&
                                      location.address?.state &&
                                      ", "}
                                    {location.address?.state &&
                                      location.address.state}
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <span className="text-sm text-gray-400">
                                No location
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>{getStatusBadge(gym.status)}</TableCell>
                        <TableCell>
                          {getPriceRangeBadge(gym.priceRange || "mid-range")}
                        </TableCell>
                        <TableCell>
                          {gym.rating ? (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="font-medium">{gym.rating}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No rating</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {gym.pictures?.length || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {new Date(gym.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingGym(gym);
                                  setWizardMode("edit");
                                  setShowGymWizard(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {gym.status === "draft" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(gym._id, "published")
                                  }
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {gym.status === "published" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(gym._id, "draft")
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Move to Draft
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusUpdate(gym._id, "archived")
                                }
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteGym(gym)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gym Creation Wizard Modal */}
      <Dialog
        open={showGymWizard}
        onOpenChange={(open) => {
          if (!open) {
            setShowGymWizard(false);
            setEditingGym(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {wizardMode === "edit" ? "Edit Gym" : "Create New Gym"}
            </DialogTitle>
            <DialogDescription>
              {wizardMode === "edit"
                ? "Update gym information and settings"
                : "Create a new gym with all necessary details"}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <GymCreationWizard
              onComplete={(gym) => {
                setSuccess(
                  wizardMode === "edit"
                    ? "Gym updated successfully!"
                    : "Gym created successfully!"
                );
                fetchData();
                setShowGymWizard(false);
                setEditingGym(null);
              }}
              onCancel={() => {
                setShowGymWizard(false);
                setEditingGym(null);
              }}
              editGym={editingGym}
              mode={wizardMode}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Gym Details Modal */}
      <Dialog open={showGymDetailsModal} onOpenChange={setShowGymDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Gym Details
            </DialogTitle>
            <DialogDescription>
              Complete information about {selectedGymForView?.name}
            </DialogDescription>
          </DialogHeader>

          {loadingGymDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-3 text-gray-600">Loading details...</span>
            </div>
          ) : gymDetails ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {gymDetails.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {gymDetails.description || "No description provided"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(gymDetails.status)}
                  {gymDetails.isActive ? (
                    <Badge className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                  )}
                </div>
              </div>

              {/* Location Info */}
              {(gymDetails.locationId || gymDetails.location) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      {(() => {
                        const location =
                          gymDetails.locationId || gymDetails.location;
                        // Check if location is an object (populated) not just an ID string
                        if (
                          location &&
                          typeof location === "object" &&
                          "name" in location
                        ) {
                          return (
                            <>
                              <p className="font-medium">
                                {location.name || "N/A"}
                              </p>
                              {location.address && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {location.address.street && (
                                    <p>{location.address.street}</p>
                                  )}
                                  <p>
                                    {location.address.city}
                                    {location.address.state &&
                                      `, ${location.address.state}`}
                                    {location.address.pinCode &&
                                      ` - ${location.address.pinCode}`}
                                  </p>
                                  {location.address.country && (
                                    <p>{location.address.country}</p>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        }
                        return (
                          <p className="text-sm text-gray-500">
                            Location ID: {location}
                          </p>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gymDetails.contact.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {gymDetails.contact.phone}
                      </span>
                    </div>
                  )}
                  {gymDetails.contact.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {gymDetails.contact.email}
                      </span>
                    </div>
                  )}
                  {gymDetails.contact.website && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a
                        href={gymDetails.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {gymDetails.contact.website}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Price Range</span>
                    </div>
                    {getPriceRangeBadge(gymDetails.priceRange || "mid-range")}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Rating</span>
                    </div>
                    {gymDetails.rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{gymDetails.rating}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        No rating yet
                      </span>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Facilities */}
              {gymDetails.facilities && gymDetails.facilities.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Facilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {gymDetails.facilities.map((facility, index) => {
                        const facilityName =
                          typeof facility === "string"
                            ? facility
                            : facility.name;
                        return (
                          <Badge key={index} variant="outline">
                            {facilityName}
                          </Badge>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Subscription Plans */}
              {gymDetails.subscriptionListings &&
                gymDetails.subscriptionListings.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Subscription Plans
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {gymDetails.subscriptionListings.map((plan) => (
                          <div
                            key={plan._id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{plan.name}</p>
                              <p className="text-sm text-gray-600">
                                {plan.type === "custom"
                                  ? plan.customTypeText
                                  : plan.type}{" "}
                                • {plan.durationInDays} days
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">₹{plan.cost}</p>
                              {plan.isActive ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Images */}
              {gymDetails.pictures && gymDetails.pictures.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Images ({gymDetails.pictures.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {gymDetails.pictures.slice(0, 6).map((pic, index) => (
                        <div
                          key={index}
                          className="aspect-video bg-gray-100 rounded-lg overflow-hidden"
                        >
                          <img
                            src={pic}
                            alt={`Gym ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Gym ID:</span>
                  <p className="font-mono text-xs mt-1">{gymDetails._id}</p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="mt-1">
                    {new Date(gymDetails.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No details available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
