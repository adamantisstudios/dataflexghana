"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { AudioPlayer, type AudioPlayerHandle } from "@/components/channel/AudioPlayer"
import { AudioLectureComments } from "@/components/channel/AudioLectureComments"
import type { AudioAttachment, AudioLecture } from "@/lib/channel-audio-types"
import { formatTimestamp } from "@/lib/channel-audio-types"
import { Headphones, ChevronLeft, Paperclip, Play } from "lucide-react"

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
      if (res.ok) setLectures(data.lectures || [])
    } finally {
      setLoading(false)
    }
  }, [channelId])

  useEffect(() => {
    void loadLectures()
  }, [loadLectures])

  if (loading) {
    return <p className="text-center text-gray-600 py-8 text-sm">Loading audio lectures…</p>
  }

  if (!selected) {
    return (
      <div className="space-y-4 w-full">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Headphones className="h-5 w-5 text-green-600" />
          Audio Classroom
        </h3>
        {lectures.length === 0 ? (
          <Card className="rounded-2xl border border-gray-100">
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
                onClick={() => setSelected(lecture)}
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

  const attachments = (selected.attachments || []) as AudioAttachment[]

  return (
    <div className="w-full space-y-4 pb-48 sm:pb-8">
      <Button
        variant="ghost"
        size="sm"
        className="h-11 text-gray-900"
        onClick={() => setSelected(null)}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        All lectures
      </Button>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 break-words">{selected.title}</h3>
        {selected.description && (
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selected.description}</p>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2">
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

      <AudioPlayer
        ref={playerRef}
        src={selected.audio_url}
        title={selected.title}
        sticky
        className="sm:!relative sm:!static sm:rounded-2xl"
      />

      <AudioLectureComments
        lectureId={selected.id}
        currentUserId={memberId}
        currentUserName={memberName}
        getCurrentPlaybackTime={() => playerRef.current?.getCurrentTime() ?? 0}
        onSeek={(s) => playerRef.current?.seekTo(s)}
        composerBottomClass="bottom-[11.5rem] sm:bottom-0"
      />
    </div>
  )
}
