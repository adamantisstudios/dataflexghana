"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  Users,
  Database,
  Package,
  FileText,
  Home,
  MessageCircle,
  Banknote,
  Wallet,
  Mail,
  CheckCircle2,
} from "lucide-react"

interface PendingAlerts {
  newAgents: number
  pendingDataOrders: number
  pendingBulkOrders: number
  pendingAFA: number
  pendingCompliance: number
  pendingProperties: number
  pendingReferrals: number
  pendingPayouts: number
  pendingDomesticWorkerRequests: number
  pendingWalletTopups: number
  pendingProfessionalWriting: number
  pendingInvitations: number
  pendingDomesticWorkers: number
  totalAlerts: number
}

export function PendingAlertsCard() {
  const [alerts, setAlerts] = useState<PendingAlerts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
    // Refresh every 30 seconds
    const interval = setInterval(loadAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadAlerts = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/pending-alerts")
      if (response.ok) {
        const data = await response.json()
        setAlerts(data)
      }
    } catch (error) {
      console.error("Error loading pending alerts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!alerts) return null

  if (alerts.totalAlerts === 0) return null

  const alertItems = [
    { icon: UserPlus, label: "New Agents", count: alerts.newAgents, color: "bg-blue-50 border-blue-200" },
    { icon: Database, label: "Data Orders", count: alerts.pendingDataOrders, color: "bg-purple-50 border-purple-200" },
    { icon: Package, label: "Bulk Orders", count: alerts.pendingBulkOrders, color: "bg-orange-50 border-orange-200" },
    { icon: FileText, label: "AFA Regs", count: alerts.pendingAFA, color: "bg-yellow-50 border-yellow-200" },
    { icon: FileText, label: "Compliance", count: alerts.pendingCompliance, color: "bg-red-50 border-red-200" },
    { icon: Home, label: "Properties", count: alerts.pendingProperties, color: "bg-green-50 border-green-200" },
    { icon: MessageCircle, label: "Referrals", count: alerts.pendingReferrals, color: "bg-cyan-50 border-cyan-200" },
    { icon: Banknote, label: "Payouts", count: alerts.pendingPayouts, color: "bg-indigo-50 border-indigo-200" },
    {
      icon: Users,
      label: "Worker Requests",
      count: alerts.pendingDomesticWorkerRequests,
      color: "bg-pink-50 border-pink-200",
    },
    { icon: Wallet, label: "Wallet Top-ups", count: alerts.pendingWalletTopups, color: "bg-teal-50 border-teal-200" },
    {
      icon: FileText,
      label: "Writing Requests",
      count: alerts.pendingProfessionalWriting,
      color: "bg-violet-50 border-violet-200",
    },
    { icon: Mail, label: "Invitations", count: alerts.pendingInvitations, color: "bg-amber-50 border-amber-200" },
    {
      icon: Users,
      label: "Domestic Workers",
      count: alerts.pendingDomesticWorkers,
      color: "bg-lime-50 border-lime-200",
    },
  ]

  const activeAlerts = alertItems.filter((item) => item.count > 0)

  return (
    <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5 text-red-600" />
            Pending Alerts Dashboard
          </CardTitle>
          <Badge className="bg-red-500 text-white text-lg px-3 py-1">{alerts.totalAlerts}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {activeAlerts.map((item, idx) => {
            const Icon = item.icon
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border-2 ${item.color} flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-md transition-shadow`}
              >
                <Icon className="h-5 w-5 mb-1 text-gray-700" />
                <p className="text-xs font-medium text-gray-700 line-clamp-2">{item.label}</p>
                <Badge className="bg-red-500 text-white text-xs mt-1">{item.count}</Badge>
              </div>
            )
          })}
        </div>
        <div className="bg-white/80 rounded-lg p-3 flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-gray-700">
            <span className="font-semibold text-red-600">{alerts.totalAlerts} pending items</span> require your
            attention across various sections
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

import { UserPlus } from "lucide-react"
