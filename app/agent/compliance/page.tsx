"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowLeft, Clock, CheckCircle, AlertCircle, Building2, Baby, CreditCard, Plus } from "lucide-react"
import Link from "next/link"
import { getStoredAgent, type Agent } from "@/lib/unified-auth-system"
import { BackToTop } from "@/components/back-to-top"
import { BirthCertificateForm } from "@/components/agent/compliance/forms/BirthCertificateForm"
import { SoleProprietorshipForm } from "@/components/agent/compliance/forms/SoleProprietorshipForm"
import { TINRegistrationForm } from "@/components/agent/compliance/forms/TINRegistrationForm"
import { SubmissionsList } from "@/components/agent/compliance/SubmissionsList"
import { Button } from "@/components/ui/button"

const AVAILABLE_FORMS = [
  {
    id: "birth-certificate",
    name: "Birth Certificate",
    description: "Apply for birth certificate registration",
    icon: Baby,
    color: "border-green-200 hover:border-green-400",
    iconColor: "text-green-600",
  },
  {
    id: "sole-proprietorship",
    name: "Sole Proprietorship",
    description: "Register your business as a sole proprietorship",
    icon: Building2,
    color: "border-blue-200 hover:border-blue-400",
    iconColor: "text-blue-600",
  },
  {
    id: "tin-registration",
    name: "TIN Registration",
    description: "Apply for Tax Identification Number (TIN)",
    icon: CreditCard,
    color: "border-purple-200 hover:border-purple-400",
    iconColor: "text-purple-600",
  },
]

export default function AgentCompliancePage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    delivered: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const loadAgentData = async () => {
      try {
        const storedAgent = getStoredAgent()

        if (!storedAgent) {
          router.push("/agent/login")
          return
        }

        setAgent(storedAgent)
        await fetchStats(storedAgent.id)
      } catch (error) {
        console.error("Error loading agent data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAgentData()
  }, [router])

  const fetchStats = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agent/compliance/stats?agentId=${agentId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error fetching compliance stats:", error)
    }
  }

  const handleFormSubmitted = () => {
    if (agent) {
      fetchStats(agent.id)
      setSelectedFormId(null)
    }
  }

  const handleFormSelect = (formId: string) => {
    console.log("[v0] Form selected:", formId)
    setSelectedFormId(formId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-medium">Loading compliance dashboard...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return null
  }

  if (selectedFormId) {
    const selectedForm = AVAILABLE_FORMS.find((f) => f.id === selectedFormId)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedFormId(null)}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                    <FileText className="w-full h-full text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                      {selectedForm?.name || "Form"}
                    </h1>
                    <p className="text-blue-100 font-medium mt-1">Fill out the form below</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <main className="container mx-auto px-4 py-8">
          {selectedFormId === "birth-certificate" && (
            <BirthCertificateForm
              agentId={agent.id}
              onComplete={handleFormSubmitted}
              onCancel={() => setSelectedFormId(null)}
            />
          )}
          {selectedFormId === "sole-proprietorship" && (
            <SoleProprietorshipForm
              agentId={agent.id}
              onComplete={handleFormSubmitted}
              onCancel={() => setSelectedFormId(null)}
            />
          )}
          {selectedFormId === "tin-registration" && (
            <TINRegistrationForm
              agentId={agent.id}
              onComplete={handleFormSubmitted}
              onCancel={() => setSelectedFormId(null)}
            />
          )}
        </main>

        <BackToTop />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl border-b-4 border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agent/dashboard" className="text-white hover:text-blue-200 transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                  <FileText className="w-full h-full text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Compliance Center</h1>
                  <p className="text-blue-100 font-medium mt-1">Business Registration & Forms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-700">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-yellow-700">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-purple-700">Processing</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-900">{stats.processing}</p>
                </div>
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-700">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900">{stats.completed}</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-indigo-700">Delivered</p>
                  <p className="text-xl sm:text-2xl font-bold text-indigo-900">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <div className="space-y-4">
              <div>
                <CardTitle className="text-lg sm:text-xl md:text-2xl">Compliance Management</CardTitle>
                <CardDescription className="mt-2 text-sm">Submit and track your compliance forms</CardDescription>
              </div>
              <Button
                onClick={() => handleFormSelect(AVAILABLE_FORMS[0].id)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Submission
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {AVAILABLE_FORMS.map((form) => {
                const Icon = form.icon
                return (
                  <Card
                    key={form.id}
                    className={`border-2 transition-colors cursor-pointer ${form.color}`}
                    onClick={() => handleFormSelect(form.id)}
                  >
                    <CardContent className="p-4 sm:p-6 text-center">
                      <div className="mx-auto mb-3 sm:mb-4">
                        <Icon className={`h-10 w-10 sm:h-12 sm:w-12 ${form.iconColor}`} />
                      </div>
                      <h3 className="font-bold text-base sm:text-lg mb-2">{form.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">{form.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        Click to Start
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        <SubmissionsList agentId={agent.id} onUpdate={handleFormSubmitted} />
      </main>

      <BackToTop />
    </div>
  )
}
