"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { apiService } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Upload, Trash2, ImageIcon } from "lucide-react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface GymPicture {
  _id: string
  gymId: string
  filePath?: string
  fileName: string
  imageUrl?: string
  isCover?: boolean
}


export default function GymPortfolioPage() {
  const params = useParams()
  const gymId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [pictures, setPictures] = useState<GymPicture[]>([])

  const fetchPictures = async () => {
    try {
      const res = await apiService.getGymPictures(gymId)
      // Backend returns { success, data: [...] }
      const pics = res.data || (res as any).pictures || []
      setPictures(Array.isArray(pics) ? pics : [])
    } catch {
      toast.error("Failed to load pictures")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPictures()
  }, [gymId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"]

    // Pre-validate before sending to server
    const oversized = fileArray.filter(f => f.size > MAX_SIZE)
    if (oversized.length > 0) {
      toast.error(
        `File too large (max 10MB): ${oversized.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`).join(", ")}`
      )
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    const invalidType = fileArray.filter(f => !ALLOWED_TYPES.includes(f.type))
    if (invalidType.length > 0) {
      toast.error(
        `Invalid file type: ${invalidType.map(f => `${f.name} (${f.type || "unknown"})`).join(", ")}. Allowed: JPEG, PNG, WebP, GIF, SVG`
      )
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setUploading(true)
    try {
      const captions = fileArray.map(() => "")
      const isCover = fileArray.map(() => false)

      const res = await apiService.bulkUploadGymPictures(gymId, fileArray, captions, isCover)
      if (res.data) {
        toast.success(`${res.data.uploaded} picture(s) uploaded successfully`)
        fetchPictures()
      } else {
        toast.error(res.error || res.message || "Upload failed. Please try again.")
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Upload failed. Please try again."
      toast.error(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDelete = async (pictureId: string) => {
    if (!confirm("Are you sure you want to delete this picture?")) return

    try {
      const res = await apiService.deleteGymPicture(pictureId)
      if (res.data) {
        toast.success("Picture deleted")
        setPictures((prev) => prev.filter((p) => p._id !== pictureId))
      } else {
        toast.error(res.error || "Failed to delete picture")
      }
    } catch {
      toast.error("Failed to delete picture")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">Manage gym photos</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload Photos
          </Button>
        </div>
      </div>

      {pictures.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No photos yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Upload photos to showcase your gym
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {pictures.map((pic) => (
            <Card key={pic._id} className="overflow-hidden group relative">
              <div className="aspect-square relative">
                {pic.imageUrl ? (
                  <img
                    src={pic.imageUrl}
                    alt={pic.fileName}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {pic.isCover && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Cover
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(pic._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-2">
                <p className="text-xs text-muted-foreground truncate">
                  {pic.fileName}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
