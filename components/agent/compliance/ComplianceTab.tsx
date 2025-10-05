"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ArrowLeft,
  Baby,
  Building2,
  CreditCard,
} from "lucide-react"
import { supabase, type FormSubmission } from "@/lib/supabase"
import { toast } from "sonner"
import { SubmissionsList } from "./SubmissionsList"
import { BirthCertificateForm } from "./forms/BirthCertificateForm"
import { SoleProprietorshipForm } from "./forms/SoleProprietorshipForm"
import { TINRegistrationForm } from "./forms/TINRegistrationForm"

interface ComplianceTabProps {
  agentId: string
}

const AVAILABLE_FORMS = [
  {
    id: "birth-certificate",
    form_type: "birth-certificate",
    form_name: "Birth Certificate",
    form_description: "Apply for birth certificate registration",
    icon: Baby,
    color: "border-green-200 hover:border-green-400 hover:bg-green-50",
    iconColor: "text-green-600",
    is_active: true,
  },
  {
    id: "sole-proprietorship",
    form_type: "sole-proprietorship",
    form_name: "Sole Proprietorship",
    form_description: "Register your business as a sole proprietorship",
    icon: Building2,
    color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    iconColor: "text-blue-600",
    is_active: true,
  },
  {
    id: "tin-registration",
    form_type: "tin-registration",
    form_name: "TIN Registration",
    form_description: "Apply for Tax Identification Number (TIN)",
    icon: CreditCard,
    color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
    iconColor: "text-purple-600",
    is_active: true,
  },
]

export function ComplianceTab({ agentId }: ComplianceTabProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [activeFormId, setActiveFormId] = useState<string | null>(null)

  useEffect(() => {
    if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
      console.error("[v0] ComplianceTab: Invalid agentId provided:", agentId)
      setLoading(false)
      return
    }

    loadData()
  }, [agentId])

  const loadData = async () => {
    if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
      console.error("[v0] ComplianceTab.loadData: Cannot load data with invalid agentId")
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data: submissionsData, error: submissionsError } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("agent_id", agentId)
        .order("submitted_at", { ascending: false })

      if (submissionsError) {
        console.error("Error loading submissions:", submissionsError)
        throw submissionsError
      }

      setSubmissions(submissionsData || [])
    } catch (error) {
      console.error("Error loading compliance data:", error)
      toast.error("Failed to load compliance data")
    } finally {
      setLoading(false)
    }
  }

  const handleFormSelect = (formId: string) => {
    setShowFormDialog(false)
    setActiveFormId(formId)
  }

  const handleFormComplete = () => {
    setActiveFormId(null)
    loadData()
    toast.success("Form submitted successfully!")
  }

  const handleFormCancel = () => {
    setActiveFormId(null)
  }

  const getFormName = (formId: string): string => {
    const form = AVAILABLE_FORMS.find((f) => f.form_type === formId || f.id === formId)
    return form?.form_name || formId
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "processing":
        return <AlertCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "delivered":
        return <Truck className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "delivered":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const statusCounts = {
    pending: submissions.filter((s) => s.status.toLowerCase() === "pending").length,
    processing: submissions.filter((s) => s.status.toLowerCase() === "processing").length,
    completed: submissions.filter((s) => s.status.toLowerCase() === "completed").length,
    delivered: submissions.filter((s) => s.status.toLowerCase() === "delivered").length,
  }

  if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Management</CardTitle>
          <CardDescription>Submit and track your compliance forms</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-500 mb-2">Unable to load compliance data</p>
            <p className="text-sm text-gray-400">Please log in again to continue</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compliance data...</p>
        </div>
      </div>
    )
  }

  if (activeFormId) {
    const selectedForm = AVAILABLE_FORMS.find((f) => f.id === activeFormId)

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleFormCancel} className="shrink-0 bg-transparent">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedForm?.form_name}</h2>
            <p className="text-gray-600 mt-1">{selectedForm?.form_description}</p>
          </div>
        </div>

        {activeFormId === "birth-certificate" && (
          <BirthCertificateForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "sole-proprietorship" && (
          <SoleProprietorshipForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "tin-registration" && (
          <TINRegistrationForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Compliance Management</h2>
          <p className="text-gray-600 mt-1">Submit and track your compliance forms</p>
        </div>
        <Button onClick={() => setShowFormDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Submission
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</span>
              <Clock className="h-8 w-8 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-blue-600">{statusCounts.processing}</span>
              <AlertCircle className="h-8 w-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-600">{statusCounts.completed}</span>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-purple-600">{statusCounts.delivered}</span>
              <Truck className="h-8 w-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Select a Form</DialogTitle>
            <DialogDescription className="text-gray-600">
              Choose the type of compliance form you want to submit
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {AVAILABLE_FORMS.map((form) => {
              const Icon = form.icon
              return (
                <Card
                  key={form.id}
                  className={`border-2 transition-all cursor-pointer ${form.color}`}
                  onClick={() => handleFormSelect(form.id)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-4 flex justify-center">
                      <Icon className={`h-16 w-16 ${form.iconColor}`} />
                    </div>
                    <h3 className="font-bold text-xl mb-2 text-gray-900">{form.form_name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{form.form_description}</p>
                    <Button variant="outline" className="w-full bg-transparent hover:bg-white">
                      Start Form
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Your Submissions</CardTitle>
          <CardDescription>Track the status of your compliance form submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionsList agentId={agentId} onUpdate={loadData} />
        </CardContent>
      </Card>
    </div>
  )
}
