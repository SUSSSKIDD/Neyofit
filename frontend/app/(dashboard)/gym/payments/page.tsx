"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  apiService,
  GymOwnerEarningsSummary,
  PayoutEntry,
  BankDetailsData,
  type UserPayment,
} from "@/lib/api";
import { useGymSelector } from "@/contexts/gym-selector-context";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  Wallet,
  IndianRupee,
  TrendingUp,
  Clock,
  Building2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function GymPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<UserPayment[]>([]);
  const [summary, setSummary] = useState<GymOwnerEarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutEntry[]>([]);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutTotalPages, setPayoutTotalPages] = useState(1);
  const [bankDetails, setBankDetails] = useState<BankDetailsData | null>(null);
  const [bankForm, setBankForm] = useState({
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    upiId: "",
  });
  const [savingBank, setSavingBank] = useState(false);
  const [activeTab, setActiveTab] = useState("earnings");
  const { selectedGymId } = useGymSelector();

  const fetchPayments = useCallback(async () => {
    try {
      const res = await apiService.getGymOwnerPayments();
      if (res.data) {
        setPayments(res.data as unknown as UserPayment[]);
      }
    } catch {
      toast.error("Failed to load payments");
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await apiService.getGymOwnerEarningsSummary();
      if (res.data) {
        setSummary(res.data);
      }
    } catch {
      // Summary endpoint may not have data yet
    }
  }, []);

  const fetchPayoutHistory = useCallback(async () => {
    try {
      const res = await apiService.getGymOwnerPayoutHistory({
        page: payoutPage,
        limit: 20,
      });
      if (res.data) {
        setPayouts(res.data.payouts || []);
        setPayoutTotalPages(res.data.pages || 1);
      }
    } catch {
      // Silently handle
    }
  }, [payoutPage]);

  const fetchBankDetails = useCallback(async () => {
    try {
      const res = await apiService.getBankDetails();
      if (res.data) {
        setBankDetails(res.data);
        setBankForm({
          accountHolderName: res.data.accountHolderName || "",
          accountNumber: res.data.accountNumber || "",
          ifscCode: res.data.ifscCode || "",
          bankName: res.data.bankName || "",
          upiId: res.data.upiId || "",
        });
      }
    } catch {
      // Silently handle
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchPayments(), fetchSummary(), fetchBankDetails()]);
      setLoading(false);
    }
    init();
  }, [fetchPayments, fetchSummary, fetchBankDetails]);

  useEffect(() => {
    if (activeTab === "payouts") {
      fetchPayoutHistory();
    }
  }, [activeTab, fetchPayoutHistory]);

  // Filter payments by selected gym
  const filteredPayments = useMemo(() => {
    if (selectedGymId === "all") return payments;
    return payments.filter(
      (p) => p.subscriptionId?.subscriptionListingId?.gymId?._id === selectedGymId
    );
  }, [payments, selectedGymId]);

  // Compute gym-filtered summary from payments when a specific gym is selected
  const displaySummary = useMemo(() => {
    if (selectedGymId === "all" && summary) return summary;
    // Compute from filtered payments
    const paidPayments = filteredPayments.filter((p) => p.status === "paid");
    const totalEarnings = paidPayments.reduce((s, p) => s + p.amount, 0);
    const totalCommission = paidPayments.reduce(
      (s, p) => s + (p.commissionAmount || 0),
      0
    );
    const totalNetEarnings = paidPayments.reduce(
      (s, p) => s + (p.gymOwnerShare || p.amount - (p.commissionAmount || 0)),
      0
    );
    const pendingPayout = paidPayments
      .filter((p) => p.payoutStatus === "unpaid")
      .reduce((s, p) => s + (p.gymOwnerShare || 0), 0);
    return {
      totalEarnings,
      totalCommission,
      totalNetEarnings,
      totalPayments: paidPayments.length,
      pendingPayout,
      pendingPaymentCount: paidPayments.filter((p) => p.payoutStatus === "unpaid").length,
      totalPaidOut: summary?.totalPaidOut || 0,
      payoutCount: summary?.payoutCount || 0,
    } as GymOwnerEarningsSummary;
  }, [selectedGymId, summary, filteredPayments]);

  const showGymColumn = selectedGymId === "all";

  const handleSaveBankDetails = async () => {
    setSavingBank(true);
    try {
      const res = await apiService.updateBankDetails(bankForm);
      if (res.success) {
        toast.success("Bank details updated");
        setBankDetails(res.data!);
      } else {
        toast.error(res.message || "Failed to save");
      }
    } catch {
      toast.error("Failed to save bank details");
    } finally {
      setSavingBank(false);
    }
  };

  const getStatusVariant = (status: string) => {
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

  const getPayoutStatusBadge = (status?: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Paid</Badge>;
      case "included":
        return <Badge className="bg-blue-100 text-blue-800">In Payout</Badge>;
      case "unpaid":
        return <Badge variant="secondary">Unpaid</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">
          Your earnings, commissions, and payout history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Earnings</p>
            </div>
            <p className="text-2xl font-bold">
              INR {(displaySummary?.totalEarnings || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Platform Commission
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              INR {(displaySummary?.totalCommission || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Net Earnings</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              INR {(displaySummary?.totalNetEarnings || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Pending Payout</p>
            </div>
            <p className="text-2xl font-bold">
              INR {(displaySummary?.pendingPayout || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="earnings" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Earnings
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <Wallet className="h-4 w-4" />
            Payout History
          </TabsTrigger>
          <TabsTrigger value="bank" className="gap-2">
            <Building2 className="h-4 w-4" />
            Bank Details
          </TabsTrigger>
        </TabsList>

        {/* Earnings Tab */}
        <TabsContent value="earnings">
          <Card>
            <CardContent className="p-0">
              {filteredPayments.length === 0 ? (
                <div className="py-12 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No payments yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Payments will appear here when customers subscribe to your
                    plans
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      {showGymColumn && <TableHead>Gym</TableHead>}
                      <TableHead>Amount</TableHead>
                      <TableHead>Commission %</TableHead>
                      <TableHead>Platform Share</TableHead>
                      <TableHead>Your Share</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell className="text-sm">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {payment.userId?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payment.userId?.email || ""}
                            </p>
                          </div>
                        </TableCell>
                        {showGymColumn && (
                          <TableCell className="text-sm">
                            {payment.subscriptionId?.subscriptionListingId?.gymId?.name || "-"}
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {payment.currency} {payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {payment.commissionRate != null
                            ? `${payment.commissionRate}%`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.commissionAmount != null
                            ? `INR ${payment.commissionAmount.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell className="font-medium text-green-700">
                          {payment.gymOwnerShare != null
                            ? `INR ${payment.gymOwnerShare.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payment.status === "paid"
                            ? getPayoutStatusBadge(payment.payoutStatus)
                            : "-"}
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
        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                Payouts received from the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payouts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No payouts yet. Payouts will appear here once the platform
                  processes your earnings.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Total Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Payout</TableHead>
                        <TableHead>Payments</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout._id}>
                          <TableCell className="text-xs">
                            {new Date(
                              payout.periodStart
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(payout.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            INR {payout.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            INR {payout.commissionAmount.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-medium text-green-700">
                            INR {payout.payoutAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>{payout.paymentIds.length}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                payout.status === "completed"
                                  ? "default"
                                  : payout.status === "failed"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {payout.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {payout.processedAt
                              ? new Date(
                                  payout.processedAt
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {payoutTotalPages > 1 && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPayoutPage((p) => Math.max(1, p - 1))
                        }
                        disabled={payoutPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {payoutPage} of {payoutTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPayoutPage((p) =>
                            Math.min(payoutTotalPages, p + 1)
                          )
                        }
                        disabled={payoutPage === payoutTotalPages}
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

        {/* Bank Details Tab */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Bank Details</CardTitle>
              <CardDescription>
                Add your bank account or UPI for receiving payouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label>Account Holder Name</Label>
                <Input
                  value={bankForm.accountHolderName}
                  onChange={(e) =>
                    setBankForm((f) => ({
                      ...f,
                      accountHolderName: e.target.value,
                    }))
                  }
                  placeholder="Full name as per bank account"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  value={bankForm.accountNumber}
                  onChange={(e) =>
                    setBankForm((f) => ({
                      ...f,
                      accountNumber: e.target.value,
                    }))
                  }
                  placeholder="Bank account number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    value={bankForm.ifscCode}
                    onChange={(e) =>
                      setBankForm((f) => ({
                        ...f,
                        ifscCode: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g. SBIN0001234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={bankForm.bankName}
                    onChange={(e) =>
                      setBankForm((f) => ({
                        ...f,
                        bankName: e.target.value,
                      }))
                    }
                    placeholder="e.g. State Bank of India"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>UPI ID (optional)</Label>
                <Input
                  value={bankForm.upiId}
                  onChange={(e) =>
                    setBankForm((f) => ({ ...f, upiId: e.target.value }))
                  }
                  placeholder="e.g. name@upi"
                />
              </div>
              {bankDetails?.isVerified && (
                <Badge variant="default">Verified</Badge>
              )}
              <div>
                <Button
                  onClick={handleSaveBankDetails}
                  disabled={savingBank}
                >
                  {savingBank ? "Saving..." : "Save Bank Details"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
