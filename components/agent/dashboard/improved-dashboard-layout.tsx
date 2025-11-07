"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, TrendingUp, ArrowUpRight, Clock } from "lucide-react"

interface DashboardStatsProps {
  totalEarnings: number
  availableBalance: number
  pendingPayout: number
  totalPaidEarnings: number
  walletBalance: number
}

export function ImprovedDashboardLayout({
  totalEarnings,
  availableBalance,
  pendingPayout,
  totalPaidEarnings,
  walletBalance,
}: DashboardStatsProps) {
  return (
    <div className="space-y-6">
      {/* Primary Stats - Most important metrics at top */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Available Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">GH₵ {availableBalance?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-emerald-600 mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">GH₵ {totalEarnings?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-blue-600 mt-1">All-time earnings</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">GH₵ {walletBalance?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-purple-600 mt-1">Spendable balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats - Additional metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">GH₵ {pendingPayout?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-orange-600 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">GH₵ {totalPaidEarnings?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-gray-600 mt-1">Withdrawn to date</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
