"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, FileText, Globe, Gift } from "lucide-react"
import { CVOrderForm } from "./cv-order-form"

const cvPackages = [
  {
    id: "local",
    name: "Local CV Package",
    price: 65,
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    features: [
      "PDF + Text version",
      "3 free minor updates (3 months)",
      "1GB data bonus (Ghana only)",
      "Professional design for local job market",
      "ATS-friendly format",
      "Cover letter template included",
    ],
    description: "Perfect for job applications within Ghana",
  },
  {
    id: "foreign",
    name: "Foreign CV Package",
    price: 270,
    icon: Globe,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    popular: true,
    features: [
      "All Local CV features included",
      "5GB data bonus",
      "Professionally written for global opportunities",
      "International format standards",
      "LinkedIn profile optimization",
      "Placement assistance with international companies",
      "No agency fee",
      "Interview preparation guide",
      "6 months of free updates",
    ],
    description: "Designed for international job opportunities and global companies",
  },
]

export function CVWritingServices() {
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  const handleOrderCV = (cvPackage: any) => {
    setSelectedPackage(cvPackage)
    setShowForm(true)
  }

  if (showForm) {
    return (
      <div>
        <Button variant="outline" onClick={() => setShowForm(false)} className="mb-6">
          ← Back to CV Packages
        </Button>
        <CVOrderForm selectedPackage={selectedPackage} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {cvPackages.map((cvPackage) => (
          <Card
            key={cvPackage.id}
            className={`relative group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${cvPackage.popular ? "ring-2 ring-purple-500" : ""}`}
          >
            {cvPackage.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1">
                Most Popular
              </Badge>
            )}

            <CardHeader className="text-center pb-4">
              <div
                className={`mx-auto w-16 h-16 ${cvPackage.bgColor} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <cvPackage.icon className={`h-8 w-8 ${cvPackage.color}`} />
              </div>
              <CardTitle className="text-2xl">{cvPackage.name}</CardTitle>
              <CardDescription className="text-gray-600">{cvPackage.description}</CardDescription>
              <div className="text-4xl font-bold mt-4">
                <span className={cvPackage.color}>₵{cvPackage.price}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {cvPackage.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleOrderCV(cvPackage)}
                className={`w-full ${cvPackage.id === "local" ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}`}
              >
                Order {cvPackage.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-semibold text-green-800">Why Choose Our CV Writing Services?</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
            <ul className="space-y-2">
              <li>• Professional writers with HR experience</li>
              <li>• ATS-optimized formats</li>
              <li>• Industry-specific customization</li>
              <li>• Fast turnaround time (24-48 hours)</li>
            </ul>
            <ul className="space-y-2">
              <li>• Free revisions included</li>
              <li>• Data bonuses for all packages</li>
              <li>• International placement assistance</li>
              <li>• 100% satisfaction guarantee</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
