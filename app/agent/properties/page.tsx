"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"

import { getCurrentAgent } from "@/lib/auth"
import { type Agent, supabase } from "@/lib/supabase"
import { BackToTop } from "@/components/back-to-top"

import PropertyBrowser from "@/components/agent/properties/PropertyBrowser"
import PropertyFavorites from "@/components/agent/properties/PropertyFavorites"
import FloatingChatButton from "@/components/agent/properties/FloatingChatButton"
import PropertiesHeroSlider from "@/components/agent/properties/PropertiesHeroSlider"

export interface Property {
  id: string
  title: string
  property_link?: string
  price: number
  currency: string
  commission?: number
  category: string
  details: {
    bedrooms?: number
    bathrooms?: number
    size?: string
    furnished?: string
    amenities?: string
    [key: string]: any
  }
  location?: string
  description?: string
  contact_info: {
    phone?: string
    whatsapp?: string
    [key: string]: any
  }
  badges?: string[]
  status: string
  created_at: string
  updated_at: string
}

export default function PropertiesPage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [activeTab, setActiveTab] = useState("browse")
  const [favoriteProperties, setFavoriteProperties] = useState<string[]>([])
  const [inquirySuccess, setInquirySuccess] = useState(false)
  const [inquiryError, setInquiryError] = useState("")

  const router = useRouter()

  /**
   * Load and refresh agent data
   */
  useEffect(() => {
    const loadAgent = async () => {
      const cached = getCurrentAgent()
      if (!cached) {
        router.push("/agent/login")
        return
      }
      setAgent(cached)

      try {
        const { calculateWalletBalance } = await import("@/lib/earnings-calculator")
        const balance = await calculateWalletBalance(cached.id)

        const { data, error } = await supabase.from("agents").select("*").eq("id", cached.id).single()

        if (!error && data) {
          const updatedAgent = { ...data, wallet_balance: balance }
          setAgent(updatedAgent)
          localStorage.setItem("agent", JSON.stringify(updatedAgent))
        }
      } catch (err) {
        console.error("Failed to refresh agent:", err)
      }
    }

    loadAgent()
  }, [router])

  /**
   * Load favorite properties from localStorage
   */
  useEffect(() => {
    if (agent?.id) {
      const stored = localStorage.getItem(`property_favorites_${agent.id}`)
      if (stored) {
        try {
          setFavoriteProperties(JSON.parse(stored))
        } catch (error) {
          console.error("Error loading favorites:", error)
        }
      }
    }
  }, [agent?.id])

  /**
   * Toggle property favorite status
   */
  const handleToggleFavorite = (propertyId: string) => {
    if (!agent?.id) return

    setFavoriteProperties((prev) => {
      const newFavorites = prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]

      localStorage.setItem(`property_favorites_${agent.id}`, JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  /**
   * Handle property inquiry success
   */
  const handleInquirySuccess = () => {
    setInquirySuccess(true)
    setInquiryError("")
    setTimeout(() => setInquirySuccess(false), 3000)
  }

  /**
   * Handle property inquiry error
   */
  const handleInquiryError = (error: string) => {
    setInquiryError(error)
    setInquirySuccess(false)
    setTimeout(() => setInquiryError(""), 5000)
  }

  const favoriteCount = favoriteProperties.length

  /**
   * Loading state
   */
  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-hidden">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-md border-b border-emerald-700">
        <div className="max-w-6xl mx-auto w-full px-4 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left side: Back + Title */}
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 shrink-0"
              >
                <Link href="/agent/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Back to Dashboard</span>
                </Link>
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Property Promotion</h1>
                <p className="text-emerald-100 text-sm">Browse properties and earn commissions</p>
              </div>
            </div>

            {/* Right side: Favorites */}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <Building2 className="h-4 w-4 mr-1" />
              Favorites: {favoriteCount}
            </Badge>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {inquirySuccess && (
        <div className="max-w-6xl mx-auto w-full px-4 py-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Admin will reach out to you in under 10 minutes!</AlertDescription>
          </Alert>
        </div>
      )}
      {inquiryError && (
        <div className="max-w-6xl mx-auto w-full px-4 py-4">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{inquiryError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-2 sm:px-4 py-4 md:py-6">
        <PropertiesHeroSlider />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 gap-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="browse" className="text-xs sm:text-sm">
              Browse
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs sm:text-sm">
              Favorites ({favoriteCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <PropertyBrowser
              agent={agent}
              favoriteProperties={favoriteProperties}
              onToggleFavorite={handleToggleFavorite}
              onInquirySuccess={handleInquirySuccess}
              onInquiryError={handleInquiryError}
            />
          </TabsContent>

          <TabsContent value="favorites">
            <PropertyFavorites
              agent={agent}
              favoriteProperties={favoriteProperties}
              onToggleFavorite={handleToggleFavorite}
              onInquirySuccess={handleInquirySuccess}
              onInquiryError={handleInquiryError}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Chat Button - only show on properties page */}
      <FloatingChatButton agent={agent} />

      <BackToTop />
    </div>
  )
}
