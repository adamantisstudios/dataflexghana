"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Baby,
  CreditCard,
  Plus,
  Info,
  Handshake,
  Users,
  Wallet,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import { getStoredAgent, type Agent } from "@/lib/unified-auth-system"
import { BackToTop } from "@/components/back-to-top"
import { BirthCertificateForm } from "@/components/agent/compliance/forms/BirthCertificateForm"
import { SoleProprietorshipForm } from "@/components/agent/compliance/forms/SoleProprietorshipForm"
import { TINRegistrationForm } from "@/components/agent/compliance/forms/TINRegistrationForm"
import { PartnershipForm } from "@/components/agent/compliance/forms/PartnershipForm"
import { SubmissionsList } from "@/components/agent/compliance/SubmissionsList"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CompanySharesForm } from "@/components/agent/compliance/forms/CompanySharesForm"
import { AssociationForm } from "@/components/agent/compliance/forms/AssociationForm"
import { BankAccountForm } from "@/components/agent/compliance/forms/BankAccountForm"
import { PassportForm } from "@/components/agent/compliance/forms/PassportForm"

const AVAILABLE_FORMS = [
  {
    id: "birth-certificate",
    name: "Birth Certificate",
    description: "Apply for birth certificate registration",
    icon: Baby,
    color: "border-green-200 hover:border-green-400",
    iconColor: "text-green-600",
    duration: "Tiered Options",
    cost: "₵500 - ₵960",
    commission: "50 GHS",
    delivery: "Free Delivery Nationwide",
  },
  {
    id: "passport",
    name: "Passport",
    description: "Apply for passport",
    icon: FileText,
    color: "border-blue-200 hover:border-blue-400",
    iconColor: "text-blue-600",
    duration: "Tiered Options",
    cost: "₵1,100 - ₵2,600",
    commission: "100 GHS",
    delivery: "Nationwide Delivery",
  },
  {
    id: "sole-proprietorship",
    name: "Sole Proprietorship Registration",
    description: "Register your business as a sole proprietorship",
    icon: Building2,
    color: "border-blue-200 hover:border-blue-400",
    iconColor: "text-blue-600",
    duration: "14 Working Days",
    cost: "580 GHS",
    commission: "50 GHS",
    delivery: "Free Delivery Nationwide",
  },
  {
    id: "tin-registration",
    name: "TIN Registration",
    description: "Apply for Tax Identification Number (TIN)",
    icon: CreditCard,
    color: "border-purple-200 hover:border-purple-400",
    iconColor: "text-purple-600",
    duration: "1 Day",
    cost: "150 GHS",
    commission: "20 GHS",
    delivery: "WhatsApp or E-mail",
  },
  {
    id: "partnership-registration",
    name: "Partnership Registration",
    description: "Register your incorporated private partnership",
    icon: Handshake,
    color: "border-emerald-200 hover:border-emerald-400",
    iconColor: "text-emerald-600",
    duration: "14 Working Days",
    cost: "1,440 GHS",
    commission: "50 GHS",
    delivery: "Free Delivery Nationwide",
  },
  {
    id: "company-shares",
    name: "Company Limited by Shares",
    description: "Register your company limited by shares",
    icon: Building2,
    color: "border-blue-200 hover:border-blue-400",
    iconColor: "text-blue-600",
    duration: "14 Working Days",
    cost: "1,930 GHS",
    commission: "70 GHS",
    delivery: "Free Delivery Nationwide",
  },
  {
    id: "association-registration",
    name: "Association Registration",
    description: "Register your association or non-profit organization",
    icon: Users,
    color: "border-orange-200 hover:border-orange-400",
    iconColor: "text-orange-600",
    duration: "14 Working Days",
    cost: "1,444 GHS",
    commission: "50 GHS",
    delivery: "Free Delivery Nationwide",
  },
  {
    id: "bank-account",
    name: "Bank Account",
    description: "Open a bank account with complete account information",
    icon: Wallet,
    color: "border-cyan-200 hover:border-cyan-400",
    iconColor: "text-cyan-600",
    duration: "1 Working Day",
    cost: "Free",
    commission: "N/A",
    delivery: "Account Info Via Email/WhatsApp",
  },
]

export default function AgentCompliancePage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [selectedFormForInfo, setSelectedFormForInfo] = useState<(typeof AVAILABLE_FORMS)[0] | null>(null)
  const [showFormInfoPopup, setShowFormInfoPopup] = useState(false)
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
    setShowFormDialog(false)
  }

  const handleShowFormInfo = (form: (typeof AVAILABLE_FORMS)[0]) => {
    setSelectedFormForInfo(form)
    setShowFormInfoPopup(true)
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
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <button
                  onClick={() => setSelectedFormId(null)}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                    <FileText className="w-full h-full text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                      {selectedForm?.name || "Form"}
                    </h1>
                    <p className="text-blue-100 font-medium text-sm sm:text-base mt-1">Fill out the form below</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          {selectedFormId === "birth-certificate" && (
            <BirthCertificateForm
              agentId={agent.id}
              onComplete={handleFormSubmitted}
              onCancel={() => setSelectedFormId(null)}
            />
          )}
          {selectedFormId === "passport" && (
            <PassportForm
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
          {selectedFormId === "partnership-registration" && (
            <PartnershipForm
              agentId={agent.id}
              onComplete={handleFormSubmitted}
              onCancel={() => setSelectedFormId(null)}
            />
          )}
          {selectedFormId === "company-shares" && (
            <CompanySharesForm
              agentId={agent.id}
              onComplete={handleFormSubmitted}
              onCancel={() => setSelectedFormId(null)}
            />
          )}
          {selectedFormId === "association-registration" && (
            <AssociationForm
              agentId={agent.id}
              onComplete={handleFormSubmitted}
              onCancel={() => setSelectedFormId(null)}
            />
          )}
          {selectedFormId === "bank-account" && (
            <BankAccountForm
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
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/agent/dashboard" className="text-white hover:text-blue-200 transition-colors">
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Link>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                  <FileText className="w-full h-full text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                    Compliance Center
                  </h1>
                  <p className="text-blue-100 font-medium text-sm sm:text-base mt-1">Business Registration & Forms</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-700">Total</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-yellow-700">Pending</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-purple-700">Processing</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">{stats.processing}</p>
                </div>
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-700">Completed</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">{stats.completed}</p>
                </div>
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-indigo-700">Delivered</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-900">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2">
                <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl">Compliance Management</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Submit and track your compliance forms</CardDescription>
              </div>
              <Button
                onClick={() => setShowFormDialog(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 self-start text-sm sm:text-base"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Submission
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Submissions List */}
        <SubmissionsList agentId={agent.id} onUpdate={handleFormSubmitted} />
      </main>

      {/* Form Info Popup - MOBILE RESPONSIVE */}
      <Dialog open={showFormInfoPopup} onOpenChange={setShowFormInfoPopup}>
        <DialogContent className="max-w-[95vw] sm:max-w-md mx-2 sm:mx-4 p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Form Information
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Details about the selected form</DialogDescription>
          </DialogHeader>
          {selectedFormForInfo && (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 sm:mb-4">
                  {selectedFormForInfo.name}
                </h3>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Duration</p>
                    <p className="text-xs sm:text-sm text-gray-600">{selectedFormForInfo.duration}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Cost</p>
                    <p className="text-xs sm:text-sm text-gray-600">{selectedFormForInfo.cost}</p>
                  </div>
                </div>

                {/* COMMISSION SECTION - ADDED HERE */}
                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-amber-50 rounded-lg">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Your Commission</p>
                    <p className="text-xs sm:text-sm text-gray-600">{selectedFormForInfo.commission}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-700">Delivery</p>
                    <p className="text-xs sm:text-sm text-gray-600">{selectedFormForInfo.delivery}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowFormInfoPopup(false)
                  handleFormSelect(selectedFormForInfo.id)
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 mt-2 sm:mt-4 text-sm sm:text-base"
              >
                Proceed with {selectedFormForInfo.name}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Selection Dialog - MOBILE RESPONSIVE */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md w-full max-h-[85vh] overflow-y-auto mx-2 sm:mx-4 p-3 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-sm sm:text-base md:text-lg">Select Form Type</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Choose the type of compliance form you want to submit
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 sm:gap-3 mt-3 sm:mt-4">
            {AVAILABLE_FORMS.map((form) => {
              const Icon = form.icon
              return (
                <Card
                  key={form.id}
                  className={`border-2 transition-colors cursor-pointer hover:shadow-md ${form.color}`}
                  onClick={() => handleShowFormInfo(form)}
                >
                  <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                    <div className="shrink-0">
                      <Icon className={`h-6 w-6 sm:h-8 sm:w-8 ${form.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm md:text-base mb-1 line-clamp-1">{form.name}</h3>
                      <p className="text-xs text-gray-600 line-clamp-2">{form.description}</p>
                    </div>
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <BackToTop />
    </div>
  )
}
