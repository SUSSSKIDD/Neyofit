"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Heart, Trash2, Loader2, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function CustomerFavoritesPage() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const res = await apiService.getUserFavorites()
        if (res.success && res.data) {
          setFavorites(Array.isArray(res.data) ? res.data : [])
        }
      } catch {
        toast.error("Failed to load favorites")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleRemove = async (gymId: string) => {
    setRemovingId(gymId)
    try {
      const res = await apiService.removeFavorite(gymId)
      if (res.success) {
        setFavorites((prev) => prev.filter((f) => {
          const fGymId = f.gymId?._id || f.gymId
          return fGymId !== gymId
        }))
        toast.success("Removed from favorites")
      } else {
        toast.error("Failed to remove")
      }
    } catch {
      toast.error("Failed to remove")
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Favorite Gyms</h1>
        <p className="text-muted-foreground">Gyms you&apos;ve saved for later</p>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No favorite gyms yet.</p>
            <Button asChild className="mt-4">
              <Link href="/gyms">Browse Gyms</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => {
            const gym = fav.gymId
            const gymId = gym?._id || gym
            const gymName = gym?.name || "Gym"
            const location = gym?.location?.address
            const locationText = [location?.city, location?.state].filter(Boolean).join(", ")

            return (
              <Card key={fav._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{gymName}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={removingId === gymId}
                      onClick={() => handleRemove(gymId)}
                    >
                      {removingId === gymId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {locationText && (
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3 mr-1" />
                      {locationText}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Saved on {new Date(fav.createdAt).toLocaleDateString()}
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href={`/gyms/${gymId}`}>View Gym</Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
