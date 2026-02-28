"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircle, Trash2, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AudioFile {
  id: string
  user_id: string
  channel_id: string
  storage_path: string
  file_size_bytes: number
  duration_seconds: number | null
  created_at: string
  accessed_at: string
}

interface StorageStats {
  total_files: number
  total_size_bytes: number
  total_duration_seconds: number
  average_file_size: number
}

interface AudioManagementTabProps {
  getCachedData?: (key: string) => any
  setCachedData?: (key: string, data: any) => void
  adminUnreadCount?: number
  adminGetUnreadCount?: () => number
  adminMarkAsRead?: () => void
}

function AudioManagementTabComponent({
  getCachedData,
  setCachedData,
  adminUnreadCount,
  adminGetUnreadCount,
  adminMarkAsRead,
}: AudioManagementTabProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterChannel, setFilterChannel] = useState("")
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    loadAudioFiles()
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      const { data, error } = await supabase.from("teaching_channels").select("id, name").order("name")

      if (!error && data) {
        setChannels(data)
      }
    } catch (err) {
      console.error("[v0] Error loading channels:", err)
    }
  }

  const loadAudioFiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("audio_files_metadata")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        setAudioFiles(data)
        calculateStats(data)
      }
    } catch (err) {
      console.error("[v0] Error loading audio files:", err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (files: AudioFile[]) => {
    const stats: StorageStats = {
      total_files: files.length,
      total_size_bytes: files.reduce((sum, f) => sum + f.file_size_bytes, 0),
      total_duration_seconds: files.reduce((sum, f) => sum + (f.duration_seconds || 0), 0),
      average_file_size: 0,
    }

    if (stats.total_files > 0) {
      stats.average_file_size = Math.round(stats.total_size_bytes / stats.total_files)
    }

    setStats(stats)
  }

  const deleteAudioFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this audio file?")) return

    setDeleting(fileId)
    try {
      const { error } = await supabase.from("audio_files_metadata").delete().eq("id", fileId)

      if (error) throw error

      setAudioFiles(audioFiles.filter((f) => f.id !== fileId))
      alert("Audio file deleted successfully")
    } catch (err) {
      console.error("[v0] Error deleting audio file:", err)
      alert("Failed to delete audio file")
    } finally {
      setDeleting(null)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const filteredFiles = audioFiles.filter((file) => {
    const matchesSearch =
      file.storage_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesChannel = !filterChannel || file.channel_id === filterChannel
    return matchesSearch && matchesChannel
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-gray-600">Loading audio files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Storage Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_files}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.total_size_bytes)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.total_duration_seconds)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Avg File Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.average_file_size)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by Path or User ID</label>
              <Input
                placeholder="Search audio files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Channel</label>
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Channels</option>
                {channels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    {channel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button onClick={loadAudioFiles} variant="outline" className="w-full bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* Audio Files List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audio Files ({filteredFiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No audio files found matching your filters.</AlertDescription>
            </Alert>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">File Path</th>
                    <th className="text-left py-3 px-4 font-semibold">Size</th>
                    <th className="text-left py-3 px-4 font-semibold">Duration</th>
                    <th className="text-left py-3 px-4 font-semibold">Created</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-xs truncate max-w-xs">{file.storage_path}</td>
                      <td className="py-3 px-4">{formatBytes(file.file_size_bytes)}</td>
                      <td className="py-3 px-4">{formatDuration(file.duration_seconds)}</td>
                      <td className="py-3 px-4 text-xs">{new Date(file.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAudioFile(file.id)}
                          disabled={deleting === file.id}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleting === file.id ? "Deleting..." : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AudioManagementTabComponent
export { AudioManagementTabComponent as AudioManagementTab }
