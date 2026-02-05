"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, TrendingUp, Clock, ArrowLeft } from "lucide-react"
import ProductManagement from "@/components/admin/wholesale/ProductManagement"
import OrderManagement from "@/components/admin/wholesale/OrderManagement"
import { BackToTop } from "@/components/back-to-top"

interface WholesaleStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  totalRevenue: number
}

export default function WholesalePage() {
  const [activeTab, setActiveTab] = useState("products")
  const [stats, setStats] = useState<WholesaleStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/wholesale/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Fixed Return to Dashboard Button */}
      <div className="fixed top-4 left-4 z-50">
        <Link href="/admin">
          <Button variant="outline" className="bg-white/90 backdrop-blur-sm border-emerald-200 hover:bg-emerald-50 shadow-lg">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-xl border-b-4 border-emerald-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white drop-shadow-lg flex items-center gap-3">
                <Package className="h-8 w-8" />
                Wholesale Management
              </h1>
              <p className="text-emerald-100 font-medium">
                Manage wholesale products and orders for your agents
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {loading ? "..." : stats.activeProducts}
                    </p>
                    <p className="text-emerald-100 text-sm">Active Products</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {loading ? "..." : stats.totalOrders}
                    </p>
                    <p className="text-emerald-100 text-sm">Total Orders</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {loading ? "..." : `GH₵ ${stats.totalRevenue.toFixed(2)}`}
                    </p>
                    <p className="text-emerald-100 text-sm">Total Revenue</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-white" />
                  <div>
                    <p className="text-white font-semibold text-lg">
                      {loading ? "..." : stats.pendingOrders}
                    </p>
                    <p className="text-emerald-100 text-sm">Pending Orders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200 p-1 rounded-xl overflow-x-auto">
  <div className="flex min-w-full md:grid md:grid-cols-2 gap-1">
    <TabsTrigger
      value="products"
      className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-3 flex items-center justify-center gap-2 whitespace-nowrap min-w-fit flex-1 md:flex-auto"
    >
      <Package className="h-4 w-4" />
      <span className="hidden xs:inline">Product Management</span>
      <span className="xs:hidden">Products</span>
    </TabsTrigger>
    <TabsTrigger
      value="orders"
      className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg p-3 flex items-center justify-center gap-2 whitespace-nowrap min-w-fit flex-1 md:flex-auto"
    >
      <ShoppingCart className="h-4 w-4" />
      <span className="hidden xs:inline">Order Management</span>
      <span className="xs:hidden">Orders</span>
    </TabsTrigger>
  </div>
</TabsList>

          <TabsContent value="products" className="space-y-6">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderManagement />
          </TabsContent>
        </Tabs>
      </div>

      <BackToTop />
    </div>
  )
}
