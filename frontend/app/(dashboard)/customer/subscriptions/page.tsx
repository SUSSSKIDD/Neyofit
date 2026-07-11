"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, CreditCard, Clock, Dumbbell, MapPin, ArrowRight, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"

export default function CustomerSubscriptionsPage() {
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([])
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [activeRes, allRes] = await Promise.all([
          apiService.getActiveGymPasses(),
          apiService.getUserSubscriptions(),
        ])

        const activeSubs: any[] = []
        if (activeRes.success && activeRes.data) {
          const data = activeRes.data as any
          activeSubs.push(...(data.subscriptions || []))
        }
        setActiveSubscriptions(activeSubs)

        // Get all subscriptions and filter out active ones
        if (allRes.success && allRes.data) {
          const allSubs = Array.isArray(allRes.data) ? allRes.data : []
          const activeIds = new Set(activeSubs.map((s: any) => s._id))
          setExpiredSubscriptions(allSubs.filter((s: any) => !activeIds.has(s._id)))
        }
      } catch (e) {
        console.error(e)
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

  const nextExpiry = activeSubscriptions.length > 0
    ? activeSubscriptions.reduce((nearest: any, sub: any) => {
        const end = new Date(sub.endDate).getTime()
        const nearestEnd = nearest ? new Date(nearest.endDate).getTime() : Infinity
        return end < nearestEnd ? sub : nearest
      }, null)
    : null

  const nextExpiryDate = nextExpiry
    ? new Date(nextExpiry.endDate).toLocaleDateString()
    : "—"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Subscriptions</h1>
        <p className="text-muted-foreground">Your gym memberships and passes</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Passes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Expiry</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{nextExpiryDate}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Subscriptions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Active</h2>
        {activeSubscriptions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Dumbbell className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="mb-3">No active subscriptions.</p>
              <Button asChild>
                <Link href="/gyms">Browse Gyms</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeSubscriptions.map((sub: any) => {
              const listing = sub.subscriptionListingId
              const gym = listing?.gymId
              const location = gym?.locationId as any
              const city = location?.address?.city
              const state = location?.address?.state
              const locationText = [city, state].filter(Boolean).join(", ")
              const start = new Date(sub.startDate)
              const end = new Date(sub.endDate)
              const now = new Date()
              const total = end.getTime() - start.getTime()
              const elapsed = now.getTime() - start.getTime()
              const progress = Math.min(100, Math.max(0, (elapsed / total) * 100))
              const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

              return (
                <Card key={sub._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{gym?.name || "Gym"}</CardTitle>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-medium">{listing?.name}</p>
                      <p className="text-sm text-muted-foreground">{listing?.type} plan</p>
                      {listing?.cost && (
                        <p className="text-sm font-semibold mt-1">₹{listing.cost}</p>
                      )}
                    </div>
                    {locationText && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {locationText}
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{daysLeft} days remaining</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Started: {start.toLocaleDateString()}</span>
                        <span>Expires: {end.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {gym?._id && (
                        <Button asChild size="sm" variant="outline" className="flex-1">
                          <Link href={`/gyms/${gym._id}`}>
                            View Gym <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                      {daysLeft <= 7 && gym?._id && listing?._id && (
                        <Button asChild size="sm" className="flex-1">
                          <Link href={`/checkout?gym=${gym._id}&subscription=${listing._id}`}>
                            <RefreshCw className="mr-1 h-3 w-3" /> Renew
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Expired / Completed Subscriptions */}
      {expiredSubscriptions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Expired / Completed</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {expiredSubscriptions.map((sub: any) => {
              const listing = sub.subscriptionListingId
              const gym = typeof listing?.gymId === "object" ? listing.gymId : null
              const start = new Date(sub.startDate)
              const end = new Date(sub.endDate)

              return (
                <Card key={sub._id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{gym?.name || "Gym"}</CardTitle>
                      <Badge variant="secondary">{sub.status || "expired"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium">{typeof listing === "object" ? listing?.name : "Plan"}</p>
                      {typeof listing === "object" && listing?.cost && (
                        <p className="text-sm font-semibold">₹{listing.cost}</p>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{start.toLocaleDateString()}</span>
                      <span>{end.toLocaleDateString()}</span>
                    </div>
                    {gym?._id && typeof listing === "object" && listing?._id && (
                      <Button asChild size="sm" className="w-full">
                        <Link href={`/checkout?gym=${gym._id}&subscription=${listing._id}`}>
                          <RefreshCw className="mr-1 h-3 w-3" /> Renew Subscription
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
