"use client"

import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  User,
  Settings,
  ClipboardCheck,
  Wallet,
  Monitor,
  Activity,
  UserCheck,
} from "lucide-react"
import { DashboardShell, type NavGroup } from "@/components/dashboard/dashboard-shell"
import { GymSelectorProvider, useGymSelector } from "@/contexts/gym-selector-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { title: "Main Dashboard", href: "/gym", icon: LayoutDashboard },
    ],
  },
  {
    label: "Online",
    items: [
      { title: "Dashboard", href: "/gym/online", icon: Monitor },
      { title: "Members", href: "/gym/online/members", icon: Users },
      { title: "Payments", href: "/gym/payments", icon: CreditCard },
    ],
  },
  {
    label: "Offline",
    items: [
      { title: "Dashboard", href: "/gym/offline", icon: Activity },
      { title: "Members", href: "/gym/members", icon: UserCheck },
      { title: "Attendance", href: "/gym/attendance", icon: ClipboardCheck },
      { title: "Payments", href: "/gym/offline-payments", icon: Wallet },
    ],
  },
  {
    label: "Gyms",
    items: [
      { title: "Gyms", href: "/gym/gyms", icon: Building2 },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Profile", href: "/gym/profile", icon: User },
      { title: "Settings", href: "/gym/settings", icon: Settings },
    ],
  },
]

function GymSelectorDropdown() {
  const { gyms, selectedGymId, setSelectedGymId } = useGymSelector()

  if (gyms.length <= 1) return null

  return (
    <Select value={selectedGymId} onValueChange={setSelectedGymId}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Select gym" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Gyms</SelectItem>
        {gyms.map((gym) => (
          <SelectItem key={gym._id} value={gym._id}>
            {gym.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function GymOwnerLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navGroups={navGroups}
      dashboardTitle="Gym Dashboard"
      dashboardIcon={Building2}
      basePath="/gym"
      allowedUserTypes={["gym"]}
      gymSelector={<GymSelectorDropdown />}
    >
      {children}
    </DashboardShell>
  )
}

export default function GymOwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <GymSelectorProvider>
      <GymOwnerLayoutInner>{children}</GymOwnerLayoutInner>
    </GymSelectorProvider>
  )
}
