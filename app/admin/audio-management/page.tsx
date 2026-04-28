"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { getStoredAdmin, logoutAdmin } from "@/lib/unified-auth-system"
import { AudioManagementTab } from "@/components/admin/tabs/AudioManagementTab"

export default function AudioManagementPage() {
  const router = useRouter()
  const admin = getStoredAdmin()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!admin) {
      router.push("/admin/login")
      return
    }
    setLoading(false)
  }, [admin, router])

  const handleLogout = () => {
    logoutAdmin()
    router.push("/admin/login")
  }

  if (loading || !admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin")}
                className="text-white hover:bg-white/20"
              >
                ← Back to Admin
              </Button>
              <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Audio Management</h1>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <AudioManagementTab />
      </div>
    </div>
  )
}
