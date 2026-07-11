"use client"

import { useEffect, useState, useMemo } from "react"
import { apiService, type Gym } from "@/lib/api"
import { useGymSelector } from "@/contexts/gym-selector-context"
import { toast } from "sonner"
import { Loader2, Users, Clock, Search } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Subscription {
  _id: string
  userId: { _id: string; name: string; email: string; phone?: string }
  subscriptionListingId: {
    _id: string
    name: string
    type: string
    durationInDays: number
    gymId: { _id: string; name: string }
    cost: number
    currency: string
  }
  startDate: string
  endDate: string
  status: string
  isRecurring: boolean
}

export default function OnlineMembersPage() {
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { selectedGymId } = useGymSelector()

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiService.getGymOwnerDashboard()
        if (res.data) {
          const d = res.data as Record<string, unknown>
          setSubscriptions((d.subscriptions as Subscription[]) || [])
        }
      } catch {
        toast.error("Failed to load subscriptions")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredSubscriptions = useMemo(() => {
    let subs = subscriptions
    if (selectedGymId !== "all") {
      subs = subs.filter((s) => s.subscriptionListingId?.gymId?._id === selectedGymId)
    }
    if (statusFilter !== "all") {
      subs = subs.filter((s) => s.status === statusFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      subs = subs.filter(
        (s) =>
          s.userId?.name?.toLowerCase().includes(q) ||
          s.userId?.email?.toLowerCase().includes(q) ||
          s.subscriptionListingId?.name?.toLowerCase().includes(q)
      )
    }
    return subs
  }, [subscriptions, selectedGymId, statusFilter, search])

  const now = new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Online Members</h1>
        <p className="text-muted-foreground">Members with online Razorpay subscriptions</p>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No subscriptions found</h3>
            <p className="text-muted-foreground text-sm">
              {search ? "Try a different search term" : "No online subscriptions yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Gym</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => {
                const daysLeft = Math.ceil(
                  (new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )
                return (
                  <TableRow key={sub._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sub.userId?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{sub.userId?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{sub.subscriptionListingId?.gymId?.name || "-"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{sub.subscriptionListingId?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.subscriptionListingId?.durationInDays} days
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p>{new Date(sub.startDate).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">to {new Date(sub.endDate).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      ₹{sub.subscriptionListingId?.cost?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                          {sub.status}
                        </Badge>
                        {sub.status === "active" && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
