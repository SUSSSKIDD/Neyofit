"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { apiService, type Gym } from "@/lib/api"
import { toast } from "sonner"
import { Building2, Loader2, ArrowRight, AlertCircle, RefreshCw } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function GymOwnerGymsPage() {
  const [loading, setLoading] = useState(true)
  const [gyms, setGyms] = useState<Gym[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGyms() {
      setLoading(true)
      setError(null)
      console.log("[GymOwnerGyms] Fetching gyms...")
      try {
        const res = await apiService.getGyms({ status: "published" })
        console.log("[GymOwnerGyms] Response:", res)
        
        if (res.success && res.data) {
          const d = res.data as { gyms?: Gym[]; total?: number }
          setGyms(d.gyms || [])
        } else {
          console.warn("[GymOwnerGyms] API warning:", res.error || res.message)
          setError(res.error || res.message || "Failed to load gyms")
          toast.error(res.error || "Failed to load gyms")
        }
      } catch (e) {
        console.error("[GymOwnerGyms] Failed to load gyms:", e)
        setError("Failed to load gyms. Please try again.")
        toast.error("Failed to load gyms")
      } finally {
        setLoading(false)
      }
    }
    fetchGyms()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading gyms...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Gyms</h1>
          <p className="text-muted-foreground">Manage your gym listings</p>
        </div>
        <Alert variant="destructive" className="flex flex-col items-center text-center p-8">
          <AlertCircle className="h-12 w-12 mb-4" />
          <AlertDescription className="text-lg">{error}</AlertDescription>
          <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Gyms</h1>
        <p className="text-muted-foreground">Manage your gym listings</p>
      </div>

      {gyms.length === 0 ? (
        <Card className="border-dashed border-orange-300">
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No gyms yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have any gyms assigned. Contact admin to get a gym assigned to your account.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/search">
                <ArrowRight className="mr-1 h-3 w-3" />
                Browse Gyms
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gyms.map((gym) => (
            <Link key={gym._id} href={`/gym/gyms/${gym._id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
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
                    {gym.location?.address
                      ? `${gym.location.address.city}, ${gym.location.address.state}`
                      : "No location set"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {gym.priceRange || "No price range"}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      {gym.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center text-sm text-primary">
                    Manage gym <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
