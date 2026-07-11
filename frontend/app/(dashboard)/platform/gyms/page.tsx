"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { apiService, Gym } from "@/lib/api";
import Link from "next/link";
import { toast } from "sonner";

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gymToDelete, setGymToDelete] = useState<Gym | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchGyms = useCallback(async () => {
    try {
      setLoading(true);
      const params: { page: number; limit: number; status?: string; search?: string } = {
        page,
        limit: 20,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (search) params.search = search;

      const response = await apiService.getGyms(params);
      if (response.data) {
        setGyms(response.data.gyms || []);
        setTotalPages(response.data.pages || 1);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      toast.error("Failed to load gyms");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchGyms(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchGyms]);

  const handleStatusToggle = async (gym: Gym) => {
    const newStatus = gym.status === "published" ? "draft" : "published";
    try {
      setActionLoading(gym._id);
      const result = await apiService.updateGymStatus(gym._id, newStatus);
      if (result.success) {
        toast.success(`Gym ${newStatus === "published" ? "published" : "unpublished"} successfully`);
        fetchGyms();
      } else {
        toast.error(result.error || "Failed to update gym status");
      }
    } catch (error) {
      toast.error("Failed to update gym status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!gymToDelete) return;
    try {
      setActionLoading(gymToDelete._id);
      await apiService.deleteGym(gymToDelete._id);
      toast.success("Gym deleted successfully");
      setDeleteDialogOpen(false);
      setGymToDelete(null);
      fetchGyms();
    } catch (error) {
      toast.error("Failed to delete gym");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default" as const;
      case "draft":
        return "secondary" as const;
      case "archived":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getOwnerName = (gym: Gym) => {
    if (!gym.ownerId) return "-";
    if (typeof gym.ownerId === "object" && "name" in (gym.ownerId as any)) {
      return (gym.ownerId as any).name;
    }
    return "-";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gym Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total gyms</p>
        </div>
        <Button asChild>
          <Link href="/platform/gyms/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Gym
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Gyms</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search gyms..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : gyms.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No gyms found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Facilities</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gyms.map((gym) => (
                  <TableRow key={gym._id}>
                    <TableCell className="font-medium">{gym.name}</TableCell>
                    <TableCell className="text-sm">{getOwnerName(gym)}</TableCell>
                    <TableCell>
                      {gym.location
                        ? `${gym.location.address?.city || ""}, ${gym.location.address?.state || ""}`
                        : "-"}
                    </TableCell>
                    <TableCell>{gym.facilities?.length || 0}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(gym.status)}>
                        {gym.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{gym.rating ?? "-"}</TableCell>
                    <TableCell>
                      {new Date(gym.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/platform/gyms/${gym._id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/platform/gyms/${gym._id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusToggle(gym)}
                          disabled={actionLoading === gym._id}
                          title={gym.status === "published" ? "Unpublish" : "Publish"}
                        >
                          {actionLoading === gym._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setGymToDelete(gym);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gym</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{gymToDelete?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === gymToDelete?._id}
            >
              {actionLoading === gymToDelete?._id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
