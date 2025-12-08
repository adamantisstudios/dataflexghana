"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, Calendar, RefreshCw, Users, Medal, Crown, Star } from "lucide-react"

interface SimpleAgent {
  name: string
  activity: number
  rank: number
}

interface RankingData {
  agents: SimpleAgent[]
  timeframe: string
  total_count: number
  last_updated: string
  fallback?: boolean
}

export default function AdminAgentRanking() {
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<"7d" | "30d">("30d")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRankings()
    // Set up auto-refresh every 3 hours (same as agent dashboard)
    const interval = setInterval(fetchRankings, 3 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeframe])

  const fetchRankings = async () => {
    try {
      setLoading(true) // Set loading to true to show spinner on refresh
      setError(null)

      console.log("🔄 Fetching admin agent rankings...", { timeframe })

      const response = await fetch(`/api/admin/agents/ranking?timeframe=${timeframe}&limit=10`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("📊 Admin rankings API response:", result)

      if (result.success) {
        setRankingData(result.data)
        console.log("✅ Admin rankings loaded successfully:", result.data.agents?.length || 0, "agents")
      } else {
        throw new Error(result.error || "Failed to fetch rankings")
      }
    } catch (err) {
      console.error("❌ Error fetching admin rankings:", err)
      const errorMessage = err instanceof Error ? err.message : "Network error occurred"
      setError(errorMessage)
      setRankingData(null)
    } finally {
      setLoading(false) // Always set loading to false when done
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      case 3:
        return <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
      default:
        return (
          <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
            {rank}
          </div>
        )
    }
  }

  const formatLastUpdated = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Unknown"
    }
  }

  if (loading && !rankingData) {
    return (
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
    )
  }

  return (
    <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <CardTitle className="text-lg sm:text-xl font-bold text-emerald-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-base sm:text-xl">Agent Performance Rankings</span>
          </CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant={timeframe === "7d" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("7d")}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                7 Days
              </Button>
              <Button
                variant={timeframe === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("30d")}
                className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                30 Days
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRankings}
              className="h-7 sm:h-8 px-2 sm:px-3 bg-transparent"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* Stats and Last Updated */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-emerald-600">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{rankingData?.total_count || 0} total agents</span>
            </div>
            {rankingData?.last_updated && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Updated: {formatLastUpdated(rankingData.last_updated)}</span>
                {rankingData.fallback && (
                  <Badge variant="outline" className="text-xs px-1 sm:px-2 py-0 ml-1">
                    Demo Data
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        {error ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-red-600 mb-4">
              <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRankings} className="text-xs sm:text-sm bg-transparent">
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : !rankingData?.agents || rankingData.agents.length === 0 ? (
          <div className="text-center py-6 sm:py-8 text-emerald-600">
            <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">No Active Agents</h3>
            <p className="text-xs sm:text-sm">No agent activity found for the selected timeframe</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Style */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {rankingData.agents.slice(0, 3).map((agent, index) => (
                <div
                  key={`${agent.name}-${agent.rank}`}
                  className={`relative p-3 sm:p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                    agent.rank === 1
                      ? "bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 shadow-lg"
                      : agent.rank === 2
                        ? "bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 shadow-md"
                        : "bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 shadow-md"
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                        agent.rank === 1 ? "bg-yellow-500" : agent.rank === 2 ? "bg-gray-400" : "bg-amber-600"
                      }`}
                    >
                      {agent.rank}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="mb-2 sm:mb-3 flex justify-center">{getRankIcon(agent.rank)}</div>
                    <h4 className="font-bold text-emerald-800 text-sm sm:text-lg mb-1 truncate">{agent.name}</h4>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-700 mb-1">{agent.activity}</div>
                    <p className="text-xs text-emerald-600">Activity Score</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Remaining Rankings */}
            {rankingData.agents.length > 3 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-emerald-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                  Other Top Performers
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                  {rankingData.agents.slice(3).map((agent) => (
                    <div
                      key={`${agent.name}-${agent.rank}`}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all duration-200"
                    >
                      <div className="flex items-center justify-center w-5 sm:w-6">{getRankIcon(agent.rank)}</div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-emerald-800 text-xs sm:text-sm truncate">{agent.name}</h5>
                      </div>
                      <div className="text-right">
                        <div className="text-sm sm:text-lg font-bold text-emerald-700">{agent.activity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-emerald-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 text-xs text-emerald-600">
                <p>Activity Score = Data Orders + Referrals + Wholesale Orders</p>
                <p className="hidden sm:block">Auto-refreshes every 3 hours</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
