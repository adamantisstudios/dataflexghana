"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Play, Plus, Pencil, Trash2, RefreshCw } from "lucide-react"
import { getAdminAuthHeaders } from "@/lib/api-client"

type Platform = "vimeo" | "youtube"

interface TutorialRow {
  id: string
  title: string
  embed_code: string | null
  platform: Platform
  order_index: number
  is_active: boolean
  created_at: string
}

const emptyForm = {
  title: "",
  embed_code: "",
  order_index: "0",
  platform: "vimeo" as Platform,
  is_active: true,
}

function adminHeaders(): HeadersInit {
  return getAdminAuthHeaders()
}

export default function TutorialsAdminTab() {
  const [rows, setRows] = useState<TutorialRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<TutorialRow | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/tutorials", { headers: adminHeaders() })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load")
      setRows(data.data || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load tutorials")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    const nextOrder = rows.length > 0 ? Math.max(...rows.map((r) => r.order_index)) + 1 : 1
    setForm({ ...emptyForm, order_index: String(nextOrder) })
    setDialogOpen(true)
  }

  const openEdit = (row: TutorialRow) => {
    setEditing(row)
    setForm({
      title: row.title,
      embed_code: row.embed_code || "",
      order_index: String(row.order_index),
      platform: row.platform || "vimeo",
      is_active: row.is_active,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!form.embed_code.trim()) {
      toast.error("Embed code is required")
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        embed_code: form.embed_code.trim(),
        order_index: Number(form.order_index) || 0,
        platform: form.platform,
        is_active: form.is_active,
      }

      const res = await fetch("/api/admin/tutorials", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...adminHeaders() },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Save failed")

      toast.success(editing ? "Video updated" : "Video added")
      setDialogOpen(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tutorial video?")) return
    try {
      const res = await fetch(`/api/admin/tutorials?id=${id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast.success("Deleted")
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Play className="h-6 w-6" />
            Video Tutorials
          </h2>
          <p className="text-muted-foreground text-sm">
            Paste full Vimeo or YouTube iframe embed codes. Active videos appear in the agent vertical feed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Video
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All tutorial videos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No videos yet. Click Add Video to paste an embed.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border rounded-lg p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold">{row.title}</span>
                      <Badge variant="outline" className="capitalize">{row.platform}</Badge>
                      <Badge variant="secondary">Order {row.order_index}</Badge>
                      {row.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono line-clamp-2 break-all">
                      {row.embed_code || "No embed code"}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit video" : "Add video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => setForm({ ...form, platform: v as Platform })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Order index</Label>
              <Input
                type="number"
                min={0}
                value={form.order_index}
                onChange={(e) => setForm({ ...form, order_index: e.target.value })}
              />
            </div>
            <div>
              <Label>Embed code (full iframe)</Label>
              <Textarea
                rows={6}
                value={form.embed_code}
                onChange={(e) => setForm({ ...form, embed_code: e.target.value })}
                placeholder='<iframe src="https://player.vimeo.com/video/..." ...></iframe>'
                className="font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tutorial_is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <Label htmlFor="tutorial_is_active">Active (visible in agent feed)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
