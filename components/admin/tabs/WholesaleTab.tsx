"use client"
import { useState, lazy, Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ShoppingBag, Package, ShoppingCart } from 'lucide-react'

// Lazy load wholesale sub-components for better performance
const OrderManagement = lazy(() => import("@/components/admin/wholesale/OrderManagement"))
const ProductManagement = lazy(() => import("@/components/admin/wholesale/ProductManagement"))

// Loading skeleton for wholesale sub-tabs
const WholesaleLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

interface WholesaleTabProps {
  getCachedData: () => any
  setCachedData: (data: any) => void
}

export default function WholesaleTab({ getCachedData, setCachedData }: WholesaleTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("orders")
  const [loadedSubTabs, setLoadedSubTabs] = useState<Set<string>>(new Set(["orders"]))

  const handleSubTabChange = (tabId: string) => {
    setActiveSubTab(tabId)
    setLoadedSubTabs(prev => new Set([...prev, tabId]))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-emerald-600" />
          <div>
            <h2 className="text-2xl font-bold text-emerald-800">Wholesale Management</h2>
            <p className="text-emerald-600">Manage wholesale products and orders</p>
          </div>
        </div>
      </div>

      <Tabs value={activeSubTab} onValueChange={handleSubTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-200">
          <TabsTrigger
            value="orders"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white"
          >
            <ShoppingCart className="h-4 w-4" />
            Order Management
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white"
          >
            <Package className="h-4 w-4" />
            Product Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {loadedSubTabs.has("orders") ? (
            <Suspense fallback={<WholesaleLoadingSkeleton />}>
              <OrderManagement />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <ShoppingCart className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">Loading order management...</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {loadedSubTabs.has("products") ? (
            <Suspense fallback={<WholesaleLoadingSkeleton />}>
              <ProductManagement />
            </Suspense>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <Package className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 font-medium">Click to load product management...</p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
