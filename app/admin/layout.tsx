"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LogOut, Shield, CheckCircle2, AlertCircle, Wrench } from "lucide-react"
import { getStoredAdmin, logoutAdmin, type AdminUser } from "@/lib/unified-auth-system"

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

  const getConnectionIndicator = () => {
    return connectionStatus === "connected" ? (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">Connected</span>
      </div>
    ) : (
      <div className="flex items-center gap-1 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-xs hidden sm:inline">Disconnected</span>
      </div>
    )
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
    return <>{children}</>
  }

  // For other admin routes, provide a minimal header
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link
                href="/admin"
                className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity min-w-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg shadow-lg flex items-center justify-center p-1 flex-shrink-0">
                  <Shield className="w-full h-full text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-sm lg:text-base font-bold text-white drop-shadow-lg truncate">
                    DataFlex Admin Portal
                  </h1>
                  <p className="text-blue-100 text-xs truncate hidden sm:block">
                    Welcome back, {adminUser?.full_name || adminUser?.email}
                  </p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {getConnectionIndicator()}
              <Link href="/admin/maintenance">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
                >
                  <Wrench className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Maintenance</span>
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-7 sm:h-8 px-1.5 sm:px-2 text-xs"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">{children}</main>
    </div>
  )
}
