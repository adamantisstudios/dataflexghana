"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Bed, Bath, Square, ArrowRight, Home, MessageCircle, Phone } from "lucide-react"
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

export default function PropertiesShowcase() {
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
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-blue-700 font-medium">Loading latest property...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!latestProperty) {
    return null
  }

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4">Featured Property</Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Latest Property <span className="text-blue-600">Listing</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover premium properties across Ghana! Browse our latest listings and contact property owners directly.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-blue-200 bg-white/90 backdrop-blur-sm">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Property Image */}
              <div className="relative">
                {latestProperty.image_urls && latestProperty.image_urls.length > 0 && (
                  <div className="aspect-[4/3] w-full bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
                    <ImageWithFallback
                      src={latestProperty.image_urls[0] || "/placeholder.svg"}
                      alt={latestProperty.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                      fallbackSrc="/diverse-property-showcase.png"
                    />
                    {latestProperty.image_urls.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <Building2 className="h-3 w-3" />+{latestProperty.image_urls.length - 1} more
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Property Details */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  <CardHeader className="p-0 mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl text-blue-800">{latestProperty.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(latestProperty.price, latestProperty.currency)}
                      </span>
                      {latestProperty.currency === "USD" && (
                        <Badge variant="outline" className="text-xs">
                          USD
                        </Badge>
                      )}
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {latestProperty.category}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-0 space-y-3">
                    {latestProperty.location && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{latestProperty.location}</span>
                      </div>
                    )}

                    {latestProperty.details && (
                      <div className="flex flex-wrap gap-4 text-sm text-blue-600">
                        {latestProperty.details.bedrooms && (
                          <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{latestProperty.details.bedrooms} bed</span>
                          </div>
                        )}
                        {latestProperty.details.bathrooms && (
                          <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{latestProperty.details.bathrooms} bath</span>
                          </div>
                        )}
                        {latestProperty.details.size && (
                          <div className="flex items-center gap-1">
                            <Square className="h-4 w-4" />
                            <span>{latestProperty.details.size}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {latestProperty.description && (
                      <p className="text-gray-600 text-sm line-clamp-3">{latestProperty.description}</p>
                    )}

                    {latestProperty.badges && latestProperty.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {latestProperty.badges.slice(0, 3).map((badge, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-xs"
                      onClick={() => window.open("tel:0242799990", "_self")}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call Admin
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-xs"
                      onClick={() => {
                        const whatsappNumber = "+233242799990"
                        const message = `Hello Admin, I'm interested in this property:\n\nProperty: ${latestProperty.title}\nPrice: ${formatPrice(latestProperty.price, latestProperty.currency)}\nLocation: ${latestProperty.location || "Not specified"}\n\nPlease provide more details.`
                        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
                        window.open(whatsappUrl, "_blank")
                      }}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                  </div>

                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Link href="/properties">
                      <Home className="h-4 w-4 mr-2" />
                      Browse More Properties
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-blue-800 mb-2">🏠 Find Your Perfect Property in Ghana</h3>
            <p className="text-blue-600 mb-4">
              Browse hundreds of verified properties across Accra, Tema, Kumasi, and all regions of Ghana. Contact
              property owners directly via WhatsApp for instant communication!
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-blue-700">
              <span className="bg-blue-100 px-3 py-1 rounded-full">Houses for Sale</span>
              <span className="bg-blue-100 px-3 py-1 rounded-full">Apartments for Rent</span>
              <span className="bg-blue-100 px-3 py-1 rounded-full">Commercial Properties</span>
              <span className="bg-blue-100 px-3 py-1 rounded-full">Land for Sale</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
