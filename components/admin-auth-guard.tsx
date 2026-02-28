"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentAdmin, getAdminToken, verifyAdminSession, clearAdminSession } from "@/lib/auth"
import type { AdminUser } from "@/lib/auth"

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication...")

      const currentAdmin = getCurrentAdmin()
      const token = getAdminToken()

      console.log("Current admin:", currentAdmin)
      console.log("Token exists:", !!token)

      if (!currentAdmin || !token) {
        console.log("No admin or token found, redirecting to login")
        setIsAuthenticated(false)
        router.push("/admin/login")
        return
      }

      // Verify session with server
      const { valid, user } = await verifyAdminSession(token)

      console.log("Session verification:", { valid, user })

      if (valid && user) {
        setAdmin(user)
        setIsAuthenticated(true)
        console.log("Authentication successful")
      } else {
        console.log("Session invalid, clearing and redirecting")
        clearAdminSession()
        setIsAuthenticated(false)
        router.push("/admin/login")
      }
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verifying authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
