"use client"
import { Button } from "@/components/ui/button"
import type React from "react"

import { ArrowRight, Package, Briefcase, ShoppingCart } from "lucide-react"
import Link from "next/link"

interface Opportunity {
  id: number
  title: string
  caption: string
  cta: string
  link: string
  icon: React.ReactNode
  color: string
  image: string
}

export default function PCOnlySidebar() {
  const opportunities: Opportunity[] = [
    {
      id: 1,
      title: "Staff Bulk Data",
      caption: "Buy Bulk Data Bundle For Your Staff.",
      cta: "Register as an agent",
      link: "/agent/register",
      icon: <Package className="h-8 w-8" />,
      color: "from-blue-600 to-blue-700",
      image: "/happy-ghanaian-students-with-books-and-laptops-cel.jpg",
    },
    {
      id: 2,
      title: "Promote Your Business",
      caption: "Work with agents to reach customers nationwide.",
      cta: "Register Business",
      link: "/business/register",
      icon: <Briefcase className="h-8 w-8" />,
      color: "from-orange-600 to-orange-700",
      image: "/images/business-agent-registration-network.jpg",
    },
    {
      id: 3,
      title: "School Voucher Cards",
      caption: "Buy educational Products.",
      cta: "Start Now",
      link: "/voucher",
      icon: <ShoppingCart className="h-8 w-8" />,
      color: "from-emerald-600 to-emerald-700",
      image: "/user6-placeholder.jpg",
    },
  ]

  return (
    <div className="w-full space-y-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Business Opportunities</h3>
      <div className="flex flex-col gap-6">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="flex flex-col rounded-2xl overflow-hidden shadow-lg hover:shadow-xl bg-white dark:bg-gray-900 transition-shadow duration-300 border border-gray-100 dark:border-gray-800"
          >
            {/* Image Section: Fixed height and width */}
            <div className="w-full h-40 md:h-44 lg:h-48 overflow-hidden flex-shrink-0 bg-gray-200">
              <img
                src={opp.image || "/placeholder.svg"}
                alt={opp.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
            </div>
            {/* Text Section with proper spacing */}
            <div className="w-full p-4 md:p-5 flex flex-col justify-between flex-1">
              <div>
                <div className="text-2xl md:text-3xl mb-3">{opp.icon}</div>
                <h4 className="text-base md:text-lg font-bold mb-2 text-gray-900 dark:text-white line-clamp-1">
                  {opp.title}
                </h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                  {opp.caption}
                </p>
              </div>
              <Button
                asChild
                className="w-fit bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 font-semibold py-2 px-4 rounded-lg text-xs md:text-sm transition-colors duration-200"
              >
                <Link href={opp.link}>
                  {opp.cta}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
