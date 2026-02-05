"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, Calendar, RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { rankingCache } from "@/lib/ranking-cache"

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
}

export default function Top5AgentsRanking() {
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeframe, setTimeframe] = useState<"7d" | "30d">("30d")
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (isExpanded && !hasLoadedOnce) {
      fetchRankings()
      setHasLoadedOnce(true)
    }
  }, [isExpanded, hasLoadedOnce])

  useEffect(() => {
    if (isExpanded && hasLoadedOnce) {
      fetchRankings()
    }
  }, [timeframe])

  const fetchRankings = async (isRetry = false) => {
    try {
      setLoading(true)
      setError(null)
      if (!isRetry) {
        setRetryCount(0)
      }

      const cacheKey = `top5-rankings-${timeframe}`

      // Use cache with request deduplication
      const result = await rankingCache.getOrFetch(
        cacheKey,
        async () => {
          const response = await fetch(`/api/admin/agents/ranking?timeframe=${timeframe}&limit=5`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          return response.json()
        },
        5 * 60 * 1000, // 5-minute client cache
      )

      if (result.success) {
        setRankingData(result.data)
        setError(null)
      } else {
        throw new Error(result.error || "Failed to fetch rankings")
      }
    } catch (err) {
      console.error("❌ Error fetching rankings:", err)
      const errorMessage = err instanceof Error ? err.message : "Network error occurred"
      setError(errorMessage)
      setRankingData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    rankingCache.invalidate(`top5-rankings-${timeframe}`)
    fetchRankings(true)
  }

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />
      case 2:
        return <Trophy className="h-4 w-4 text-gray-400" />
      case 3:
        return <Trophy className="h-4 w-4 text-amber-600" />
      default:
        return (
          <div className="h-4 w-4 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
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

  return (
    <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-emerald-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Agent Performance
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleExpanded}
            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show Top 5
              </>
            )}
          </Button>
        </div>

        {!isExpanded && (
          <p className="text-sm text-emerald-600">Click "Show Top 5" to view real-time agent performance rankings</p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              <Button
                variant={timeframe === "7d" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("7d")}
                className="h-7 px-2 text-xs"
                disabled={loading}
              >
                7 Days
              </Button>
              <Button
                variant={timeframe === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe("30d")}
                className="h-7 px-2 text-xs"
                disabled={loading}
              >
                30 Days
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchRankings}
              disabled={loading}
              className="text-xs bg-transparent"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {rankingData?.last_updated && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 mb-3">
              <Calendar className="h-3 w-3" />
              <span>Updated: {formatLastUpdated(rankingData.last_updated)}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded bg-emerald-50 animate-pulse">
                  <div className="w-4 h-4 bg-emerald-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-emerald-200 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-emerald-200 rounded w-8"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="text-xs bg-transparent"
                  disabled={loading}
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                  Retry ({retryCount}/3)
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Unable to load agent rankings. Please try again or contact support if the issue persists.
              </p>
            </div>
          ) : !rankingData?.agents || rankingData.agents.length === 0 ? (
            <div className="text-center py-6 text-emerald-600">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active agents found for the selected timeframe</p>
              <p className="text-xs text-emerald-500 mt-1">Try selecting a different time period or check back later</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rankingData.agents.map((agent) => (
                <div
                  key={`${agent.name}-${agent.rank}`}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:scale-[1.01] ${
                    agent.rank === 1
                      ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200"
                      : agent.rank === 2
                        ? "bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200"
                        : agent.rank === 3
                          ? "bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200"
                          : "bg-emerald-50 border border-emerald-100"
                  }`}
                >
                  <div className="flex items-center justify-center w-6">{getRankIcon(agent.rank)}</div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-emerald-800 text-sm truncate">{agent.name}</h4>
                    <p className="text-xs text-emerald-600">Rank #{agent.rank}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-700">{agent.activity}</div>
                    <p className="text-xs text-emerald-500">Activity</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rankingData?.agents && rankingData.agents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-emerald-100">
              <p className="text-xs text-center text-emerald-600">
                Activity Score = Data Orders + Referrals + Wholesale Orders + Voucher Orders
              </p>
              <p className="text-xs text-center text-emerald-500 mt-1">
                Rankings update in real-time based on agent performance
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
