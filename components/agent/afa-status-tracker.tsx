"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, Trash2, FileText } from "lucide-react"

interface AFAStatus {
  id: string
  full_name: string
  phone_number: string
  ghana_card: string
  status: string
  created_at: string
}

export default function AFAStatusTracker() {
  const [registrations, setRegistrations] = useState<AFAStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (agentData) {
      try {
        const parsed = JSON.parse(agentData)
        setAgentId(parsed.id)
        loadRegistrations(parsed.id)
      } catch (error) {
        console.error("Failed to parse agent data:", error)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!agentId) return

    const interval = setInterval(() => {
      loadRegistrations(agentId)
    }, 5000)

    return () => clearInterval(interval)
  }, [agentId])

  const loadRegistrations = async (id: string) => {
    try {
      console.log("[v0] Loading AFA registrations for agent:", id)
      const response = await fetch(`/api/agent/afa/status?agent_id=${id}`)
      if (!response.ok) {
        console.error("[v0] Failed to fetch registrations, status:", response.status)
        throw new Error("Failed to fetch registrations")
      }
      const data = await response.json()
      console.log("[v0] AFA registrations loaded:", data?.length || 0, "items")
      setRegistrations(Array.isArray(data) ? data : [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error("Error loading registrations:", error)
      setRegistrations([])
    } finally {
      setLoading(false)
    }
  }

  const deleteAFARegistration = async (afaId: string) => {
    if (!confirm("Are you sure you want to delete this AFA registration? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch("/api/agent/afa/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: afaId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete")
      }

      if (agentId) await loadRegistrations(agentId)
      alert("AFA registration deleted successfully")
    } catch (error) {
      console.error("Error deleting AFA:", error)
      alert("Failed to delete AFA registration: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "pending_admin_review":
        return "bg-amber-100 text-amber-800 border border-amber-300"
      case "processing":
        return "bg-purple-100 text-purple-800 border border-purple-300"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300"
      case "canceled":
        return "bg-red-100 text-red-800 border border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300"
    }
  }

  const handleRefresh = () => {
    if (agentId) loadRegistrations(agentId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 sm:py-8">
        <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-2 border-emerald-600 border-t-transparent mr-2 flex-shrink-0"></div>
        <span className="text-xs sm:text-sm text-emerald-600">Loading registrations...</span>
      </div>
    )
  }

  return (
    <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg w-full overflow-hidden">
      <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base sm:text-lg text-emerald-800 flex items-center gap-2 truncate">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">AFA Registration Status</span>
            </CardTitle>
            <CardDescription className="text-emerald-600 text-xs sm:text-sm mt-1">
              Track your MTN AFA submissions
            </CardDescription>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex-shrink-0 text-xs sm:text-sm bg-transparent"
          >
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-3 sm:pt-4 px-3 sm:px-4">
        {registrations.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-gray-500">
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">No AFA registrations submitted yet</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {registrations.map((registration) => (
              <div
                key={registration.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-2 sm:p-4 border border-emerald-100 rounded-lg hover:bg-emerald-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate">{registration.full_name}</h3>
                  <div className="flex gap-1 sm:gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="truncate">{registration.phone_number}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="truncate">{registration.ghana_card}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {new Date(registration.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <Badge className={`${getStatusColor(registration.status)} text-xs whitespace-nowrap flex-shrink-0`}>
                    {registration.status.replace(/_/g, " ")}
                  </Badge>
                  <Button
                    onClick={() => deleteAFARegistration(registration.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8 px-2 sm:px-3"
                    disabled={registration.status !== "pending" && registration.status !== "pending_admin_review"}
                    title={
                      registration.status !== "pending" && registration.status !== "pending_admin_review"
                        ? "Can only delete pending registrations"
                        : ""
                    }
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Delete</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
