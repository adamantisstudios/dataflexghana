"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { toast } from "sonner"
import { Plus, Trash2, Edit2, FileText } from "lucide-react"

interface LessonNote {
  id: string
  channel_id: string
  author_id: string
  author_name: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

interface LessonNotesManagerProps {
  channelId: string
  teacherId: string
  teacherName: string
  onNotesUpdated?: () => void
}

export function LessonNotesManager({ channelId, teacherId, teacherName, onNotesUpdated }: LessonNotesManagerProps) {
  const [notes, setNotes] = useState<LessonNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<LessonNote | null>(null)
  const [formData, setFormData] = useState({ title: "", content: "" })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [channelId])

  const loadNotes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("lesson_notes")
        .select("*")
        .eq("channel_id", channelId)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error("[v0] Error loading lesson notes:", error)
      toast.error("Failed to load lesson notes")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required")
      return
    }

    try {
      setIsSaving(true)

      if (editingNote) {
        // Update existing note
        const { error } = await supabase
          .from("lesson_notes")
          .update({
            title: formData.title,
            content: formData.content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingNote.id)

        if (error) throw error
        toast.success("Lesson note updated successfully!")
      } else {
        // Create new note
        const { error } = await supabase.from("lesson_notes").insert([
          {
            channel_id: channelId,
            author_id: teacherId,
            author_name: teacherName,
            title: formData.title,
            content: formData.content,
          },
        ])

        if (error) throw error
        toast.success("Lesson note created successfully!")
      }

      setShowDialog(false)
      setFormData({ title: "", content: "" })
      setEditingNote(null)
      loadNotes()
      onNotesUpdated?.()
    } catch (error) {
      console.error("[v0] Error saving lesson note:", error)
      toast.error("Failed to save lesson note")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this lesson note?")) return

    try {
      const { error } = await supabase.from("lesson_notes").delete().eq("id", noteId)

      if (error) throw error
      toast.success("Lesson note deleted")
      loadNotes()
      onNotesUpdated?.()
    } catch (error) {
      console.error("[v0] Error deleting lesson note:", error)
      toast.error("Failed to delete lesson note")
    }
  }

  const handleEditNote = (note: LessonNote) => {
    setEditingNote(note)
    setFormData({ title: note.title, content: note.content })
    setShowDialog(true)
  }

  const handleOpenNewNote = () => {
    setEditingNote(null)
    setFormData({ title: "", content: "" })
    setShowDialog(true)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading lesson notes...</div>
  }

  return (
    <div className="space-y-4 w-full">
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button onClick={handleOpenNewNote} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            {editingNote ? "Edit Lesson Note" : "Create Lesson Note"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] w-full">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit Lesson Note" : "Create New Lesson Note"}</DialogTitle>
            <DialogDescription>
              {editingNote ? "Update your lesson note" : "Create a new lesson note for your channel"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Lesson note title"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your lesson notes here..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDialog(false)
                setEditingNote(null)
                setFormData({ title: "", content: "" })
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveNote}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Saving..." : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        <h3 className="font-semibold text-blue-800 text-lg">Lesson Notes</h3>
        {notes.length === 0 ? (
          <div className="bg-blue-50 border-b-2 border-blue-200 rounded p-6 text-center text-blue-600">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No lesson notes yet. Create your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border-b-2 border-blue-200 pb-3 bg-blue-50 p-4 rounded">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-blue-800 break-words">{note.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">Updated {formatDateTime(note.updated_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditNote(note)}
                      className="text-blue-600 border-blue-300"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteNote(note.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-700 whitespace-pre-wrap break-words">{note.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
