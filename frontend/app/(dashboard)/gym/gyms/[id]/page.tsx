"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { apiService, type Gym } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Image, Clock, CreditCard, Save } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function EditGymPage() {
  const params = useParams()
  const gymId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gym, setGym] = useState<Gym | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [priceRange, setPriceRange] = useState("")

  useEffect(() => {
    async function fetchGym() {
      try {
        const res = await apiService.getGymById(gymId)
        if (res.data) {
          const g = res.data
          setGym(g)
          setName(g.name || "")
          setDescription(g.description || "")
          setPhone(g.contact?.phone || "")
          setEmail(g.contact?.email || "")
          setWebsite(g.contact?.website || "")
          setPriceRange(g.priceRange || "")
        }
      } catch {
        toast.error("Failed to load gym")
      } finally {
        setLoading(false)
      }
    }
    fetchGym()
  }, [gymId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await apiService.updateGym(gymId, {
        name,
        description,
        contact: { phone, email, website },
        priceRange,
      })
      if (res.data) {
        toast.success("Gym updated successfully")
        setGym(res.data)
      } else {
        toast.error(res.error || "Failed to update gym")
      }
    } catch {
      toast.error("Failed to update gym")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!gym) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Gym not found
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{gym.name}</h1>
        <p className="text-muted-foreground">Edit gym details and manage sub-sections</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/gym/gyms/${gymId}/plans`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Subscription Plans</p>
                <p className="text-xs text-muted-foreground">Manage pricing plans</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/gym/gyms/${gymId}/portfolio`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <Image className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Portfolio</p>
                <p className="text-xs text-muted-foreground">Manage gym photos</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/gym/gyms/${gymId}/slots`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Time Slots</p>
                <p className="text-xs text-muted-foreground">Manage operating hours</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Gym Details</CardTitle>
          <CardDescription>Update your gym information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Gym Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Gym name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceRange">Price Range</Label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger id="priceRange">
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="mid-range">Mid-Range</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your gym..."
            />
          </div>

          <Separator />

          <h3 className="text-sm font-medium">Contact Information</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="gym@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
