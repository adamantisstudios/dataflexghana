"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { AudioPlayer, type AudioPlayerHandle } from "@/components/channel/AudioPlayer"
import { AudioLectureComments } from "@/components/channel/AudioLectureComments"
import type { AudioLecture } from "@/lib/channel-audio-types"
import { formatTimestamp, parseAttachments } from "@/lib/channel-audio-types"
import {
  resolveAudioPlaybackSrc,
  teachingHubContentCardClass,
  teachingHubFullBleedClass,
} from "@/components/teaching/teaching-hub-ui"
import { TeachingSectionErrorBoundary } from "@/components/teaching/TeachingSectionErrorBoundary"
import { Headphones, Paperclip, Play, X } from "lucide-react"

type Props = {
  channelId: string
  memberId: string
  memberName: string
}

export function ChannelAudioClassroom({ channelId, memberId, memberName }: Props) {
  const [lectures, setLectures] = useState<AudioLecture[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AudioLecture | null>(null)
  const playerRef = useRef<AudioPlayerHandle>(null)

  const loadLectures = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/channel/${channelId}/audio`, {
        headers: getAgentAuthHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("[audio classroom]", data.error)
        return
      }
      const list = (data.lectures || []).map((lecture: AudioLecture) => ({
        ...lecture,
        attachments: parseAttachments(lecture.attachments),
      }))
      setLectures(list)
    } finally {
      setLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    void loadLectures()
  }, [loadLectures])

  const closeDetail = () => {
    playerRef.current?.pause()
    setSelected(null)
  }

  if (loading) {
    return <p className="text-center text-gray-600 py-8 text-sm">Loading audio lectures…</p>
  }

  if (!selected) {
    return (
      <div className={`space-y-4 ${teachingHubFullBleedClass}`}>
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Headphones className="h-5 w-5 text-green-600" />
          Audio Classroom
        </h3>
        {lectures.length === 0 ? (
          <Card className={teachingHubContentCardClass}>
            <CardContent className="py-8 text-center text-gray-600 text-sm">
              No audio lectures yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {lectures.map((lecture) => (
              <Card
                key={lecture.id}
                className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  setSelected({
                    ...lecture,
                    attachments: parseAttachments(lecture.attachments),
                  })
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Play className="h-5 w-5 text-green-600 ml-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm break-words">{lecture.title}</h4>
                      {lecture.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{lecture.description}</p>
                      )}
                      <p className="text-[11px] text-gray-500 mt-2">
                        {formatTimestamp(lecture.duration ?? 0)} ·{" "}
                        {new Date(lecture.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const attachments = parseAttachments(selected.attachments)

  return (
    <TeachingSectionErrorBoundary sectionName="audio lecture">
      <div
        className={`flex w-full max-w-none flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${teachingHubFullBleedClass}`}
        style={{ minHeight: "min(72dvh, 680px)", maxHeight: "85dvh" }}
      >
        {/* Header + close */}
        <div className="relative shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={closeDetail}
            className="absolute right-3 top-3 flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-gray-500 hover:bg-slate-100 hover:text-gray-900"
            aria-label="Close lecture"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="pr-14">
            <h3 className="text-base font-semibold text-gray-900 break-words sm:text-lg">{selected.title}</h3>
            {selected.description && (
              <p className="mt-1 text-sm leading-relaxed text-gray-600 line-clamp-2">{selected.description}</p>
            )}
          </div>
          {attachments.length > 0 && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" />
                Attachments
              </p>
              <ul className="space-y-1">
                {attachments.map((a, i) => (
                  <li key={`${a.url}-${i}`}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-700 hover:underline break-all min-h-[44px] inline-flex items-center"
                    >
                      {a.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Player — fixed height, no sticky/fixed positioning */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5">
          <AudioPlayer
            ref={playerRef}
            src={resolveAudioPlaybackSrc(selected)}
            title={selected.title}
            sticky={false}
            className="shadow-none border-0 p-0"
          />
        </div>

        {/* Comments — scrollable list + sticky composer */}
        {selected.id && (
          <AudioLectureComments
            layout="panel"
            lectureId={selected.id}
            currentUserId={memberId}
            currentUserName={memberName}
            getCurrentPlaybackTime={() => playerRef.current?.getCurrentTime() ?? 0}
            onSeek={(s) => playerRef.current?.seekTo(s)}
          />
        )}
      </div>
    </TeachingSectionErrorBoundary>
  )
}
