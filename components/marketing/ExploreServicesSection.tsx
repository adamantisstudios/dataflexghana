"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Award,
  Leaf,
  ShoppingBasket,
  Megaphone,
  Home,
  ArrowRight,
} from "lucide-react"

const BRAND = "#0E8F3D"
const BRAND_HOVER = "#35B24A"

export type ExploreServiceItem = {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const DEFAULT_SERVICES: ExploreServiceItem[] = [
  {
    title: "Micro-Influencers",
    description: "Connect with verified creators to promote your brand.",
    href: "/influencers",
    icon: Award,
  },
  {
    title: "Farmers Friend",
    description: "Fresh farm produce listings and orders for your community.",
    href: "/farmersfriend",
    icon: Leaf,
  },
  {
    title: "Grocery Concierge",
    description: "Personal grocery shopping and delivery requests.",
    href: "/foodandGroceries",
    icon: ShoppingBasket,
  },
  {
    title: "Advertising Marketplace",
    description: "Sell ad packages on your agent storefront.",
    href: "/agent/register",
    icon: Megaphone,
  },
  {
    title: "Real Estate",
    description: "Browse property listings from agents nationwide.",
    href: "/properties",
    icon: Home,
  },
]

type Props = {
  title?: string
  subtitle?: string
  items?: ExploreServiceItem[]
  compact?: boolean
  id?: string
}

export function ExploreServicesSection({
  title = "Explore Our Services",
  subtitle = "Discover what Dataflex Ghana offers agents and customers.",
  items = DEFAULT_SERVICES,
  compact = false,
  id = "explore-services",
}: Props) {
  return (
    <section id={id} className={compact ? "py-8" : "py-14 bg-gradient-to-br from-emerald-50/80 to-white"}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h2
            className={`font-bold text-slate-900 ${compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className={`text-slate-600 mt-2 max-w-2xl mx-auto ${compact ? "text-sm" : "text-base"}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Card
                key={item.href + item.title}
                className="rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <CardContent className={`p-4 flex flex-col h-full ${compact ? "gap-3" : "gap-4"}`}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${BRAND}18` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: BRAND }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-snug">{item.description}</p>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-200 hover:bg-emerald-50"
                    style={{ color: BRAND }}
                  >
                    <Link href={item.href}>
                      Learn More
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
