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
  FileText,
  Briefcase,
  BookOpen,
  Info,
  CreditCard,
} from "lucide-react"
import { supabase, type FormSubmission } from "@/lib/supabase"
import { toast } from "sonner"
import { ResumeWritingForm } from "./forms/ResumeWritingForm"
import { CurriculumVitaeForm } from "./forms/CurriculumVitaeForm"
import { BusinessPresentationForm } from "./forms/BusinessPresentationForm"
import { InternationalResumeForm } from "./forms/InternationalResumeForm"
import { ProfessionalWritingSubmissionsList } from "./ProfessionalWritingSubmissionsList"

interface ProfessionalWritingTabProps {
  agentId: string
}

const AVAILABLE_SERVICES = [
  {
    id: "resume-writing",
    service_type: "resume-writing",
    service_name: "Resume Writing",
    service_description: "Professional resume creation",
    icon: FileText,
    color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    iconColor: "text-blue-600",
    is_active: true,
    cost: "65 GHS",
    duration: "2 Hours",
    delivery: "Email or WhatsApp",
    format: "PDF/DOC",
  },
  {
    id: "curriculum-vitae",
    service_type: "curriculum-vitae",
    service_name: "Curriculum Vitae",
    service_description: "Comprehensive CV writing",
    icon: BookOpen,
    color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
    iconColor: "text-purple-600",
    is_active: true,
    cost: "65 GHS",
    duration: "2 Hours",
    delivery: "Email or WhatsApp",
    format: "PDF/DOC",
  },
  {
    id: "business-presentation",
    service_type: "business-presentation",
    service_name: "Business Presentation",
    service_description: "Professional business presentations",
    icon: Briefcase,
    color: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
    iconColor: "text-emerald-600",
    is_active: true,
    cost: "80 GHS",
    duration: "2 Hours",
    delivery: "Email or WhatsApp",
    format: "PowerPoint (PPT)",
  },
  {
    id: "international-resume",
    service_type: "international-resume",
    service_name: "International Resume",
    service_description: "Professional international CV for specific countries",
    icon: FileText,
    color: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50",
    iconColor: "text-indigo-600",
    is_active: true,
    cost: "270 GHS",
    duration: "2 Hours",
    delivery: "Email or WhatsApp",
    format: "PDF/DOC",
  },
]

export function ProfessionalWritingTab({ agentId }: ProfessionalWritingTabProps) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [showServiceDialog, setShowServiceDialog] = useState(false)
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null)
  const [showServiceInfoPopup, setShowServiceInfoPopup] = useState(false)
  const [selectedServiceForInfo, setSelectedServiceForInfo] = useState<(typeof AVAILABLE_SERVICES)[0] | null>(null)

  useEffect(() => {
    if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
      setLoading(false)
      return
    }
    loadData()
  }, [agentId])

  const loadData = async () => {
    if (!agentId || agentId === "" || agentId === "undefined" || agentId === "null") {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("professional_writing_submissions")
        .select("*")
        .eq("agent_id", agentId)
        .order("submitted_at", { ascending: false })
      if (submissionsError) throw submissionsError
      setSubmissions(submissionsData || [])
    } catch (error) {
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const handleShowServiceInfo = (service: (typeof AVAILABLE_SERVICES)[0]) => {
    setSelectedServiceForInfo(service)
    setShowServiceInfoPopup(true)
  }

  const handleServiceSelect = (serviceId: string) => {
    setShowServiceDialog(false)
    setActiveServiceId(serviceId)
  }

  const handleServiceComplete = () => {
    setActiveServiceId(null)
    loadData()
    toast.success("Service request submitted!")
  }

  const handleServiceCancel = () => {
    setActiveServiceId(null)
  }

  const getServiceName = (serviceId: string): string => {
    const service = AVAILABLE_SERVICES.find((s) => s.service_type === serviceId || s.id === serviceId)
    return service?.service_name || serviceId
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
          <CardTitle>Professional Writing Services</CardTitle>
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

  if (activeServiceId) {
    const selectedService = AVAILABLE_SERVICES.find((s) => s.id === activeServiceId)
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleServiceCancel}
            className="shrink-0 bg-transparent h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{selectedService?.service_name}</h2>
            <p className="text-sm text-gray-500">{selectedService?.service_description}</p>
          </div>
        </div>
        {activeServiceId === "resume-writing" && (
          <ResumeWritingForm agentId={agentId} onComplete={handleServiceComplete} onCancel={handleServiceCancel} />
        )}
        {activeServiceId === "curriculum-vitae" && (
          <CurriculumVitaeForm agentId={agentId} onComplete={handleServiceComplete} onCancel={handleServiceCancel} />
        )}
        {activeServiceId === "business-presentation" && (
          <BusinessPresentationForm
            agentId={agentId}
            onComplete={handleServiceComplete}
            onCancel={handleServiceCancel}
          />
        )}
        {activeServiceId === "international-resume" && (
          <InternationalResumeForm
            agentId={agentId}
            onComplete={handleServiceComplete}
            onCancel={handleServiceCancel}
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Professional Writing</h2>
          <p className="text-sm text-gray-500">Submit & track your writing requests</p>
        </div>
        <Button onClick={() => setShowServiceDialog(true)} size="sm" className="bg-pink-600 hover:bg-pink-700">
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

      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Select Service</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 mt-4">
            {AVAILABLE_SERVICES.map((service) => {
              const Icon = service.icon
              return (
                <Card
                  key={service.id}
                  className={`border-2 transition-all cursor-pointer p-3 ${service.color}`}
                  onClick={() => handleShowServiceInfo(service)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${service.iconColor}`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{service.service_name}</h3>
                      <p className="text-xs text-gray-500">{service.service_description}</p>
                    </div>
                    <Info className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  </div>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showServiceInfoPopup} onOpenChange={setShowServiceInfoPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-pink-600" />
              Service Information
            </DialogTitle>
          </DialogHeader>
          {selectedServiceForInfo && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-4">{selectedServiceForInfo.service_name}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cost</p>
                    <p className="text-sm text-gray-600">{selectedServiceForInfo.cost}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Duration</p>
                    <p className="text-sm text-gray-600">{selectedServiceForInfo.duration}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Truck className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Delivery</p>
                    <p className="text-sm text-gray-600">{selectedServiceForInfo.delivery}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Format</p>
                    <p className="text-sm text-gray-600">{selectedServiceForInfo.format}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowServiceInfoPopup(false)
                  handleServiceSelect(selectedServiceForInfo.id)
                }}
                className="w-full bg-pink-600 hover:bg-pink-700 mt-4"
              >
                Proceed with {selectedServiceForInfo.service_name}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Your Submissions</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <ProfessionalWritingSubmissionsList agentId={agentId} onUpdate={loadData} />
        </CardContent>
      </Card>
    </div>
  )
}
