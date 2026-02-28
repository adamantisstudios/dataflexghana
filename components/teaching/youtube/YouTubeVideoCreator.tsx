"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { Play } from "lucide-react"
import { toast } from "sonner"

interface YouTubeVideoCreatorProps {
  channelId: string
  teacherId: string
  teacherName: string
  onVideoCreated: () => void
}

export function YouTubeVideoCreator({ channelId, teacherId, teacherName, onVideoCreated }: YouTubeVideoCreatorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
  })

  // Extract YouTube video ID from various URL formats
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const handleCreateVideo = async () => {
    if (!form.title.trim() || !form.youtubeUrl.trim()) {
      toast.error("Title and YouTube URL are required")
      return
    }

    const videoId = extractYouTubeId(form.youtubeUrl)
    if (!videoId) {
      toast.error("Invalid YouTube URL. Please enter a valid YouTube link or video ID")
      return
    }

    try {
      setLoading(true)

      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

      const { error } = await supabase.from("youtube_videos").insert([
        {
          channel_id: channelId,
          author_id: teacherId,
          author_name: teacherName,
          title: form.title,
          description: form.description,
          youtube_url: youtubeUrl,
          youtube_video_id: videoId,
          thumbnail_url: thumbnailUrl,
        },
      ])

      if (error) {
        console.error("[v0] Error creating video:", error)
        throw error
      }

      toast.success("YouTube video posted successfully!")
      setForm({ title: "", description: "", youtubeUrl: "" })
      setOpen(false)
      onVideoCreated()
    } catch (error) {
      console.error("[v0] Error creating video:", error)
      toast.error("Failed to post video")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-8">
          <Play className="h-3 w-3 mr-1" />
          Post YouTube Video
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle className="text-base">Post YouTube Video</DialogTitle>
          <DialogDescription className="text-xs">
            Share an educational YouTube video with your channel members
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <div className="grid gap-1">
            <Label htmlFor="video-title" className="text-xs">
              Video Title
            </Label>
            <Input
              id="video-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter video title"
              className="h-8 text-xs"
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="youtube-url" className="text-xs">
              YouTube URL or Video ID
            </Label>
            <Input
              id="youtube-url"
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... or video ID"
              className="h-8 text-xs"
            />
            <p className="text-xs text-gray-500">Paste the full YouTube link or just the video ID (11 characters)</p>
          </div>
          <div className="grid gap-1">
            <Label htmlFor="video-description" className="text-xs">
              Description (Optional)
            </Label>
            <Textarea
              id="video-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add context or notes about this video"
              rows={3}
              className="text-xs"
            />
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-2 rounded">
            <p className="text-xs text-blue-900 font-medium">Tips:</p>
            <ul className="text-xs text-blue-800 mt-1 space-y-0.5">
              <li>• Use full YouTube URLs or just the video ID</li>
              <li>• Add a clear title for easy discovery</li>
              <li>• Include context in the description</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-xs h-8">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreateVideo}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-xs h-8"
          >
            {loading ? "Posting..." : "Post Video"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
