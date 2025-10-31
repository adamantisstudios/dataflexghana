"use client"

import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { generateWhatsAppLink } from "@/utils/whatsapp"

const devices = [
  {
    name: "Router (ZLT s20)",
    price: 590,
    image: "/assets/router-s20.jpg",
    description: "ZTE Router with high-speed connectivity. Perfect for home and small office use.",
  },
  {
    name: "Mini TurboNet",
    price: 640,
    image: "/assets/mini-turbonet.jpg",
    description: "Compact and powerful TurboNet device for high-speed internet on the go.",
  },
  {
    name: "Pocket MiFi",
    price: 450,
    image: "/assets/pocket-mifi.jpg",
    description: "Portable MiFi device that fits in your pocket. Connect up to 10 devices simultaneously.",
  },
  {
    name: "MTN TURBONET",
    price: 3600,
    image: "/assets/mtn-turbonet.jpg",
    description: "Premium MTN TurboNet device for ultra-fast internet speeds and reliable connectivity.",
  },
  {
    name: "Router (ZLT s50)",
    price: 700,
    image: "/assets/router-s50.jpg",
    description: "Advanced ZLT s50 Router with extended range and superior performance.",
  },
  {
    name: "Homebox Router",
    price: 870,
    image: "/assets/homebox router.jpg",
    description: "Super fast 4G Universal Homebox router. Accepts and works with all sim/network.",
  },
]

export function DevicesSection() {
  const handleOrderDevice = (device: any) => {
    const message = `I want to order:

Device: ${device.name}
Price: ₵${device.price}
Description: ${device.description}`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
  }

  return (
    <section id="devices" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">MiFi, Router and TurboNet</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Quality devices for your internet connectivity needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {devices.map((device, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="p-0">
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <Image
                    src={device.image || "/placeholder.svg"}
                    alt={device.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2">{device.name}</CardTitle>
                <div className="text-2xl font-bold text-green-600 mb-3">₵{device.price.toLocaleString()}</div>
                <CardDescription className="text-gray-600 mb-4">{device.description}</CardDescription>
                <Button onClick={() => handleOrderDevice(device)} className="w-full bg-green-600 hover:bg-green-700">
                  Order Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
