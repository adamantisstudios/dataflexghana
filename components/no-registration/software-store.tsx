"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SoftwareInstallationForm } from "./software-installation-form"

const softwareCategories = [
  {
    category: "Operating Systems",
    items: [
      {
        name: "Windows XP",
        price: 50,
        image: "/windowsxp.jpg?height=200&width=300",
        description: "Classic Windows XP installation",
      },
      {
        name: "Windows 7",
        price: 60,
        image: "/windows 7.jpg?height=200&width=300",
        description: "Windows 7 Professional/Ultimate",
      },
      {
        name: "Windows 8/8.1",
        price: 70,
        image: "/windows 8.jpg?height=200&width=300",
        description: "Windows 8.1 Pro installation",
      },
      {
        name: "Windows 10",
        price: 80,
        image: "/windows 10.jpg?height=200&width=300",
        description: "Windows 10 Pro/Home installation",
      },
      {
        name: "Windows 11",
        price: 100,
        image: "/windows 11.jpg?height=200&width=300",
        description: "Latest Windows 11 installation",
      },
      {
        name: "macOS",
        price: 120,
        image: "/macos.jpg?height=200&width=300",
        description: "macOS installation and setup",
      },
    ],
  },
  {
    category: "Microsoft Office",
    items: [
      {
        name: "MS Office 2016",
        price: 80,
        image: "/office2016.jpg?height=200&width=300",
        description: "Word, Excel, PowerPoint, Outlook",
      },
      {
        name: "MS Office 2019",
        price: 100,
        image: "/office2019.jpg?height=200&width=300",
        description: "Latest Office 2019 suite",
      },
      {
        name: "MS Office 365",
        price: 400,
        image: "/office365.jpg?height=200&width=300",
        description: "Office 365 subscription setup",
      },
    ],
  },
  {
    category: "Antivirus & Security",
    items: [
      {
        name: "Kaspersky",
        price: 260,
        image: "/Kaspersky.jpg?height=200&width=300",
        description: "Kaspersky Internet Security",
      },
      { name: "Norton", price: 270, image: "/Norton.jpg?height=200&width=300", description: "Norton 360 Deluxe" },
      {
        name: "McAfee",
        price: 300,
        image: "/McAfee.jpg?height=200&width=300",
        description: "McAfee Total Protection",
      },
      {
        name: "Avast Premium",
        price: 300,
        image: "/Avast.jpg?height=200&width=300",
        description: "Avast Premium Security",
      },
    ],
  },
  {
    category: "Creative Software",
    items: [
      {
        name: "Adobe Photoshop",
        price: 80,
        image: "/Adobe Photoshop.jpg?height=200&width=300",
        description: "Professional photo editing",
      },
      {
        name: "Adobe Illustrator",
        price: 80,
        image: "/Adobe illustrator.jpg?height=200&width=300",
        description: "Vector graphics design",
      },
      { name: "CorelDRAW", price: 70, image: "/CorelDRAW.jpg?height=200&width=300", description: "Graphics suite" },
      {
        name: "AutoCAD",
        price: 100,
        image: "/AutoCAD.jpg?height=200&width=300",
        description: "CAD design software",
      },
    ],
  },
]

export function SoftwareStore() {
  const [selectedSoftware, setSelectedSoftware] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)

  const handleInstallOrder = (software: any) => {
    setSelectedSoftware(software)
    setShowForm(true)
  }

  if (showForm) {
    return (
      <div>
        <Button variant="outline" onClick={() => setShowForm(false)} className="mb-6">
          ← Back to Software Store
        </Button>
        <SoftwareInstallationForm selectedSoftware={selectedSoftware} />
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {softwareCategories.map((category, categoryIndex) => (
        <div key={categoryIndex}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.items.map((software, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="p-0">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <Image
                      src={software.image || "/placeholder.svg"}
                      alt={software.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-2 right-2 bg-purple-600">₵{software.price}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-xl mb-2">{software.name}</CardTitle>
                  <CardDescription className="mb-4 text-gray-600">{software.description}</CardDescription>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-purple-600">₵{software.price}</span>
                    <Button onClick={() => handleInstallOrder(software)} className="bg-purple-600 hover:bg-purple-700">
                      Order Installation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
