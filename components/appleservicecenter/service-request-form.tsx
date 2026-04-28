"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, AlertCircle } from "lucide-react"
import appleDeviceData from "@/lib/apple-devices-data"

// Device categories for all electronics repair
const deviceCategories = {
  "Apple Devices": {
    useAppleData: true,
  },
  "Android Phones": {
    devices: ["Samsung Galaxy", "Google Pixel", "OnePlus", "Lenovo Phone", "Motorola", "Infinix", "Tecno", "Other Android Phone"],
    issues: [
      "Cracked Screen",
      "Battery Issues",
      "Charging Port Problem",
      "Camera Not Working",
      "Software Issue",
      "Water Damage",
      "Speaker Problem",
      "Microphone Issue",
      "Power Button Problem",
      "Other Issue",
    ],
  },
  "Laptops & Computers": {
    devices: ["HP Laptop", "Dell Laptop", "Lenovo Laptop", "ASUS Laptop", "MacBook Pro/Air", "Other Laptop"],
    issues: [
      "Screen Damage",
      "Keyboard Problem",
      "Battery Issues",
      "Hard Drive Failure",
      "Overheating",
      "Software Issue",
      "RAM Problem",
      "Power Issue",
      "Trackpad Issue",
      "Motherboard Problem",
      "Other Issue",
    ],
  },
  "Home Appliances": {
    devices: ["Television (TV)", "Refrigerator", "Microwave", "Washing Machine", "Air Conditioner", "Gas Cooker", "Electric Heater", "Radio", "Fan", "Water Heater", "Other Appliance"],
    issues: [
      "No Power",
      "Screen/Display Issue",
      "Not Cooling/Heating",
      "Strange Noise",
      "Leaking",
      "Controls Not Working",
      "Overheating",
      "Water Supply Issue",
      "Ice Formation Problem",
      "Remote Not Working",
      "Other Issue",
    ],
  },
  "Other Electronics": {
    devices: ["Gaming Console", "Printer", "Scanner", "External Hard Drive", "Monitor", "Keyboard", "Mouse", "Speaker System", "Projector", "Other Device"],
    issues: [
      "Not Turning On",
      "Connection Issues",
      "Screen/Display Problem",
      "Hardware Malfunction",
      "Software Issue",
      "Overheating",
      "Power Supply Problem",
      "Cable/Port Issue",
      "Sensor Problem",
      "Other Issue",
    ],
  },
}

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

  // Get issues based on category
  const getIssues = () => {
    if (!selectedCategory) return []
    
    if (selectedCategory === "Apple Devices" && selectedDevice) {
      const appleDeviceObj = appleDeviceData.find((d) => d.Device === selectedDevice)
      return appleDeviceObj?.Issues || []
    }
    
    return deviceCategories[selectedCategory]?.issues || []
  }

  const issues = getIssues()
  
  // Get devices based on category
  const getDevices = () => {
    if (!selectedCategory) return []
    
    if (selectedCategory === "Apple Devices") {
      // Use the original Apple device list from appleDeviceData
      return appleDeviceData.map((d) => d.Device)
    }
    
    return deviceCategories[selectedCategory]?.devices || []
  }
  
  const devices = getDevices()

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value)
    setSelectedDevice("")
    setSelectedIssue("")
    setOtherDevice("")
    setOtherIssue("")
  }

  const handleDeviceChange = (e) => {
    const value = e.target.value
    setSelectedDevice(value)
    setSelectedIssue("")
    setOtherIssue("")
    if (!value.includes("Other")) {
      setOtherDevice("")
    }
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

    // Get final device and issue names
    const finalDevice = selectedDevice.includes("Other") ? otherDevice : selectedDevice
    const finalIssue = selectedIssue === "Other Issue" ? otherIssue : selectedIssue

    if (!finalDevice || !finalIssue) {
      alert("Please specify device and issue details")
      return
    }

    // Format message for WhatsApp
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

    // Send to WhatsApp
    const whatsappURL = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
    window.open(whatsappURL, "_blank")
  }

  return (
    <section id="service-form" className="py-16 md:py-24 px-4 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Request Device Repair</h2>
          <p className="text-lg text-slate-600">
            Tell us about your device issue and we'll get back to you with a quote. We repair all electronics - Apple, Android, Laptops, Home Appliances, and more!
          </p>
        </div>

        <Card className="p-6 md:p-8 border-2 border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* CLIENT INFORMATION SECTION */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Your Contact Information
              </h3>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name *</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address *</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">WhatsApp Number *</label>
                  <input
                    type="tel"
                    placeholder="+233242799990"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Location (Area/Address) *</label>
                <input
                  type="text"
                  placeholder="e.g., Accra Central, Near Circle Mall"
                  value={clientLocation}
                  onChange={(e) => setClientLocation(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Alternative Contact Number</label>
                <input
                  type="tel"
                  placeholder="Optional alternative number"
                  value=""
                  onChange={(e) => {}}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* DEVICE CATEGORY SELECTION */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">Device Category *</label>
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              >
                <option value="">Choose a category...</option>
                {Object.keys(deviceCategories).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Selection */}
            {selectedCategory && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Select Device *</label>
                <select
                  value={selectedDevice}
                  onChange={handleDeviceChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose your device...</option>
                  {devices.map((device) => (
                    <option key={device} value={device}>
                      {device}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Other Device Input */}
            {selectedDevice && selectedDevice.includes("Other") && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Specify Your Device *</label>
                <input
                  type="text"
                  placeholder="e.g., Sony 55-inch TV, Samsung Refrigerator, Dell Inspiron Laptop"
                  value={otherDevice}
                  onChange={(e) => setOtherDevice(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Issue Selection */}
            {selectedDevice && issues.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Select Issue *</label>
                <select
                  value={selectedIssue}
                  onChange={(e) => setSelectedIssue(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                >
                  <option value="">Choose an issue...</option>
                  {issues.map((issue) => (
                    <option key={issue} value={issue}>
                      {issue}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Other Issue Input */}
            {selectedIssue === "Other Issue" && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Describe the Issue *</label>
                <input
                  type="text"
                  placeholder="Describe the problem with your device..."
                  value={otherIssue}
                  onChange={(e) => setOtherIssue(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
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

            {/* DISCLAIMER SECTION */}
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-3">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Follow-up Policy &amp; Service Agreement
              </h3>
              <div className="text-sm text-amber-900 space-y-2 max-h-40 overflow-y-auto">
                <p className="leading-relaxed">
                  After a service repair officer contacts you and repairs your device for you, we will be following up on you to:
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Collect your experience and review of the repair</li>
                  <li>Your viewpoint or satisfaction of the final outcome of the repair</li>
                </ol>
                <p className="leading-relaxed mt-2">
                  Please cooperate with us to help us better serve you. Also note that even if you visit the repair center later on to repair your device again or another device, it is still important to contact us over any issue you may face so that we can better improve our service delivery.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={disclaimerAccepted}
                  onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 focus:ring-amber-500"
                  required
                />
                <span className="text-sm font-semibold text-amber-900">
                  I understand and accept the follow-up policy and service agreement *
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 text-base flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              <MessageCircle className="w-5 h-5" />
              Send Repair Request via WhatsApp
            </Button>
          </form>
        </Card>
      </div>
    </section>
  )
}
