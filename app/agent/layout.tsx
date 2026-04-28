"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from 'next/navigation'
import { getStoredAgent, type Agent, logoutAgent } from "@/lib/unified-auth-system"
import { AgentSecurityProvider } from "@/components/agent/AgentSecurityProvider"

interface AgentLayoutProps {
  children: React.ReactNode
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        const storedAgent = getStoredAgent()

        if (!storedAgent) {
          if (mounted && pathname !== "/agent/login" && pathname !== "/agent/register" && pathname !== "/agent/registration-payment" && pathname !== "/agent/registration-complete") {
            router.push("/agent/login")
          }
          return
        }

        if (mounted) {
          setAgent(storedAgent)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        if (mounted && pathname !== "/agent/login" && pathname !== "/agent/register" && pathname !== "/agent/registration-payment" && pathname !== "/agent/registration-complete") {
          router.push("/agent/login")
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
      if (e.key === "agent" && !e.newValue) {
        setAgent(null)
        if (pathname !== "/agent/login" && pathname !== "/agent/register" && pathname !== "/agent/registration-payment" && pathname !== "/agent/registration-complete") {
          router.push("/agent/login")
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      mounted = false
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router, pathname])

  const handleLogout = async () => {
    try {
      await logoutAgent()
      router.push("/agent/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/agent/login")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (pathname === "/agent/login" || pathname === "/agent/register" || pathname === "/agent/registration-payment" || pathname === "/agent/registration-complete") {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">{children}</div>
  }

  if (!agent) {
    return null
  }

  return (
    <AgentSecurityProvider
      enabled={true}
      inactivityTimeoutMinutes={15}
      showWarningMinutes={0}
    >
      {children}
    </AgentSecurityProvider>
  )
}
