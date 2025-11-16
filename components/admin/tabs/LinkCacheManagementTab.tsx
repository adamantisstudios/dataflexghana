"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface CacheStats {
  totalEntries: number
  activeEntries: number
  expiredEntries: number
  cacheSize: string
}

export function LinkCacheManagementTab() {
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    loadCacheStats()
  }, [])

  const loadCacheStats = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/link-preview-cache?action=stats")

      if (!response.ok) {
        throw new Error("Failed to fetch cache stats")
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[v0] Error loading cache stats:", error)
      toast.error("Failed to load cache statistics")
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm("Are you sure you want to clear all cached link previews? This cannot be undone.")) {
      return
    }

    try {
      setClearing(true)
      const response = await fetch("/api/admin/link-preview-cache", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to clear cache")
      }

      toast.success("Link preview cache cleared successfully")
      loadCacheStats()
    } catch (error) {
      console.error("[v0] Error clearing cache:", error)
      toast.error("Failed to clear cache")
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading cache statistics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cached Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalEntries || 0}</div>
            <p className="text-xs text-gray-500 mt-1">All cached previews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.activeEntries || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Valid and cached</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Expired Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{stats?.expiredEntries || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Ready for cleanup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cache Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.cacheSize || "0 MB"}</div>
            <p className="text-xs text-gray-500 mt-1">Estimated storage</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>Manage link preview cache and storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">About Link Preview Cache</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Previews are cached for 3 days to improve performance</li>
              <li>Expired entries are automatically cleaned up</li>
              <li>Cache includes title, description, image, and domain information</li>
              <li>SSRF protection prevents access to private networks</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={loadCacheStats} variant="outline" disabled={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleClearCache}
              variant="destructive"
              disabled={clearing || (stats?.totalEntries || 0) === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {clearing ? "Clearing..." : "Clear Cache"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Configuration</CardTitle>
          <CardDescription>Current cache settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Cache TTL</span>
              <Badge>3 days</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Max Response Size</span>
              <Badge>2 MB</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">Fetch Timeout</span>
              <Badge>5 seconds</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">SSRF Protection</span>
              <Badge variant="secondary">Enabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LinkCacheManagementTab
