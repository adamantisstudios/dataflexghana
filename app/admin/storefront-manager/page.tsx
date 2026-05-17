"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import StorefrontManagerTab from "@/components/admin/tabs/StorefrontManagerTab"
import { getStoredAdmin } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function AdminStorefrontManagerPage() {
  const router = useRouter()

  useEffect(() => {
    if (!getStoredAdmin()) {
      router.push("/admin/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-semibold">Storefront Management</h1>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <StorefrontManagerTab />
      </div>
    </div>
  )
}
