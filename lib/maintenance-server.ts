import { cookies } from "next/headers"
import { getAdminClient } from "@/lib/supabase-base"
import type { MaintenanceMode } from "@/lib/maintenance-mode"

export async function fetchMaintenanceStatusServer(): Promise<MaintenanceMode | null> {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from("maintenance_mode")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !data) return null

    return {
      isEnabled: Boolean(data.is_enabled),
      title: data.title,
      message: data.message,
      estimatedCompletion: data.estimated_completion,
      countdownEnabled: Boolean(data.countdown_enabled),
      countdownEndTime: data.countdown_end_time,
      updatedAt: data.updated_at,
    }
  } catch {
    return null
  }
}

export function isMaintenanceAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/fonts") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname === "/manifest.json" ||
    pathname === "/site.webmanifest" ||
    pathname === "/browserconfig.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  )
}

export function isAdminAuthPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/verify-2fa" ||
    pathname.startsWith("/api/admin/2fa/")
  )
}

export function isAdminPanelPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/")
  )
}

export function isMaintenancePagePath(pathname: string): boolean {
  return pathname === "/maintenance" || pathname.startsWith("/api/maintenance")
}

export async function hasAdminSessionServer(): Promise<boolean> {
  const cookieStore = await cookies()
  const adminCookie = cookieStore.get("admin_user")
  if (adminCookie?.value) {
    try {
      const adminData = JSON.parse(decodeURIComponent(adminCookie.value))
      if (adminData?.id) return true
    } catch {
      if (adminCookie.value.trim()) return true
    }
  }

  const adminIdCookie = cookieStore.get("admin_id")
  return Boolean(adminIdCookie?.value?.trim())
}

export async function shouldBypassMaintenanceServer(pathname: string): Promise<boolean> {
  if (isMaintenancePagePath(pathname) || isMaintenanceAssetPath(pathname)) {
    return true
  }

  if (isAdminAuthPath(pathname)) {
    return true
  }

  if (isAdminPanelPath(pathname) && (await hasAdminSessionServer())) {
    return true
  }

  if ((await hasAdminSessionServer()) && pathname.startsWith("/api/")) {
    return true
  }

  return false
}
