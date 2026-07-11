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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Search,
  CheckCircle,
  IndianRupee,
  History,
  Clock,
  X,
} from "lucide-react";
import {
  apiService,
  PayoutDashboardData,
  PayoutEntry,
} from "@/lib/api";
import { toast } from "sonner";

export default function PayoutsPage() {
  const [dashboardData, setDashboardData] = useState<PayoutDashboardData | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutEntry[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Dialog states
  const [createPayoutDialog, setCreatePayoutDialog] = useState<{
    gymOwnerId: string;
    ownerName: string;
    amount: number;
  } | null>(null);
  const [completeDialog, setCompleteDialog] = useState<PayoutEntry | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getPayoutDashboard();
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch {
      toast.error("Failed to load payout dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayoutHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await apiService.getAllPayoutsHistory({ page: historyPage, limit: 20 });
      if (response.data) {
        setPayoutHistory(response.data.payouts || []);
        setHistoryTotalPages(response.data.pages || 1);
      }
    } catch {
      toast.error("Failed to load payout history");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchPayoutHistory();
    }
  }, [activeTab, fetchPayoutHistory]);

  const handleCreatePayout = async () => {
    if (!createPayoutDialog) return;
    setSubmitting(true);
    try {
      const response = await apiService.createPayout({
        gymOwnerId: createPayoutDialog.gymOwnerId,
        notes: payoutNotes || undefined,
      });
      if (response.success) {
        toast.success(`Payout created for ${createPayoutDialog.ownerName}`);
        setCreatePayoutDialog(null);
        setPayoutNotes("");
        fetchDashboard();
        fetchPayoutHistory();
      } else {
        toast.error(response.message || "Failed to create payout");
      }
    } catch {
      toast.error("Failed to create payout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!completeDialog) return;
    setSubmitting(true);
    try {
      const response = await apiService.markPayoutCompleted(completeDialog._id, {
        transactionReference: txnRef || undefined,
        notes: payoutNotes || undefined,
      });
      if (response.success) {
        toast.success("Payout marked as completed");
        setCompleteDialog(null);
        setTxnRef("");
        setPayoutNotes("");
        fetchDashboard();
        fetchPayoutHistory();
      } else {
        toast.error(response.message || "Failed to complete payout");
      }
    } catch {
      toast.error("Failed to complete payout");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkFailed = async (payout: PayoutEntry) => {
    try {
      const response = await apiService.markPayoutFailed(payout._id);
      if (response.success) {
        toast.success("Payout marked as failed. Payments reverted to unpaid.");
        fetchDashboard();
        fetchPayoutHistory();
      } else {
        toast.error(response.message || "Failed");
      }
    } catch {
      toast.error("Failed to update payout");
    }
  };

  const summary = dashboardData?.summary;
  const pendingOwners = dashboardData?.pendingByOwner || [];
  const filteredPending = pendingOwners.filter(
    (p) =>
      p.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOwnerName = (p: PayoutEntry) =>
    typeof p.gymOwnerId === "object" ? p.gymOwnerId.name : p.gymOwnerId;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-muted-foreground">
          Track and manage payouts to gym owners
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unpaid to Gym Owners
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  INR {(summary?.totalUnpaidToGyms || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending disbursement
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Platform Commission
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  INR{" "}
                  {(summary?.platformCommissionEarned || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total commission earned
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Payouts Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  INR{" "}
                  {(summary?.totalPayoutsCompleted || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary?.completedPayoutCount || 0} payouts disbursed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Payouts
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Payout History
          </TabsTrigger>
        </TabsList>

        {/* Pending Payouts Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Pending Payouts</CardTitle>
                  <CardDescription>
                    Gym owners with unpaid balances
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search gym owners..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-[250px]"
                  />
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
              ) : filteredPending.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {search
                    ? "No matching gym owners found"
                    : "No pending payouts. All gym owners are paid up!"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gym Owner</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Gyms</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Payout Amount</TableHead>
                      <TableHead>Payments</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPending.map((entry) => (
                      <TableRow key={entry.gymOwnerId}>
                        <TableCell className="font-medium">
                          {entry.ownerName}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.ownerEmail}
                        </TableCell>
                        <TableCell>{entry.gymCount}</TableCell>
                        <TableCell>
                          INR {entry.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          INR {entry.totalCommission.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">
                          INR {entry.totalGymOwnerShare.toLocaleString()}
                        </TableCell>
                        <TableCell>{entry.paymentCount}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCreatePayoutDialog({
                                gymOwnerId: entry.gymOwnerId,
                                ownerName: entry.ownerName,
                                amount: entry.totalGymOwnerShare,
                              })
                            }
                          >
                            Create Payout
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

        {/* Payout History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>All payouts created</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : payoutHistory.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No payouts created yet
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gym Owner</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Payout</TableHead>
                        <TableHead>Payments</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Txn Ref</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payoutHistory.map((payout) => (
                        <TableRow key={payout._id}>
                          <TableCell className="font-medium">
                            {getOwnerName(payout)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(payout.periodStart).toLocaleDateString()}{" "}
                            - {new Date(payout.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            INR {payout.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            INR {payout.commissionAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            INR {payout.payoutAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>{payout.paymentIds.length}</TableCell>
                          <TableCell>
                            {getPayoutStatusBadge(payout.status)}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {payout.transactionReference || "-"}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {payout.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setCompleteDialog(payout);
                                    setTxnRef("");
                                    setPayoutNotes("");
                                  }}
                                >
                                  Complete
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleMarkFailed(payout)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {payout.status === "completed" && (
                              <span className="text-sm text-muted-foreground">
                                Done
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {historyTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setHistoryPage((p) => Math.max(1, p - 1))
                        }
                        disabled={historyPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {historyPage} of {historyTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setHistoryPage((p) =>
                            Math.min(historyTotalPages, p + 1)
                          )
                        }
                        disabled={historyPage === historyTotalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Create Payout Dialog */}
      <Dialog
        open={!!createPayoutDialog}
        onOpenChange={(open) => !open && setCreatePayoutDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Payout</DialogTitle>
            <DialogDescription>
              Create a payout of INR{" "}
              {createPayoutDialog?.amount.toLocaleString()} to{" "}
              {createPayoutDialog?.ownerName}? This will claim all their
              unpaid payments.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Add a note..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreatePayoutDialog(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePayout} disabled={submitting}>
              {submitting ? "Creating..." : "Create Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark Completed Dialog */}
      <Dialog
        open={!!completeDialog}
        onOpenChange={(open) => !open && setCompleteDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payout Completed</DialogTitle>
            <DialogDescription>
              Confirm that INR{" "}
              {completeDialog?.payoutAmount.toLocaleString()} has been
              transferred to {completeDialog && getOwnerName(completeDialog)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Transaction Reference</Label>
              <Input
                placeholder="e.g. UTR number, transaction ID..."
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Add a note..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteDialog(null)}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkCompleted} disabled={submitting}>
              {submitting ? "Saving..." : "Confirm Completed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
