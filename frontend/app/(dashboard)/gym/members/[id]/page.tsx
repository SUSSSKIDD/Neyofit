"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiService, GymMember, SubscriptionListing, Visit, OfflinePayment } from "@/lib/api"
import { toast } from "sonner"
import {
  Loader2, ArrowLeft, Phone, Mail, Calendar, CreditCard,
  Snowflake, RefreshCw, Ban, Clock, User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  frozen: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
  trial: "bg-yellow-100 text-yellow-800",
}

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const memberId = params.id as string

  const [loading, setLoading] = useState(true)
  const [member, setMember] = useState<GymMember | null>(null)
  const [visits, setVisits] = useState<Visit[]>([])
  const [payments, setPayments] = useState<OfflinePayment[]>([])
  const [plans, setPlans] = useState<SubscriptionListing[]>([])

  // Renew dialog
  const [showRenewDialog, setShowRenewDialog] = useState(false)
  const [renewData, setRenewData] = useState({
    subscriptionListingId: "",
    paymentAmount: "",
    paymentMethod: "cash",
    transactionReference: "",
  })
  const [renewing, setRenewing] = useState(false)

  // Freeze dialog
  const [showFreezeDialog, setShowFreezeDialog] = useState(false)
  const [freezeData, setFreezeData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    reason: "",
  })
  const [freezing, setFreezing] = useState(false)

  const fetchMember = useCallback(async () => {
    try {
      const res = await apiService.getGymMember(memberId)
      if (res.success && res.data) {
        setMember(res.data)
      } else {
        toast.error("Member not found")
        router.push("/gym/members")
      }
    } catch {
      toast.error("Failed to fetch member")
    }
  }, [memberId, router])

  const fetchVisits = useCallback(async () => {
    try {
      const res = await apiService.getMemberVisits(memberId)
      if (res.success && res.data) {
        setVisits(res.data)
      }
    } catch { /* ignore */ }
  }, [memberId])

  const fetchPayments = useCallback(async () => {
    try {
      const res = await apiService.getMemberOfflinePayments(memberId)
      if (res.success && res.data) {
        setPayments(res.data)
      }
    } catch { /* ignore */ }
  }, [memberId])

  const fetchPlans = useCallback(async () => {
    if (!member) return
    const gymId = typeof member.gymId === "string" ? member.gymId : (member.gymId as any)?._id
    if (!gymId) return
    try {
      const res = await apiService.getGymSubscriptionListings(gymId)
      if (res.success && res.data) {
        setPlans(Array.isArray(res.data) ? res.data : [])
      }
    } catch { /* ignore */ }
  }, [member])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchMember()
      await Promise.all([fetchVisits(), fetchPayments()])
      setLoading(false)
    }
    load()
  }, [fetchMember, fetchVisits, fetchPayments])

  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  const handleRenew = async () => {
    if (!renewData.subscriptionListingId) {
      toast.error("Please select a plan")
      return
    }
    setRenewing(true)
    try {
      const res = await apiService.renewGymMember(memberId, {
        subscriptionListingId: renewData.subscriptionListingId,
        payment: renewData.paymentAmount
          ? {
              amount: parseFloat(renewData.paymentAmount),
              paymentMethod: renewData.paymentMethod,
              transactionReference: renewData.transactionReference || undefined,
            }
          : undefined,
      })
      if (res.success) {
        toast.success("Membership renewed successfully")
        setShowRenewDialog(false)
        fetchMember()
        fetchPayments()
      } else {
        toast.error(res.message || "Failed to renew")
      }
    } catch {
      toast.error("Failed to renew membership")
    } finally {
      setRenewing(false)
    }
  }

  const handleFreeze = async () => {
    if (!freezeData.endDate) {
      toast.error("Please select an end date")
      return
    }
    setFreezing(true)
    try {
      const res = await apiService.freezeGymMember(memberId, {
        startDate: freezeData.startDate,
        endDate: freezeData.endDate,
        reason: freezeData.reason || undefined,
      })
      if (res.success) {
        toast.success("Membership frozen")
        setShowFreezeDialog(false)
        fetchMember()
      } else {
        toast.error(res.message || "Failed to freeze")
      }
    } catch {
      toast.error("Failed to freeze membership")
    } finally {
      setFreezing(false)
    }
  }

  const handleUnfreeze = async () => {
    try {
      const res = await apiService.unfreezeGymMember(memberId)
      if (res.success) {
        toast.success("Membership unfrozen. End date extended.")
        fetchMember()
      } else {
        toast.error(res.message || "Failed to unfreeze")
      }
    } catch {
      toast.error("Failed to unfreeze")
    }
  }

  const handleCancel = async () => {
    try {
      const res = await apiService.updateGymMember(memberId, { membershipStatus: "cancelled" } as any)
      if (res.success) {
        toast.success("Membership cancelled")
        fetchMember()
      } else {
        toast.error(res.message || "Failed to cancel")
      }
    } catch {
      toast.error("Failed to cancel membership")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!member) return null

  const plan =
    typeof member.subscriptionListingId === "object"
      ? (member.subscriptionListingId as SubscriptionListing)
      : null

  const daysLeft = member.membershipEndDate
    ? Math.ceil((new Date(member.membershipEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const renewPlan = plans.find(p => p._id === renewData.subscriptionListingId)

  return (
    <div className="space-y-6 p-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/gym/members")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Members
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{member.name}</h1>
          <p className="text-muted-foreground">#{member.membershipNumber}</p>
        </div>
        <Badge className={`text-sm ${statusColors[member.membershipStatus] || ""}`}>
          {member.membershipStatus}
        </Badge>
      </div>

      {/* Member Info + Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Member Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{member.phone}</span>
              </div>
              {member.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{member.email}</span>
                </div>
              )}
              {member.gender && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{member.gender}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            {plan && (
              <div className="border-t pt-3 mt-3">
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-medium">{plan.name} — {plan.currency || "INR"} {plan.cost}</p>
                {member.membershipStartDate && member.membershipEndDate && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(member.membershipStartDate).toLocaleDateString()} — {new Date(member.membershipEndDate).toLocaleDateString()}
                    {daysLeft !== null && daysLeft >= 0 && (
                      <span className={`ml-2 ${daysLeft <= 7 ? "text-amber-600" : "text-green-600"}`}>
                        ({daysLeft} days left)
                      </span>
                    )}
                    {daysLeft !== null && daysLeft < 0 && (
                      <span className="ml-2 text-red-600">(Expired {Math.abs(daysLeft)} days ago)</span>
                    )}
                  </p>
                )}
              </div>
            )}
            {member.notes && (
              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{member.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Renew */}
            <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" /> Renew Membership
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Renew Membership</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Plan</Label>
                    <Select
                      value={renewData.subscriptionListingId}
                      onValueChange={v => {
                        const p = plans.find(pl => pl._id === v)
                        setRenewData({ ...renewData, subscriptionListingId: v, paymentAmount: p ? String(p.cost) : "" })
                      }}
                    >
                      <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                      <SelectContent>
                        {plans.map(p => (
                          <SelectItem key={p._id} value={p._id}>
                            {p.name} - {p.currency || "INR"} {p.cost} ({p.durationInDays} days)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={renewData.paymentAmount}
                        onChange={e => setRenewData({ ...renewData, paymentAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Method</Label>
                      <Select value={renewData.paymentMethod} onValueChange={v => setRenewData({ ...renewData, paymentMethod: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {renewData.paymentMethod === "upi" && (
                    <div>
                      <Label>Transaction Reference</Label>
                      <Input
                        value={renewData.transactionReference}
                        onChange={e => setRenewData({ ...renewData, transactionReference: e.target.value })}
                        placeholder="UPI reference number"
                      />
                    </div>
                  )}
                  <Button className="w-full" onClick={handleRenew} disabled={renewing}>
                    {renewing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Renew{renewPlan ? ` & Collect ${renewPlan.currency || "INR"} ${renewData.paymentAmount || renewPlan.cost}` : ""}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Freeze / Unfreeze */}
            {member.membershipStatus === "frozen" ? (
              <Button className="w-full" variant="outline" onClick={handleUnfreeze}>
                <Snowflake className="h-4 w-4 mr-2" /> Unfreeze Membership
              </Button>
            ) : (
              <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline" disabled={member.membershipStatus !== "active"}>
                    <Snowflake className="h-4 w-4 mr-2" /> Freeze Membership
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Freeze Membership</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={freezeData.startDate}
                          onChange={e => setFreezeData({ ...freezeData, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={freezeData.endDate}
                          onChange={e => setFreezeData({ ...freezeData, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Reason (optional)</Label>
                      <Input
                        value={freezeData.reason}
                        onChange={e => setFreezeData({ ...freezeData, reason: e.target.value })}
                        placeholder="e.g., Medical leave, travel"
                      />
                    </div>
                    <Button className="w-full" onClick={handleFreeze} disabled={freezing}>
                      {freezing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Freeze Membership
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Cancel */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full" variant="destructive" disabled={member.membershipStatus === "cancelled"}>
                  <Ban className="h-4 w-4 mr-2" /> Cancel Membership
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Membership?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the membership as cancelled. The member can be reactivated later via renewal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Active</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancel}>Cancel Membership</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Visits & Payments */}
      <Tabs defaultValue="visits">
        <TabsList>
          <TabsTrigger value="visits">Visit History ({visits.length})</TabsTrigger>
          <TabsTrigger value="payments">Payment History ({payments.length})</TabsTrigger>
          {member.freezeHistory.length > 0 && (
            <TabsTrigger value="freezes">Freeze History ({member.freezeHistory.length})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="visits">
          <Card>
            {visits.length === 0 ? (
              <CardContent className="flex flex-col items-center py-8">
                <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No visits recorded yet</p>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map(visit => {
                    const duration = visit.checkOutTime
                      ? Math.round((new Date(visit.checkOutTime).getTime() - new Date(visit.checkInTime).getTime()) / (1000 * 60))
                      : null
                    return (
                      <TableRow key={visit._id}>
                        <TableCell>{new Date(visit.checkInTime).toLocaleString()}</TableCell>
                        <TableCell>{visit.checkOutTime ? new Date(visit.checkOutTime).toLocaleString() : <Badge variant="outline">Still in</Badge>}</TableCell>
                        <TableCell>{duration !== null ? `${duration} min` : "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{visit.notes || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            {payments.length === 0 ? (
              <CardContent className="flex flex-col items-center py-8">
                <CreditCard className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No payments recorded yet</p>
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow key={payment._id}>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs">{payment.receiptNumber}</TableCell>
                      <TableCell className="capitalize">{payment.paymentType.replace(/_/g, " ")}</TableCell>
                      <TableCell className="capitalize">{payment.paymentMethod.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-medium">INR {payment.amount}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "completed" ? "default" : "destructive"}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {member.freezeHistory.length > 0 && (
          <TabsContent value="freezes">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.freezeHistory.map((freeze, i) => {
                    const days = Math.ceil(
                      (new Date(freeze.endDate).getTime() - new Date(freeze.startDate).getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return (
                      <TableRow key={i}>
                        <TableCell>{new Date(freeze.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(freeze.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{days} days</TableCell>
                        <TableCell className="text-muted-foreground">{freeze.reason || "-"}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
