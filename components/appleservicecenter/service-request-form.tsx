"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, AlertCircle } from "lucide-react"
import appleDeviceData from "@/lib/apple-devices-data"

// ----------------------------------------------------------------------
// Device categories for all electronics repair (unchanged data)
// ----------------------------------------------------------------------
const deviceCategories = {
  "Apple Devices": {
    useAppleData: true,
  },
  "Android Phones": {
    devices: [
      "Samsung Galaxy", "Google Pixel", "OnePlus", "Lenovo Phone",
      "Motorola", "Infinix", "Tecno", "Other Android Phone",
    ],
    issues: [
      "Cracked Screen", "Battery Issues", "Charging Port Problem",
      "Camera Not Working", "Software Issue", "Water Damage",
      "Speaker Problem", "Microphone Issue", "Power Button Problem",
      "Other Issue",
    ],
  },
  "Laptops & Computers": {
    devices: [
      "HP Laptop", "Dell Laptop", "Lenovo Laptop", "ASUS Laptop",
      "MacBook Pro/Air", "Other Laptop",
    ],
    issues: [
      "Screen Damage", "Keyboard Problem", "Battery Issues",
      "Hard Drive Failure", "Overheating", "Software Issue",
      "RAM Problem", "Power Issue", "Trackpad Issue",
      "Motherboard Problem", "Other Issue",
    ],
  },
  "Home Appliances": {
    devices: [
      "Television (TV)", "Refrigerator", "Microwave", "Washing Machine",
      "Air Conditioner", "Gas Cooker", "Electric Heater", "Radio",
      "Fan", "Water Heater", "Other Appliance",
    ],
    issues: [
      "No Power", "Screen/Display Issue", "Not Cooling/Heating",
      "Strange Noise", "Leaking", "Controls Not Working",
      "Overheating", "Water Supply Issue", "Ice Formation Problem",
      "Remote Not Working", "Other Issue",
    ],
  },
  "Other Electronics": {
    devices: [
      "Gaming Console", "Printer", "Scanner", "External Hard Drive",
      "Monitor", "Keyboard", "Mouse", "Speaker System", "Projector",
      "Other Device",
    ],
    issues: [
      "Not Turning On", "Connection Issues", "Screen/Display Problem",
      "Hardware Malfunction", "Software Issue", "Overheating",
      "Power Supply Problem", "Cable/Port Issue", "Sensor Problem",
      "Other Issue",
    ],
  },
}

// ----------------------------------------------------------------------
// Sub-components for cleaner, modular layout
// ----------------------------------------------------------------------

function ClientInfoFields({
  clientName, setClientName,
  clientEmail, setClientEmail,
  clientPhone, setClientPhone,
  clientLocation, setClientLocation,
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-blue-600" />
        Your Contact Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Full Name *</label>
          <input
            type="text"
            placeholder="Your full name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Email Address *</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">WhatsApp Number *</label>
          <input
            type="tel"
            placeholder="Phone number"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">Location (Area/Address) *</label>
          <input
            type="text"
            placeholder="e.g., Accra Central"
            value={clientLocation}
            onChange={(e) => setClientLocation(e.target.value)}
            className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            required
          />
        </div>
      </div>
    </div>
  )
}

function DeviceCategorySelect({ selectedCategory, onChange }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">Device Category *</label>
      <select
        value={selectedCategory}
        onChange={onChange}
        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        required
      >
        <option value="">Choose a category...</option>
        {Object.keys(deviceCategories).map((category) => (
          <option key={category} value={category}>{category}</option>
        ))}
      </select>
    </div>
  )
}

function DeviceSelect({ devices, selectedDevice, onChange }) {
  if (!devices.length) return null
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">Select Device *</label>
      <select
        value={selectedDevice}
        onChange={onChange}
        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        required
      >
        <option value="">Choose your device...</option>
        {devices.map((device) => (
          <option key={device} value={device}>{device}</option>
        ))}
      </select>
    </div>
  )
}

function IssueSelect({ issues, selectedIssue, onChange }) {
  if (!issues.length) return null
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-900 mb-1">Select Issue *</label>
      <select
        value={selectedIssue}
        onChange={onChange}
        className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        required
      >
        <option value="">Choose an issue...</option>
        {issues.map((issue) => (
          <option key={issue} value={issue}>{issue}</option>
        ))}
      </select>
    </div>
  )
}

function DisclaimerSection({ accepted, onChange }) {
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 space-y-2">
      <h3 className="font-bold text-amber-900 flex items-center gap-2 text-sm">
        <AlertCircle className="w-4 h-4" />
        Follow-up Policy &amp; Service Agreement
      </h3>
      <div className="text-xs text-amber-900 max-h-24 overflow-y-auto leading-relaxed">
        <p>
          After your device is repaired, we will follow up to collect your experience and satisfaction with the repair.
          Please cooperate to help us serve you better. Future repairs should still be reported via this form for quality tracking.
        </p>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 focus:ring-amber-500"
          required
        />
        <span className="text-sm font-semibold text-amber-900">
          I understand and accept the follow-up policy *
        </span>
      </label>
    </div>
  )
}

// ----------------------------------------------------------------------
// Main form component
// ----------------------------------------------------------------------
export default function ServiceRequestForm() {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDevice, setSelectedDevice] = useState("")
  const [selectedIssue, setSelectedIssue] = useState("")
  const [otherDevice, setOtherDevice] = useState("")
  const [otherIssue, setOtherIssue] = useState("")
  const [deviceCondition, setDeviceCondition] = useState("")
  const [description, setDescription] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientLocation, setClientLocation] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Device list based on category
  const devices = (() => {
    if (!selectedCategory) return []
    if (selectedCategory === "Apple Devices") {
      return appleDeviceData.map((d) => d.Device)
    }
    return deviceCategories[selectedCategory]?.devices || []
  })()

  // Issue list based on category and selected device (for Apple)
  const issues = (() => {
    if (!selectedCategory || !selectedDevice) return []
    if (selectedCategory === "Apple Devices") {
      const appleDeviceObj = appleDeviceData.find((d) => d.Device === selectedDevice)
      return appleDeviceObj?.Issues || []
    }
    return deviceCategories[selectedCategory]?.issues || []
  })()

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
    setSelectedDevice("")
    setSelectedIssue("")
    setOtherDevice("")
    setOtherIssue("")
  }

  const handleDeviceChange = (e) => {
    const val = e.target.value
    setSelectedDevice(val)
    setSelectedIssue("")
    setOtherIssue("")
    if (!val.includes("Other")) setOtherDevice("")
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!selectedCategory || !selectedDevice || !selectedIssue || !clientName || !clientEmail || !clientLocation || !clientPhone) {
      alert("Please fill in all required fields")
      return
    }

    if (!disclaimerAccepted) {
      alert("Please accept the terms and disclaimer")
      return
    }

    const finalDevice = selectedDevice.includes("Other") ? otherDevice : selectedDevice
    const finalIssue = selectedIssue === "Other Issue" ? otherIssue : selectedIssue

    if (!finalDevice || !finalIssue) {
      alert("Please specify device and issue details")
      return
    }

    const message = `
*Dataflex Service Repair Center - Repair Request*

*CLIENT INFORMATION*
Name: ${clientName}
Email: ${clientEmail}
Location: ${clientLocation}
Contact Number: ${clientPhone}

*DEVICE & ISSUE*
Category: ${selectedCategory}
Device: ${finalDevice}
Issue: ${finalIssue}
Device Condition: ${deviceCondition || "Not specified"}

*ADDITIONAL DETAILS*
${description || "No additional information provided"}

Timestamp: ${new Date().toLocaleString()}
    `.trim()

    const whatsappURL = `https://wa.me/233246827049?text=${encodeURIComponent(message)}`
    window.open(whatsappURL, "_blank")
  }

  return (
    <section id="service-form" className="py-12 md:py-20 px-4 bg-slate-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Request Device Repair</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Tell us about your device and we’ll get back to you with a quote. All electronics welcome.
          </p>
        </div>

        <Card className="p-5 md:p-6 border border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Contact info – compact 2‑column grid */}
            <ClientInfoFields
              clientName={clientName} setClientName={setClientName}
              clientEmail={clientEmail} setClientEmail={setClientEmail}
              clientPhone={clientPhone} setClientPhone={setClientPhone}
              clientLocation={clientLocation} setClientLocation={setClientLocation}
            />

            {/* Device & Issue selection – logical flow */}
            <DeviceCategorySelect selectedCategory={selectedCategory} onChange={handleCategoryChange} />

            {selectedCategory && (
              <DeviceSelect devices={devices} selectedDevice={selectedDevice} onChange={handleDeviceChange} />
            )}

            {selectedDevice && selectedDevice.includes("Other") && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Specify Your Device *</label>
                <input
                  type="text"
                  placeholder="e.g., Sony TV, Samsung Fridge"
                  value={otherDevice}
                  onChange={(e) => setOtherDevice(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {selectedDevice && (
              <IssueSelect issues={issues} selectedIssue={selectedIssue} onChange={(e) => setSelectedIssue(e.target.value)} />
            )}

            {selectedIssue === "Other Issue" && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-1">Describe the Issue *</label>
                <input
                  type="text"
                  placeholder="Brief description of the problem"
                  value={otherIssue}
                  onChange={(e) => setOtherIssue(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Device Condition */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Device Condition</label>
              <select
                value={deviceCondition}
                onChange={(e) => setDeviceCondition(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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

            {/* Additional details */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">Additional Details</label>
              <Textarea
                placeholder="Any extra info that helps our technicians..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            {/* Compact disclaimer */}
            <DisclaimerSection accepted={disclaimerAccepted} onChange={setDisclaimerAccepted} />

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-2.5 text-sm flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <MessageCircle className="w-4 h-4" />
              Send Repair Request via WhatsApp
            </Button>
          </form>
        </Card>
      </div>
    </section>
  )
}