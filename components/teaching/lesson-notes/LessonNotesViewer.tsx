"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { FileText } from "lucide-react"

interface LessonNote {
  id: string
  title: string
  content: string
  author_name: string
  updated_at: string
  is_deleted?: boolean
}

interface LessonNotesViewerProps {
  channelId: string
}

export function LessonNotesViewer({ channelId }: LessonNotesViewerProps) {
  const [notes, setNotes] = useState<LessonNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("lesson_notes")
          .select("id, title, content, author_name, updated_at, is_deleted, is_published")
          .eq("channel_id", channelId)
          .eq("is_published", true)
          .order("updated_at", { ascending: false })

        if (error) throw error
        setNotes((data || []).filter((n) => !n.is_deleted))
      } catch (err) {
        console.error("Failed to load lesson notes:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [channelId])

  if (loading) {
    return <p className="text-sm text-gray-500 py-4">Loading lesson notes...</p>
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        No lesson notes published yet.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <article key={note.id} className="rounded-lg border border-green-100 bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-[#0E8F3D] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{note.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {note.author_name} · {new Date(note.updated_at).toLocaleDateString()}
              </p>
              <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{note.content}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
