"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Lock, ArrowLeft, CheckCircle, Upload, Edit, BookOpen } from "lucide-react"
import AgentEditProperties from "@/components/agent/AgentEditProperties"
import AgentPublishNewProperties from "@/components/agent/AgentPublishNewProperties"
import PublishingRulesModalProperties from "@/components/agent/PublishingRulesModalProperties"
import { getStoredAgent } from "@/lib/agent-auth"
import { supabase } from "@/lib/supabase"
import type { Agent } from "@/lib/supabase"

export default function PublishPropertiesPage() {
  const router = useRouter()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [permissions, setPermissions] = useState({
    canPublish: false,
    canUpdate: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("publish")
  const [showRulesModal, setShowRulesModal] = useState(false)

  useEffect(() => {
    const checkAuthAndPermissions = async () => {
      try {
        setLoading(true)

        // Get agent from local storage first
        const storedAgent = getStoredAgent()
        if (!storedAgent) {
          router.push("/agent/login")
          return
        }

        // Fetch full agent details to check approval and permissions
        const { data: agentData, error } = await supabase
          .from("agents")
          .select("id, full_name, isapproved, can_publish_properties, can_update_properties")
          .eq("id", storedAgent.id)
          .single()

        if (error) throw error

        setAgent(agentData as Agent)
        setPermissions({
          canPublish: agentData.can_publish_properties || false,
          canUpdate: agentData.can_update_properties || false,
        })
        
        // Show publishing rules modal on first load
        setShowRulesModal(true)
      } catch (err) {
        console.error("Error checking permissions:", err)
        router.push("/agent/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndPermissions()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-orange-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <Alert className="bg-red-100 border-red-300">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!permissions.canPublish && !permissions.canUpdate) {
    const whatsappNumber = "+233242799990"
    const defaultMessage = encodeURIComponent("I want to publish properties on Dataflex Ghana. What are the requirements?")
    const whatsappLink = `https://wa.me/${whatsappNumber.replace("+", "")}?text=${defaultMessage}`

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Button variant="outline" size="sm" asChild className="mb-6 bg-transparent">
            <Link href="/agent/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-8 w-8 text-red-600" />
                <div>
                  <CardTitle>Account Activation Required</CardTitle>
                  <CardDescription>Property publishing access pending</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Your account needs to be activated and approved by an admin before you can publish properties. Please contact admin for account activation and approval.
              </p>
              <div className="bg-white p-4 rounded border border-red-200">
                <p className="text-sm text-gray-600 font-medium">To get access, you need to:</p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                  <li>1. Contact the admin via WhatsApp</li>
                  <li>2. Provide required documentation</li>
                  <li>3. Wait for account approval</li>
                </ul>
              </div>
              <Button asChild className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  Contact Admin on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/agent/dashboard">Return to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 shadow-xl border-b-4 border-orange-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            {/* Row 1: Back button + Badge */}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 h-9 w-9 p-0"
              >
                <Link href="/agent/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <span className="bg-white/20 text-white border border-white/30 text-xs sm:text-sm px-3 py-1 rounded-full flex items-center gap-2 whitespace-nowrap">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Approved Publisher</span>
              </span>
            </div>

            {/* Row 2: Title and Description */}
            <div className="flex items-start gap-3">
              <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0 mt-1" />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">Publish Properties</h1>
                <p className="text-sm sm:text-base text-amber-100 mt-1">Submit properties for admin review and approval</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs for Publish and Edit */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-orange-100 border border-orange-200">
            {permissions.canPublish && (
              <TabsTrigger value="publish" className="gap-2">
                <Upload className="h-4 w-4" />
                Publish Properties
              </TabsTrigger>
            )}
            {permissions.canUpdate && (
              <TabsTrigger value="edit" className="gap-2">
                <Edit className="h-4 w-4" />
                Edit Properties
              </TabsTrigger>
            )}
          </TabsList>

          {/* Publish New Properties Tab */}
          {permissions.canPublish && (
            <TabsContent value="publish" className="space-y-8">
              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      How It Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-2">
                    <p>1. Submit your property with all details</p>
                    <p>2. Admin reviews and approves the property</p>
                    <p>3. Property becomes visible to all users</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-2">
                    <p>✓ Property title and description</p>
                    <p>✓ Category selection</p>
                    <p>✓ Location and pricing</p>
                    <p>✓ At least one property image</p>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Quality Standards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-2">
                    <p>📸 Clear, real property photos</p>
                    <p>✍️ Accurate descriptions</p>
                    <p>💰 Realistic pricing</p>
                  </CardContent>
                </Card>
              </div>

              {/* View Rules Button */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <Button
                  onClick={() => setShowRulesModal(true)}
                  size="lg"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <BookOpen className="h-5 w-5 mr-2" />
                  View Publishing Rules
                </Button>
              </div>

              {/* Publishing Component */}
              {agent && (
                <AgentPublishNewProperties agentId={agent.id} />
              )}
            </TabsContent>
          )}

          {/* Edit Properties Tab */}
          {permissions.canUpdate && (
            <TabsContent value="edit" className="space-y-8">
              {/* Main Component */}
              {agent && (
                <AgentEditProperties
                  agentId={agent.id}
                  canUpdateProperties={permissions.canUpdate}
                />
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Publishing Rules Modal */}
      <PublishingRulesModalProperties
        open={showRulesModal}
        onOpenChange={setShowRulesModal}
      />
    </div>
  )
}
