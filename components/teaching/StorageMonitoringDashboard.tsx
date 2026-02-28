"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Trash2, BarChart3, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StorageStats {
  currentUsageBytes: number
  maxQuotaBytes: number
  isOverQuota: boolean
  percentageUsed: number
  audioCount: number
  retentionDays: number
}

interface StorageMonitoringDashboardProps {
  userId: string
  channelId: string
}

export function StorageMonitoringDashboard({ userId, channelId }: StorageMonitoringDashboardProps) {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)

  const fetchStorageStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/storage/stats?userId=${userId}&channelId=${channelId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch storage stats")
      }

      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      console.error("[v0] Error fetching storage stats:", err)
      setError("Failed to load storage information")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStorageStats()
    const interval = setInterval(fetchStorageStats, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [userId, channelId])

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true)
      const response = await fetch(`/api/storage/cleanup?userId=${userId}&channelId=${channelId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Cleanup failed")
      }

      const result = await response.json()
      console.log("[v0] Cleanup result:", result)

      // Refresh stats after cleanup
      await fetchStorageStats()
    } catch (err) {
      console.error("[v0] Cleanup error:", err)
      setError("Failed to cleanup files")
    } finally {
      setIsCleaningUp(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading storage information...</div>
  }

  if (error || !stats) {
    return <div className="text-sm text-red-600">{error || "Unable to load storage stats"}</div>
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const progressColor =
    stats.percentageUsed > 90 ? "bg-red-500" : stats.percentageUsed > 70 ? "bg-yellow-500" : "bg-green-500"

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-600" />
          <h3 className="font-medium text-gray-900">Storage Usage</h3>
        </div>
        <button
          onClick={fetchStorageStats}
          disabled={loading}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {stats.isOverQuota && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-600">Storage quota exceeded. Please cleanup old files.</span>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600">
          <span>
            {formatBytes(stats.currentUsageBytes)} / {formatBytes(stats.maxQuotaBytes)}
          </span>
          <span>{stats.percentageUsed.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${progressColor}`}
            style={{ width: `${stats.percentageUsed}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white p-2 rounded border border-gray-200">
          <div className="text-gray-600">Audio Files</div>
          <div className="font-semibold text-gray-900">{stats.audioCount}</div>
        </div>
        <div className="bg-white p-2 rounded border border-gray-200">
          <div className="text-gray-600">Retention</div>
          <div className="font-semibold text-gray-900">{stats.retentionDays} days</div>
        </div>
      </div>

      {stats.isOverQuota && (
        <Button
          size="sm"
          variant="destructive"
          className="w-full text-xs"
          onClick={handleCleanup}
          disabled={isCleaningUp}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          {isCleaningUp ? "Cleaning..." : "Cleanup Old Files"}
        </Button>
      )}

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
        <p>Opus compression reduces file size by ~90% compared to WAV format.</p>
        <p>Files older than {stats.retentionDays} days are automatically removed.</p>
      </div>
    </div>
  )
}
