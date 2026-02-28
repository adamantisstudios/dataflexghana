"use client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import MTNAFAForm from "@/components/agent/mtn-afa/MTNAFAForm"
import AFAStatusTracker from "@/components/agent/afa-status-tracker"

export default function MTNAFARegistrationPage() {
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
              <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm break-words">
                MTN AFA Registration
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm font-medium truncate">
                Register and track your MTN AFA applications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl">
        <Tabs defaultValue="register" className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 shadow-lg border border-emerald-200">
            <TabsTrigger
              value="register"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs sm:text-sm"
            >
              New Registration
            </TabsTrigger>
            <TabsTrigger
              value="status"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs sm:text-sm"
            >
              My Applications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-6">
            <MTNAFAForm />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <AFAStatusTracker />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
