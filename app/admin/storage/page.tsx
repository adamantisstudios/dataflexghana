"use client"

import { useEffect, useState, useMemo } from "react"
import { BarChart3, TrendingUp, AlertTriangle } from "lucide-react"
import { useAdminCache } from "@/lib/admin-cache-manager"
import { AdminPageSkeleton } from "@/components/admin/admin-page-skeleton"

interface StorageSummary {
  userId: string
  email: string
  totalStorageBytes: number
  totalAudioCount: number
  maxStorageBytes: number
  storagePercentage: number
  retentionDays: number
  autoCleanupEnabled: boolean
}

export default function StorageAdminPage() {
  const [summaries, setSummaries] = useState<StorageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { fetchData } = useAdminCache(
    "admin:storage:summary",
    async () => {
      const response = await fetch("/api/admin/storage/summary")
      if (!response.ok) throw new Error("Failed to fetch storage summary")
      return response.json()
    },
    5 * 60 * 1000, // 5 minute cache
  )

  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchData()
        if (isMounted) {
          setSummaries(data)
          setError(null)
        }
      } catch (err) {
        console.error("[v0] Error fetching storage summary:", err)
        if (isMounted) {
          setError("Failed to load storage information")
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [fetchData])

  const stats = useMemo(() => {
    return {
      totalStorage: summaries.reduce((sum, s) => sum + s.totalStorageBytes, 0),
      totalAudio: summaries.reduce((sum, s) => sum + s.totalAudioCount, 0),
      overQuotaCount: summaries.filter((s) => s.storagePercentage > 100).length,
    }
  }, [summaries])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  if (loading) {
    return <AdminPageSkeleton />
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Storage Management</h1>
        <p className="text-gray-600">Monitor and manage audio storage across all users and channels</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded p-4 mb-6 text-red-600">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Storage</p>
              <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.totalStorage)}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Audio Files</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAudio}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Users</p>
              <p className="text-2xl font-bold text-gray-900">{summaries.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Over Quota</p>
              <p className="text-2xl font-bold text-gray-900">{stats.overQuotaCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* User Storage Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Storage Usage</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Storage Used</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Quota</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Usage %</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Audio Files</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map((summary) => (
                <tr key={summary.userId} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{summary.email}</td>
                  <td className="px-6 py-4 text-gray-600">{formatBytes(summary.totalStorageBytes)}</td>
                  <td className="px-6 py-4 text-gray-600">{formatBytes(summary.maxStorageBytes)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            summary.storagePercentage > 90
                              ? "bg-red-500"
                              : summary.storagePercentage > 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(summary.storagePercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-medium">{summary.storagePercentage.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{summary.totalAudioCount}</td>
                  <td className="px-6 py-4">
                    {summary.storagePercentage > 100 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        Over Quota
                      </span>
                    ) : summary.storagePercentage > 80 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                        Warning
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Storage Optimization</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Audio files are compressed using Opus codec (90% smaller than WAV)</li>
          <li>• Files older than 90 days are automatically removed</li>
          <li>• Each user has a 500 MB storage quota by default</li>
          <li>• Quotas can be adjusted per user or channel</li>
        </ul>
      </div>
    </div>
  )
}
