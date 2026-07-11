"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, Star, Trash2, ArrowRight, Dumbbell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiService } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function CustomerReviewsPage() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const res = await apiService.getUserReviews(user!._id || (user as any).id)
        if (res.success && res.data) {
          setReviews(Array.isArray(res.data) ? res.data : [])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleDelete = async (reviewId: string) => {
    try {
      const res = await apiService.deleteReview(reviewId)
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId && r._id !== reviewId))
        toast.success("Review deleted")
      } else {
        toast.error(res.message || "Failed to delete review")
      }
    } catch (e) {
      toast.error("Failed to delete review")
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Reviews</h1>
          <p className="text-muted-foreground">Reviews you&apos;ve written for gyms</p>
        </div>
        <Button asChild>
          <Link href="/gyms">
            Write a Review <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <Dumbbell className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="mb-3">You haven&apos;t written any reviews yet.</p>
            <Button asChild variant="outline">
              <Link href="/gyms">Browse Gyms to Review</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => {
            const gymId = review.gym?._id || review.gymId?._id || review.gymId
            const gymName = review.gym?.name || review.gymId?.name || "Gym"

            return (
              <Card key={review.id || review._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{gymName}</CardTitle>
                      {gymId && typeof gymId === "string" && (
                        <Button asChild variant="ghost" size="sm" className="h-auto py-0 px-1 text-xs text-blue-600">
                          <Link href={`/gyms/${gymId}`}>View Gym</Link>
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(review.id || review._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="text-sm text-muted-foreground ml-2">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
