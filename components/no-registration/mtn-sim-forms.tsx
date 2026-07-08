"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal"
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator"

export function MTNSimForms() {
  const [activeForm, setActiveForm] = useState<"agent" | "merchant">("agent")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentReference, setPaymentReference] = useState("")
  const [pendingMessage, setPendingMessage] = useState("")

  // Form states
  const [agentData, setAgentData] = useState<any>({})
  const [merchantData, setMerchantData] = useState<any>({})

  const simOptions = {
    agent: {
      name: "MTN Agent SIM",
      price: 3400,
      delivery: "Nationwide Delivery",
      duration: "4 Weeks",
    },
    merchant: {
      name: "MTN Merchant SIM",
      price: 400,
      delivery: "Nationwide Delivery",
      duration: "3 Days",
    },
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const reference = generatePaymentReferenceCode()
    setPaymentReference(reference)

    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
    const dateString = now.toLocaleDateString()

    const selectedSim = simOptions[activeForm]
    const data = activeForm === "agent" ? agentData : merchantData

    let message = `MTN GHANA – ${activeForm.toUpperCase()} SIM REGISTRATION FORM\n\n`
    message += `SERVICE: ${selectedSim.name}\n`
    message += `COST: ₵${selectedSim.price}\n`
    message += `DELIVERY: ${selectedSim.delivery}\n`
    message += `DURATION: ${selectedSim.duration}\n\n`

    // Section A
    message += `SECTION A: BUSINESS INFORMATION\n`
    message += `Business Name: ${data.bizName || ""}\n`
    message += `Registration No: ${data.bizRegNo || ""}\n`
    message += `Type: ${data.bizType || ""}\n`
    message += `Nature: ${data.bizNature || ""}\n`
    message += `TIN: ${data.tin || ""}\n`
    message += `Contact: ${data.bizContact || ""}\n`
    message += `Email: ${data.bizEmail || ""}\n`
    message += `Digital Address: ${data.bizDigitalAddr || ""}\n`
    message += `Physical Address: ${data.bizPhysicalAddr || ""}\n\n`

    // Section B
    message += `SECTION B: OWNER DETAILS\n`
    message += `Full Name: ${data.ownerName || ""}\n`
    message += `DOB: ${data.ownerDob || ""}\n`
    message += `Nationality: ${data.ownerNationality || ""}\n`
    message += `ID Type: ${data.ownerIdType || ""}\n`
    message += `ID Number: ${data.ownerIdNo || ""}\n`
    message += `Residential Address: ${data.ownerResAddr || ""}\n`
    message += `Contact: ${data.ownerContact || ""}\n`
    message += `Email: ${data.ownerEmail || ""}\n\n`

    // Section C
    message += `SECTION C: ${activeForm === "agent" ? "ACCOUNT HANDLER" : "ACCOUNT OPERATOR"}\n`
    message += `Full Name: ${data.handlerName || ""}\n`
    message += `Relationship: ${data.handlerRel || ""}\n`
    message += `DOB: ${data.handlerDob || ""}\n`
    message += `ID Type: ${data.handlerIdType || ""}\n`
    message += `ID Number: ${data.handlerIdNo || ""}\n`
    message += `Residential Address: ${data.handlerResAddr || ""}\n`
    message += `Contact: ${data.handlerContact || ""}\n`
    message += `Email: ${data.handlerEmail || ""}\n\n`

    if (activeForm === "merchant") {
      message += `SECTION D: SERVICE REQUEST\n`
      message += `Type: ${data.serviceType || ""}\n`
      message += `Volume: ${data.expectedVolume || ""}\n\n`
    }

    // Location
    message += `SECTION ${activeForm === "agent" ? "D" : "E"}: LOCATION DETAILS\n`
    message += `Description: ${data.locDesc || ""}\n`
    message += `Landmark: ${data.landmark || ""}\n`
    message += `Region: ${data.region || ""}\n`
    message += `District: ${data.district || ""}\n`
    message += `Permanent: ${data.isPermanent || ""}\n\n`

    // Declaration
    message += `SECTION ${activeForm === "agent" ? "E" : "F"}: DECLARATION\n`
    message += `Owner Name: ${data.declOwnerName || ""}\n`
    message += `Date: ${dateString}\n`
    message += `Signature: Will be shared via WhatsApp\n\n`

    message += `💳 PAYMENT REFERENCE: ${reference}\n`
    message += `⏱️ ORDER PLACED AT: ${timeString}\n`
    message += `🏢 CLOSING TIME: 9:30 PM\n`
    message += `🔗 TERMS & CONDITIONS: https://dataflexghana.com/terms\n\n`
    message += `✅ PAYMENT CONFIRMED\n`
    message += `Adamantis Solutions (Francis Ani-Johnson .K) - 0557943392\n`
    message += `Alternative Payment Name: Francis Ani-Johnson`

    setPendingMessage(message)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirmed = () => {
    const whatsappUrl = generateWhatsAppLink(pendingMessage)
    window.open(whatsappUrl, "_blank")
    setShowPaymentModal(false)
    setPaymentReference("")
  }

  return (
    <div className="w-full">
      {/* Toggle between Agent/Merchant – flat, no shadow */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-2">
          <Button
            variant={activeForm === "agent" ? "default" : "outline"}
            onClick={() => setActiveForm("agent")}
            className={`px-6 py-2 text-base font-medium rounded-lg transition-colors ${
              activeForm === "agent"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "border-yellow-600 text-yellow-700 hover:bg-yellow-50"
            }`}
          >
            Agent SIM
          </Button>
          <Button
            variant={activeForm === "merchant" ? "default" : "outline"}
            onClick={() => setActiveForm("merchant")}
            className={`px-6 py-2 text-base font-medium rounded-lg transition-colors ${
              activeForm === "merchant"
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : "border-yellow-600 text-yellow-700 hover:bg-yellow-50"
            }`}
          >
            Merchant SIM
          </Button>
        </div>
      </div>

      {/* Form container – flat, no card, no shadow, no overflow hidden */}
      <div className="w-full border border-yellow-200 bg-white">
        {/* Header – plain yellow background, no gradient tricks */}
        <div className="bg-yellow-600 text-white px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{simOptions[activeForm].name}</h2>
            <p className="text-yellow-100 text-sm mt-1">
              {simOptions[activeForm].delivery} • {simOptions[activeForm].duration}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">₵{simOptions[activeForm].price}</div>
            <Badge className="mt-1 bg-yellow-500 text-white border-none text-xs">Standard Pricing</Badge>
          </div>
        </div>

        {/* Form body – clean spacing, no shadows */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* SECTION A: Business Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-yellow-100">
                <div className="w-8 h-8 rounded-full bg-yellow-600 text-white flex items-center justify-center font-bold text-sm">
                  A
                </div>
                <h3 className="text-lg font-bold text-gray-800">BUSINESS INFORMATION</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Business Name</Label>
                  <Input
                    placeholder="Enter legal business name"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, bizName: e.target.value })
                        : setMerchantData({ ...merchantData, bizName: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Business Registration Number</Label>
                  <Input
                    placeholder="Registration No."
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, bizRegNo: e.target.value })
                        : setMerchantData({ ...merchantData, bizRegNo: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Type of Business</Label>
                  <Input
                    placeholder="e.g. Sole Proprietor"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, bizType: e.target.value })
                        : setMerchantData({ ...merchantData, bizType: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Nature of Business</Label>
                  <Input
                    placeholder="e.g. Retail"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, bizNature: e.target.value })
                        : setMerchantData({ ...merchantData, bizNature: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-1">TIN Number</Label>
                  <Input
                    placeholder="Tax ID"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, tin: e.target.value })
                        : setMerchantData({ ...merchantData, tin: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Business Contact Number</Label>
                  <Input
                    placeholder="Contact"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, bizContact: e.target.value })
                        : setMerchantData({ ...merchantData, bizContact: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Business Email</Label>
                  <Input
                    placeholder="Email"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, bizEmail: e.target.value })
                        : setMerchantData({ ...merchantData, bizEmail: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-gray-700 font-medium mb-1">Physical Address</Label>
                <Input
                  placeholder="Street, Building, etc."
                  onChange={(e) =>
                    activeForm === "agent"
                      ? setAgentData({ ...agentData, bizPhysicalAddr: e.target.value })
                      : setMerchantData({ ...merchantData, bizPhysicalAddr: e.target.value })
                  }
                  className="border-yellow-200 focus:border-yellow-500 mt-1"
                />
              </div>
            </div>

            {/* SECTION B: Owner Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b-2 border-yellow-100">
                <div className="w-8 h-8 rounded-full bg-yellow-600 text-white flex items-center justify-center font-bold text-sm">
                  B
                </div>
                <h3 className="text-lg font-bold text-gray-800">BUSINESS OWNER DETAILS</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Full Name (as per ID)</Label>
                  <Input
                    placeholder="Owner's Name"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, ownerName: e.target.value })
                        : setMerchantData({ ...merchantData, ownerName: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Date of Birth</Label>
                  <Input
                    type="date"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, ownerDob: e.target.value })
                        : setMerchantData({ ...merchantData, ownerDob: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-700 font-medium mb-1">Nationality</Label>
                  <Input
                    placeholder="Ghanaian"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, ownerNationality: e.target.value })
                        : setMerchantData({ ...merchantData, ownerNationality: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-1">ID Type</Label>
                  <Input
                    placeholder="e.g. Ghana Card"
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, ownerIdType: e.target.value })
                        : setMerchantData({ ...merchantData, ownerIdType: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-1">ID Number</Label>
                  <Input
                    placeholder="GHA-XXXX..."
                    onChange={(e) =>
                      activeForm === "agent"
                        ? setAgentData({ ...agentData, ownerIdNo: e.target.value })
                        : setMerchantData({ ...merchantData, ownerIdNo: e.target.value })
                    }
                    className="border-yellow-200 focus:border-yellow-500 font-mono mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Footer note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm italic">
              * Note: You will need to share your signature and Ghana Card ID via WhatsApp after submitting this form.
            </div>

            {/* Submit button – flat style */}
            <Button
              type="submit"
              className="w-full py-6 text-lg font-bold bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg"
            >
              Submit Form
            </Button>
          </form>
        </div>
      </div>

      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirmed}
        orderSummary={{
          service: simOptions[activeForm].name,
          amount: simOptions[activeForm].price,
          total: simOptions[activeForm].price,
        }}
        paymentReference={paymentReference}
      />
    </div>
  )
}
