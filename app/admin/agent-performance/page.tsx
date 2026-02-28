"use client"

import { Suspense } from "react"
import { TrendingUp } from "lucide-react"
import dynamic from "next/dynamic"
import { AdminCardSkeleton } from "@/components/admin/admin-page-skeleton"

const AdminAgentRanking = dynamic(() => import("@/components/admin/AdminAgentRanking"), {
  loading: () => <AdminCardSkeleton />,
  ssr: false,
})

export default function AgentPerformancePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
            Agent Performance
          </h1>
          <p className="text-gray-600 mt-2">Monitor and analyze agent activity rankings and performance metrics</p>
        </div>
      </div>

      {/* Agent Performance Rankings */}
      <Suspense fallback={<AdminCardSkeleton />}>
        <AdminAgentRanking />
      </Suspense>
    </div>
  )
}
