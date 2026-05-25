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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { getAdminAuthHeaders } from "@/lib/api-client"
import { getAgentInitials } from "@/lib/agent-profile-completion"
import { VOICE_ROOM_REGIONS } from "@/lib/voice-room-regions"
import type { Agent } from "@/lib/supabase"
import { toast } from "sonner"

type AgentEdit = Agent & {
  admin_notes?: string | null
}

type Props = {
  agent: AgentEdit | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (agent: AgentEdit) => void
}

export function AdminEditAgentProfileDialog({ agent, open, onOpenChange, onSaved }: Props) {
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [momoNumber, setMomoNumber] = useState("")
  const [email, setEmail] = useState("")
  const [region, setRegion] = useState("")
  const [profession, setProfession] = useState("")
  const [exactLocation, setExactLocation] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isbanned, setIsbanned] = useState(false)
  const [canTeach, setCanTeach] = useState(false)
  const [canPublishProducts, setCanPublishProducts] = useState(false)
  const [canUpdateProducts, setCanUpdateProducts] = useState(false)
  const [canPublishProperties, setCanPublishProperties] = useState(false)
  const [canUpdateProperties, setCanUpdateProperties] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!agent) return
    setFullName(agent.full_name?.trim() || "")
    setPhoneNumber(agent.phone_number?.trim() || "")
    setMomoNumber(agent.momo_number?.trim() || "")
    setEmail(agent.email?.trim() || "")
    setRegion(agent.region?.trim() || VOICE_ROOM_REGIONS[0])
    setProfession(agent.profession?.trim() || "")
    setExactLocation(agent.exact_location?.trim() || "")
    setAdminNotes(agent.admin_notes?.trim() || "")
    setIsbanned(agent.isbanned === true)
    setCanTeach(agent.can_teach === true)
    setCanPublishProducts(agent.can_publish_products === true)
    setCanUpdateProducts(agent.can_update_products === true)
    setCanPublishProperties(agent.can_publish_properties === true)
    setCanUpdateProperties(agent.can_update_properties === true)
  }, [agent])

  const handleSave = async () => {
    if (!agent) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/agents/${agent.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminAuthHeaders() },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          momo_number: momoNumber.trim(),
          email: email.trim(),
          region: region.trim(),
          profession: profession.trim(),
          exact_location: exactLocation.trim(),
          admin_notes: adminNotes.trim(),
          isbanned,
          can_teach: canTeach,
          can_publish_products: canPublishProducts,
          can_update_products: canUpdateProducts,
          can_publish_properties: canPublishProperties,
          can_update_properties: canUpdateProperties,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed")
      toast.success("Agent profile updated successfully")
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
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit agent profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <section className="flex flex-col items-center gap-2 pb-2 border-b">
            <p className="text-xs text-gray-500 w-full text-center">Profile photo (read-only)</p>
            {agent.profile_image_url ? (
              <Image
                src={agent.profile_image_url}
                alt={agent.full_name}
                width={88}
                height={88}
                className="h-22 w-22 rounded-2xl object-cover border-2 border-emerald-200"
              />
            ) : (
              <div className="h-22 w-22 rounded-2xl bg-[#0E8F3D] text-white text-lg font-bold flex items-center justify-center min-h-[88px] min-w-[88px]">
                {getAgentInitials(agent.full_name)}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-emerald-800">Basic info</h3>
            <div className="space-y-2">
              <Label htmlFor="edit-full-name">Full name</Label>
              <Input id="edit-full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone number</Label>
                <Input id="edit-phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-momo">MoMo number</Label>
                <Input id="edit-momo" value={momoNumber} onChange={(e) => setMomoNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_ROOM_REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-profession">Profession</Label>
              <Input id="edit-profession" value={profession} onChange={(e) => setProfession(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Exact location</Label>
              <Input id="edit-location" value={exactLocation} onChange={(e) => setExactLocation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Admin notes</Label>
              <Textarea
                id="edit-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="resize-y"
              />
            </div>
          </section>

          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold text-emerald-800">Account & permissions</h3>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="edit-banned" className="text-sm">Banned</Label>
              <Switch id="edit-banned" checked={isbanned} onCheckedChange={setIsbanned} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="edit-teach" className="text-sm">Can teach</Label>
              <Switch id="edit-teach" checked={canTeach} onCheckedChange={setCanTeach} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="edit-pub-prod" className="text-sm">Publish products</Label>
              <Switch id="edit-pub-prod" checked={canPublishProducts} onCheckedChange={setCanPublishProducts} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="edit-upd-prod" className="text-sm">Update products</Label>
              <Switch id="edit-upd-prod" checked={canUpdateProducts} onCheckedChange={setCanUpdateProducts} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="edit-pub-prop" className="text-sm">Publish properties</Label>
              <Switch id="edit-pub-prop" checked={canPublishProperties} onCheckedChange={setCanPublishProperties} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="edit-upd-prop" className="text-sm">Update properties</Label>
              <Switch id="edit-upd-prop" checked={canUpdateProperties} onCheckedChange={setCanUpdateProperties} />
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
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
