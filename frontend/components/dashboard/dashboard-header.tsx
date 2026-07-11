"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface DashboardHeaderProps {
  basePath: string
  dashboardTitle: string
}

export function DashboardHeader({ basePath, dashboardTitle }: DashboardHeaderProps) {
  const pathname = usePathname()

  const segments = pathname
    .replace(basePath, "")
    .split("/")
    .filter(Boolean)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {segments.length === 0 ? (
              <BreadcrumbPage>{dashboardTitle}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink href={basePath}>{dashboardTitle}</BreadcrumbLink>
            )}
          </BreadcrumbItem>
          {segments.map((segment, index) => {
            const href = `${basePath}/${segments.slice(0, index + 1).join("/")}`
            const isLast = index === segments.length - 1
            const label = segment
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())

            return (
              <BreadcrumbItem key={href}>
                <BreadcrumbSeparator />
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  )
}
