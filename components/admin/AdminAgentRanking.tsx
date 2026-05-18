"use client"

import { getAdminAuthHeaders } from "@/lib/api-client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, AlertCircle } from "lucide-react"

interface RankingAgent {
  name: string
  activity: number
  rank: number
}

interface RankingResponse {
  success: boolean
  data?: {
    agents: RankingAgent[]
    timeframe: string
    total_count: number
    last_updated: string
    calculation_time_ms: number
  }
  error?: string
  details?: string
}

export function AdminAgentRanking() {
  const [rankings, setRankings] = useState<RankingAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<"7d" | "30d">("30d")
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [calculationTime, setCalculationTime] = useState<number>(0)

  const fetchRankings = async (tf: "7d" | "30d") => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/agents/ranking?timeframe=${tf}&limit=10`, { headers: getAdminAuthHeaders() })
      const data: RankingResponse = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch rankings")
      }

      setRankings(data.data?.agents || [])
      setLastUpdated(data.data?.last_updated || "")
      setCalculationTime(data.data?.calculation_time_ms || 0)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load rankings"
      setError(errorMsg)
      console.error("[v0] Error fetching rankings:", errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRankings(timeframe)
  }, [timeframe])

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Top Performing Agents
            </CardTitle>
            <CardDescription>Agent activity rankings based on orders and referrals</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeframe === "7d" ? "default" : "outline"}
              onClick={() => setTimeframe("7d")}
              size="sm"
              className={timeframe === "7d" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              7 Days
            </Button>
            <Button
              variant={timeframe === "30d" ? "default" : "outline"}
              onClick={() => setTimeframe("30d")}
              size="sm"
              className={timeframe === "30d" ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              30 Days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error loading rankings</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        ) : rankings.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No agent activity found for this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rankings.map((agent) => (
              <div
                key={agent.rank}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  agent.rank === 1
                    ? "bg-amber-50 border-amber-200 shadow-sm"
                    : agent.rank === 2
                      ? "bg-gray-100 border-gray-300"
                      : agent.rank === 3
                        ? "bg-orange-50 border-orange-200"
                        : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                      agent.rank === 1
                        ? "bg-gradient-to-br from-amber-400 to-amber-600"
                        : agent.rank === 2
                          ? "bg-gradient-to-br from-gray-400 to-gray-600"
                          : agent.rank === 3
                            ? "bg-gradient-to-br from-orange-400 to-orange-600"
                            : "bg-blue-500"
                    }`}
                  >
                    {agent.rank}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.activity} activities</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className={
                      agent.rank === 1
                        ? "bg-amber-200 text-amber-900"
                        : agent.rank === 2
                          ? "bg-gray-200 text-gray-900"
                          : agent.rank === 3
                            ? "bg-orange-200 text-orange-900"
                            : "bg-blue-200 text-blue-900"
                    }
                  >
                    {agent.activity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && rankings.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
              <span>Timeframe: {timeframe === "7d" ? "Last 7 days" : "Last 30 days"}</span>
              <div className="flex items-center gap-4">
                <span>Calculation time: {calculationTime}ms</span>
                {lastUpdated && <span>Updated: {new Date(lastUpdated).toLocaleString()}</span>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
