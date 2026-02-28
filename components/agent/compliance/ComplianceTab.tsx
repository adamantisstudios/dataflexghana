"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Plus,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  ArrowLeft,
  Baby,
  Building2,
  CreditCard,
  Handshake,
  Briefcase,
  Users,
  Share2,
  FileText,
} from "lucide-react"
import type { FormSubmission } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { SubmissionsList } from "./SubmissionsList"
import { BirthCertificateForm } from "./forms/BirthCertificateForm"
import { SoleProprietorshipForm } from "./forms/SoleProprietorshipForm"
import { TINRegistrationForm } from "./forms/TINRegistrationForm"
import { PartnershipForm } from "./forms/PartnershipForm"
import { BankAccountForm } from "./forms/BankAccountForm"
import { AssociationForm } from "./forms/AssociationForm"
import { CompanySharesForm } from "./forms/CompanySharesForm"
import { PassportForm } from "./forms/PassportForm"

interface ComplianceTabProps {
  agentId: string
}

const AVAILABLE_FORMS = [
  {
    id: "birth-certificate",
    form_type: "birth-certificate",
    form_name: "Birth Certificate.",
    form_description: "Apply for birth certificate",
    icon: Baby,
    color: "border-green-200 hover:border-green-400 hover:bg-green-50",
    iconColor: "text-green-600",
    is_active: true,
  },
  {
    id: "passport",
    form_type: "passport",
    form_name: "Passport",
    form_description: "Apply for passport",
    icon: FileText,
    color: "border-red-200 hover:border-red-400 hover:bg-red-50",
    iconColor: "text-red-600",
    is_active: true,
  },
  {
    id: "sole-proprietorship",
    form_type: "sole-proprietorship",
    form_name: "Sole Proprietorship (One Man Business.)",
    form_description: "Register your business",
    icon: Building2,
    color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    iconColor: "text-blue-600",
    is_active: true,
  },
  {
    id: "tin-registration",
    form_type: "tin-registration",
    form_name: "TIN Registration.",
    form_description: "Apply for Tax ID",
    icon: CreditCard,
    color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
    iconColor: "text-purple-600",
    is_active: true,
  },
  {
    id: "partnership",
    form_type: "partnership",
    form_name: "Partnership Registration.",
    form_description: "Register partnership business",
    icon: Handshake,
    color: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
    iconColor: "text-emerald-600",
    is_active: true,
  },
  {
    id: "bank-account",
    form_type: "bank-account",
    form_name: "Bank Account",
    form_description: "Open a bank account",
    icon: Briefcase,
    color: "border-cyan-200 hover:border-cyan-400 hover:bg-cyan-50",
    iconColor: "text-cyan-600",
    is_active: true,
  },
  {
    id: "association",
    form_type: "association",
    form_name: "Association Registration.",
    form_description: "Register an association",
    icon: Users,
    color: "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
    iconColor: "text-amber-600",
    is_active: true,
  },
  {
    id: "company-shares",
    form_type: "company-shares",
    form_name: "Company Limited By Shares",
    form_description: "Register company limited by shares",
    icon: Share2,
    color: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50",
    iconColor: "text-indigo-600",
    is_active: true,
  },
]

export function ComplianceTab({ agentId }: ComplianceTabProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [activeFormId, setActiveFormId] = useState<string | null>(null)

  const loadSubmissions = async () => {
    if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*")
        .eq("agent_id", agentId)
        .order("submitted_at", { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error("[v0] Error loading submissions:", error)
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubmissions()
  }, [agentId])

  const handleFormSelect = (formId: string) => {
    setShowFormDialog(false)
    setActiveFormId(formId)
  }

  const handleFormComplete = () => {
    setActiveFormId(null)
    loadSubmissions()
    toast.success("Form submitted!")
  }

  const handleFormCancel = () => {
    setActiveFormId(null)
  }

  const getFormName = (formId: string): string => {
    const form = AVAILABLE_FORMS.find((f) => f.form_type === formId || f.id === formId)
    return form?.form_name || formId
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
          <CardTitle>Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-500">Please log in again</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (activeFormId) {
    const selectedForm = AVAILABLE_FORMS.find((f) => f.id === activeFormId)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="outline" size="icon" onClick={handleFormCancel} className="shrink-0 bg-transparent h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{selectedForm?.form_name}</h2>
            <p className="text-sm text-gray-500">{selectedForm?.form_description}</p>
          </div>
        </div>
        {activeFormId === "birth-certificate" && (
          <BirthCertificateForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "passport" && (
          <PassportForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "sole-proprietorship" && (
          <SoleProprietorshipForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "tin-registration" && (
          <TINRegistrationForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "partnership" && (
          <PartnershipForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "bank-account" && (
          <BankAccountForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "association" && (
          <AssociationForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
        {activeFormId === "company-shares" && (
          <CompanySharesForm agentId={agentId} onComplete={handleFormComplete} onCancel={handleFormCancel} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Compliance</h2>
          <p className="text-sm text-gray-500">Submit & track forms</p>
        </div>
        <Button onClick={() => setShowFormDialog(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
            <Clock className="h-6 w-6 text-yellow-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Processing</p>
              <p className="text-lg font-bold text-blue-600">{statusCounts.processing}</p>
            </div>
            <AlertCircle className="h-6 w-6 text-blue-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-lg font-bold text-green-600">{statusCounts.completed}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600 opacity-20" />
          </div>
        </Card>
        <Card className="p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Delivered</p>
              <p className="text-lg font-bold text-purple-600">{statusCounts.delivered}</p>
            </div>
            <Truck className="h-6 w-6 text-purple-600 opacity-20" />
          </div>
        </Card>
      </div>

      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Select Form</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 mt-4">
            {AVAILABLE_FORMS.map((form) => {
              const Icon = form.icon
              return (
                <Card
                  key={form.id}
                  className={`border-2 transition-all cursor-pointer p-3 ${form.color}`}
                  onClick={() => handleFormSelect(form.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${form.iconColor}`} />
                    <div>
                      <h3 className="font-medium text-sm">{form.form_name}</h3>
                      <p className="text-xs text-gray-500">{form.form_description}</p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Your Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <SubmissionsList
            agentId={agentId}
            submissions={submissions}
            onUpdate={loadSubmissions}
            tableName="form_submissions"
          />
        </CardContent>
      </Card>
    </div>
  )
}
