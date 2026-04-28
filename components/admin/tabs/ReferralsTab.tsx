"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase, type Referral } from "@/lib/supabase"
import { MessageCircle, Search, Filter, Trash2 } from "lucide-react"

interface ReferralsTabProps {
  getCachedData: () => Referral[] | undefined
  setCachedData: (data: Referral[]) => void
  adminUnreadCount: number
  adminGetUnreadCount: (referralId: string) => number
  adminMarkAsRead: (referralId: string) => void
}

export default function ReferralsTab({
  getCachedData,
  setCachedData,
  adminUnreadCount,
  adminGetUnreadCount,
  adminMarkAsRead,
}: ReferralsTabProps) {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [filteredReferrals, setFilteredReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [referralSearchTerm, setReferralSearchTerm] = useState("")
  const [referralsFilterAdmin, setReferralsFilterAdmin] = useState("All Referrals")
  const [currentReferralsPage, setCurrentReferralsPage] = useState(1)
  const itemsPerPage = 12

  useEffect(() => {
    const loadReferrals = async () => {
      const cachedData = getCachedData()
      if (cachedData) {
        setReferrals(cachedData)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("referrals")
          .select(`*, agents (full_name, phone_number), services (id, title, commission_amount), service_id`)
          .order("created_at", { ascending: false })

        if (error) throw error
        const referralsData = data || []
        setReferrals(referralsData)
        setCachedData(referralsData)
      } catch (error) {
        console.error("Error loading referrals:", error)
        alert("Failed to load referrals data.")
      } finally {
        setLoading(false)
      }
    }
    loadReferrals()
  }, [getCachedData, setCachedData])

  useEffect(() => {
    const filtered = referrals.filter(
      (referral) =>
        referral.client_name?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.agents?.full_name?.toLowerCase().includes(referralSearchTerm.toLowerCase()) ||
        referral.client_phone?.includes(referralSearchTerm) ||
        referral.services?.title?.toLowerCase().includes(referralSearchTerm.toLowerCase()),
    )
    let filteredByStatus = filtered
    if (referralsFilterAdmin !== "All Referrals") {
      filteredByStatus = filtered.filter((referral) => {
        switch (referralsFilterAdmin) {
          case "Pending":
            return referral.status === "pending"
          case "Confirmed":
            return referral.status === "confirmed"
          case "In Progress":
            return referral.status === "in_progress"
          case "Completed":
            return referral.status === "completed"
          case "Rejected":
            return referral.status === "rejected"
          default:
            return true
        }
      })
    }
    setFilteredReferrals(filteredByStatus)
    setCurrentReferralsPage(1)
  }, [referralSearchTerm, referrals, referralsFilterAdmin])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const updateReferralStatus = async (referralId: string, newStatus: string) => {
    try {
      const currentReferral = referrals.find((r) => r.id === referralId)
      const oldStatus = currentReferral?.status

      const updatePayload: { status: string; commission_paid?: boolean } = { status: newStatus }
      if (newStatus === "completed") {
        updatePayload.commission_paid = false
      } else {
        updatePayload.commission_paid = false
      }

      const { error } = await supabase.from("referrals").update(updatePayload).eq("id", referralId)
      if (error) throw error

      if (oldStatus !== "completed" && newStatus === "completed") {
        console.log("🎯 Referral marked as completed, triggering commission creation:", {
          referralId,
          oldStatus,
          newStatus,
          referralData: {
            agent_id: currentReferral?.agent_id,
            service_id: currentReferral?.service_id,
            services: currentReferral?.services,
          },
        })

        try {
          const { handleReferralStatusChange } = await import("@/lib/order-status-handlers")
          const result = await handleReferralStatusChange(referralId, oldStatus || "pending", newStatus, "admin")

          if (result.success && result.commissionChange?.action === "created") {
            console.log("✅ Referral commission created successfully:", result.commissionChange)
            alert(
              `Referral completed! Commission of GH₵${result.commissionChange.amount.toFixed(2)} has been credited to ${currentReferral?.agents?.full_name}.`,
            )
          } else if (!result.success) {
            console.error("❌ Failed to create referral commission:", result.message, result.error)
            alert(`Referral status updated, but commission creation failed: ${result.message}`)
          }
        } catch (commissionError) {
          console.error("❌ Error triggering referral commission:", commissionError)
          alert("Referral status updated, but there was an error processing the commission.")
        }
      }

      const updatedReferrals = referrals.map((referral) =>
        referral.id === referralId ? { ...referral, ...updatePayload } : referral,
      )
      setReferrals(updatedReferrals)
      setCachedData(updatedReferrals)
    } catch (error) {
      console.error("Error updating referral status:", error)
      alert("Failed to update referral status")
    }
  }

  const deleteReferral = async (referralId: string) => {
    if (!confirm("Are you sure you want to delete this referral? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("referrals").delete().eq("id", referralId)
      if (error) throw error

      const updatedReferrals = referrals.filter((referral) => referral.id !== referralId)
      setReferrals(updatedReferrals)
      setCachedData(updatedReferrals)
      alert("Referral deleted successfully!")
    } catch (error) {
      console.error("Error deleting referral:", error)
      alert("Failed to delete referral.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "confirmed":
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
  }) => {
    if (totalPages <= 1) return null

    return (
      <div className="flex justify-center mt-4 sm:mt-6">
        <Pagination>
          <PaginationContent className="gap-1 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={`${currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              )
            })}
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={`${currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" id="referrals">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Referral Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select value={referralsFilterAdmin} onValueChange={setReferralsFilterAdmin}>
            <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Referrals" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Referrals">All Referrals</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search referrals..."
              value={referralSearchTerm}
              onChange={(e) => setReferralSearchTerm(e.target.value)}
              className="pl-10 w-full border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {getPaginatedData(filteredReferrals, currentReferralsPage).map((referral) => (
          <Card
            key={referral.id}
            className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-emerald-800">{referral.services?.title}</h3>
                    <Badge className={getStatusColor(referral.status)}>{referral.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-emerald-600">
                      <span className="font-medium">Agent:</span> {referral.agents?.full_name}
                    </p>
                    <p className="text-emerald-600">
                      <span className="font-medium">Client:</span> {referral.client_name} • {referral.client_phone}
                    </p>
                    <p className="text-emerald-600">{referral.description}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {referral.allow_direct_contact === false ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">
                        🚫 No Direct Client Contact
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        ✅ Direct Client Contact OK
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm font-semibold text-emerald-700">
                      Commission: GH₵ {referral.services?.commission_amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-500">Submitted: {formatTimestamp(referral.created_at)}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 relative w-full sm:w-auto bg-transparent"
                  >
                    <Link href={`/admin/chat/${referral.id}`} onClick={() => adminMarkAsRead(referral.id)}>
                      <div className="relative flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                        {adminGetUnreadCount(referral.id) > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-pulse font-bold">
                            {adminGetUnreadCount(referral.id) > 9 ? "9+" : adminGetUnreadCount(referral.id)}
                          </span>
                        )}
                      </div>
                    </Link>
                  </Button>
                  <Select value={referral.status} onValueChange={(value) => updateReferralStatus(referral.id, value)}>
                    <SelectTrigger className="w-full sm:w-40 border-emerald-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteReferral(referral.id)}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {getPaginatedData(filteredReferrals, currentReferralsPage).length === 0 && (
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <CardContent className="text-center py-8">
              <p className="text-emerald-600">
                {referralsFilterAdmin === "All Referrals"
                  ? "No referrals found."
                  : `No ${referralsFilterAdmin.toLowerCase()} referrals found.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <PaginationControls
        currentPage={currentReferralsPage}
        totalPages={getTotalPages(filteredReferrals.length)}
        onPageChange={setCurrentReferralsPage}
      />
    </div>
  )
}
