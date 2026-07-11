"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  Archive,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
} from "lucide-react";
import { apiService, Gym } from "@/lib/api";

interface GymStatusManagerProps {
  onGymUpdate?: (gym: Gym) => void;
  onRefresh?: () => void;
}

type GymStatus = "draft" | "published" | "archived";

const statusConfig = {
  draft: {
    label: "Draft",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: EyeOff,
    description: "Not visible to users",
  },
  published: {
    label: "Published",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    description: "Visible to users",
  },
  archived: {
    label: "Archived",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Archive,
    description: "Hidden from users",
  },
};

export default function GymStatusManager({
  onGymUpdate,
  onRefresh,
}: GymStatusManagerProps) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<GymStatus | "all">("all");
  const [updatingGym, setUpdatingGym] = useState<string | null>(null);

  const fetchGyms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getGymsByStatus({
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 50,
      });

      if (response.success && response.data) {
        setGyms(response.data.gyms);
      } else {
        setError(response.error || "Failed to fetch gyms");
      }
    } catch (error) {
      console.error("Error fetching gyms:", error);
      setError("Failed to fetch gyms");
    } finally {
      setLoading(false);
    }
  };

  const updateGymStatus = async (gymId: string, newStatus: GymStatus) => {
    setUpdatingGym(gymId);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.updateGymStatus(gymId, newStatus);

      if (response.success && response.data) {
        setGyms((prev) =>
          prev.map((gym) =>
            gym._id === gymId ? { ...gym, status: newStatus } : gym
          )
        );
        setSuccess(`Gym status updated to ${statusConfig[newStatus].label}`);
        onGymUpdate?.(response.data);
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

  const handleStatusChange = (gymId: string, newStatus: GymStatus) => {
    updateGymStatus(gymId, newStatus);
  };

  const handleRefresh = () => {
    fetchGyms();
    onRefresh?.();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as GymStatus | "all");
  };

  // Fetch gyms when component mounts or status filter changes
  React.useEffect(() => {
    fetchGyms();
  }, [statusFilter]);

  const filteredGyms =
    statusFilter === "all"
      ? gyms
      : gyms.filter((gym) => gym.status === statusFilter);

  const getStatusBadge = (status: GymStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gym Status Management</h2>
          <p className="text-gray-600">Manage gym visibility and status</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filter by status:</span>
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gyms</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Gyms List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading gyms...</span>
        </div>
      ) : filteredGyms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              {statusFilter === "all"
                ? "No gyms found"
                : `No ${statusConfig[
                    statusFilter as GymStatus
                  ]?.label.toLowerCase()} gyms found`}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGyms.map((gym) => (
            <Card key={gym._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{gym.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {gym.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(gym.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gym Details */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">
                      Details
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        Price Range:{" "}
                        <span className="capitalize">{gym.priceRange}</span>
                      </div>
                      {gym.rating && <div>Rating: {gym.rating} ⭐</div>}
                      <div>Pictures: {gym.pictures?.length || 0}</div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">
                      Contact
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {gym.contact.phone && <div>📞 {gym.contact.phone}</div>}
                      {gym.contact.email && <div>✉️ {gym.contact.email}</div>}
                      {gym.contact.website && (
                        <div>🌐 {gym.contact.website}</div>
                      )}
                    </div>
                  </div>

                  {/* Status Management */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">
                      Status
                    </h4>
                    <div className="flex items-center gap-2">
                      <Select
                        value={gym.status}
                        onValueChange={(value) =>
                          handleStatusChange(gym._id, value as GymStatus)
                        }
                        disabled={updatingGym === gym._id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      {updatingGym === gym._id && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {statusConfig[gym.status].description}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {gyms.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                Showing {filteredGyms.length} of {gyms.length} gyms
              </div>
              <div className="flex items-center gap-4">
                {Object.entries(statusConfig).map(([status, config]) => {
                  const count = gyms.filter(
                    (gym) => gym.status === status
                  ).length;
                  return (
                    <div key={status} className="flex items-center gap-1">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          config.color.split(" ")[0]
                        }`}
                      />
                      <span className="text-gray-600">
                        {config.label}: {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
