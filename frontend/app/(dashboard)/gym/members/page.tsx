"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useGymSelector } from "@/contexts/gym-selector-context"
import { apiService, GymMember, SubscriptionListing } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Plus, Search, Users, UserCheck, AlertTriangle, UserX, Phone, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  frozen: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
  trial: "bg-yellow-100 text-yellow-800",
}

export default function MembersPage() {
  const router = useRouter()
  const { selectedGymId, gyms } = useGymSelector()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<GymMember[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [plans, setPlans] = useState<SubscriptionListing[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0, expired: 0 })

  // New member form state
  const [newMember, setNewMember] = useState({
    gymId: "",
    name: "",
    phone: "",
    email: "",
    gender: "",
    subscriptionListingId: "",
    membershipStartDate: new Date().toISOString().split("T")[0],
    source: "walk_in",
    notes: "",
    paymentAmount: "",
    paymentMethod: "cash",
    collectPayment: false,
  })
  const [submitting, setSubmitting] = useState(false)

  const activeGymId = selectedGymId && selectedGymId !== "all" ? selectedGymId : gyms[0]?._id

  const fetchMembers = useCallback(async () => {
    if (!activeGymId) return
    setLoading(true)
    try {
      // "expiring" is a special filter — use the dedicated endpoint
      if (statusFilter === "expiring") {
        const res = await apiService.getExpiringMembers(activeGymId, 7)
        if (res.success && res.data) {
          const expiringMembers = Array.isArray(res.data) ? res.data : []
          setMembers(expiringMembers)
          setPagination({ total: expiringMembers.length, page: 1, limit: expiringMembers.length || 20, totalPages: 1 })
        }
      } else {
        const res = await apiService.getGymMembers(activeGymId, {
          page: pagination.page,
          limit: pagination.limit,
          status: statusFilter !== "all" ? statusFilter : undefined,
          search: search || undefined,
        })
        if (res.success && res.data) {
          setMembers(res.data.members)
          setPagination(res.data.pagination)
        }
      }
    } catch {
      toast.error("Failed to fetch members")
    } finally {
      setLoading(false)
    }
  }, [activeGymId, pagination.page, pagination.limit, statusFilter, search])

  const fetchStats = useCallback(async () => {
    if (!activeGymId) return
    try {
      const [allRes, activeRes, expiredRes, expiringRes] = await Promise.all([
        apiService.getGymMembers(activeGymId, { limit: 1 }),
        apiService.getGymMembers(activeGymId, { limit: 1, status: "active" }),
        apiService.getGymMembers(activeGymId, { limit: 1, status: "expired" }),
        apiService.getExpiringMembers(activeGymId, 7),
      ])
      setStats({
        total: allRes.data?.pagination.total || 0,
        active: activeRes.data?.pagination.total || 0,
        expired: expiredRes.data?.pagination.total || 0,
        expiring: expiringRes.data?.length || 0,
      })
    } catch { /* ignore */ }
  }, [activeGymId])

  const fetchPlans = useCallback(async (gymId?: string) => {
    const id = gymId || activeGymId
    if (!id) return
    try {
      const res = await apiService.getGymSubscriptionListings(id)
      if (res.success && res.data) {
        setPlans(Array.isArray(res.data) ? res.data : [])
      }
    } catch { /* ignore */ }
  }, [activeGymId])

  useEffect(() => {
    fetchMembers()
    fetchStats()
    fetchPlans()
  }, [fetchMembers, fetchStats, fetchPlans])

  const handleAddMember = async () => {
    const targetGymId = newMember.gymId || activeGymId
    if (!targetGymId) {
      toast.error("Please select a gym branch")
      return
    }
    if (!newMember.name || !newMember.phone) {
      toast.error("Name and phone are required")
      return
    }
    setSubmitting(true)
    try {
      const selectedPlan = plans.find(p => p._id === newMember.subscriptionListingId)
      const shouldCollectPayment = newMember.collectPayment && newMember.paymentAmount
      const res = await apiService.createGymMember({
        gymId: targetGymId,
        name: newMember.name,
        phone: newMember.phone,
        email: newMember.email || undefined,
        gender: newMember.gender || undefined,
        subscriptionListingId: newMember.subscriptionListingId || undefined,
        membershipStartDate: newMember.membershipStartDate || undefined,
        source: newMember.source as any,
        notes: newMember.notes || undefined,
        payment: shouldCollectPayment
          ? {
              amount: parseFloat(newMember.paymentAmount) || selectedPlan?.cost || 0,
              paymentMethod: newMember.paymentMethod,
            }
          : undefined,
      })
      if (res.success) {
        toast.success(shouldCollectPayment ? "Member registered & payment recorded" : "Member registered successfully")
        setShowAddDialog(false)
        setNewMember({
          gymId: "", name: "", phone: "", email: "", gender: "",
          subscriptionListingId: "", membershipStartDate: new Date().toISOString().split("T")[0],
          source: "walk_in", notes: "", paymentAmount: "", paymentMethod: "cash",
          collectPayment: false,
        })
        fetchMembers()
        fetchStats()
      } else {
        toast.error(res.message || "Failed to register member")
      }
    } catch {
      toast.error("Failed to register member")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPlan = plans.find(p => p._id === newMember.subscriptionListingId)

  const daysUntilExpiry = (endDate?: string) => {
    if (!endDate) return null
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
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
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage your gym members and memberships</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Member</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Gym Branch Selector */}
              <div>
                <Label>Gym Branch *</Label>
                <Select
                  value={newMember.gymId || activeGymId || ""}
                  onValueChange={v => {
                    setNewMember({ ...newMember, gymId: v, subscriptionListingId: "", paymentAmount: "" })
                    fetchPlans(v)
                  }}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <SelectValue placeholder="Select gym branch" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {gyms.map(gym => (
                      <SelectItem key={gym._id} value={gym._id}>
                        {gym.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={newMember.name}
                    onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    placeholder="10-digit phone"
                    value={newMember.phone}
                    onChange={e => setNewMember({ ...newMember, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    placeholder="Email (optional)"
                    value={newMember.email}
                    onChange={e => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select value={newMember.gender} onValueChange={v => setNewMember({ ...newMember, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Plan</Label>
                <Select
                  value={newMember.subscriptionListingId}
                  onValueChange={v => {
                    const plan = plans.find(p => p._id === v)
                    setNewMember({
                      ...newMember,
                      subscriptionListingId: v,
                      paymentAmount: plan ? String(plan.cost) : "",
                      collectPayment: plan ? true : newMember.collectPayment,
                    })
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map(plan => (
                      <SelectItem key={plan._id} value={plan._id}>
                        {plan.name} - {plan.currency || "INR"} {plan.cost} ({plan.durationInDays} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newMember.membershipStartDate}
                    onChange={e => setNewMember({ ...newMember, membershipStartDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Source</Label>
                  <Select value={newMember.source} onValueChange={v => setNewMember({ ...newMember, source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk_in">Walk-in</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="phone_inquiry">Phone Inquiry</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Offline Payment */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="collectPayment"
                    checked={newMember.collectPayment}
                    onChange={e => setNewMember({ ...newMember, collectPayment: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="collectPayment" className="font-medium cursor-pointer">
                    Record Offline Payment
                  </Label>
                </div>
                {newMember.collectPayment && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={newMember.paymentAmount}
                        placeholder={selectedPlan ? String(selectedPlan.cost) : "0"}
                        onChange={e => setNewMember({ ...newMember, paymentAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Method</Label>
                      <Select value={newMember.paymentMethod} onValueChange={v => setNewMember({ ...newMember, paymentMethod: v })}>
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
                )}
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  placeholder="Optional notes"
                  value={newMember.notes}
                  onChange={e => setNewMember({ ...newMember, notes: e.target.value })}
                />
              </div>
              <Button className="w-full" onClick={handleAddMember} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Register Member{newMember.collectPayment && newMember.paymentAmount ? ` & Collect ₹${newMember.paymentAmount}` : ""}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:border-primary" onClick={() => setStatusFilter("all")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500" onClick={() => setStatusFilter("active")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.active}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-amber-500" onClick={() => setStatusFilter("expiring")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-2xl font-bold">{stats.expiring}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-red-500" onClick={() => setStatusFilter("expired")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{stats.expired}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or membership number..."
            className="pl-10"
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPagination(p => ({ ...p, page: 1 }))
            }}
          />
        </div>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPagination(p => ({ ...p, page: 1 })) }}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="frozen">Frozen</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No members found</h3>
            <p className="text-muted-foreground text-sm">
              {search ? "Try a different search term" : "Register your first member to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Member #</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => {
                  const days = daysUntilExpiry(member.membershipEndDate)
                  const plan = typeof member.subscriptionListingId === "object"
                    ? member.subscriptionListingId
                    : null
                  return (
                    <TableRow
                      key={member._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/gym/members/${member._id}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </div>
                      </TableCell>
                      <TableCell>{plan?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[member.membershipStatus] || ""}>
                          {member.membershipStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.membershipEndDate ? (
                          <div>
                            <p className="text-sm">{new Date(member.membershipEndDate).toLocaleDateString()}</p>
                            {days !== null && days <= 7 && days >= 0 && (
                              <p className="text-xs text-amber-600">{days} days left</p>
                            )}
                            {days !== null && days < 0 && (
                              <p className="text-xs text-red-600">Expired {Math.abs(days)} days ago</p>
                            )}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{member.membershipNumber}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
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
    </div>
  )
}
