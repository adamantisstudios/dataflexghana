"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal"

const networks = {
  mtn: {
    name: "MTN",
    image: "/assets/mtn.jpg",
    description: "We offer the best MTN prices while maintaining healthy profit margins.",
    plans: [
      { size: "1GB", price: 6.0 },
      { size: "2GB", price: 11.5 },
      { size: "3GB", price: 15.5 },
      { size: "4GB", price: 19.5 },
      { size: "5GB", price: 23.5 },
      { size: "6GB", price: 28.5 },
      { size: "7GB", price: 34.5 },
      { size: "8GB", price: 38.5 },
      { size: "10GB", price: 46.5 },
      { size: "12GB", price: 52.5 },
      { size: "15GB", price: 67.5 },
      { size: "20GB", price: 83.5 },
      { size: "25GB", price: 108.5 },
      { size: "30GB", price: 129.0 },
      { size: "40GB", price: 169.0 },
      { size: "50GB", price: 199.0 },
      { size: "100GB", price: 390.0 },
    ],
  },
  telecel: {
    name: "Telecel",
    image: "/assets/telecel.jpg",
    description: "Competitive pricing for Telecel users with reliable connectivity.",
    plans: [
      { size: "5GB", price: 26.0 },
      { size: "10GB", price: 46.0 },
      { size: "15GB", price: 62.0 },
      { size: "20GB", price: 81.0 },
      { size: "25GB", price: 102.0 },
      { size: "30GB", price: 119.0 },
      { size: "35GB", price: 139.0 },
      { size: "40GB", price: 151.0 },
      { size: "45GB", price: 178.0 },
      { size: "50GB", price: 187.0 },
      { size: "100GB", price: 369.0 },
    ],
  },
  airteltigo: {
    name: "AirtelTigo",
    image: "/assets/airteltigo.jpg",
    description: "The absolute cheapest data in Ghana with bulk discounts that beat everyone.",
    plans: [
      { size: "1GB", price: 6.0 },
      { size: "2GB", price: 9.0 },
      { size: "3GB", price: 14.0 },
      { size: "4GB", price: 18.0 },
      { size: "5GB", price: 23.0 },
      { size: "6GB", price: 27.0 },
      { size: "7GB", price: 31.0 },
      { size: "8GB", price: 36.0 },
      { size: "10GB", price: 41.0 },
      { size: "12GB", price: 48.0 },
      { size: "15GB", price: 59.0 },
      { size: "20GB", price: 79.0 },
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

  const handleOrder = () => {
    if (!selectedPlan || !phoneNumber) {
      alert("Please select a plan and enter phone number")
      return
    }

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

  const handlePaymentConfirmed = () => {
    const [size, priceStr] = selectedPlan.split(" - ₵")
    const message = `DATA BUNDLE ORDER

Network: ${networks[activeNetwork].name}
Plan: ${size}
Price: ₵${priceStr}
Phone Number: ${phoneNumber}

✅ PAYMENT CONFIRMED
Customer has confirmed payment to:
Payment Name: Adamantis Solutions (Francis Ani-Johnson .K)
Payment Line: 0557943392

Please process this order.`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")

    setSelectedPlan("")
    setPhoneNumber("")
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

                  {/* Price Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {networks[activeNetwork].plans.map((plan, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-3 rounded-lg text-center hover:bg-green-50 transition-colors"
                      >
                        <div className="font-bold text-gray-900">{plan.size}</div>
                        <div className="text-green-600 font-semibold">₵{plan.price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Order Form */}
                  <div className="space-y-4">
                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {networks[activeNetwork].plans.map((plan, index) => (
                          <SelectItem key={index} value={`${plan.size} - ₵${plan.price.toFixed(2)}`}>
                            {networks[activeNetwork].name} {plan.size} - ₵{plan.price.toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />

                    <Button onClick={handleOrder} className="w-full bg-green-600 hover:bg-green-700">
                      Order Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirmed}
        orderSummary={getOrderSummary()}
      />
    </>
  )
}
