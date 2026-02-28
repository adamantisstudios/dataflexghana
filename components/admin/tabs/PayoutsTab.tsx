"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { supabase, type Withdrawal } from "@/lib/supabase"
import { ViewDetailsDialog } from "@/components/admin/ViewDetailsDialog"
import { getCurrentAdmin } from "@/lib/auth"
import { getAgentCommissionSummary } from "@/lib/commission-earnings"
import { Banknote, Filter, Trash2, Eye, AlertCircle } from "lucide-react"

interface PayoutsTabProps {
  getCachedData: () => Withdrawal[] | undefined
  setCachedData: (data: Withdrawal[]) => void
}

export default function PayoutsTab({ getCachedData, setCachedData }: PayoutsTabProps) {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [payoutsFilterAdmin, setPayoutsFilterAdmin] = useState("All Payouts")
  const [currentPayoutsPage, setCurrentPayoutsPage] = useState(1)
  const [showViewDetailsDialog, setShowViewDetailsDialog] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
  const [agentBalances, setAgentBalances] = useState<Map<string, any>>(new Map())
  const itemsPerPage = 12
  const admin = getCurrentAdmin()

  const loadAgentBalance = async (agentId: string) => {
    if (agentBalances.has(agentId)) {
      return agentBalances.get(agentId)
    }

    try {
      const balance = await getAgentCommissionSummary(agentId)
      setAgentBalances((prev) => new Map(prev.set(agentId, balance)))
      return balance
    } catch (error) {
      console.error(`Error loading balance for agent ${agentId}:`, error)
      return null
    }
  }

  // Function to enrich withdrawals with detailed commission information
  const enrichWithdrawalsWithCommissionDetails = async (withdrawals: any[]) => {
    try {
      const enrichedWithdrawals = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          const agentBalance = await loadAgentBalance(withdrawal.agent_id)

          if (!withdrawal.commission_items || !Array.isArray(withdrawal.commission_items)) {
            return {
              ...withdrawal,
              commission_items: [],
              agent_balance: agentBalance,
            }
          }

          const enrichedItems = await Promise.all(
            withdrawal.commission_items.map(async (item: any) => {
              try {
                let enrichedItem = { ...item }

                // Enrich based on commission type
                switch (item.type) {
                  case "referral":
                    if (item.id) {
                      const { data: referralData } = await supabase
                        .from("referrals")
                        .select(`
                          id,
                          client_name,
                          client_phone,
                          created_at,
                          services (title)
                        `)
                        .eq("id", item.id)
                        .single()

                      if (referralData) {
                        enrichedItem = {
                          ...enrichedItem,
                          client_name: referralData.client_name,
                          client_phone: referralData.client_phone,
                          service_title: referralData.services?.title,
                          created_at: referralData.created_at,
                        }
                      }
                    }
                    break

                  case "data_order":
                    if (item.id) {
                      const { data: orderData } = await supabase
                        .from("data_orders")
                        .select(`
                          id,
                          recipient_phone,
                          created_at,
                          data_bundles (name, provider)
                        `)
                        .eq("id", item.id)
                        .single()

                      if (orderData) {
                        enrichedItem = {
                          ...enrichedItem,
                          recipient_phone: orderData.recipient_phone,
                          bundle_name: orderData.data_bundles?.name,
                          bundle_provider: orderData.data_bundles?.provider,
                          created_at: orderData.created_at,
                        }
                      }
                    }
                    break

                  case "wholesale":
                  case "wholesale_order":
                    if (item.id) {
                      const { data: wholesaleData } = await supabase
                        .from("wholesale_orders")
                        .select(`
                          id,
                          quantity,
                          commission_per_item,
                          commission_amount,
                          created_at,
                          wholesale_products (name)
                        `)
                        .eq("id", item.id)
                        .single()

                      if (wholesaleData) {
                        enrichedItem = {
                          ...enrichedItem,
                          product_name: wholesaleData.wholesale_products?.name,
                          quantity: wholesaleData.quantity,
                          commission_per_item:
                            wholesaleData.commission_per_item ||
                            (wholesaleData.commission_amount && wholesaleData.quantity
                              ? wholesaleData.commission_amount / wholesaleData.quantity
                              : 0),
                          total_commission: wholesaleData.commission_amount,
                          created_at: wholesaleData.created_at,
                        }
                      }
                    }
                    break

                  default:
                    // For unknown types, keep the original item
                    break
                }

                return enrichedItem
              } catch (itemError) {
                console.error(`Error enriching commission item ${item.id}:`, itemError)
                return item // Return original item if enrichment fails
              }
            }),
          )

          return {
            ...withdrawal,
            commission_items: enrichedItems,
            agent_balance: agentBalance,
          }
        }),
      )

      return enrichedWithdrawals
    } catch (error) {
      console.error("Error enriching withdrawals:", error)
      return withdrawals // Return original data if enrichment fails
    }
  }

  useEffect(() => {
    const loadWithdrawals = async () => {
      const cachedData = getCachedData()
      if (cachedData) {
        setWithdrawals(cachedData)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("withdrawals")
          .select(`*, agents (full_name, phone_number), commission_items`)
          .order("requested_at", { ascending: false })

        if (error) throw error

        // Enrich withdrawals with detailed commission data
        const enrichedWithdrawals = await enrichWithdrawalsWithCommissionDetails(data || [])
        setWithdrawals(enrichedWithdrawals)
        setCachedData(enrichedWithdrawals)
      } catch (error) {
        console.error("Error loading withdrawals:", error)
        alert("Failed to load withdrawals data.")
      } finally {
        setLoading(false)
      }
    }
    loadWithdrawals()
  }, [getCachedData, setCachedData])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + " - " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const updateWithdrawalStatus = async (withdrawalId: string, status: string) => {
    try {
      console.log(`[v0] Updating withdrawal ${withdrawalId} to status: ${status}`)

      if (status === "requested") {
        // For "requested" status, we just update the local state without calling the API
        // since "requested" is the default state and doesn't require server-side processing
        const currentTimestamp = new Date().toISOString()
        const updateData = {
          status: "requested",
          paid_at: null,
          processing_at: null,
          rejected_at: null,
        }

        const updatedWithdrawals = withdrawals.map((withdrawal) =>
          withdrawal.id === withdrawalId ? { ...withdrawal, ...updateData } : withdrawal,
        )
        setWithdrawals(updatedWithdrawals)
        setCachedData(updatedWithdrawals)

        // Update the withdrawal in the database directly
        const { error } = await supabase.from("withdrawals").update(updateData).eq("id", withdrawalId)

        if (error) {
          console.error("Error updating withdrawal to requested:", error)
          alert("Failed to update withdrawal status")
          return
        }

        alert("Withdrawal status reset to requested successfully")
        return
      }

      console.log(`[v0] Making API call to /api/admin/withdrawals/${withdrawalId}`)
      console.log(`[v0] Request body:`, {
        status,
        admin_notes: `Status updated to ${status} by ${admin?.full_name || admin?.email}`,
      })
      console.log(`[v0] Admin data:`, admin)

      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${btoa(JSON.stringify(admin))}`,
        },
        body: JSON.stringify({
          status,
          admin_notes: `Status updated to ${status} by ${admin?.full_name || admin?.email}`,
        }),
      })

      console.log(`[v0] Response status: ${response.status}`)
      console.log(`[v0] Response headers:`, Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorDetails = null

        // Try to get response text first
        const responseText = await response.text()
        console.log(`[v0] Raw response text:`, responseText)

        if (responseText) {
          try {
            const errorData = JSON.parse(responseText)
            errorDetails = errorData
            errorMessage = errorData.error || errorData.message || errorMessage
            console.log(`[v0] Parsed error data:`, errorData)
          } catch (parseError) {
            console.log(`[v0] Failed to parse error response as JSON:`, parseError)
            errorMessage = `${errorMessage} - Response: ${responseText}`
          }
        }

        console.error(`[v0] API Error - Status: ${response.status}, Message: ${errorMessage}`, errorDetails)
        throw new Error(errorMessage)
      }

      const responseText = await response.text()
      console.log(`[v0] Success response text:`, responseText)

      let result
      try {
        result = JSON.parse(responseText)
        console.log(`[v0] Parsed success response:`, result)
      } catch (parseError) {
        console.error(`[v0] Failed to parse success response as JSON:`, parseError)
        throw new Error(`Invalid JSON response: ${responseText}`)
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to update withdrawal status")
      }

      const statusMessages = {
        processing: "moved to processing",
        paid: "marked as paid and commission processed",
        rejected: "rejected and commission statuses reset",
      }

      alert(`Withdrawal ${statusMessages[status as keyof typeof statusMessages] || "updated"} successfully`)

      const currentTimestamp = new Date().toISOString()
      const updateData: any = { status }

      switch (status) {
        case "paid":
          updateData.paid_at = currentTimestamp
          break
        case "processing":
          updateData.processing_at = currentTimestamp
          break
        case "rejected":
          updateData.rejected_at = currentTimestamp
          break
      }

      const updatedWithdrawals = withdrawals.map((withdrawal) =>
        withdrawal.id === withdrawalId ? { ...withdrawal, ...updateData } : withdrawal,
      )
      setWithdrawals(updatedWithdrawals)
      setCachedData(updatedWithdrawals)

      const withdrawal = withdrawals.find((w) => w.id === withdrawalId)
      if (withdrawal) {
        setAgentBalances((prev) => {
          const newMap = new Map(prev)
          newMap.delete(withdrawal.agent_id)
          return newMap
        })
        await loadAgentBalance(withdrawal.agent_id)
      }
    } catch (error: any) {
      console.error(`[v0] Error updating withdrawal status:`, error)
      console.error(`[v0] Error stack:`, error.stack)
      alert(`Failed to update withdrawal status: ${error.message || "Unknown error occurred"}`)
    }
  }

  const deleteWithdrawal = async (withdrawalId: string) => {
    if (!confirm("Are you sure you want to delete this withdrawal? This action cannot be undone.")) return
    try {
      const { error } = await supabase.from("withdrawals").delete().eq("id", withdrawalId)
      if (error) throw error

      const updatedWithdrawals = withdrawals.filter((withdrawal) => withdrawal.id !== withdrawalId)
      setWithdrawals(updatedWithdrawals)
      setCachedData(updatedWithdrawals)
      alert("Withdrawal deleted successfully!")
    } catch (error) {
      console.error("Error deleting withdrawal:", error)
      alert("Failed to delete withdrawal.")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getWithdrawalValidation = (withdrawal: any) => {
    if (!withdrawal.agent_balance) return null

    const availableBalance = withdrawal.agent_balance.availableForWithdrawal || 0
    const withdrawalAmount = Number(withdrawal.amount) || 0

    if (withdrawal.status === "requested" && withdrawalAmount > availableBalance) {
      return {
        isValid: false,
        message: `Insufficient balance: Available GH₵${availableBalance.toFixed(2)}, Requested GH₵${withdrawalAmount.toFixed(2)}`,
      }
    }

    return { isValid: true, message: null }
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
                className={`${
                  currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
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
                className={`${
                  currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                } h-8 px-2 sm:h-10 sm:px-4 text-xs sm:text-sm`}
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

  const filteredWithdrawals = withdrawals.filter(
    (withdrawal) => payoutsFilterAdmin === "All Payouts" || withdrawal.status === payoutsFilterAdmin.toLowerCase(),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-emerald-800">Withdrawal Management</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Select value={payoutsFilterAdmin} onValueChange={setPayoutsFilterAdmin}>
            <SelectTrigger className="w-full sm:w-48 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter Payouts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Payouts">All Payouts</SelectItem>
              <SelectItem value="Requested">Requested</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              {withdrawals.length} total
            </Badge>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              {withdrawals.filter((w) => w.status === "requested").length} pending
            </Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredWithdrawals.length === 0 ? (
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="text-gray-500 mb-4">
                <Banknote className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No withdrawal requests found</p>
                <p className="text-sm">Withdrawal requests will appear here when agents submit them</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          getPaginatedData(filteredWithdrawals, currentPayoutsPage).map((withdrawal) => {
            const validation = getWithdrawalValidation(withdrawal)

            return (
              <Card
                key={withdrawal.id}
                className={`border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${
                  validation && !validation.isValid ? "border-red-300 bg-red-50/50" : ""
                }`}
              >
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-emerald-800 text-lg">
                          GH₵ {withdrawal.amount.toLocaleString()}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(withdrawal.status)}>{withdrawal.status}</Badge>
                          {validation && !validation.isValid && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                        </div>
                      </div>

                      {validation && !validation.isValid && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Balance Validation Failed</span>
                          </div>
                          <p className="text-red-700 text-sm mt-1">{validation.message}</p>
                        </div>
                      )}

                      {withdrawal.agent_balance && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-blue-800">Available Balance:</span>
                              <span className="text-blue-600 ml-1">
                                GH₵{withdrawal.agent_balance.availableForWithdrawal?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">Total Earned:</span>
                              <span className="text-blue-600 ml-1">
                                GH₵{withdrawal.agent_balance.totalEarned?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">Total Withdrawn:</span>
                              <span className="text-blue-600 ml-1">
                                GH₵{withdrawal.agent_balance.totalWithdrawn?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-800">Pending:</span>
                              <span className="text-blue-600 ml-1">
                                GH₵{withdrawal.agent_balance.pendingWithdrawal?.toFixed(2) || "0.00"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <p className="text-emerald-600">
                          <span className="font-medium">Agent:</span> {withdrawal.agents?.full_name}
                        </p>
                        <p className="text-emerald-600">
                          <span className="font-medium">Phone:</span> {withdrawal.agents?.phone_number}
                        </p>
                        <p className="text-emerald-600">
                          <span className="font-medium">MoMo:</span> {withdrawal.momo_number}
                        </p>
                        <p className="text-emerald-500 text-xs">
                          <span className="font-medium">Requested:</span> {formatTimestamp(withdrawal.requested_at)}
                        </p>
                      </div>
                      {withdrawal.paid_at && (
                        <p className="text-emerald-500 text-xs">
                          <span className="font-medium">Paid:</span> {formatTimestamp(withdrawal.paid_at)}
                        </p>
                      )}
                      {withdrawal.commission_items && withdrawal.commission_items.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal)
                            setShowViewDetailsDialog(true)
                          }}
                          className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details ({withdrawal.commission_items.length} items)
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-emerald-100">
                      <Select
                        value={withdrawal.status}
                        onValueChange={(value) => updateWithdrawalStatus(withdrawal.id, value)}
                      >
                        <SelectTrigger className="w-full sm:w-40 border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="requested">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                              Requested
                            </div>
                          </SelectItem>
                          <SelectItem value="processing">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              Processing
                            </div>
                          </SelectItem>
                          <SelectItem value="paid">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              Paid
                            </div>
                          </SelectItem>
                          <SelectItem value="rejected">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              Rejected
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteWithdrawal(withdrawal.id)}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <PaginationControls
        currentPage={currentPayoutsPage}
        totalPages={getTotalPages(filteredWithdrawals.length)}
        onPageChange={setCurrentPayoutsPage}
      />

      {/* ViewDetailsDialog */}
      <ViewDetailsDialog
        open={showViewDetailsDialog}
        onOpenChange={setShowViewDetailsDialog}
        withdrawal={selectedWithdrawal}
      />
    </div>
  )
}
