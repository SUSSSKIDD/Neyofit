"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { apiService, type Gym, type VisitStats, type RevenueSummary } from "@/lib/api"
import { useGymSelector } from "@/contexts/gym-selector-context"
import { toast } from "sonner"
import { Building2, Users, CreditCard, ArrowRight, Loader2, Clock, AlertTriangle, ClipboardCheck, Wallet, UserCheck, Monitor, Activity } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"

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

interface Stats {
  totalGyms: number
  publishedGyms: number
  draftGyms: number
  totalSubscriptions: number
  activeSubscriptions: number
}

const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const subscriptionChartConfig = {
  active: {
    label: "Active",
    color: "hsl(var(--chart-2))",
  },
  expiring: {
    label: "Expiring",
    color: "hsl(var(--chart-4))",
  },
  expired: {
    label: "Expired",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

const PIE_COLORS = [
  "hsl(var(--chart-2))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

export default function GymOwnerDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [gyms, setGyms] = useState<Gym[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<Stats>({
    totalGyms: 0,
    publishedGyms: 0,
    draftGyms: 0,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
  })
  const { selectedGymId } = useGymSelector()

  // CRM stats
  const [crmStats, setCrmStats] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    expiringThisWeek: 0,
    offlineRevenueMonth: 0,
  })

  const activeGymId = selectedGymId && selectedGymId !== "all" ? selectedGymId : null

  const fetchCrmStats = useCallback(async (gymList: Gym[]) => {
    const gymId = activeGymId || gymList[0]?._id
    if (!gymId) return
    try {
      const [membersRes, visitStatsRes, expiringRes, revenueRes] = await Promise.all([
        apiService.getGymMembers(gymId, { limit: 1 }),
        apiService.getVisitStats(gymId),
        apiService.getExpiringMembers(gymId, 7),
        apiService.getRevenueSummary(gymId),
      ])
      setCrmStats({
        totalMembers: membersRes.data?.pagination.total || 0,
        todayAttendance: (visitStatsRes.data as VisitStats)?.today || 0,
        expiringThisWeek: (expiringRes.data as any)?.length || 0,
        offlineRevenueMonth: (revenueRes.data as RevenueSummary)?.thisMonth?.total || 0,
      })
    } catch { /* CRM stats are optional, don't block */ }
  }, [activeGymId])

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await apiService.getGymOwnerDashboard()
        if (res.data) {
          const d = res.data as Record<string, unknown>
          const gymList = (d.gyms as Gym[]) || []
          setGyms(gymList)
          setSubscriptions((d.subscriptions as Subscription[]) || [])
          if (d.stats) {
            setStats(d.stats as Stats)
          }
          fetchCrmStats(gymList)
        }
      } catch {
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [fetchCrmStats])

  const filteredSubscriptions = useMemo(() => {
    if (selectedGymId === "all") return subscriptions
    return subscriptions.filter(
      (s) => s.subscriptionListingId?.gymId?._id === selectedGymId
    )
  }, [subscriptions, selectedGymId])

  const now = new Date()

  const activeSubscriptions = filteredSubscriptions.filter((s) => s.status === "active")
  const expiringSoon = activeSubscriptions.filter((s) => {
    const end = new Date(s.endDate)
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 7 && daysLeft > 0
  })
  const expiredSubscriptions = filteredSubscriptions.filter((s) => s.status === "expired")
  const totalRevenue = filteredSubscriptions
    .filter((s) => s.status === "active" || s.status === "expired")
    .reduce((sum, s) => sum + (s.subscriptionListingId?.cost || 0), 0)

  // Revenue trend: last 6 months
  const revenueData = useMemo(() => {
    const months: { month: string; revenue: number }[] = []
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = d.toLocaleString("default", { month: "short", year: "2-digit" })
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)

      const monthRevenue = filteredSubscriptions
        .filter((s) => {
          if (s.status !== "active" && s.status !== "expired") return false
          const start = new Date(s.startDate)
          return start >= monthStart && start <= monthEnd
        })
        .reduce((sum, s) => sum + (s.subscriptionListingId?.cost || 0), 0)

      months.push({ month: monthKey, revenue: monthRevenue })
    }
    return months
  }, [filteredSubscriptions])

  // Subscription status breakdown
  const subscriptionBreakdown = useMemo(() => {
    const data = [
      { name: "Active", value: activeSubscriptions.length - expiringSoon.length, fill: PIE_COLORS[0] },
      { name: "Expiring", value: expiringSoon.length, fill: PIE_COLORS[1] },
      { name: "Expired", value: expiredSubscriptions.length, fill: PIE_COLORS[2] },
    ].filter((d) => d.value > 0)
    return data
  }, [activeSubscriptions.length, expiringSoon.length, expiredSubscriptions.length])

  const filteredGyms = selectedGymId === "all" ? gyms : gyms.filter((g) => g._id === selectedGymId)

  const displayStats = useMemo(() => {
    if (selectedGymId === "all") return stats
    return {
      totalGyms: filteredGyms.length,
      publishedGyms: filteredGyms.filter((g) => g.status === "published").length,
      draftGyms: filteredGyms.filter((g) => g.status === "draft").length,
      totalSubscriptions: filteredSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
    }
  }, [selectedGymId, stats, filteredGyms, filteredSubscriptions.length, activeSubscriptions.length])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Gyms",
      value: displayStats.totalGyms,
      icon: Building2,
      description: `${displayStats.publishedGyms} published, ${displayStats.draftGyms} draft`,
    },
    {
      title: "Active Members",
      value: displayStats.activeSubscriptions,
      icon: Users,
      description: `${displayStats.totalSubscriptions} total subscriptions`,
    },
    {
      title: "Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: CreditCard,
      description: selectedGymId === "all" ? "From all subscriptions" : "From selected gym",
    },
    {
      title: "Expiring Soon",
      value: expiringSoon.length,
      icon: AlertTriangle,
      description: "Within next 7 days",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Main Dashboard</h1>
        <p className="text-muted-foreground">Cumulative overview of your gym business — online and offline</p>
      </div>

      {/* Quick Nav */}
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/gym/online">
            <Monitor className="h-4 w-4 mr-2" />
            Online Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/gym/offline">
            <Activity className="h-4 w-4 mr-2" />
            Offline Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Online Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5" /> Online
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      </div>

      {/* Offline Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" /> Offline
        </h2>
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/gym/members">
              Manage Members <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{crmStats.totalMembers}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/gym/members" className="hover:underline">View all members</Link>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Attendance</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{crmStats.todayAttendance}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/gym/attendance" className="hover:underline">Check-in members</Link>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring This Week</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{crmStats.expiringThisWeek}</div>
              <p className="text-xs text-muted-foreground">Members need renewal</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offline Revenue (Month)</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{crmStats.offlineRevenueMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <Link href="/gym/offline-payments" className="hover:underline">View payments</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueChartConfig} className="h-[250px] w-full">
              <BarChart data={revenueData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `₹${Number(value).toLocaleString()}`}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Subscription Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription Status</CardTitle>
            <CardDescription>Active vs Expiring vs Expired</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No subscription data
              </div>
            ) : (
              <ChartContainer config={subscriptionChartConfig} className="h-[250px] w-full">
                <PieChart accessibilityLayer>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={subscriptionBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    strokeWidth={2}
                  >
                    {subscriptionBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            )}
            {subscriptionBreakdown.length > 0 && (
              <div className="flex justify-center gap-4 mt-2">
                {subscriptionBreakdown.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    {entry.name}: {entry.value}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Gyms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Gyms</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/gym/gyms">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGyms.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-8 text-center text-muted-foreground">
                No gyms found. Contact admin to get a gym assigned.
              </CardContent>
            </Card>
          ) : (
            filteredGyms.map((gym) => (
              <Card key={gym._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{gym.name}</CardTitle>
                    <Badge
                      variant={
                        gym.status === "published"
                          ? "default"
                          : gym.status === "draft"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {gym.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {(gym.location as any)?.name || (gym.location as any)?.address?.city || "No location set"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">
                      {gym.priceRange || "No price range"}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/gym/gyms/${gym._id}`}>
                        Manage <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Recent Subscribers */}
      {activeSubscriptions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Subscribers</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/gym/online/members">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {activeSubscriptions.slice(0, 5).map((sub) => {
                  const daysLeft = Math.ceil(
                    (new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <div key={sub._id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="font-medium text-sm">{sub.userId?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {sub.subscriptionListingId?.gymId?.name} — {sub.subscriptionListingId?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ₹{sub.subscriptionListingId?.cost?.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
