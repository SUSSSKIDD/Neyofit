"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, type LucideIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AuthGuard } from "./auth-guard"
import { DashboardHeader } from "./dashboard-header"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string | number
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

interface DashboardShellProps {
  children: React.ReactNode
  navGroups: NavGroup[]
  dashboardTitle: string
  dashboardIcon: LucideIcon
  basePath: string
  allowedUserTypes: string[]
  gymSelector?: React.ReactNode
}

function DashboardSidebar({
  navGroups,
  dashboardTitle,
  dashboardIcon: Icon,
  basePath,
  gymSelector,
}: Omit<DashboardShellProps, "children" | "allowedUserTypes">) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={basePath}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{dashboardTitle}</span>
                  <span className="truncate text-xs text-muted-foreground">Neyofit</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {gymSelector && (
        <div className="px-3 py-2 border-b">
          {gymSelector}
        </div>
      )}

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== basePath && pathname.startsWith(item.href + "/"))
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-medium">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 group-data-[collapsible=icon]:hidden"
                onClick={() => logout()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export function DashboardShell({
  children,
  navGroups,
  dashboardTitle,
  dashboardIcon,
  basePath,
  allowedUserTypes,
  gymSelector,
}: DashboardShellProps) {
  return (
    <AuthGuard allowedUserTypes={allowedUserTypes}>
      <SidebarProvider>
        <DashboardSidebar
          navGroups={navGroups}
          dashboardTitle={dashboardTitle}
          dashboardIcon={dashboardIcon}
          basePath={basePath}
          gymSelector={gymSelector}
        />
        <SidebarInset>
          <DashboardHeader basePath={basePath} dashboardTitle={dashboardTitle} />
          <div className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
