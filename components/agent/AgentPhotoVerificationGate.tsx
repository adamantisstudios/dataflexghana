"use client"

import { useCallback, useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { PhotoVerificationWelcome } from "@/components/agent/PhotoVerificationWelcome"
import { Button } from "@/components/ui/button"
import { FacePhotoUpload } from "@/components/ui/FacePhotoUpload"
import { getStoredAgent, logoutAgent } from "@/lib/unified-auth-system"
import { isPlatformAdminAgent } from "@/lib/platform-admin"
import {
  agentRequiresPhotoVerification,
  AGENT_PHOTO_VERIFICATION_HOLD_PATH,
  isAgentAuthPublicPath,
  isAgentPhotoVerificationHoldPath,
} from "@/lib/agent-photo-verification-gate"
import { getPhotoVerificationStatus } from "@/lib/photo-verification-status"
import { getAgentAuthHeaders } from "@/lib/agent-api-headers"
import { confirmAgentProfilePhotoVerified } from "@/lib/agent-profile-photo-client"
import { supabase } from "@/lib/supabase-client"
import { toast } from "sonner"

const POLL_MS = 10_000

type AgentRow = {
  id: string
  phone_number?: string
  email?: string | null
  profile_image_url?: string | null
  profile_verified?: boolean | null
  isapproved?: boolean
}

function AgentPhotoVerificationLockScreen({
  agent,
  onRefresh,
}: {
  agent: AgentRow
  onRefresh: () => Promise<void>
}) {
  const router = useRouter()
  const [photoUploading, setPhotoUploading] = useState(false)
  const photoStatus = getPhotoVerificationStatus(agent)
  const pending = photoStatus === "pending"

  const uploadProfilePhoto = async (file: File) => {
    const currentAgent = getStoredAgent()
    if (!currentAgent?.id) {
      toast.error("Session expired. Please log in again.")
      router.push("/agent/login")
      return
    }
    setPhotoUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload/image", {
        method: "POST",
        headers: getAgentAuthHeaders(),
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed")
      const verified = await confirmAgentProfilePhotoVerified(data.url)
      if (!verified.ok) throw new Error(verified.error || "Could not submit photo")
      toast.success("Photo received! We'll notify you once your account is verified.")
      await onRefresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutAgent()
    } finally {
      router.push("/agent/login")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-lg p-6 space-y-5">
        <PhotoVerificationWelcome pending={pending} />

        {!pending && (
          <FacePhotoUpload
            label="Upload verification photo"
            uploading={photoUploading}
            disabled={photoUploading}
            onFile={uploadProfilePhoto}
          />
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full min-h-[44px]"
          onClick={() => void handleLogout()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log out
        </Button>
      </div>
    </div>
  )
}

/**
 * Blocks all agent section pages and API-backed actions until photo verification is approved.
 */
export function AgentPhotoVerificationGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [locked, setLocked] = useState(false)
  const [agent, setAgent] = useState<AgentRow | null>(null)

  const refreshAgent = useCallback(async () => {
    const stored = getStoredAgent()
    if (!stored?.id || isPlatformAdminAgent(stored) || !stored.isapproved) {
      setLocked(false)
      setAgent(null)
      return
    }

    const { data } = await supabase
      .from("agents")
      .select("id, phone_number, email, profile_image_url, profile_verified, isapproved")
      .eq("id", stored.id)
      .maybeSingle()

    const row = (data ?? stored) as AgentRow
    setAgent(row)

    const needsLock = agentRequiresPhotoVerification(row)
    setLocked(needsLock)

    if (needsLock && getPhotoVerificationStatus(row) === "verified") {
      const merged = { ...stored, ...row, profile_verified: true }
      localStorage.setItem("agent", JSON.stringify(merged))
      setLocked(false)
      return
    }

    if (needsLock && !isAgentPhotoVerificationHoldPath(pathname)) {
      router.replace(AGENT_PHOTO_VERIFICATION_HOLD_PATH)
    }
  }, [pathname, router])

  useEffect(() => {
    if (isAgentAuthPublicPath(pathname)) {
      setChecking(false)
      setLocked(false)
      return
    }

    let mounted = true
    const run = async () => {
      setChecking(true)
      await refreshAgent()
      if (mounted) setChecking(false)
    }
    void run()

    const id = window.setInterval(() => void refreshAgent(), POLL_MS)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "agent") void refreshAgent()
    }
    window.addEventListener("storage", handleStorageChange)

    return () => {
      mounted = false
      window.clearInterval(id)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [pathname, refreshAgent])

  if (isAgentAuthPublicPath(pathname)) {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-blue-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (locked && agent) {
    return <AgentPhotoVerificationLockScreen agent={agent} onRefresh={refreshAgent} />
  }

  return <>{children}</>
}
