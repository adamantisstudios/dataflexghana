"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ShieldAlert } from "lucide-react"
import { FacePhotoUpload } from "@/components/ui/FacePhotoUpload"
import { getStoredAgent } from "@/lib/unified-auth-system"
import { isPlatformAdminAgent } from "@/lib/platform-admin"
import { isAgentProfileVerified } from "@/lib/agent-profile-completion"
import { getPhotoVerificationStatus } from "@/lib/photo-verification-status"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { confirmAgentProfilePhotoVerified } from "@/lib/agent-profile-photo-client"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

const POLL_MS = 10_000

export function ForcedProfileVerificationDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [agent, setAgent] = useState<{
    id: string
    email?: string | null
    profile_image_url?: string | null
    profile_verified?: boolean | null
    isapproved?: boolean
  } | null>(null)

  const refreshAgent = useCallback(async () => {
    const stored = getStoredAgent()
    if (!stored?.id || isPlatformAdminAgent(stored)) {
      setOpen(false)
      return
    }
    if (!stored.isapproved) {
      setOpen(false)
      return
    }

    const { data } = await supabase
      .from("agents")
      .select("id, email, profile_image_url, profile_verified, isapproved")
      .eq("id", stored.id)
      .maybeSingle()

    const row = data ?? stored
    setAgent(row)

    if (isAgentProfileVerified(row)) {
      setOpen(false)
      const merged = { ...stored, ...row, profile_verified: true }
      localStorage.setItem("agent", JSON.stringify(merged))
      return
    }

    setOpen(true)
  }, [])

  useEffect(() => {
    void refreshAgent()
    const id = window.setInterval(() => void refreshAgent(), POLL_MS)
    return () => window.clearInterval(id)
  }, [refreshAgent])

  const uploadProfilePhoto = async (file: File) => {
    if (!agent?.id) return
    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: {
          "x-agent-id": agent.id,
          "x-agent-phone": (agent as { phone_number?: string }).phone_number || "",
        },
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      const verified = await confirmAgentProfilePhotoVerified(data.url)
      if (!verified.ok) throw new Error(verified.error || "Could not submit photo")
      toast.success("Photo submitted — waiting for admin approval")
      await refreshAgent()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setPhotoUploading(false)
    }
  }

  if (!open || !agent) return null

  const photoStatus = getPhotoVerificationStatus(agent)
  const pending = photoStatus === "pending"

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md w-[calc(100vw-1.5rem)] [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
            Account verification required
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            You must verify your account before accessing the dashboard. Please upload a clear photo of
            your face.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {pending ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Verification pending — please wait for admin approval. This screen will close
              automatically once approved.
            </div>
          ) : (
            <FacePhotoUpload
              label="Profile photo"
              uploading={photoUploading}
              disabled={photoUploading}
              onFile={uploadProfilePhoto}
            />
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => router.push("/agent/settings")}
          >
            Open profile settings
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Need help?{" "}
            <Link href="/agent/settings" className="text-[#0E8F3D] underline">
              Complete your profile
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
