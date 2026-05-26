"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase-client";
import { getStoredAdmin, logoutAdmin, type AdminUser } from "@/lib/unified-auth-system"
import { AdminCallWidget } from "@/components/admin-call-widget"
import { AdminHeader } from "@/components/admin/AdminHeader"
import { AdminConnectionStatus } from "@/components/admin/AdminConnectionStatus"

export { getStoredAdmin } from "@/lib/unified-auth-system"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("connected")

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const storedAdmin = getStoredAdmin()

        if (!storedAdmin) {
          if (mounted && pathname !== "/admin/login") {
            router.push("/admin/login")
          }
          return
        }

        if (mounted) {
          setAdminUser(storedAdmin)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        if (mounted && pathname !== "/admin/login") {
          router.push("/admin/login")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin_user" && !e.newValue) {
        setAdminUser(null)
        if (pathname !== "/admin/login") {
          router.push("/admin/login")
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Simple connection check (every 30 seconds)
    const connectionCheck = setInterval(async () => {
      if (!mounted) return

      try {
        const { error } = await supabase.from("agents").select("id").limit(1)

        setConnectionStatus(error ? "disconnected" : "connected")
      } catch {
        setConnectionStatus("disconnected")
      }
    }, 30000)

    return () => {
      mounted = false
      window.removeEventListener("storage", handleStorageChange)
      clearInterval(connectionCheck)
    }
  }, [router, pathname])

  const handleLogout = async () => {
    try {
      await logoutAdmin()
      router.push("/admin/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/admin/login")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">{children}</div>
  }

  if (!adminUser) {
    return null
  }

  // For the main admin dashboard, render without additional wrapper
  if (pathname === "/admin" || pathname === "/admin/") {
    return (
      <>
        {children}
        <AdminCallWidget />
      </>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <AdminHeader
        displayName={adminUser.full_name}
        adminEmail={adminUser.email}
        connectionIndicator={
          <AdminConnectionStatus
            variant="db"
            status={connectionStatus === "connected" ? "connected" : "disconnected"}
          />
        }
        showMaintenanceLink
        onLogout={handleLogout}
      />
      <main className="container mx-auto max-w-full px-3 py-4 sm:px-4 sm:py-6">{children}</main>
      <AdminCallWidget />
    </div>
  )
}
