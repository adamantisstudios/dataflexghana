"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import MTNAFAForm from "@/components/agent/mtn-afa/MTNAFAForm"
import AFAStatusTracker from "@/components/agent/afa-status-tracker"

export default function MTNAFARegistrationPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-sm border-b border-emerald-700">
        <div className="container mx-auto px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="bg-white/20 hover:bg-white/30 text-white border-white/40"
            >
              <Link href="/agent/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">MTN AFA Registration</h1>
              <p className="text-emerald-100 text-xs sm:text-sm truncate">
                Register and track your MTN AFA applications
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8 max-w-3xl">
        <Card className="border-emerald-200 shadow-md overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="register" className="space-y-5">
              <TabsList className="grid w-full grid-cols-2 bg-emerald-50 p-1 rounded-lg">
                <TabsTrigger
                  value="register"
                  className="text-xs sm:text-sm py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
                >
                  New Registration
                </TabsTrigger>
                <TabsTrigger
                  value="status"
                  className="text-xs sm:text-sm py-2 rounded-md data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
                >
                  My Applications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="register" className="mt-0">
                <MTNAFAForm />
              </TabsContent>

              <TabsContent value="status" className="mt-0">
                <AFAStatusTracker />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}