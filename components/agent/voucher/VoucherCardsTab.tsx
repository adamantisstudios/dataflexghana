"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VoucherProductCard } from "./VoucherProductCard"
import { VoucherOrderDialog } from "./VoucherOrderDialog"
import { VoucherOrdersList } from "./VoucherOrdersList"
import { Search, ShoppingCart, Package, CreditCard, Info, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface VoucherProduct {
  id: string
  title: string
  description: string
  image_url: string
  price: number
  quantity: number
  status: "published" | "hidden" | "out_of_stock"
  created_at: string
}

interface VoucherOrder {
  id: string
  agent_id: string
  agent_name: string
  product_id: string
  quantity: number
  total_cost: number
  payment_reference: string
  payment_number: string
  delivery_method: "email" | "whatsapp"
  delivery_contact: string
  status: "pending" | "processing" | "delivered" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  product_title?: string
  product_image_url?: string
  unit_price?: number
}

interface VoucherCardsTabProps {
  agentId: string
  agentName: string
}

export function VoucherCardsTab({ agentId, agentName }: VoucherCardsTabProps) {
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState<VoucherProduct[]>([])
  const [orders, setOrders] = useState<VoucherOrder[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<VoucherProduct | null>(null)
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
  })

  const itemsPerPage = 12

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true)
      console.log("[v0] 🛒 Loading voucher products...")

      // Get agent data from localStorage
      const agentData = localStorage.getItem("agent")
      if (!agentData) {
        throw new Error("Agent not authenticated")
      }

      console.log("[v0] ✅ Agent data found in localStorage")

      const response = await fetch("/api/agent/voucher/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache busting for production
        cache: "no-cache",
      })

      console.log("[v0] 📡 API response status:", response.status)
      console.log("[v0] 📡 API response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] ❌ API error response:", errorText)

        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` }
        }

        throw new Error(errorData.error || `HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log("[v0] ✅ API response received:", result)

      // Handle response format
      let products = []
      if (result.success !== undefined) {
        if (!result.success) {
          throw new Error(result.error || "Failed to load products")
        }
        products = result.products || []
      } else if (result.products !== undefined) {
        products = result.products || []
      } else if (Array.isArray(result)) {
        products = result
      } else {
        throw new Error("Unexpected response format")
      }

      console.log("[v0] ✅ Successfully loaded products:", {
        count: products.length,
        products: products.map((p) => ({ id: p.id, title: p.title, status: p.status })),
      })

      setProducts(products)

      if (products.length === 0) {
        console.log("[v0] ⚠️ No voucher products found")
        toast.info("No voucher products are currently available. The database may need to be set up.")
      } else {
        console.log("[v0] ✅ Successfully loaded ${products.length} voucher products")
        toast.success(`Loaded ${products.length} voucher products`)
      }
    } catch (error) {
      console.error("[v0] ❌ Error loading products:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load products"

      toast.error(`Failed to load voucher products: ${errorMessage}. Check console for details.`)

      // Show debug info in production
      if (typeof window !== "undefined") {
        console.error("[v0] 🔍 Debug info:", {
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          agentId,
          localStorage: !!localStorage.getItem("agent"),
        })
      }

      setProducts([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  // Load orders
  const loadOrders = async () => {
    try {
      setOrdersLoading(true)

      // Get agent data from localStorage
      const agentData = localStorage.getItem("agent")
      if (!agentData) {
        throw new Error("Agent not authenticated")
      }

      // Create authorization token from localStorage data
      const authToken = btoa(agentData) // Base64 encode the agent data

      // Use the API endpoint with authorization header
      const response = await fetch("/api/agent/voucher/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to load orders")
      }

      const transformedOrders = result.orders || []

      setOrders(transformedOrders)

      // Calculate stats
      const totalOrders = transformedOrders.length
      const pendingOrders = transformedOrders.filter((o) => o.status === "pending").length
      const completedOrders = transformedOrders.filter((o) => o.status === "completed").length
      const totalSpent = transformedOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total_cost, 0)

      setStats({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent,
      })
    } catch (error) {
      console.error("Error loading orders:", error)
      toast.error("Failed to load orders")
    } finally {
      setOrdersLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadProducts()
    loadOrders()
  }, [agentId])

  // Filter products based on search
  const filteredProducts = products.filter(
    (product) =>
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Paginate products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleBuyNow = (product: VoucherProduct) => {
    setSelectedProduct(product)
    setShowOrderDialog(true)
  }

  const handleOrderComplete = async (orderData: any) => {
    try {
      // Get agent data from localStorage
      const agentData = localStorage.getItem("agent")
      if (!agentData) {
        throw new Error("Agent not authenticated")
      }

      const response = await fetch("/api/agent/voucher/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId, // Pass agent ID directly
          product_id: orderData.product_id,
          quantity: orderData.quantity,
          payment_reference: orderData.payment_reference,
          payment_number: "0557943392", // Default payment number
          delivery_method: orderData.delivery_method,
          delivery_contact: orderData.delivery_contact,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to create order")
      }

      // Refresh data
      await Promise.all([loadProducts(), loadOrders()])

      // Switch to orders tab
      setActiveTab("orders")

      toast.success("Order placed successfully!")
    } catch (error) {
      console.error("[v0] Error placing order:", error)
      throw error
    }
  }

  const handleRefreshOrders = () => {
    loadOrders()
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-800">Voucher Cards</h2>
          <p className="text-emerald-600">Purchase digital voucher cards and track your orders</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadProducts}
            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>How it works:</strong> Browse available voucher cards, select your quantity, complete MoMo payment,
          and receive your digital vouchers via email or WhatsApp.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-blue-100 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-amber-100 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-emerald-100 mt-1">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GH₵ {stats.totalSpent.toFixed(2)}</div>
            <p className="text-xs text-purple-100 mt-1">All purchases</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl">
          <TabsTrigger
            value="products"
            className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            E-Products ({products.length})
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
          >
            <Package className="h-4 w-4 mr-2" />
            E-Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* E-Products Tab */}
        <TabsContent value="products" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
            <Input
              placeholder="Search E-Products…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1) // Reset to first page when searching
              }}
              className="pl-10 border-emerald-200 focus:border-emerald-500 bg-white/80 backdrop-blur-sm"
            />
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="border-emerald-200 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="w-full h-48 bg-gray-200 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-emerald-300" />
                <h3 className="text-lg font-semibold text-emerald-800 mb-2">
                  {searchTerm ? "No products found" : "No products available"}
                </h3>
                <p className="text-emerald-600">
                  {searchTerm ? "Try adjusting your search terms" : "Check back later for new voucher cards"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => (
                  <VoucherProductCard key={product.id} product={product} onBuyNow={handleBuyNow} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  >
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={
                          currentPage === page
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                        }
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                  >
                    Next
                  </Button>
                </div>
              )}

              {/* Results info */}
              <div className="text-center text-sm text-emerald-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
            </>
          )}
        </TabsContent>

        {/* E-Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <VoucherOrdersList orders={orders} loading={ordersLoading} onRefresh={handleRefreshOrders} />
        </TabsContent>
      </Tabs>

      {/* Order Dialog */}
      <VoucherOrderDialog
        isOpen={showOrderDialog}
        onClose={() => {
          setShowOrderDialog(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        agentName={agentName}
        onOrderComplete={handleOrderComplete}
      />
    </div>
  )
}
