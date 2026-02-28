"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Bed, Bath, Square, ArrowRight, Home, TrendingUp, Users, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import Link from "next/link"

interface Property {
  id: string
  title: string
  price: number
  currency: string
  category: string
  details: {
    bedrooms?: number
    bathrooms?: number
    size?: string
    [key: string]: any
  }
  location?: string
  description?: string
  image_urls?: string[]
  badges?: string[]
  status: string
  created_at: string
}

export default function AgentPropertiesShowcase() {
  const [latestProperty, setLatestProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLatestProperty = async () => {
      try {
        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .in("status", ["Published", "Featured"])
          .eq("is_approved", true)  // Only show admin-approved properties
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        if (error) throw error
        setLatestProperty(data)
      } catch (error) {
        console.error("Error loading latest property:", error)
      } finally {
        setLoading(false)
      }
    }

    loadLatestProperty()
  }, [])

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === "GHS" ? "₵" : "$"
    return `${symbol}${price.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="mb-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading latest property...</p>
        </div>
      </div>
    )
  }

  if (!latestProperty) {
    return null
  }

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-3 text-xs">💰 Earn Commission</Badge>
        <h2 className="text-lg lg:text-xl font-bold mb-3">
          Latest Property <span className="text-emerald-600">Opportunity</span>
        </h2>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">
          🏠 Submit properties near you and earn commissions! Be an active real estate agent and grow your income.
        </p>
      </div>

      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-emerald-200 bg-white/90 backdrop-blur-sm mb-6">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Property Image */}
          <div className="relative">
            {latestProperty.image_urls && latestProperty.image_urls.length > 0 && (
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-emerald-100 to-green-100 overflow-hidden">
                <ImageWithFallback
                  src={latestProperty.image_urls[0] || "/placeholder.svg"}
                  alt={latestProperty.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                  fallbackSrc="/diverse-property-showcase.png"
                />
                {latestProperty.image_urls.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1 py-0.5 rounded flex items-center gap-0.5">
                    <Building2 className="h-2 w-2" />+{latestProperty.image_urls.length - 1} more
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="p-3 flex flex-col justify-between">
            <div>
              <CardHeader className="p-0 mb-2">
                <div className="flex items-start justify-between mb-1">
                  <CardTitle className="text-base text-emerald-800">{latestProperty.title}</CardTitle>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(latestProperty.price, latestProperty.currency)}
                  </span>
                  {latestProperty.currency === "USD" && (
                    <Badge variant="outline" className="text-xs">
                      USD
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {latestProperty.category}
                </Badge>
              </CardHeader>

              <CardContent className="p-0 space-y-2">
                {latestProperty.location && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">{latestProperty.location}</span>
                  </div>
                )}

                {latestProperty.details && (
                  <div className="flex flex-wrap gap-2 text-xs text-emerald-600">
                    {latestProperty.details.bedrooms && (
                      <div className="flex items-center gap-0.5">
                        <Bed className="h-3 w-3" />
                        <span>{latestProperty.details.bedrooms} bed</span>
                      </div>
                    )}
                    {latestProperty.details.bathrooms && (
                      <div className="flex items-center gap-0.5">
                        <Bath className="h-3 w-3" />
                        <span>{latestProperty.details.bathrooms} bath</span>
                      </div>
                    )}
                    {latestProperty.details.size && (
                      <div className="flex items-center gap-0.5">
                        <Square className="h-3 w-3" />
                        <span>{latestProperty.details.size}</span>
                      </div>
                    )}
                  </div>
                )}

                {latestProperty.description && (
                  <p className="text-gray-600 text-xs line-clamp-2">{latestProperty.description}</p>
                )}

                {latestProperty.badges && latestProperty.badges.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {latestProperty.badges.slice(0, 3).map((badge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </div>

            {/* Action Button */}
            <div className="mt-3">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 h-7 text-xs"
              >
                <Link href="/agent/properties">
                  <Home className="h-3 w-3 mr-1" />
                  Browse More Properties
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Agent Motivation Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg shadow-lg border border-emerald-200 p-3">
        <div className="text-center mb-2">
          <h3 className="text-base font-bold text-emerald-800 mb-1">🚀 Become a Top Real Estate Agent!</h3>
          <p className="text-xs text-emerald-700 mb-2">
            Submit properties in your area and earn commissions on every successful promotion. The more properties you
            add, the more you earn!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <div className="bg-white/80 rounded-lg p-2 border border-emerald-200 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
            <h4 className="font-semibold text-emerald-800 text-xs">Earn More</h4>
            <p className="text-xs text-emerald-600">Commission on every property promotion</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-emerald-200 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
            <h4 className="font-semibold text-emerald-800 text-xs">Help Others</h4>
            <p className="text-xs text-emerald-600">Connect buyers with perfect properties</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-emerald-200 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
            <h4 className="font-semibold text-emerald-800 text-xs">Build Wealth</h4>
            <p className="text-xs text-emerald-600">Grow your real estate business</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-emerald-700 font-medium">
            💡 <strong>Pro Tip:</strong> Submit properties near you for faster approvals and higher success rates!
          </p>
        </div>
      </div>
    </div>
  )
}
