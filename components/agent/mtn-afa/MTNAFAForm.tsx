"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Phone, FileText } from "lucide-react"
import { CopyButton } from "@/components/ui/copy-button"

interface AFAFormData {
  full_name: string
  phone_number: string
  ghana_card: string
  location: string
  occupation: string
  notes: string
}

interface AFAFormErrors {
  full_name?: string
  phone_number?: string
  ghana_card?: string
  location?: string
}

const PAYMENT_INSTRUCTION =
  "Your request was submitted. Please pay 20 GHS manually to 0557943392 (Adamantis Solutions) for processing."

export default function MTNAFAForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<AFAFormData>({
    full_name: "",
    phone_number: "",
    ghana_card: "",
    location: "",
    occupation: "",
    notes: "",
  })
  const [errors, setErrors] = useState<AFAFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submissionId, setSubmissionId] = useState<string>("")
  const [paymentPin, setPaymentPin] = useState<string>("")
  const [agentId, setAgentId] = useState<string | null>(null)

  useEffect(() => {
    const agentData = localStorage.getItem("agent")
    if (agentData) {
      try {
        const parsed = JSON.parse(agentData)
        setAgentId(parsed.id)
      } catch (error) {
        console.error("Failed to parse agent data:", error)
      }
    }
  }, [])

  // Custom function to normalize phone number without adding "00"
  const normalizePhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, "")
    // Ensure the number starts with 0 and is 10 digits long
    if (digitsOnly.startsWith("0") && digitsOnly.length === 10) {
      return digitsOnly
    }
    // If the number starts with 233, replace it with 0
    if (digitsOnly.startsWith("233") && digitsOnly.length === 12) {
      return "0" + digitsOnly.slice(3)
    }
    // If the number starts with 00233, replace it with 0
    if (digitsOnly.startsWith("00233") && digitsOnly.length === 14) {
      return "0" + digitsOnly.slice(5)
    }
    // Default: return the first 10 digits if they start with 0
    if (digitsOnly.length >= 10 && digitsOnly[0] === "0") {
      return digitsOnly.slice(0, 10)
    }
    // Otherwise, return the value as-is (or empty string if invalid)
    return digitsOnly.length > 0 ? digitsOnly : ""
  }

  const handlePhoneChange = (value: string) => {
    const normalized = normalizePhoneNumber(value)
    setFormData((prev) => ({
      ...prev,
      phone_number: normalized,
    }))
  }

  const validateForm = (): boolean => {
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setShowConfirm(true)
    }
  }

  const submitForm = async () => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/agent/afa/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          payment_instructions: PAYMENT_INSTRUCTION,
          agent_id: agentId,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit registration")
      }
      setSubmissionId(data.submission_id)
      setPaymentPin(data.payment_pin)
      setShowConfirm(false)
      setShowSuccess(true)
    } catch (error: any) {
      alert(error.message || "An error occurred during submission")
    } finally {
      setSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-emerald-200 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6" />
              <div>
                <CardTitle>Registration Submitted Successfully</CardTitle>
                <CardDescription className="text-emerald-100">Your request has been received</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Submission ID:</strong>
              </p>
              <div className="flex gap-2 items-center">
                <code className="flex-1 bg-gray-100 p-3 rounded border text-center font-mono text-sm text-emerald-700">
                  {submissionId}
                </code>
                <CopyButton value={submissionId} label="Copy ID" size="sm" />
              </div>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-yellow-900">Payment PIN:</p>
              <div className="flex gap-2 items-center bg-white p-3 rounded border border-yellow-400">
                <code className="flex-1 font-mono font-bold text-2xl text-yellow-900 text-center">{paymentPin}</code>
                <CopyButton value={paymentPin} label="Copy PIN" size="sm" className="flex-shrink-0" />
              </div>
              <p className="text-xs text-yellow-800">Use this PIN when making payment to verify your submission</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <Phone className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Payment Instructions:</p>
                  <p className="text-blue-800">{PAYMENT_INSTRUCTION}</p>
                  <div className="flex gap-2 items-center mt-3 bg-white p-3 rounded border border-blue-300">
                    <code className="flex-1 font-mono font-bold text-lg text-blue-900">0557943392</code>
                    <CopyButton value="0557943392" label="Copy" size="sm" className="flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => router.push("/agent/dashboard")}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            MTN AFA Registration
          </CardTitle>
          <CardDescription className="text-emerald-600">
            Register for MTN AFA services with your personal details
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <Label className="text-gray-700 font-medium">Full Name *</Label>
              <Input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
                className={`mt-2 border-emerald-200 focus:border-emerald-500 ${errors.full_name ? "border-red-500" : ""}`}
              />
              {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
            </div>
            {/* Phone Number */}
            <div>
              <Label className="text-gray-700 font-medium">Phone Number *</Label>
              <Input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="0201234567"
                maxLength={10}
                className={`mt-2 border-emerald-200 focus:border-emerald-500 ${
                  errors.phone_number ? "border-red-500" : ""
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">Format: 0XXXXXXXXX (10 digits, starts with 02-05)</p>
              {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
            </div>
            {/* Ghana Card */}
            <div>
              <Label className="text-gray-700 font-medium">Ghana Card Number *</Label>
              <Input
                type="text"
                value={formData.ghana_card}
                onChange={(e) => setFormData((prev) => ({ ...prev, ghana_card: e.target.value.toUpperCase() }))}
                placeholder="Enter Ghana Card number"
                className={`mt-2 border-emerald-200 focus:border-emerald-500 font-mono ${
                  errors.ghana_card ? "border-red-500" : ""
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">Enter your Ghana Card number exactly as it appears</p>
              {errors.ghana_card && <p className="text-red-500 text-sm mt-1">{errors.ghana_card}</p>}
            </div>
            {/* Location */}
            <div>
              <Label className="text-gray-700 font-medium">Location *</Label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Enter your location"
                className={`mt-2 border-emerald-200 focus:border-emerald-500 ${errors.location ? "border-red-500" : ""}`}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
            {/* Occupation */}
            <div>
              <Label className="text-gray-700 font-medium">Occupation</Label>
              <Input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData((prev) => ({ ...prev, occupation: e.target.value }))}
                placeholder="Enter your occupation (optional)"
                className="mt-2 border-emerald-200 focus:border-emerald-500"
              />
            </div>
            {/* Notes */}
            <div>
              <Label className="text-gray-700 font-medium">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes (optional)"
                rows={3}
                className="mt-2 border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                After submission, you'll need to pay 20 GHS to 0557943392 (Adamantis Solutions) to complete your
                registration.
              </AlertDescription>
            </Alert>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 font-semibold"
            >
              {submitting ? "Submitting..." : "Submit Registration"}
            </Button>
          </form>
        </CardContent>
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="w-[95vw] max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-emerald-800">Confirm Registration</AlertDialogTitle>
              <AlertDialogDescription>
                Please review your details before submitting your MTN AFA registration.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Name:</span>
                <span className="font-semibold text-emerald-900">{formData.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Phone:</span>
                <span className="font-semibold text-emerald-900">{formData.phone_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Ghana Card:</span>
                <span className="font-semibold text-emerald-900">{formData.ghana_card}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Location:</span>
                <span className="font-semibold text-emerald-900">{formData.location}</span>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={submitForm}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  )
}
