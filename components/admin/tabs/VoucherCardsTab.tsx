"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AdminVoucherOrdersTab } from "../voucher/AdminVoucherOrdersTab"
import { AdminVoucherProductsTab } from "../voucher/AdminVoucherProductsTab"
import { 
  ShoppingCart, 
  Package, 
  CreditCard, 
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getCurrentAdmin } from "@/lib/auth"

interface VoucherCardsTabProps {
  getCachedData?: (key: string) => any
  setCachedData?: (key: string, data: any) => void
}

export default function VoucherCardsTab({ getCachedData, setCachedData }: VoucherCardsTabProps) {
  const [activeTab, setActiveTab] = useState("orders")
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    publishedProducts: 0,
    todayOrders: 0,
    todayRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  const admin = getCurrentAdmin()
  const adminId = admin?.id || ""

  // Load overview stats
  const loadStats = async () => {
    try {
      setLoading(true)
      
      // Check cache first
      const cachedStats = getCachedData?.('voucher-stats')
      if (cachedStats && Date.now() - cachedStats.timestamp < 60000) { // 1 minute cache
        setStats(cachedStats.data)
        setLoading(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      // Load orders stats
      const { data: ordersData, error: ordersError } = await supabase
        .from('e_orders')
        .select('id, status, total_cost, created_at')

      if (ordersError) {
        console.error('Error loading orders stats:', ordersError)
      }

      // Load products stats
      const { data: productsData, error: productsError } = await supabase
        .from('e_products')
        .select('id, status')

      if (productsError) {
        console.error('Error loading products stats:', productsError)
      }

      // Calculate stats
      const orders = ordersData || []
      const products = productsData || []

      const totalOrders = orders.length
      const pendingOrders = orders.filter(o => o.status === 'pending').length
      const completedOrders = orders.filter(o => o.status === 'completed').length
      const totalRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_cost, 0)
      const totalProducts = products.length
      const publishedProducts = products.filter(p => p.status === 'published').length
      const todayOrders = orders.filter(o => 
        o.created_at.startsWith(today)
      ).length
      const todayRevenue = orders
        .filter(o => o.created_at.startsWith(today) && o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total_cost, 0)

      const newStats = {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        totalProducts,
        publishedProducts,
        todayOrders,
        todayRevenue
      }

      setStats(newStats)
      
      // Cache the results
      setCachedData?.('voucher-stats', {
        data: newStats,
        timestamp: Date.now()
      })

    } catch (error) {
      console.error('Error loading voucher stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-blue-200 bg-white/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-800">Voucher Cards Management</h2>
          <p className="text-blue-600">Manage e-products and track orders for voucher cards</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-blue-100 mt-1">All time orders</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-100 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-amber-100 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-emerald-100 mt-1">{stats.publishedProducts} published</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">GH₵ {stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-purple-100 mt-1">Total earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-green-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Today's Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{stats.todayOrders}</div>
                <p className="text-xs text-green-100">Orders Today</p>
              </div>
              <div>
                <div className="text-2xl font-bold">GH₵ {stats.todayRevenue.toFixed(2)}</div>
                <p className="text-xs text-green-100">Revenue Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-indigo-100 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                </div>
                <p className="text-xs text-indigo-100">Orders Completed</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completedOrders}</div>
                <p className="text-xs text-indigo-100">Total Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg border border-blue-200 p-1 rounded-xl">
          <TabsTrigger
            value="orders"
            className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            E-Orders ({stats.totalOrders})
            {stats.pendingOrders > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white text-xs">
                {stats.pendingOrders}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200 rounded-lg"
          >
            <Package className="h-4 w-4 mr-2" />
            E-Management ({stats.totalProducts})
          </TabsTrigger>
        </TabsList>

        {/* E-Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <AdminVoucherOrdersTab adminId={adminId} />
        </TabsContent>

        {/* E-Products Management Tab */}
        <TabsContent value="products" className="space-y-6">
          <AdminVoucherProductsTab adminId={adminId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
