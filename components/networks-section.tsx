"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateWhatsAppLink } from "@/utils/whatsapp"

const networks = {
  mtn: {
    name: "MTN",
    image: "/assets/mtn.jpg",
    description: "We offer the best MTN prices while maintaining healthy profit margins.",
    plans: [
      { size: "1GB", price: 6.0 },
      { size: "2GB", price: 12.0 },
      { size: "3GB", price: 16.0 },
      { size: "4GB", price: 21.0 },
      { size: "5GB", price: 27.0 },
      { size: "6GB", price: 31.0 },
      { size: "7GB", price: 36.0 },
      { size: "8GB", price: 40.0 },
      { size: "10GB", price: 46.0 },
      { size: "15GB", price: 67.0 },
      { size: "20GB", price: 84.0 },
      { size: "25GB", price: 105.0 },
      { size: "30GB", price: 126.0 },
      { size: "40GB", price: 163.0 },
      { size: "50GB", price: 201.0 },
      { size: "100GB", price: 396.0 },
    ],
  },
  telecel: {
    name: "Telecel",
    image: "/assets/telecel.jpg",
    description: "Competitive pricing for Telecel users with reliable connectivity.",
    plans: [
      { size: "5GB", price: 26.0 },
      { size: "10GB", price: 46.0 },
      { size: "15GB", price: 67.0 },
      { size: "20GB", price: 89.0 },
      { size: "25GB", price: 109.0 },
      { size: "30GB", price: 127.0 },
      { size: "40GB", price: 156.0 },
      { size: "50GB", price: 125.0 },
    ],
  },
  airteltigo: {
    name: "AirtelTigo",
    image: "/assets/airteltigo.jpg",
    description: "The absolute cheapest data in Ghana with bulk discounts that beat everyone.",
    plans: [
      { size: "1GB", price: 6.0 },
      { size: "2GB", price: 10.0 },
      { size: "3GB", price: 16.0 },
      { size: "4GB", price: 21.0 },
      { size: "5GB", price: 25.0 },
      { size: "6GB", price: 27.0 },
      { size: "7GB", price: 31.0 },
      { size: "8GB", price: 36.0 },
      { size: "10GB", price: 44.0 },
      { size: "15GB", price: 57.0 },
      { size: "20GB", price: 66.0 },
      { size: "25GB", price: 81.0 },
      { size: "30GB", price: 91.0 },
      { size: "40GB", price: 106.0 },
      { size: "50GB", price: 116.0 },
      { size: "60GB", price: 126.0 },
      { size: "80GB", price: 156.0 },
      { size: "100GB", price: 217.0 },
    ],
  },
}

export function NetworksSection() {
  const [activeNetwork, setActiveNetwork] = useState<keyof typeof networks>("mtn")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")

  const handleOrder = () => {
    if (!selectedPlan || !phoneNumber) {
      alert("Please select a plan and enter phone number")
      return
    }

    const [size, priceStr] = selectedPlan.split(" - ₵")
    const message = `I want to order ${networks[activeNetwork].name} ${size} for ₵${priceStr}. Bundle For This Number: ${phoneNumber}`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
  }

  return (
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
  )
}
