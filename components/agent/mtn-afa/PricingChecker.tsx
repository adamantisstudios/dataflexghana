"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone } from "lucide-react"

const NETWORK_PRICES = {
  MTN: {
    name: "MTN",
    color: "from-yellow-500 to-orange-500",
    bgColor: "bg-yellow-50",
    badgeColor: "bg-yellow-100 text-yellow-800",
  },
  AirtelTigo: {
    name: "AirtelTigo",
    color: "from-red-500 to-pink-500",
    bgColor: "bg-red-50",
    badgeColor: "bg-red-100 text-red-800",
  },
  Telecel: {
    name: "Telecel",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    badgeColor: "bg-blue-100 text-blue-800",
  },
}

export function PricingChecker() {
  return (
    <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50">
      <CardHeader>
        <CardTitle className="text-emerald-800 flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Network Pricing Reference
        </CardTitle>
        <CardDescription className="text-emerald-600">
          Check current network prices before uploading your bulk orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(NETWORK_PRICES).map(([key, network]) => (
            <div key={key} className={`${network.bgColor} rounded-lg p-4 border border-gray-200`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{network.name}</h3>
                <Badge className={network.badgeColor}>Active</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Check your data bundle rates before ordering. Prices vary by capacity and network.
              </p>
              <div className="text-xs text-gray-500 bg-white rounded p-2">
                <p className="font-mono">Visit Data Bundles tab for current prices</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
