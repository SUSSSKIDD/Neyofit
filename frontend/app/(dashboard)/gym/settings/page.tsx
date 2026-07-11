"use client"

import { useEffect, useState } from "react"
import { apiService, type User } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Mail, KeyRound } from "lucide-react"
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

export default function GymSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await apiService.verifyToken()
        if (res.data?.user) {
          setUser(res.data.user)
        }
      } catch {
        toast.error("Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleSendResetEmail = async () => {
    if (!user?.email) return
    setSending(true)
    try {
      const res = await apiService.forgotPassword(user.email)
      if (res.data || res.success) {
        toast.success("Password reset email sent. Check your inbox.")
      } else {
        toast.error(res.error || "Failed to send reset email")
      }
    } catch {
      toast.error("Failed to send reset email")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load settings
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Account and security settings</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Change your password by requesting a reset email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
          </div>

          <Separator />

          <p className="text-sm text-muted-foreground">
            Click the button below to receive a password reset link at your registered email address.
          </p>

          <Button onClick={handleSendResetEmail} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send Password Reset Email
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
