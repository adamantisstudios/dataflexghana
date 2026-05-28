"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import type { AudioAttachment, AudioLecture } from "@/lib/channel-audio-types"
import { formatTimestamp, parseAttachments } from "@/lib/channel-audio-types"
import { resolveAudioPlaybackSrc, teachingHubFullBleedClass } from "@/components/teaching/teaching-hub-ui"
import { TeachingSectionErrorBoundary } from "@/components/teaching/TeachingSectionErrorBoundary"
import { AudioPlayer } from "@/components/channel/AudioPlayer"
import { formatUploadErrorMessage } from "@/lib/upload-error-messages"
import { toast } from "sonner"
import { Headphones, Trash2, Upload, Plus, X, Play, ChevronLeft } from "lucide-react"
import { ChannelAudioRecorder } from "@/components/channel/ChannelAudioRecorder"
import { AudioLectureAttachments } from "@/components/channel/AudioLectureAttachments"
import { cn } from "@/lib/utils"

type Props = {
  channelId: string
}

export function ChannelAudioLecturesAdmin({ channelId }: Props) {
  const [lectures, setLectures] = useState<AudioLecture[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [attachments, setAttachments] = useState<AudioAttachment[]>([])
  const [attachmentUrl, setAttachmentUrl] = useState("")
  const [attachmentName, setAttachmentName] = useState("")
  const [previewLecture, setPreviewLecture] = useState<AudioLecture | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadingAttachments, setUploadingAttachments] = useState(false)

  const loadLectures = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/channel/${channelId}/audio`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (res.ok) {
        const list = (data.lectures || []).map((lecture: AudioLecture) => ({
          ...lecture,
          attachments: parseAttachments(lecture.attachments),
        }))
        setLectures(list)
      }
      else toast.error(data.error || "Failed to load lectures")
    } finally {
      setLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    void loadLectures()
  }, [loadLectures])

  const uploadAttachmentFile = async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    form.append("channelId", channelId)
    const res = await fetch("/api/channel/audio/upload-attachment", {
      method: "POST",
      headers: { Authorization: getAgentAuthHeaders().Authorization || "" },
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Attachment upload failed")
    return data.attachment as AudioAttachment
  }

  const addAttachmentFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    setUploadingAttachments(true)
    try {
      const uploaded: AudioAttachment[] = []
      for (const file of list) {
        const att = await uploadAttachmentFile(file)
        uploaded.push(att)
      }
      setAttachments((prev) => [...prev, ...uploaded])
      toast.success(uploaded.length === 1 ? "Attachment added" : `${uploaded.length} attachments added`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingAttachments(false)
    }
  }

  const addUrlAttachment = () => {
    if (!attachmentUrl.trim()) return
    setAttachments((prev) => [
      ...prev,
      {
        name: attachmentName.trim() || "Resource",
        url: attachmentUrl.trim(),
        type: "application/octet-stream",
      },
    ])
    setAttachmentUrl("")
    setAttachmentName("")
  }

  const uploadLectureFile = async (file: File, onProgress?: (p: number) => void) => {
    if (!title.trim()) {
      toast.error("Enter a title before uploading")
      throw new Error("Title required")
    }

    setUploading(true)
    onProgress?.(10)
    setProgress(10)
    try {
      const form = new FormData()
      form.append("title", title.trim())
      form.append("description", description.trim())
      form.append("audio", file)
      form.append("attachments", JSON.stringify(attachments))
      onProgress?.(40)
      setProgress(40)

      const res = await fetch(`/api/channel/${channelId}/audio`, {
        method: "POST",
        headers: { Authorization: getAgentAuthHeaders().Authorization || "" },
        body: form,
      })
      onProgress?.(90)
      setProgress(90)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      toast.success("Audio lecture uploaded")
      setTitle("")
      setDescription("")
      setAudioFile(null)
      setAttachments([])
      onProgress?.(100)
      setProgress(100)
      await loadLectures()
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 500)
    }
  }

  const handleUpload = async () => {
    if (!title.trim() || !audioFile) {
      toast.error("Title and audio file are required")
      return
    }
    try {
      await uploadLectureFile(audioFile)
    } catch (e) {
      toast.error(formatUploadErrorMessage(e, "Audio upload failed"))
    }
  }

  const deleteLecture = async (lectureId: string) => {
    if (!confirm("Delete this audio lecture?")) return
    try {
      const res = await fetch(
        `/api/channel/${channelId}/audio?lectureId=${encodeURIComponent(lectureId)}`,
        { method: "DELETE", headers: getAgentAuthHeaders() },
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast.success("Lecture deleted")
      await loadLectures()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  if (previewLecture) {
    const attachments = parseAttachments(previewLecture.attachments)
    return (
      <TeachingSectionErrorBoundary sectionName="audio preview">
        <div className="w-full space-y-4 overflow-x-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-11 text-gray-900"
            onClick={() => setPreviewLecture(null)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to lectures
          </Button>
          <h3 className="text-lg font-semibold text-gray-900 break-words">{previewLecture.title}</h3>
          {previewLecture.description && (
            <p className="text-sm text-gray-600">{previewLecture.description}</p>
          )}
          <AudioPlayer
            src={resolveAudioPlaybackSrc(previewLecture)}
            title={previewLecture.title}
            className="!relative !static rounded-2xl"
          />
          {attachments.length > 0 && (
            <AudioLectureAttachments attachments={attachments} className="mt-2" />
          )}
        </div>
      </TeachingSectionErrorBoundary>
    )
  }

  return (
    <div className={`space-y-4 ${teachingHubFullBleedClass}`}>
      <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
        <Headphones className="h-4 w-4 text-green-600" />
        Audio Lectures
      </h3>

      <Card className="rounded-2xl border border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Upload new lecture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="audio-title" className="text-xs">
              Title
            </Label>
            <Input
              id="audio-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 text-sm"
              placeholder="Lecture title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="audio-desc" className="text-xs">
              Description
            </Label>
            <Textarea
              id="audio-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-sm"
              placeholder="What members will learn…"
            />
          </div>
          <ChannelAudioRecorder
            disabled={uploading}
            onRecordedFile={(file) => setAudioFile(file)}
            onUploadProgress={setProgress}
            autoUpload={
              title.trim()
                ? async (file, onProgress) => {
                    await uploadLectureFile(file, onProgress)
                  }
                : undefined
            }
          />

          <div className="grid gap-2">
            <Label htmlFor="audio-file" className="text-xs">
              Or upload a file (MP3, WAV, M4A)
            </Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a"
              className="h-11 text-sm"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
            />
            {audioFile && (
              <p className="text-xs text-gray-600 truncate">
                Selected: {audioFile.name} ({(audioFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <div
            className={cn(
              "rounded-xl border border-dashed p-4 space-y-3 transition-colors",
              dragOver ? "border-emerald-400 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50",
            )}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              if (e.dataTransfer.files?.length) void addAttachmentFiles(e.dataTransfer.files)
            }}
          >
            <p className="text-xs font-semibold text-slate-700">Attachments (optional)</p>
            <p className="text-[11px] text-slate-500">
              Drag & drop PDFs, images, or notes — or browse below. Multiple files supported.
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.txt,.md,image/*,application/pdf"
              className="h-11 text-sm"
              disabled={uploadingAttachments}
              onChange={(e) => {
                if (e.target.files?.length) void addAttachmentFiles(e.target.files)
                e.target.value = ""
              }}
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Display name"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="h-11 text-sm flex-1"
              />
              <Input
                placeholder="Or paste URL…"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="h-11 text-sm flex-[2]"
              />
              <Button type="button" variant="outline" className="h-11 shrink-0" onClick={addUrlAttachment}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {uploadingAttachments && (
              <p className="text-xs text-emerald-700">Uploading attachments…</p>
            )}
            {attachments.length > 0 && (
              <ul className="text-xs space-y-1">
                {attachments.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm">
                    <span className="truncate font-medium text-slate-800">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                      className="flex h-11 w-11 items-center justify-center text-slate-400 hover:text-red-600"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {uploading && progress > 0 && <Progress value={progress} className="h-2" />}

          <Button
            className="w-full h-11 bg-green-500 hover:bg-green-600 text-white"
            disabled={uploading}
            onClick={() => void handleUpload()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading…" : "Upload lecture"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-800 uppercase tracking-wide">Published lectures</h4>
        {loading ? (
          <p className="text-xs text-gray-500">Loading…</p>
        ) : lectures.length === 0 ? (
          <p className="text-xs text-gray-500">No lectures yet.</p>
        ) : (
          lectures.map((lecture) => (
            <Card
              key={lecture.id}
              className="rounded-xl border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setPreviewLecture(lecture)}
            >
              <CardContent className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-start gap-3 flex-1">
                  <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Play className="h-5 w-5 text-green-600 ml-0.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 break-words">{lecture.title}</p>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {formatTimestamp(lecture.duration ?? 0)} ·{" "}
                      {new Date(lecture.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    void deleteLecture(lecture.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
