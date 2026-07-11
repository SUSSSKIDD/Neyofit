"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AuthGuardProps {
  children: React.ReactNode
  allowedUserTypes: string[]
}

const dashboardRoutes: Record<string, string> = {
  superadmin: "/platform",
  gym: "/gym",
  customer: "/customer",
}

export function AuthGuard({ children, allowedUserTypes }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user) {
      router.push("/login")
      return
    }

    if (!allowedUserTypes.includes(user.userType)) {
      const redirect = dashboardRoutes[user.userType] || "/login"
      router.push(redirect)
    }
  }, [isLoading, isAuthenticated, user, allowedUserTypes, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isAuthenticated || !user || !allowedUserTypes.includes(user.userType)) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
