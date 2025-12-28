"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Shield, ExternalLink, Loader2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAgentSubAdminRole } from "@/lib/sub-admin-utils"
import { getStoredAgent } from "@/lib/unified-auth-system"
import { useRouter } from "next/navigation"

interface AdminPortalAccessProps {
  agentId: string
  className?: string
  showAsHero?: boolean
}

export function AdminPortalAccess({ agentId, className, showAsHero = false }: AdminPortalAccessProps) {
  const [isSubAdmin, setIsSubAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [roleInfo, setRoleInfo] = useState<{ assigned_tabs: string[] } | null>(null)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    async function checkRole() {
      console.log("[v0] AdminPortalAccess: Initiating check for agentId:", agentId)

      if (!agentId) {
        console.error("[v0] AdminPortalAccess: CRITICAL - No agentId provided to component")
        if (mounted) setChecking(false)
        return
      }

      try {
        const role = await getAgentSubAdminRole(agentId)
        console.log("[v0] AdminPortalAccess: Database response for role:", role)

        if (mounted) {
          const active = role !== null && role.is_active === true
          setIsSubAdmin(active)
          setRoleInfo(role)
          console.log("[v0] AdminPortalAccess: Final visibility state -> isSubAdmin:", active)
        }
      } catch (error) {
        console.error("[v0] AdminPortalAccess: Error fetching role from Supabase:", error)
      } finally {
        if (mounted) setChecking(false)
      }
    }
    checkRole()
    return () => {
      mounted = false
    }
  }, [agentId])

  const handleAccessPortal = () => {
    const agent = getStoredAgent()
    if (!agent) {
      console.log("[v0] AdminPortalAccess: Session expired, redirecting to login.")
      router.push("/agent/login")
      return
    }

    console.log("[v0] AdminPortalAccess: Accessing Admin Portal...")
    router.push("/admin")
  }

  if (checking)
    return (
      <div
        className={
          showAsHero
            ? "h-32 w-full animate-pulse bg-indigo-100 rounded-xl"
            : "h-9 w-32 bg-white/5 animate-pulse rounded-md flex items-center justify-center"
        }
      >
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
      </div>
    )

  if (!isSubAdmin) {
    console.log("[v0] AdminPortalAccess: Not a sub-admin, hiding portal button.")
    return null
  }

  if (showAsHero) {
    return (
      <Card
        className={`bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-900 text-white shadow-2xl border-none overflow-hidden relative w-full ${className}`}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Shield className="w-16 md:w-24 h-16 md:h-24" />
        </div>
        <CardHeader className="pb-2 px-4 md:px-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-2xl font-black italic tracking-tighter uppercase">
            <Shield className="h-5 w-5 md:h-6 md:h-6 text-indigo-200 fill-indigo-200" />
            Access Sub-Admin Portal
          </CardTitle>
          <CardDescription className="text-indigo-100/80 font-medium text-xs md:text-sm">
            You have active administrative privileges for your assigned management modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 md:px-6 pb-6">
          {roleInfo?.assigned_tabs && roleInfo.assigned_tabs.length > 0 && (
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {roleInfo.assigned_tabs.map((tab) => (
                <Badge
                  key={tab}
                  variant="secondary"
                  className="bg-white/10 text-white hover:bg-white/20 border-white/20 px-2 md:px-3 py-0.5 md:py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest"
                >
                  {tab.replace(/-/g, " ")}
                </Badge>
              ))}
            </div>
          )}
          <Button
            onClick={handleAccessPortal}
            className="w-full md:w-auto bg-white text-indigo-900 hover:bg-indigo-50 font-black uppercase tracking-widest shadow-xl group transition-all duration-300 text-xs md:text-sm h-10 md:h-11"
          >
            Enter Portal
            <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleAccessPortal}
      className={`bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-400/30 h-9 px-3 gap-2 shadow-lg shadow-indigo-500/20 animate-in fade-in zoom-in duration-300 ${className}`}
    >
      <Shield className="h-4 w-4 fill-white/20" />
      <span className="md:inline text-[10px] font-black uppercase tracking-tighter">Admin Portal</span>
      <ExternalLink className="h-3 w-3 opacity-70" />
    </Button>
  )
}
