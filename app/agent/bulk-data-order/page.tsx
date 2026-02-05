"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import BulkOrdersUploader from "@/components/agent/mtn-afa/BulkOrdersUploader"
import BulkStatusTracker from "@/components/agent/bulk-status-tracker"

export default function BulkDataOrderPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-lg border-b-2 border-emerald-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 flex-shrink-0"
            >
              <Link href="/agent/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm break-words">Bulk Data Orders</h1>
              <p className="text-emerald-100 text-xs sm:text-sm font-medium truncate">
                Place bulk orders for data bundles and track status
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl space-y-6">
        <BulkStatusTracker />
        <BulkOrdersUploader />
      </div>
    </div>
  )
}
