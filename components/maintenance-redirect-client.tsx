"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ADMIN_AUTH_PATHS = new Set([
  "/admin/login",
  "/api/admin/login",
  "/api/admin/verify-2fa",
])

function hasAdminCookie(): boolean {
  if (typeof document === "undefined") return false
  return document.cookie.includes("admin_user=") || document.cookie.includes("admin_id=")
}

function shouldSkipMaintenanceRedirect(pathname: string): boolean {
  if (pathname === "/maintenance" || pathname.startsWith("/api/maintenance")) {
    return true
  }

  if (ADMIN_AUTH_PATHS.has(pathname) || pathname.startsWith("/api/admin/2fa/")) {
    return true
  }

  if (
    (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/")) &&
    hasAdminCookie()
  ) {
    return true
  }

  return false
}

export function MaintenanceRedirectClient() {
  const pathname = usePathname()

  useEffect(() => {
    if (shouldSkipMaintenanceRedirect(pathname)) {
      return
    }

    let cancelled = false

    const checkMaintenance = async () => {
      try {
        const response = await fetch(`/api/maintenance?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        })

        if (cancelled || !response.ok) return

        const data = await response.json()
        if (data?.success && data?.data?.isEnabled) {
          window.location.replace("/maintenance")
        }
      } catch {
        /* ignore network errors */
      }
    }

    checkMaintenance()
    const interval = setInterval(checkMaintenance, 30000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pathname])

  return null
}
