"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingBag, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"

import { getCurrentAgent } from "@/lib/auth"
import { type Agent, supabase } from "@/lib/supabase"
import { type WholesaleProduct, generateWholesaleOrderReference } from "@/lib/wholesale"

import ProductBrowser from "@/components/agent/wholesale/ProductBrowser"
import ShoppingCart, { type CheckoutData } from "@/components/agent/wholesale/ShoppingCart"
import OrderHistory from "@/components/agent/wholesale/OrderHistory"
import { BackToTop } from "@/components/back-to-top"

interface CartItem {
  product: WholesaleProduct
  quantity: number
  selectedVariants?: Record<string, string> // Maps variant type to selected value
}

export default function WholesalePage() {
  const [agent, setAgent] = useState<Agent | null>(null)
  const [activeTab, setActiveTab] = useState("browse")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState("")
  const [orderHistoryKey, setOrderHistoryKey] = useState(0)

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

  useEffect(() => {
    const handleNavigateToOrders = () => {
      setActiveTab("orders")
      setOrderHistoryKey((k) => k + 1)
    }

    window.addEventListener("navigateToOrders", handleNavigateToOrders)
    return () => window.removeEventListener("navigateToOrders", handleNavigateToOrders)
  }, [])

  /**
   * Add item to cart
   */
  const handleAddToCart = (product: WholesaleProduct, quantity: number, selectedVariants?: Record<string, string>) => {
    setCartItems((prev) => {
      // For products with variants, create unique cart items based on variant selections
      if (selectedVariants && Object.keys(selectedVariants).length > 0) {
        // Create a unique key based on product + variant selections
        const variantKey = JSON.stringify(selectedVariants)
        const existing = prev.find(
          (i) => i.product.id === product.id && JSON.stringify(i.selectedVariants || {}) === variantKey,
        )
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id && JSON.stringify(i.selectedVariants || {}) === variantKey
              ? { ...i, quantity: Math.min(i.quantity + quantity, product.quantity) }
              : i,
          )
        }
        return [...prev, { product, quantity: Math.min(quantity, product.quantity), selectedVariants }]
      }

      // Original behavior for products without variants
      const existing = prev.find((i) => i.product.id === product.id && !i.selectedVariants)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && !i.selectedVariants
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.quantity) }
            : i,
        )
      }
      return [...prev, { product, quantity: Math.min(quantity, product.quantity) }]
    })
    setActiveTab("cart")
  }

  /**
   * Update cart items
   */
  const handleCartUpdate = (items: CartItem[]) => setCartItems(items)

  /**
   * Checkout handler
   */
  const handleCheckout = async (checkout: CheckoutData) => {
    if (!agent) throw new Error("Agent not found")

    setOrderError("")
    setOrderSuccess(false)

    try {
      const reference = generateWholesaleOrderReference()

      const request = {
        agent_id: agent.id,
        items: checkout.items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price,
          commission_per_item: i.product.commission_value,
          selectedVariants: i.selectedVariants, // Include variant selections
        })),
        payment_method: checkout.paymentMethod,
        payment_reference: checkout.paymentReference || reference,
        delivery_address: checkout.deliveryAddress,
        delivery_phone: checkout.deliveryPhone,
        total_amount: checkout.totalAmount,
        total_commission: checkout.totalCommission,
      }

      const response = await fetch("/api/agent/wholesale/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })

      const result = await response.json()
      if (!response.ok) {
        if (result.error === "Insufficient wallet balance") {
          throw new Error(`Insufficient wallet balance. You need GH₵${result.shortfall?.toFixed(2)} more.`)
        }
        throw new Error(result.error || "Failed to process order")
      }

      setCartItems([])
      setOrderSuccess(true)
      setActiveTab("orders")
      setOrderHistoryKey((k) => k + 1)

      setTimeout(() => setOrderSuccess(false), 5000)
    } catch (err) {
      console.error("Checkout error:", err)
      setOrderError(err instanceof Error ? err.message : "Failed to process order")
      throw err
    }
  }

  const cartItemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)

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
                <h1 className="text-xl md:text-2xl font-bold text-white">Wholesale Orders</h1>
                <p className="text-emerald-100 text-sm">Browse products and manage your wholesale orders</p>
              </div>
            </div>

            {/* Right side: Cart */}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              <ShoppingBag className="h-4 w-4 mr-1" />
              Cart: {cartItemCount}
            </Badge>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {orderSuccess && (
        <div className="max-w-6xl mx-auto w-full px-4 py-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Order placed successfully! Track it in the Orders tab.</AlertDescription>
          </Alert>
        </div>
      )}
      {orderError && (
        <div className="max-w-6xl mx-auto w-full px-4 py-4">
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{orderError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-2 sm:px-4 py-4 md:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 gap-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="browse" className="text-xs sm:text-sm">
              Browse
            </TabsTrigger>
            <TabsTrigger value="cart" className="text-xs sm:text-sm">
              Cart ({cartItemCount})
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs sm:text-sm">
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            <ProductBrowser onAddToCart={handleAddToCart} cartItems={cartItems} onCartUpdate={handleCartUpdate} />
          </TabsContent>

          <TabsContent value="cart">
            <ShoppingCart
              cartItems={cartItems}
              onUpdateCart={handleCartUpdate}
              onCheckout={handleCheckout}
              agent={agent}
            />
          </TabsContent>

          <TabsContent value="orders">
            <OrderHistory key={orderHistoryKey} agent={agent} />
          </TabsContent>
        </Tabs>
      </main>

      <BackToTop />
    </div>
  )
}
