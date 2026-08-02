"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { DisableGlobalLinkPrefetch } from "@/components/disable-global-link-prefetch"
import { MenuScrollHandler } from "@/components/menu-scroll-handler"
import { AnalyticsRoot } from "@/components/analytics/AnalyticsRoot"
import { MaintenanceRedirectClient } from "@/components/maintenance-redirect-client"
import { DevConsoleDetector } from "@/components/dev-console-detector"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"

function isMaintenancePath(pathname: string): boolean {
  return pathname === "/maintenance" || pathname.startsWith("/maintenance/")
}

export function RootLayoutBody({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const onMaintenancePage = isMaintenancePath(pathname)

  return (
    <>
      {!onMaintenancePage && <DisableGlobalLinkPrefetch />}
      {!onMaintenancePage && <MenuScrollHandler />}
      {!onMaintenancePage && <AnalyticsRoot />}
      {!onMaintenancePage && <MaintenanceRedirectClient />}
      {children}
      {!onMaintenancePage && <Toaster />}
      {!onMaintenancePage && <SonnerToaster position="top-right" richColors closeButton />}
      {!onMaintenancePage && <DevConsoleDetector />}
    </>
  )
}
