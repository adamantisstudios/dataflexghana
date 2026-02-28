"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
// CRITICAL FIX: Import unified auth system instead of direct Supabase auth
import { getCurrentAdmin, isAdminLoggedIn } from "@/lib/unified-auth-system"
import type { User } from "@supabase/supabase-js"
import { AutomationDashboard } from "@/components/admin/automation/AutomationDashboard"
import { ActivityTracker } from "@/components/admin/automation/ActivityTracker"
import { useAgentAutomation } from "@/hooks/useAgentAutomation"
import { ArrowLeft, LogOut, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface AutomationStats {
  total_runs: number
  successful_runs: number
  failed_runs: number
  total_agents_processed: number
  total_agents_deactivated: number
  avg_execution_time_ms: number
  last_run_at: string | null
  next_recommended_run: string | null
}

interface AgentAtRisk {
  agent_id: string
  agent_name: string
  phone_number: string
  last_activity_at: string
  days_since_activity: number
  orders_7d: number
  orders_30d: number
  risk_level: string
  risk_reason: string
}

export default function AdminAgentsSwitchButtonPage() {
  const router = useRouter()
  // CRITICAL FIX: Use admin user instead of Supabase user
  const [admin, setAdmin] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("automation")
  const [error, setError] = useState<string | null>(null)

  // Add the useAgentAutomation hook with error handling
  const { runAutomation, reactivateAgent, error: automationError } = useAgentAutomation()

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'suspended':
        return 'bg-orange-100 text-orange-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleRunAutomation = async () => {
    try {
      setError(null)
      await runAutomation()
    } catch (error) {
      console.error("Automation run failed:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Automation failed: ${errorMessage}`)
    }
  }

  const handleReactivateAgent = async (agentId: string, agentName: string) => {
    try {
      setError(null)
      await reactivateAgent(agentId, `Manually reactivated ${agentName} by admin`)
    } catch (error) {
      console.error("Agent reactivation failed:", error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Agent reactivation failed: ${errorMessage}`)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setError(null)
        
        // CRITICAL FIX: Use unified auth system instead of Supabase auth
        if (!isAdminLoggedIn()) {
          setError('No authenticated admin found')
          router.push('/admin/login')
          return
        }

        const currentAdmin = getCurrentAdmin()
        if (!currentAdmin) {
          setError('Admin session expired')
          router.push('/admin/login')
          return
        }

        setAdmin(currentAdmin)
      } catch (error) {
        console.error('Auth check failed:', error)
        setError('Authentication check failed')
        router.push('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      setError(null)
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setError(`Logout failed: ${errorMessage}`)
      toast.error(`Logout failed: ${errorMessage}`)
    }
  }

  const handleSwitchToInactivityTracker = () => {
    setActiveTab("activity")
  }

  const handleSwitchToAutomationDashboard = () => {
    setActiveTab("automation")
  }

  // CRITICAL FIX: Update user check to use admin
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error || 'Authentication required'}</p>
            <Button 
              onClick={() => router.push('/admin/login')} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="w-fit"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                Admin: {admin?.email || 'Unknown'}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-fit bg-transparent">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {/* Title Section */}
          <div className="px-4 sm:px-6 pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Agent Automation Control
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Monitor and manage agent inactivity automation processes
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {(error || automationError) && (
          <Card className="border-yellow-200 bg-yellow-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">{error || automationError}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0">
                <TabsTrigger
                  value="automation"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent py-4 px-6"
                >
                  Automation Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent py-4 px-6"
                >
                  Activity Tracker
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="automation" className="mt-0">
                <AutomationDashboard
                  onSwitchToInactivityTracker={handleSwitchToInactivityTracker}
                />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <ActivityTracker
                  onSwitchToAutomationDashboard={handleSwitchToAutomationDashboard}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
