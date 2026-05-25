"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Radio } from "lucide-react"
import { getStoredAdmin } from "@/lib/auth"
import VoiceRoomsAdminTab from "@/components/admin/tabs/VoiceRoomsAdminTab"

export default function AdminVoiceRoomsPage() {
  const router = useRouter()

  useEffect(() => {
    if (!getStoredAdmin()) router.push("/admin/login")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1628] via-[#0d1b2a] to-black text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-11 w-11">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <Radio className="h-5 w-5 text-emerald-400 shrink-0" />
            <h1 className="font-semibold text-lg truncate">Agent Conference Management</h1>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <VoiceRoomsAdminTab />
      </div>
    </div>
  )
}
