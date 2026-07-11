"use client"

import {
  LayoutDashboard,
  Building2,
  Users,
  ShoppingCart,
  Wallet,
  Settings,
  Shield,
} from "lucide-react"
import { DashboardShell, type NavGroup } from "@/components/dashboard/dashboard-shell"

const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/platform", icon: LayoutDashboard },
    ],
  },
  {
    label: "Gyms",
    items: [
      { title: "All Gyms", href: "/platform/gyms", icon: Building2 },
    ],
  },
  {
    label: "Revenue",
    items: [
      { title: "Orders", href: "/platform/orders", icon: ShoppingCart },
      { title: "Payouts", href: "/platform/payouts", icon: Wallet },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Users", href: "/platform/users", icon: Users },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "Platform Settings", href: "/platform/settings", icon: Settings },
    ],
  },
]

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navGroups={navGroups}
      dashboardTitle="Platform Admin"
      dashboardIcon={Shield}
      basePath="/platform"
      allowedUserTypes={["superadmin"]}
    >
      {children}
    </DashboardShell>
  )
}
