"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { PaystackPaymentModal, type PaymentCompletedData } from "@/components/paystack-payment-modal"
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"

const networks = {
  mtn: {
    name: "MTN",
    image: "/assets/mtn.jpg",
    description: "We offer the best MTN prices while maintaining healthy profit margins.",
    plans: [
      { size: "1GB", price: 6.0 },
      { size: "2GB", price: 12.5 },
      { size: "3GB", price: 19.5 },
      { size: "4GB", price: 27.5 },
      { size: "5GB", price: 30.5 },
      { size: "6GB", price: 33.5 },
      { size: "8GB", price: 42.5 },
      { size: "10GB", price: 47.5 },
      { size: "15GB", price: 72.5 },
      { size: "20GB", price: 89.5 },
      { size: "25GB", price: 109.5 },
      { size: "30GB", price: 131.0 },
      { size: "40GB", price: 170.0 },
      { size: "50GB", price: 218.0 },
      { size: "100GB", price: 404.0 },
    ],
  },
  telecel: {
    name: "Telecel",
    image: "/assets/telecel.jpg",
    description: "Competitive pricing for Telecel users with reliable connectivity.",
    plans: [
      { size: "5GB", price: 32.0 },
      { size: "10GB", price: 54.0 },
      { size: "15GB", price: 73.0 },
      { size: "20GB", price: 93.0 },
      { size: "25GB", price: 125.0 },
      { size: "30GB", price: 132.0 },
      { size: "40GB", price: 174.0 },
      { size: "50GB", price: 219.0 },
      { size: "100GB", price: 410.0 },
    ],
  },
  airteltigo: {
    name: "AirtelTigo",
    image: "/assets/airteltigo.jpg",
    description: "The absolute cheapest data in Ghana with bulk discounts that beat everyone.",
    plans: [
      { size: "1GB", price: 6.0 },
      { size: "2GB", price: 10.0 },
      { size: "3GB", price: 14.0 },
      { size: "4GB", price: 19.0 },
      { size: "5GB", price: 23.0 },
      { size: "6GB", price: 27.0 },
      { size: "7GB", price: 31.0 },
      { size: "8GB", price: 35.0 },
      { size: "9GB", price: 49.0 },
      { size: "10GB", price: 52.0 },
      { size: "12GB", price: 56.0 },
      { size: "15GB", price: 64.0 },
      { size: "20GB", price: 80.0 },
      { size: "25GB", price: 95.0 },
      { size: "30GB", price: 99.0 },
      { size: "40GB", price: 117.0 },
      { size: "50GB", price: 129.0 },
      { size: "60GB", price: 137.0 },
      { size: "80GB", price: 166.0 },
      { size: "100GB", price: 229.0 },
    ],
  },
}

export function NetworksSection() {
  const [activeNetwork, setActiveNetwork] = useState<keyof typeof networks>("mtn")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentReference, setPaymentReference] = useState("")
  const phoneInputRef = useRef<HTMLInputElement>(null)

  const handleSelectPlan = (plan: (typeof networks.mtn.plans)[0]) => {
    const planValue = `${plan.size} - ₵${plan.price.toFixed(2)}`
    setSelectedPlan(planValue)

    // Scroll to phone number input after a brief delay to allow state update
    setTimeout(() => {
      phoneInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      phoneInputRef.current?.focus()
    }, 100)
  }

  const handleOrder = () => {
    if (!selectedPlan || !phoneNumber) {
      alert("Please select a plan and enter phone number")
      return
    }

    const reference = generatePaymentReferenceCode()
    setPaymentReference(reference)
    setShowPaymentModal(true)
  }

  const getOrderSummary = () => {
    if (!selectedPlan) {
      return {
        service: "Data Bundle",
        amount: 0,
        total: 0,
      }
    }

    const [size, priceStr] = selectedPlan.split(" - ₵")
    const price = Number.parseFloat(priceStr)

    return {
      service: `${networks[activeNetwork].name} ${size} Data Bundle`,
      amount: price,
      total: price,
    }
  }

  const handlePaymentCompleted = (paymentData: PaymentCompletedData) => {
    const [size, priceStr] = selectedPlan.split(" - ₵")
    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })

    let message = ""

    if (paymentData.paymentMethod === "paystack") {
      // For Paystack payments, the callback handles the WhatsApp message
      // Just show a toast and close the modal
      toast.success("Payment successful! Check your WhatsApp for order confirmation.")
      setSelectedPlan("")
      setPhoneNumber("")
      setPaymentReference("")
      setShowPaymentModal(false)
      return
    }

    // For manual payments
    message = `DATA BUNDLE ORDER

Network: ${networks[activeNetwork].name}
Plan: ${size}
Price: ₵${priceStr}
Phone Number: ${phoneNumber}

💳 PAYMENT REFERENCE: ${paymentReference}

✅ PAYMENT CONFIRMED
Customer has confirmed payment to:
Payment Name: Adamantis Solutions (Francis Ani-Johnson .K)
Payment Line: 0557943392

⏱️ ORDER PLACED AT: ${timeString}
🏢 CLOSING TIME: 9:30 PM

🔗 TERMS & CONDITIONS: https://dataflexghana.com/terms

⏱️ PROCESSING TIME: Data processing and delivery takes 10-30 minutes after payment confirmation.

Please process this order using the payment reference above.`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")

    setSelectedPlan("")
    setPhoneNumber("")
    setPaymentReference("")
    setShowPaymentModal(false)
  }

  return (
    <>
      <section id="networks" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Network Offerings</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose from Ghana's top 3 networks with our discounted rates
            </p>
          </div>

          <div className="mb-8 max-w-6xl mx-auto p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-center text-sm font-medium text-blue-800">
              ⏱️ <strong>Processing & Delivery Time:</strong> Data bundles are processed and delivered between 10-30
              minutes after payment confirmation.
            </p>
          </div>

          {/* Network Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-4 bg-gray-100 p-2 rounded-lg">
              {Object.entries(networks).map(([key, network]) => (
                <Button
                  key={key}
                  variant={activeNetwork === key ? "default" : "ghost"}
                  onClick={() => setActiveNetwork(key as keyof typeof networks)}
                  className={activeNetwork === key ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {network.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Network Content */}
          <Card className="max-w-6xl mx-auto">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Network Image */}
                <div className="relative h-80 rounded-lg overflow-hidden">
                  <Image
                    src={networks[activeNetwork].image || "/placeholder.svg"}
                    alt={networks[activeNetwork].name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Network Details */}
                <div>
                  <h3 className="text-2xl font-bold mb-4">{networks[activeNetwork].name} Data Bundles</h3>
                  <p className="text-gray-600 mb-6">{networks[activeNetwork].description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {networks[activeNetwork].plans.map((plan, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectPlan(plan)}
                        className={`p-3 rounded-lg text-center transition-all duration-200 cursor-pointer font-medium ${
                          selectedPlan.startsWith(plan.size)
                            ? "bg-green-600 text-white shadow-lg scale-105"
                            : "bg-gray-50 text-gray-900 hover:bg-green-50 hover:scale-105"
                        }`}
                      >
                        <div className="font-bold">{plan.size}</div>
                        <div className={selectedPlan.startsWith(plan.size) ? "text-white" : "text-green-600"}>
                          ₵{plan.price.toFixed(2)}
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedPlan && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Selected Plan:</p>
                      <p className="text-lg font-bold text-green-700">{selectedPlan}</p>
                    </div>
                  )}

                  {/* Order Form */}
                  <div className="space-y-4">
                    {!selectedPlan && (
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger className="border-green-300">
                          <SelectValue placeholder="Or select a plan from above" />
                        </SelectTrigger>
                        <SelectContent>
                          {networks[activeNetwork].plans.map((plan, index) => (
                            <SelectItem key={index} value={`${plan.size} - ₵${plan.price.toFixed(2)}`}>
                              {networks[activeNetwork].name} {plan.size} - ₵{plan.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                      <label className="text-sm font-semibold text-gray-700">Enter Phone Number</label>
                    </div>
                    <Input
                      ref={phoneInputRef}
                      type="tel"
                      placeholder="Enter phone number (e.g., 0541234567)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />

                    <Button
                      onClick={handleOrder}
                      disabled={!selectedPlan || !phoneNumber}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      Order Now & Proceed to Payment
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PaystackPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentCompleted={handlePaymentCompleted}
        orderSummary={getOrderSummary()}
        paymentReference={paymentReference}
        customerPhone={phoneNumber}
        customerName=""
      />
    </>
  )
}
