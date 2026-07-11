"use client"

import { useEffect, useState, useCallback } from "react"
import { useGymSelector } from "@/contexts/gym-selector-context"
import { apiService, OfflinePayment, GymMember, SubscriptionListing, RevenueSummary } from "@/lib/api"
import { toast } from "sonner"
import {
  Loader2, Plus, Search, Wallet, Banknote, CreditCard, TrendingUp, DollarSign,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

const methodIcons: Record<string, string> = {
  cash: "Banknote",
  upi: "Wallet",
  card: "CreditCard",
  bank_transfer: "TrendingUp",
}

export default function OfflinePaymentsPage() {
  const { selectedGymId, gyms } = useGymSelector()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<OfflinePayment[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Search member for recording payment
  const [memberSearch, setMemberSearch] = useState("")
  const [memberResults, setMemberResults] = useState<GymMember[]>([])
  const [selectedMember, setSelectedMember] = useState<GymMember | null>(null)
  const [plans, setPlans] = useState<SubscriptionListing[]>([])

  // Payment form
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "cash",
    paymentType: "membership_new",
    subscriptionListingId: "",
    transactionReference: "",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const activeGymId = selectedGymId && selectedGymId !== "all" ? selectedGymId : gyms[0]?._id

  const fetchPayments = useCallback(async () => {
    if (!activeGymId) return
    setLoading(true)
    try {
      const res = await apiService.getGymOfflinePayments(activeGymId, {
        page: pagination.page,
        limit: pagination.limit,
      })
      if (res.success && res.data) {
        setPayments(res.data.payments)
        setPagination(res.data.pagination)
      }
    } catch {
      toast.error("Failed to fetch payments")
    } finally {
      setLoading(false)
    }
  }, [activeGymId, pagination.page, pagination.limit])

  const fetchSummary = useCallback(async () => {
    if (!activeGymId) return
    try {
      const res = await apiService.getRevenueSummary(activeGymId)
      if (res.success && res.data) {
        setSummary(res.data)
      }
    } catch { /* ignore */ }
  }, [activeGymId])

  const fetchPlans = useCallback(async () => {
    if (!activeGymId) return
    try {
      const res = await apiService.getGymSubscriptionListings(activeGymId)
      if (res.success && res.data) {
        setPlans(Array.isArray(res.data) ? res.data : [])
      }
    } catch { /* ignore */ }
  }, [activeGymId])

  useEffect(() => {
    fetchPayments()
    fetchSummary()
    fetchPlans()
  }, [fetchPayments, fetchSummary, fetchPlans])

  // Search members for payment recording
  useEffect(() => {
    if (!activeGymId || memberSearch.length < 2) {
      setMemberResults([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiService.searchGymMembers(activeGymId, memberSearch)
        if (res.success && res.data) {
          setMemberResults(res.data)
        }
      } catch { /* ignore */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [memberSearch, activeGymId])

  const handleRecordPayment = async () => {
    if (!activeGymId || !selectedMember || !paymentForm.amount) {
      toast.error("Please select a member and enter an amount")
      return
    }
    setSubmitting(true)
    try {
      const res = await apiService.createOfflinePayment({
        gymId: activeGymId,
        memberId: selectedMember._id,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        paymentType: paymentForm.paymentType,
        subscriptionListingId: paymentForm.subscriptionListingId || undefined,
        transactionReference: paymentForm.transactionReference || undefined,
        notes: paymentForm.notes || undefined,
      })
      if (res.success) {
        toast.success(`Payment of INR ${paymentForm.amount} recorded`)
        setShowAddDialog(false)
        setSelectedMember(null)
        setMemberSearch("")
        setPaymentForm({
          amount: "", paymentMethod: "cash", paymentType: "membership_new",
          subscriptionListingId: "", transactionReference: "", notes: "",
        })
        fetchPayments()
        fetchSummary()
      } else {
        toast.error(res.message || "Failed to record payment")
      }
    } catch {
      toast.error("Failed to record payment")
    } finally {
      setSubmitting(false)
    }
  }

  if (!activeGymId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a gym first</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offline Payments</h1>
          <p className="text-muted-foreground">Track cash, UPI, and other offline payments</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Record Payment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Offline Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Member search */}
              {!selectedMember ? (
                <div>
                  <Label>Search Member</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type phone or name..."
                      className="pl-10"
                      value={memberSearch}
                      onChange={e => setMemberSearch(e.target.value)}
                    />
                  </div>
                  {memberResults.length > 0 && (
                    <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                      {memberResults.map(m => (
                        <div
                          key={m._id}
                          className="p-2 hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedMember(m)
                            setMemberSearch("")
                            setMemberResults([])
                          }}
                        >
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.phone} | #{m.membershipNumber}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{selectedMember.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedMember.phone}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMember(null)}>Change</Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Method</Label>
                  <Select value={paymentForm.paymentMethod} onValueChange={v => setPaymentForm({ ...paymentForm, paymentMethod: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Payment Type</Label>
                <Select value={paymentForm.paymentType} onValueChange={v => setPaymentForm({ ...paymentForm, paymentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membership_new">New Membership</SelectItem>
                    <SelectItem value="membership_renewal">Membership Renewal</SelectItem>
                    <SelectItem value="day_pass">Day Pass</SelectItem>
                    <SelectItem value="personal_training">Personal Training</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(paymentForm.paymentType === "membership_new" || paymentForm.paymentType === "membership_renewal") && (
                <div>
                  <Label>Plan (optional)</Label>
                  <Select
                    value={paymentForm.subscriptionListingId}
                    onValueChange={v => {
                      const plan = plans.find(p => p._id === v)
                      setPaymentForm({
                        ...paymentForm,
                        subscriptionListingId: v,
                        amount: plan ? String(plan.cost) : paymentForm.amount,
                      })
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>
                      {plans.map(plan => (
                        <SelectItem key={plan._id} value={plan._id}>
                          {plan.name} - INR {plan.cost}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {paymentForm.paymentMethod === "upi" && (
                <div>
                  <Label>Transaction Reference</Label>
                  <Input
                    value={paymentForm.transactionReference}
                    onChange={e => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
                    placeholder="UPI reference number"
                  />
                </div>
              )}

              <div>
                <Label>Notes</Label>
                <Input
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>

              <Button className="w-full" onClick={handleRecordPayment} disabled={submitting || !selectedMember}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Record Payment{paymentForm.amount ? ` - INR ${paymentForm.amount}` : ""}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Revenue Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">INR {summary.today.total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{summary.today.count} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">INR {summary.thisWeek.total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{summary.thisWeek.count} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">INR {summary.thisMonth.total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{summary.thisMonth.count} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">All Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">INR {summary.allTime.total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{summary.allTime.count} transactions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue by Method */}
      {summary && summary.byMethod.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {summary.byMethod.map(m => (
                <div key={m.method} className="text-center p-3 border rounded-lg">
                  <p className="text-sm text-muted-foreground capitalize">{m.method.replace(/_/g, " ")}</p>
                  <p className="text-lg font-bold">INR {m.total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{m.count} txns</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <CreditCard className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No payments recorded yet</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => {
                    const member = typeof payment.memberId === "object" ? payment.memberId : null
                    return (
                      <TableRow key={payment._id}>
                        <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{member?.name || "-"}</p>
                            <p className="text-xs text-muted-foreground">{member?.phone || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{payment.receiptNumber}</TableCell>
                        <TableCell className="capitalize text-sm">{payment.paymentType.replace(/_/g, " ")}</TableCell>
                        <TableCell className="capitalize text-sm">{payment.paymentMethod.replace(/_/g, " ")}</TableCell>
                        <TableCell className="font-medium">INR {payment.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "completed" ? "default" : "destructive"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
