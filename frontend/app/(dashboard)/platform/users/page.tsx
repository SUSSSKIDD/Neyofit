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
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Search,
  Trash2,
  Eye,
  Building2,
  IndianRupee,
  Users,
  UserCheck,
  UserCircle,
} from "lucide-react";
import { apiService, User, Gym } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

interface OwnerEnrichment {
  gymCount: number;
  revenue: number;
  gyms: Array<{ _id: string; name: string; status: string; revenue: number }>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);

  // Enrichment for gym owners
  const [enrichment, setEnrichment] = useState<Record<string, OwnerEnrichment>>({});

  // Create form
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // Fetch enrichment data for gym owners
  useEffect(() => {
    (async () => {
      try {
        const response = await apiService.getSuperAdminDashboard();
        if (response.data) {
          const dashData = response.data as {
            gyms: Gym[];
            subscriptions: Array<{
              subscriptionListingId?: {
                cost: number;
                gymId?: { _id: string };
              };
              status: string;
            }>;
          };
          const gyms = dashData.gyms || [];
          const subs = dashData.subscriptions || [];

          const gymRevenue: Record<string, number> = {};
          subs
            .filter((s) => s.status === "active" || s.status === "completed")
            .forEach((s) => {
              const gymId = s.subscriptionListingId?.gymId?._id;
              if (gymId) {
                gymRevenue[gymId] = (gymRevenue[gymId] || 0) + (s.subscriptionListingId?.cost || 0);
              }
            });

          const ownerMap: Record<string, OwnerEnrichment> = {};
          gyms.forEach((gym) => {
            const ownerId = typeof gym.ownerId === "object" && gym.ownerId
              ? (gym.ownerId as { _id: string })._id
              : gym.ownerId;
            if (!ownerId || typeof ownerId !== "string") return;
            if (!ownerMap[ownerId]) {
              ownerMap[ownerId] = { gymCount: 0, revenue: 0, gyms: [] };
            }
            const rev = gymRevenue[gym._id] || 0;
            ownerMap[ownerId].gymCount++;
            ownerMap[ownerId].revenue += rev;
            ownerMap[ownerId].gyms.push({
              _id: gym._id,
              name: gym.name,
              status: gym.status,
              revenue: rev,
            });
          });
          setEnrichment(ownerMap);
        }
      } catch {
        // Non-critical
      }
    })();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params: { userType?: string; page: number; limit: number; search?: string } = {
        page,
        limit: 20,
      };
      if (roleFilter !== "all") params.userType = roleFilter;
      if (search) params.search = search;

      const response = await apiService.getUsers(params);
      if (response.success && response.data) {
        setUsers(response.data);
        setTotalPages(response.pagination?.pages || 1);
        setTotal(response.pagination?.total || response.data.length);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleCreateGymOwner = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      setCreating(true);
      const response = await apiService.createGymOwner(formData);
      if (response.data) {
        toast.success("Gym owner created successfully");
        setCreateDialogOpen(false);
        setFormData({ name: "", email: "", phone: "", password: "" });
        fetchUsers();
      } else {
        toast.error(response.error || "Failed to create gym owner");
      }
    } catch {
      toast.error("Failed to create gym owner");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      setToggling(userId);
      await apiService.toggleUserStatus(userId);
      toast.success("User status updated");
      fetchUsers();
    } catch {
      toast.error("Failed to toggle user status");
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      await apiService.deleteUser(userToDelete._id);
      toast.success("User deleted");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  // Client-side status filter
  const displayUsers = statusFilter === "all"
    ? users
    : statusFilter === "active"
    ? users.filter((u) => u.isActive)
    : users.filter((u) => !u.isActive);

  const getRoleBadge = (userType: string) => {
    switch (userType) {
      case "gym":
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Gym Owner</Badge>;
      case "customer":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Customer</Badge>;
      case "superadmin":
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>;
      default:
        return <Badge variant="outline">{userType}</Badge>;
    }
  };

  // Stat cards
  const gymOwnerCount = users.filter((u) => u.userType === "gym").length;
  const customerCount = users.filter((u) => u.userType === "customer").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total users</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Gym Owner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Gym Owner</DialogTitle>
              <DialogDescription>Add a new gym owner account to the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Name *</Label>
                <Input
                  id="ownerName"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email *</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerPhone">Phone</Label>
                <Input
                  id="ownerPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerPassword">Password *</Label>
                <Input
                  id="ownerPassword"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateGymOwner} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Owner
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="rounded-lg p-2 bg-blue-50"><Users className="h-4 w-4 text-blue-600" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gym Owners</CardTitle>
            <div className="rounded-lg p-2 bg-indigo-50"><UserCheck className="h-4 w-4 text-indigo-600" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{roleFilter === "all" ? gymOwnerCount : roleFilter === "gym" ? total : "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <div className="rounded-lg p-2 bg-green-50"><UserCircle className="h-4 w-4 text-green-600" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{roleFilter === "all" ? customerCount : roleFilter === "customer" ? total : "—"}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Users</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-8 w-[220px]"
                />
              </div>
              <Select value={roleFilter} onValueChange={(val) => { setRoleFilter(val); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="gym">Gym Owners</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No users found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Gyms</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayUsers.map((user) => {
                  const info = enrichment[user._id];
                  const isGymOwner = user.userType === "gym";
                  return (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm">{user.phone || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.userType)}</TableCell>
                      <TableCell>
                        {isGymOwner ? (
                          <Badge variant="outline">{info?.gymCount ?? 0}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {isGymOwner ? (
                          <span className="font-medium">INR {(info?.revenue ?? 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewUser(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user._id)}
                            disabled={toggling === user._id}
                            title={user.isActive ? "Deactivate" : "Activate"}
                          >
                            {toggling === user._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                          {isGymOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setUserToDelete(user); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
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

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{viewUser.name}</span>
                <span className="text-muted-foreground">Email:</span>
                <span>{viewUser.email}</span>
                <span className="text-muted-foreground">Phone:</span>
                <span>{viewUser.phone || "-"}</span>
                <span className="text-muted-foreground">Role:</span>
                {getRoleBadge(viewUser.userType)}
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={viewUser.isActive ? "default" : "destructive"} className="w-fit">
                  {viewUser.isActive ? "Active" : "Inactive"}
                </Badge>
                <span className="text-muted-foreground">Joined:</span>
                <span>{new Date(viewUser.createdAt).toLocaleDateString()}</span>
                {viewUser.userType === "gym" && (
                  <>
                    <span className="text-muted-foreground">Total Revenue:</span>
                    <span className="font-medium">INR {(enrichment[viewUser._id]?.revenue ?? 0).toLocaleString()}</span>
                  </>
                )}
              </div>

              {/* Gym list for gym owners */}
              {viewUser.userType === "gym" && enrichment[viewUser._id]?.gyms && enrichment[viewUser._id].gyms.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    Gyms ({enrichment[viewUser._id].gymCount})
                  </h4>
                  <div className="space-y-2">
                    {enrichment[viewUser._id].gyms.map((gym) => (
                      <div key={gym._id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <Link href={`/platform/gyms/${gym._id}`} className="text-sm font-medium text-blue-600 hover:underline">
                            {gym.name}
                          </Link>
                          <Badge variant="outline" className="ml-2 text-xs">{gym.status}</Badge>
                        </div>
                        <span className="text-sm font-medium flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          {gym.revenue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewUser.userType === "gym" && (!enrichment[viewUser._id] || enrichment[viewUser._id].gymCount === 0) && (
                <p className="text-sm text-muted-foreground">No gyms owned</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{userToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
