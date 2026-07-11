"use client";

import { useState, useEffect } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { IndianRupee, ShoppingCart, AlertTriangle, Eye, Wallet, Search } from "lucide-react";
import { apiService, UserPayment } from "@/lib/api";
import { toast } from "sonner";

interface PlatformStats {
  totalRevenue: number;
  totalCommission: number;
  totalOrders: number;
  failedCount: number;
}

export default function OrdersPage() {
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewPayment, setViewPayment] = useState<UserPayment | null>(null);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalRevenue: 0,
    totalCommission: 0,
    totalOrders: 0,
    failedCount: 0,
  });

  // Fetch platform-wide stats once from dashboard API
  useEffect(() => {
    (async () => {
      try {
        const response = await apiService.getSuperAdminDashboard();
        if (response.data) {
          const subs = (response.data as { subscriptions: Array<{ status: string; subscriptionListingId?: { cost: number } }> }).subscriptions || [];
          const paid = subs.filter((s) => s.status === "active" || s.status === "completed");
          const revenue = paid.reduce((sum, s) => sum + (s.subscriptionListingId?.cost || 0), 0);
          setPlatformStats({
            totalRevenue: revenue,
            totalCommission: Math.round(revenue * 0.15),
            totalOrders: subs.length,
            failedCount: subs.filter((s) => s.status === "failed").length,
          });
        }
      } catch {
        // Non-critical
      }
    })();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: { page: number; limit: number; status?: string } = {
        page,
        limit: 20,
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await apiService.getAllPayments(params);
      if (response.data) {
        setPayments(response.data.payments || []);
        setTotal(response.data.total || 0);
        setTotalPages(response.data.pages || 1);
      }
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "paid":
        return "default" as const;
      case "created":
        return "secondary" as const;
      case "failed":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const getCustomerName = (p: UserPayment) => p.userId?.name || "-";
  const getGymName = (p: UserPayment) =>
    p.subscriptionId?.subscriptionListingId?.gymId?.name || "-";
  const getPlanName = (p: UserPayment) =>
    p.subscriptionId?.subscriptionListingId?.name || "-";

  // Client-side search filter
  const displayPayments = searchQuery
    ? payments.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          getCustomerName(p).toLowerCase().includes(q) ||
          getGymName(p).toLowerCase().includes(q) ||
          (p.razorpayOrderId || "").toLowerCase().includes(q)
        );
      })
    : payments;

  const failedPercent =
    platformStats.totalOrders > 0
      ? ((platformStats.failedCount / platformStats.totalOrders) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Orders & Payments</h1>

      {/* Platform-Wide Revenue Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              INR {platformStats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Platform-wide total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Share</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              INR {platformStats.totalCommission.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Commission earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformStats.totalOrders || total}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedPercent}%</div>
            <p className="text-xs text-muted-foreground">{platformStats.failedCount} failed transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {total} total transactions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer or gym..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-[260px]"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
          ) : displayPayments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? "No transactions match your search" : "No transactions found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Gym</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission %</TableHead>
                  <TableHead>Platform Share</TableHead>
                  <TableHead>Gym Share</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayPayments.map((payment) => (
                  <TableRow
                    key={payment._id}
                    className="cursor-pointer"
                    onClick={() => setViewPayment(payment)}
                  >
                    <TableCell className="font-mono text-xs">
                      {payment.razorpayOrderId?.slice(-12) || payment._id.slice(-8)}
                    </TableCell>
                    <TableCell className="text-sm">{getCustomerName(payment)}</TableCell>
                    <TableCell className="text-sm">{getGymName(payment)}</TableCell>
                    <TableCell className="font-medium">
                      INR {payment.amount?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.commissionRate != null ? `${payment.commissionRate}%` : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-green-700">
                      {payment.commissionAmount != null
                        ? `INR ${payment.commissionAmount.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {payment.gymOwnerShare != null
                        ? `INR ${payment.gymOwnerShare.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.payoutStatus ? (
                        <Badge
                          variant={
                            payment.payoutStatus === "paid"
                              ? "default"
                              : payment.payoutStatus === "included"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {payment.payoutStatus}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewPayment(payment);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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

      {/* Detail Dialog */}
      <Dialog open={!!viewPayment} onOpenChange={(open) => !open && setViewPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>
          {viewPayment && (
            <div className="space-y-3 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono text-xs break-all">{viewPayment.razorpayOrderId}</span>
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="font-mono text-xs break-all">{viewPayment.razorpayPaymentId || "-"}</span>
                <span className="text-muted-foreground">Customer:</span>
                <span>{getCustomerName(viewPayment)}</span>
                {viewPayment.userId?.email && (
                  <>
                    <span className="text-muted-foreground">Email:</span>
                    <span>{viewPayment.userId.email}</span>
                  </>
                )}
                {viewPayment.userId?.phone && (
                  <>
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{viewPayment.userId.phone}</span>
                  </>
                )}
                <span className="text-muted-foreground">Gym:</span>
                <span>{getGymName(viewPayment)}</span>
                <span className="text-muted-foreground">Plan:</span>
                <span>{getPlanName(viewPayment)}</span>
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{viewPayment.currency || "INR"} {viewPayment.amount?.toLocaleString()}</span>
                {viewPayment.commissionRate != null && (
                  <>
                    <span className="text-muted-foreground">Commission Rate:</span>
                    <span>{viewPayment.commissionRate}%</span>
                    <span className="text-muted-foreground">Platform Share:</span>
                    <span className="text-green-700 font-medium">INR {viewPayment.commissionAmount?.toLocaleString()}</span>
                    <span className="text-muted-foreground">Gym Owner Share:</span>
                    <span className="font-medium">INR {viewPayment.gymOwnerShare?.toLocaleString()}</span>
                    <span className="text-muted-foreground">Payout Status:</span>
                    <Badge variant={viewPayment.payoutStatus === "paid" ? "default" : "outline"} className="w-fit">
                      {viewPayment.payoutStatus || "N/A"}
                    </Badge>
                  </>
                )}
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={getStatusBadgeVariant(viewPayment.status)} className="w-fit">
                  {viewPayment.status}
                </Badge>
                <span className="text-muted-foreground">Date:</span>
                <span>{new Date(viewPayment.createdAt).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPayment(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
