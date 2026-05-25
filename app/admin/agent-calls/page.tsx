"use client"

import { Suspense, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getStoredAdmin } from "@/lib/auth"
import AgentCallsAdminTab from "@/components/admin/tabs/AgentCallsAdminTab"

function AgentCallsContent() {
  return <AgentCallsAdminTab />
}

export default function AdminAgentCallsPage() {
  const router = useRouter()

  useEffect(() => {
    if (!getStoredAdmin()) {
      router.push("/admin/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[#0E8F3D] text-white px-4 py-3 sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-lg">Agent Calls</h1>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Suspense
          fallback={
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#0E8F3D]" />
            </div>
          }
        >
          <AgentCallsContent />
        </Suspense>
      </div>
    </div>
  )
}
