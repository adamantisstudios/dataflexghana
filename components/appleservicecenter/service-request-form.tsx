"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle } from "lucide-react"
import appleDeviceData from "@/lib/apple-devices-data"

export default function ServiceRequestForm() {
  const [selectedDevice, setSelectedDevice] = useState("")
  const [selectedIssue, setSelectedIssue] = useState("")
  const [deviceCondition, setDeviceCondition] = useState("")
  const [description, setDescription] = useState("")
  const [contactInfo, setContactInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const deviceIssues = selectedDevice ? appleDeviceData.find((d) => d.Device === selectedDevice)?.Issues || [] : []

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedDevice || !selectedIssue || !contactInfo) {
      alert("Please fill in all required fields")
      return
    }

    // Format message for WhatsApp
    const message = `
*Dataflex Service Repair Center - Repair Request*

Device: ${selectedDevice}
Issue: ${selectedIssue}
Device Condition: ${deviceCondition}

Description:
${description}

Contact Info: ${contactInfo}

Timestamp: ${new Date().toLocaleString()}
    `.trim()

    // Send to WhatsApp
    const whatsappURL = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
    window.open(whatsappURL, "_blank")
  }

  return (
    <section id="service-form" className="py-16 md:py-24 px-4 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Request Device Repair</h2>
          <p className="text-lg text-slate-600">
            Tell us about your device issue and we'll get back to you with a quote
          </p>
        </div>

        <Card className="p-6 md:p-8 border-2 border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Device Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Select Device *</label>
              <select
                value={selectedDevice}
                onChange={(e) => {
                  setSelectedDevice(e.target.value)
                  setSelectedIssue("")
                }}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">Choose your device...</option>
                {appleDeviceData.map((device) => (
                  <option key={device.Device} value={device.Device}>
                    {device.Device}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Selection */}
            {selectedDevice && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Select Issue *</label>
                <select
                  value={selectedIssue}
                  onChange={(e) => setSelectedIssue(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an issue...</option>
                  {deviceIssues.map((issue) => (
                    <option key={issue} value={issue}>
                      {issue}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Device Condition */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Device Condition</label>
              <select
                value={deviceCondition}
                onChange={(e) => setDeviceCondition(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select condition...</option>
                <option value="Like New">Like New</option>
                <option value="Good - Minor Cosmetic Damage">Good - Minor Cosmetic Damage</option>
                <option value="Fair - Moderate Damage">Fair - Moderate Damage</option>
                <option value="Poor - Severe Damage">Poor - Severe Damage</option>
                <option value="Water Damaged">Water Damaged</option>
                <option value="Physically Damaged">Physically Damaged</option>
              </select>
            </div>

            {/* Additional Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Additional Details</label>
              <Textarea
                placeholder="Describe what happened, when it started, or any additional information that might help our technicians..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {/* Contact Information */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">WhatsApp Number *</label>
              <input
                type="tel"
                placeholder="233242799990 or your WhatsApp number"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 text-base flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <MessageCircle className="w-5 h-5" />
              Send Request via WhatsApp
            </Button>
          </form>
        </Card>
      </div>
    </section>
  )
}
