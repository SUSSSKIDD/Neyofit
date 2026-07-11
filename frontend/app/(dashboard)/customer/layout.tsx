"use client"

import {
  LayoutDashboard,
  CreditCard,
  Heart,
  Star,
  Wallet,
  Settings,
  Dumbbell,
} from "lucide-react"
import { DashboardShell, type NavGroup } from "@/components/dashboard/dashboard-shell"

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/customer", icon: LayoutDashboard },
    ],
  },
  {
    label: "Fitness",
    items: [
      { title: "Subscriptions", href: "/customer/subscriptions", icon: CreditCard },
      { title: "Favorites", href: "/customer/favorites", icon: Heart },
      { title: "Reviews", href: "/customer/reviews", icon: Star },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", href: "/customer/payments", icon: Wallet },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Account", href: "/customer/settings", icon: Settings },
    ],
  },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navGroups={navGroups}
      dashboardTitle="My Dashboard"
      dashboardIcon={Dumbbell}
      basePath="/customer"
      allowedUserTypes={["customer"]}
    >
      {children}
    </DashboardShell>
  )
}
