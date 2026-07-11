"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { apiService, type VisitStats, type RevenueSummary } from "@/lib/api"
import { useGymSelector } from "@/contexts/gym-selector-context"
import { toast } from "sonner"
import { Users, ClipboardCheck, AlertTriangle, Wallet, ArrowRight, Loader2, UserCheck, LogIn } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function OfflineDashboardPage() {
  const [loading, setLoading] = useState(true)
  const { selectedGymId, gyms } = useGymSelector()

  const [stats, setStats] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    currentlyIn: 0,
    expiringThisWeek: 0,
  })
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null)

  const activeGymId = selectedGymId && selectedGymId !== "all" ? selectedGymId : gyms[0]?._id

  const fetchData = useCallback(async () => {
    if (!activeGymId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [membersRes, visitStatsRes, expiringRes, revenueRes] = await Promise.all([
        apiService.getGymMembers(activeGymId, { limit: 1 }),
        apiService.getVisitStats(activeGymId),
        apiService.getExpiringMembers(activeGymId, 7),
        apiService.getRevenueSummary(activeGymId),
      ])

      const visitStats = visitStatsRes.data as VisitStats | undefined
      setStats({
        totalMembers: membersRes.data?.pagination.total || 0,
        todayAttendance: visitStats?.today || 0,
        currentlyIn: visitStats?.currentlyIn || 0,
        expiringThisWeek: (expiringRes.data as any)?.length || 0,
      })
      setRevenue((revenueRes.data as RevenueSummary) || null)
    } catch {
      toast.error("Failed to load offline dashboard data")
    } finally {
      setLoading(false)
    }
  }, [activeGymId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!activeGymId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a gym first</p>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Offline Members",
      value: stats.totalMembers,
      icon: UserCheck,
      description: "Registered walk-in members",
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      icon: ClipboardCheck,
      description: "Check-ins today",
    },
    {
      title: "Currently In",
      value: stats.currentlyIn,
      icon: LogIn,
      description: "Members currently in gym",
    },
    {
      title: "Expiring This Week",
      value: stats.expiringThisWeek,
      icon: AlertTriangle,
      description: "Members need renewal",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offline Dashboard</h1>
        <p className="text-muted-foreground">Walk-in members, attendance, and offline payments</p>
      </div>

      {/* Stat Cards */}
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

      {/* Offline Revenue Summary */}
      {revenue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Offline Revenue</CardTitle>
            <CardDescription>Revenue from offline payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Today</p>
                <p className="text-lg font-bold">₹{revenue.today?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{revenue.today?.count || 0} payments</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">This Week</p>
                <p className="text-lg font-bold">₹{revenue.thisWeek?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{revenue.thisWeek?.count || 0} payments</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">This Month</p>
                <p className="text-lg font-bold">₹{revenue.thisMonth?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{revenue.thisMonth?.count || 0} payments</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">All Time</p>
                <p className="text-lg font-bold">₹{revenue.allTime?.total?.toLocaleString() || 0}</p>
                <p className="text-xs text-muted-foreground">{revenue.allTime?.count || 0} payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue by Payment Method */}
      {revenue && revenue.byMethod && revenue.byMethod.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenue.byMethod.map((method) => (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium capitalize">{method.method.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{method.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{method.count} payments</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="h-auto py-4 justify-start" asChild>
            <Link href="/gym/members">
              <Users className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Manage Members</p>
                <p className="text-xs text-muted-foreground">Add, edit, view offline members</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start" asChild>
            <Link href="/gym/attendance">
              <ClipboardCheck className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Attendance</p>
                <p className="text-xs text-muted-foreground">Check-in and check-out members</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start" asChild>
            <Link href="/gym/offline-payments">
              <Wallet className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Offline Payments</p>
                <p className="text-xs text-muted-foreground">Record and track payments</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
