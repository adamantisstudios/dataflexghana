"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, DollarSign, FileText, User, Phone, Package } from "lucide-react"

interface TransactionItem {
  id: string
  created_at: string
  amount: number
  transaction_type?: string
  status: string
  description?: string
  // Wallet transaction fields
  agent_id?: string
  reference_code?: string
  admin_notes?: string
  source_type?: string
  source_id?: string
  // Order fields
  bundle_id?: string
  client_name?: string
  client_phone?: string
  quantity?: number
  commission_per_item?: number
  // Additional fields
  type?: string
  service_title?: string
  recipient_phone?: string
  bundle_name?: string
  bundle_provider?: string
  product_name?: string
}

interface ViewDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  withdrawal: {
    id: string
    amount: number
    agents?: {
      full_name: string
      phone_number: string
    }
    commission_items?: TransactionItem[]
    requested_at: string
  } | null
}

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return "N/A"
  
  try {
    const date = new Date(timestamp)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date"
    }
    
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    console.error("Error formatting timestamp:", error)
    return "Invalid Date"
  }
}

const getCommissionTypeIcon = (type: string) => {
  switch (type) {
    case "referral":
      return <User className="h-4 w-4" />
    case "data_order":
      return <Package className="h-4 w-4" />
    case "wholesale_order":
      return <DollarSign className="h-4 w-4" />
    case "wholesale":
      return <DollarSign className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

const getCommissionTypeColor = (type: string) => {
  switch (type) {
    case "referral":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "data_order":
      return "bg-green-100 text-green-800 border-green-200"
    case "wholesale":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getCommissionTypeName = (type: string) => {
  switch (type) {
    case "referral":
      return "Referral Commission"
    case "data_order":
      return "Data Order Commission"
    case "wholesale":
      return "Wholesale Commission"
    default:
      return "Commission"
  }
}

export function ViewDetailsDialog({ open, onOpenChange, withdrawal }: ViewDetailsDialogProps) {
  if (!withdrawal) return null

  const commissionItems = withdrawal.commission_items || []
  const totalAmount = commissionItems.reduce((sum, item) => sum + item.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto mx-auto p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-emerald-800 text-lg sm:text-xl font-semibold">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="break-words">Commission Details</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            View detailed breakdown of commission items for this withdrawal request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Withdrawal Summary */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-emerald-600">
                    <span className="font-medium">Agent:</span> {withdrawal.agents?.full_name}
                  </p>
                  <p className="text-sm text-emerald-600">
                    <span className="font-medium">Phone:</span> {withdrawal.agents?.phone_number}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-emerald-600">
                    <span className="font-medium">Total Amount:</span> ₵ {withdrawal.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-emerald-600">
                    <span className="font-medium">Requested:</span> {formatTimestamp(withdrawal.requested_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Items Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-emerald-800">
              Commission Items ({commissionItems.length})
            </h3>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 w-fit">
              Total: ₵ {totalAmount.toLocaleString()}
            </Badge>
          </div>

          <Separator />

          {/* Commission Items List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {commissionItems.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No commission items found</p>
                  <p className="text-sm text-gray-400">Commission details are not available for this withdrawal</p>
                </CardContent>
              </Card>
            ) : (
              commissionItems.map((item, index) => (
                <Card key={`${item.id}-${index}`} className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getCommissionTypeIcon(item.type)}
                          <Badge className={getCommissionTypeColor(item.type)}>
                            {getCommissionTypeName(item.type)}
                          </Badge>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-emerald-700">
                            ₵ {item.amount.toLocaleString()}
                          </p>
                          {item.type === "wholesale" && item.quantity && item.commission_per_item && (
                            <p className="text-xs text-gray-500">
                              {item.quantity} × ₵ {item.commission_per_item}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Details based on type */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {item.type === "referral" && (
                          <>
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words">Client: {item.client_name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words">Phone: {item.client_phone || "N/A"}</span>
                            </div>
                            <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-gray-600">
                              <FileText className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words">Service: {item.service_title || "N/A"}</span>
                            </div>
                          </>
                        )}

                        {item.type === "data_order" && (
                          <>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words">To: {item.recipient_phone || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Package className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words">Provider: {item.bundle_provider || "N/A"}</span>
                            </div>
                            <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-gray-600">
                              <FileText className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words">Bundle: {item.bundle_name || "N/A"}</span>
                            </div>
                          </>
                        )}

                        {item.type === "wholesale" && (
                          <>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Package className="h-3 w-3 flex-shrink-0" />
                              <span className="break-words">Product: {item.product_name || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="h-3 w-3 flex-shrink-0" />
                              <span>Quantity: {item.quantity || "N/A"}</span>
                            </div>
                            {item.commission_per_item && (
                              <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-gray-600">
                                <FileText className="h-3 w-3 flex-shrink-0" />
                                <span>Commission per item: ₵ {item.commission_per_item}</span>
                              </div>
                            )}
                          </>
                        )}

                        <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-gray-500 text-xs">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="break-words">Date: {formatTimestamp(item.created_at)}</span>
                        </div>

                        {item.reference_code && (
                          <div className="col-span-1 sm:col-span-2 flex items-center gap-2 text-gray-500 text-xs">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">Reference: {item.reference_code}</span>
                          </div>
                        )}

                        {item.description && (
                          <div className="col-span-1 sm:col-span-2 text-gray-600 text-xs bg-gray-50 p-2 rounded break-words">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Summary Footer */}
          {commissionItems.length > 0 && (
            <>
              <Separator />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-emerald-50 p-3 rounded-lg">
                <span className="font-medium text-emerald-800">Total Commission Amount:</span>
                <span className="font-bold text-lg text-emerald-700">
                  ₵ {totalAmount.toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
