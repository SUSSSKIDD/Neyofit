"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, CreditCard, Dumbbell, Calendar, Activity, ArrowRight, Clock, Search, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"

export default function CustomerDashboardPage() {
  const [gymPasses, setGymPasses] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [passesRes, paymentsRes] = await Promise.all([
          apiService.getActiveGymPasses(),
          apiService.getUserPayments(),
        ])
        if (passesRes.success && passesRes.data) {
          const data = passesRes.data as any
          setGymPasses(data.subscriptions || [])
        }
        if (paymentsRes.success && paymentsRes.data) {
          setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : [])
        }
      } catch (e) {
        console.error("Failed to load dashboard:", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const activeCount = gymPasses.length
  const paidPayments = payments.filter((p: any) => p.status === "paid")
  const totalSpent = paidPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const totalPayments = payments.length
  const recentPayments = payments.slice(0, 5)

  // Find nearest-expiring active pass
  const nearestExpiringPass = gymPasses.length > 0
    ? gymPasses.reduce((nearest: any, pass: any) => {
        const end = new Date(pass.endDate).getTime()
        const nearestEnd = nearest ? new Date(nearest.endDate).getTime() : Infinity
        return end < nearestEnd ? pass : nearest
      }, null)
    : null

  const daysUntilExpiry = nearestExpiringPass
    ? Math.max(0, Math.ceil((new Date(nearestExpiringPass.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s your fitness overview.</p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Passes</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">Current memberships</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Days Until Expiry</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount > 0 ? daysUntilExpiry : "—"}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount > 0 ? "Nearest pass expiry" : "No active passes"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime spending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Pass Spotlight */}
      {nearestExpiringPass && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-orange-600" />
              Active Pass Spotlight
            </CardTitle>
            <CardDescription>Your nearest expiring gym pass</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const pass = nearestExpiringPass
              const listing = pass.subscriptionListingId
              const gym = listing?.gymId
              const start = new Date(pass.startDate)
              const end = new Date(pass.endDate)
              const now = new Date()
              const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
              const daysUsed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
              const progressPercent = Math.min(100, Math.max(0, (daysUsed / totalDays) * 100))
              const daysLeft = Math.max(0, totalDays - daysUsed)

              return (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Circular Progress Ring */}
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="42"
                        stroke="#e5e7eb" strokeWidth="8" fill="none"
                      />
                      <circle
                        cx="50" cy="50" r="42"
                        stroke={daysLeft <= 7 ? "#ef4444" : "#f97316"}
                        strokeWidth="8" fill="none"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold">{daysUsed}</span>
                      <span className="text-[10px] text-muted-foreground">of {totalDays} days</span>
                    </div>
                  </div>

                  {/* Pass Details */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h3 className="text-lg font-semibold">{gym?.name || "Gym"}</h3>
                    <p className="text-sm text-muted-foreground">{listing?.name || "Plan"}</p>
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                      <Badge variant={daysLeft > 7 ? "default" : "destructive"}>
                        {daysLeft} days left
                      </Badge>
                      <Badge variant="outline">
                        Expires {end.toLocaleDateString()}
                      </Badge>
                    </div>
                    {gym?._id && (
                      <Button asChild size="sm" variant="outline" className="mt-2">
                        <Link href={`/gyms/${gym._id}`}>
                          View Gym <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/customer/payments">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((p: any) => {
                const sub = p.subscriptionId
                const listing = sub?.subscriptionListingId
                const gym = listing?.gymId
                return (
                  <div key={p._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">₹{p.amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {gym?.name || listing?.name || ""}{" "}
                        {gym?.name && listing?.name ? `— ${listing.name}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={p.status === "paid" ? "default" : p.status === "failed" ? "destructive" : "secondary"}>
                      {p.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/gyms" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Browse Gyms
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/customer/payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            View All Payments
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/customer/reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            My Reviews
          </Link>
        </Button>
      </div>
    </div>
  )
}
