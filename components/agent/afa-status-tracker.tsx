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
  date_of_birth: string | null
  location: string
  occupation: string | null
  payment_pin: string
  payment_verified: boolean
  payment_verified_at: string | null
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

    // Poll every 3 seconds to check for verification status updates
    const interval = setInterval(() => {
      loadRegistrations(agentId)
    }, 3000)

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
          <div className="space-y-3 sm:space-y-4">
            {registrations.map((registration, index) => (
              <div
                key={registration.id}
                className="border-2 border-emerald-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all bg-white hover:border-emerald-300"
              >
                {/* Header row with enhanced visual separation */}
                <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-4 sm:p-5 border-b-2 border-emerald-100 ${
                  registration.status === "completed" ? "bg-gradient-to-r from-emerald-50 to-green-50" :
                  registration.status === "canceled" ? "bg-gradient-to-r from-red-50 to-rose-50" :
                  registration.status === "processing" ? "bg-gradient-to-r from-purple-50 to-indigo-50" :
                  "bg-gradient-to-r from-amber-50 to-orange-50"
                }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900">{registration.full_name}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {new Date(registration.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <Badge className={`${getStatusColor(registration.status)} text-xs whitespace-nowrap font-semibold`}>
                      {registration.status.replace(/_/g, " ").toUpperCase()}
                    </Badge>
                    <Button
                      onClick={() => deleteAFARegistration(registration.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-600 hover:bg-red-50 text-xs h-9 px-3 sm:px-4"
                      disabled={registration.status !== "completed" && registration.status !== "canceled"}
                      title={registration.status !== "completed" && registration.status !== "canceled" ? "Can only delete completed or canceled orders" : "Delete this order"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Details grid */}
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium">Phone Number</p>
                      <p className="text-gray-900 font-mono">{registration.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Ghana Card</p>
                      <p className="text-gray-900 font-mono">{registration.ghana_card}</p>
                    </div>
                    {registration.date_of_birth && (
                      <div>
                        <p className="text-gray-500 font-medium">Date of Birth</p>
                        <p className="text-gray-900">{registration.date_of_birth}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-500 font-medium">Location</p>
                      <p className="text-gray-900">{registration.location}</p>
                    </div>
                    {registration.occupation && (
                      <div>
                        <p className="text-gray-500 font-medium">Occupation</p>
                        <p className="text-gray-900">{registration.occupation}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment PIN Section */}
                  <div className="mt-4 pt-4 border-t-2 border-emerald-200">
                    <p className="text-gray-600 font-bold text-sm mb-2">Payment Details</p>
                    <div className="flex gap-2 items-center bg-gradient-to-r from-yellow-50 to-amber-50 p-3 rounded-lg border-2 border-yellow-300 shadow-sm">
                      <span className="text-xs text-gray-600 font-medium">PIN:</span>
                      <code className="flex-1 font-mono font-bold text-base text-yellow-900">{registration.payment_pin}</code>
                    </div>
                    <div className="mt-3">
                      {registration.payment_verified ? (
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border-2 border-emerald-300 shadow-sm">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-800">Payment Verified</p>
                            <p className="text-xs text-emerald-700">
                              {registration.payment_verified_at && `Confirmed on ${new Date(registration.payment_verified_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-300 shadow-sm">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">!</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-amber-900">Awaiting Payment Verification</p>
                            <p className="text-xs text-amber-800">Admin will verify your payment soon</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
