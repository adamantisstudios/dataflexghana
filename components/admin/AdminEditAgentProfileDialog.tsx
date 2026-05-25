"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { getAgentInitials } from "@/lib/agent-profile-completion"
import type { Agent } from "@/lib/supabase"
import { toast } from "sonner"

type Props = {
  agent: Agent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (agent: Agent) => void
}

export function AdminEditAgentProfileDialog({ agent, open, onOpenChange, onSaved }: Props) {
  const [email, setEmail] = useState("")
  const [profession, setProfession] = useState("")
  const [exactLocation, setExactLocation] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [profileImageUrl, setProfileImageUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)

  useEffect(() => {
    if (!agent) return
    setEmail(agent.email?.trim() || "")
    setProfession(agent.profession?.trim() || "")
    setExactLocation(agent.exact_location?.trim() || "")
    setPhoneNumber(agent.phone_number?.trim() || "")
    setProfileImageUrl(agent.profile_image_url?.trim() || "")
  }, [agent])

  const uploadPhoto = async (file: File) => {
    if (!agent) return
    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: {
          "x-agent-id": agent.id,
          "x-agent-phone": agent.phone_number,
        },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      setProfileImageUrl(data.url)
      toast.success("Photo uploaded")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleSave = async () => {
    if (!agent) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/agents/${agent.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({
          email: email.trim(),
          profession: profession.trim(),
          exact_location: exactLocation.trim(),
          phone_number: phoneNumber.trim(),
          profile_image_url: profileImageUrl.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")
      toast.success("Agent profile updated")
      onSaved?.(data.agent)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (!agent) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit agent profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-3">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={agent.full_name}
                width={96}
                height={96}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-emerald-200"
              />
            ) : (
              <div className="h-24 w-24 rounded-2xl bg-[#0E8F3D] text-white text-xl font-bold flex items-center justify-center">
                {getAgentInitials(agent.full_name)}
              </div>
            )}
            <Label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 text-sm text-emerald-700 font-medium">
                {photoUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload profile photo
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={photoUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void uploadPhoto(f)
                  e.target.value = ""
                }}
              />
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone number</Label>
            <Input
              id="edit-phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-profession">Profession</Label>
            <Input
              id="edit-profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-location">Exact location</Label>
            <Input
              id="edit-location"
              value={exactLocation}
              onChange={(e) => setExactLocation(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
