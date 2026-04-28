"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RichTextRenderer } from "@/components/ui/rich-text-renderer"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { supabase, type Agent } from "@/lib/supabase"
import { getCurrentAgent } from "@/lib/auth"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ImageModal } from "@/components/ui/image-modal"
import {
  ArrowLeft,
  Users,
  DollarSign,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  MessageCircle,
  Send,
  Phone,
  User,
  FileText,
  ChevronDown,
} from "lucide-react"

interface Service {
  id: string
  title: string
  description: string
  commission_amount: number
  product_cost?: number
  materials_link?: string
  materials_link_label?: string
  image_url?: string
  image_urls?: string[]
}

export default function ReferServicePage() {
  const params = useParams()
  const serviceId = params.serviceId as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    description: "",
    allowDirectContact: true,
  })
  const [currentImageIdx, setCurrentImageIdx] = useState(0)

  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")

  const router = useRouter()

  useEffect(() => {
    const currentAgent = getCurrentAgent()
    if (!currentAgent) {
      router.push("/agent/login")
      return
    }
    setAgent(currentAgent)
    loadService()
  }, [router, serviceId])

  const loadService = async () => {
    try {
      const { data, error } = await supabase.from("services").select("*").eq("id", serviceId).single()

      if (error) throw error
      setService(data)
    } catch (error) {
      console.error("Error loading service:", error)
      router.push("/agent/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agent || !service) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from("referrals").insert([
        {
          agent_id: agent.id,
          service_id: service.id,
          client_name: formData.clientName,
          client_phone: formData.clientPhone,
          description: formData.description,
          allow_direct_contact: formData.allowDirectContact,
          status: "pending",
        },
      ])

      if (error) throw error

      alert("Referral submitted successfully! You can track its progress in your dashboard.")
      router.push("/agent/dashboard")
    } catch (error) {
      console.error("Error submitting referral:", error)
      alert("Failed to submit referral. Please try again.")
    } finally {
      setSubmitting(false)
      setShowConfirmDialog(false)
    }
  }

  const openImageModal = (images: string[], index: number, alt: string) => {
    setModalImages(images.filter((img) => img && img.trim() !== ""))
    setModalImageIndex(index)
    setModalImageAlt(alt)
    setShowImageModal(true)
  }

  const handleModalIndexChange = (newIndex: number) => {
    setModalImageIndex(newIndex)
  }

  const canSubmit = formData.clientName && formData.clientPhone && formData.description

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading service details...</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-white/90 backdrop-blur-sm shadow-lg">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-semibold text-red-800 mb-2">Service Not Found</h3>
            <p className="text-red-600 mb-6">The requested service could not be found.</p>
            <Button
              asChild
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              <Link href="/agent/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl border-b-4 border-emerald-700">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 shrink-0"
              >
                <Link href="/agent/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">Refer Client</h1>
                <p className="text-emerald-100 font-medium text-sm sm:text-base">
                  Submit a new referral for commission
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <DollarSign className="h-4 w-4 mr-1" />
                GH₵ {service.commission_amount.toLocaleString()} Commission
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Service Details */}
          <div className="space-y-6">
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden">
              {/* Image Gallery */}
              {service && (
                <div className="relative w-full h-64 sm:h-80 bg-gradient-to-br from-emerald-100 to-green-100 overflow-hidden group">
                  {(() => {
                    const images =
                      service.image_urls && service.image_urls.length > 0
                        ? service.image_urls
                        : service.image_url
                          ? [service.image_url]
                          : []

                    if (images.length === 0)
                      return (
                        <div className="w-full h-full flex items-center justify-center text-emerald-300">
                          <FileText className="h-16 w-16 opacity-30" />
                        </div>
                      )

                    return (
                      <>
                        <ImageWithFallback
                          src={images[currentImageIdx] || "/placeholder.svg"}
                          alt={service.title}
                          className="w-full h-full object-cover transition-all duration-500 cursor-pointer"
                          onClick={() => openImageModal(images, currentImageIdx, service.title)}
                        />
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openImageModal(images, currentImageIdx, service.title)
                              }}
                              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm font-medium z-10 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="h-3 w-3" />
                              {currentImageIdx + 1} / {images.length}
                            </button>
                            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length)
                                }}
                                className="bg-white/80 hover:bg-white rounded-full shadow-lg h-10 w-10 pointer-events-auto"
                              >
                                <ChevronDown className="h-6 w-6 rotate-90" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setCurrentImageIdx((prev) => (prev + 1) % images.length)
                                }}
                                className="bg-white/80 hover:bg-white rounded-full shadow-lg h-10 w-10 pointer-events-auto"
                              >
                                <ChevronDown className="h-6 w-6 -rotate-90" />
                              </Button>
                            </div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                              {images.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setCurrentImageIdx(i)}
                                  className={`h-2 rounded-full transition-all ${
                                    i === currentImageIdx ? "bg-white w-8" : "bg-white/50 w-2"
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
              <CardHeader>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-emerald-800 text-lg sm:text-xl">{service.title}</CardTitle>
                  <CardDescription className="text-gray-600 mb-6">
                    <RichTextRenderer content={service.description} />
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium text-emerald-800">Your Commission</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">
                      GH₵ {service.commission_amount.toLocaleString()}
                    </p>
                  </div>

                  {service.product_cost && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Product Cost</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">GH₵ {service.product_cost.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {service.materials_link && (
                  <div className="pt-4 border-t border-emerald-100">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm hover:shadow transition-all group"
                    >
                      <a
                        href={service.materials_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        <span className="font-semibold">
                          {service.materials_link_label || "View Service Materials"}
                        </span>
                      </a>
                    </Button>
                    <p className="text-[10px] text-emerald-500/70 text-center mt-2 font-medium">Opens in a new tab</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-blue-200 bg-blue-50/50 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-blue-700">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    1
                  </div>
                  <p>Fill out the client information form with accurate details</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </div>
                  <p>Submit the referral and wait for admin confirmation</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    3
                  </div>
                  <p>Track progress through the chat system</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    4
                  </div>
                  <p>Receive your commission when the service is completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Referral Form */}
          <div>
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-emerald-800 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Information
                </CardTitle>
                <CardDescription className="text-emerald-600">
                  Provide details about the client you're referring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setShowConfirmDialog(true)
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="clientName" className="text-emerald-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Client Name *
                    </Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder="Enter client's full name"
                      required
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="clientPhone" className="text-emerald-700 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Client Phone Number *
                    </Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      placeholder="e.g., 0241234567"
                      required
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-emerald-700 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Service Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what the client needs and any specific requirements..."
                      required
                      rows={4}
                      className="border-emerald-200 focus:border-emerald-500 resize-none"
                    />
                    <p className="text-xs text-emerald-600 mt-1">
                      Be specific about the client's needs to help admin process the referral faster
                    </p>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <Checkbox
                      id="allowDirectContact"
                      checked={formData.allowDirectContact}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, allowDirectContact: checked as boolean })
                      }
                      className="border-emerald-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <div className="space-y-1">
                      <Label htmlFor="allowDirectContact" className="text-emerald-800 font-medium cursor-pointer">
                        Allow direct client contact
                      </Label>
                      <p className="text-xs text-emerald-600">
                        Check this if the admin can contact your client directly. Uncheck if you prefer to handle all
                        communication yourself.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Referral
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Chat Feature Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Stay Connected:</strong> Once submitted, you can chat with the admin about this referral to
                provide updates, answer questions, or track progress in real-time.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="w-[95vw] max-w-md bg-white/95 backdrop-blur-sm border-emerald-200">
          <DialogHeader>
            <DialogTitle className="text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Confirm Referral Submission
            </DialogTitle>
            <DialogDescription className="text-emerald-600">
              Please review the referral details before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="font-semibold text-emerald-800 mb-3">{service.title}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-600">Client:</span>
                  <span className="text-emerald-800 font-medium">{formData.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Phone:</span>
                  <span className="text-emerald-800 font-medium">{formData.clientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Commission:</span>
                  <span className="text-green-600 font-semibold">GH₵ {service.commission_amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Direct Contact:</span>
                  <span className="text-emerald-800 font-medium">
                    {formData.allowDirectContact ? "Allowed" : "Not Allowed"}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200">
                <p className="text-xs text-emerald-600 font-medium mb-1">Description:</p>
                <p className="text-sm text-emerald-800">{formData.description}</p>
              </div>
            </div>

            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Make sure all information is accurate. You can chat with admin after submission to provide updates or
                corrections.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
            >
              {submitting ? "Submitting..." : "Confirm & Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={modalImages}
        currentIndex={modalImageIndex}
        onIndexChange={handleModalIndexChange}
        alt={modalImageAlt}
      />
    </div>
  )
}
