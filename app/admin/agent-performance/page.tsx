"use client"

import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import dynamic from "next/dynamic"

// Lazy load the AdminAgentRanking component for better performance
const AdminAgentRanking = dynamic(
  () => import("@/components/admin/AdminAgentRanking"),
  {
    loading: () => (
      <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl font-bold text-emerald-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-sm sm:text-xl">Agent Performance Rankings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 sm:p-4 rounded-lg bg-emerald-50 animate-pulse">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-emerald-200 rounded"></div>
                  <div className="h-3 sm:h-4 bg-emerald-200 rounded w-16 sm:w-20"></div>
                </div>
                <div className="h-5 sm:h-6 bg-emerald-200 rounded w-6 sm:w-8 mb-1"></div>
                <div className="h-2 sm:h-3 bg-emerald-200 rounded w-12 sm:w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false
  }
)

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
          <p className="text-gray-600 mt-2">
            Monitor and analyze agent activity rankings and performance metrics
          </p>
        </div>
      </div>

      {/* Agent Performance Rankings */}
      <Suspense
        fallback={
          <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-lg sm:text-xl font-bold text-emerald-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-sm sm:text-xl">Loading Agent Performance Rankings...</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-3 sm:p-4 rounded-lg bg-emerald-50 animate-pulse">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-emerald-200 rounded"></div>
                      <div className="h-3 sm:h-4 bg-emerald-200 rounded w-16 sm:w-20"></div>
                    </div>
                    <div className="h-5 sm:h-6 bg-emerald-200 rounded w-6 sm:w-8 mb-1"></div>
                    <div className="h-2 sm:h-3 bg-emerald-200 rounded w-12 sm:w-16"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        }
      >
        <AdminAgentRanking />
      </Suspense>
    </div>
  )
}
