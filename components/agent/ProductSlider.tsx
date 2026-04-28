"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Package } from "lucide-react"
import Link from "next/link"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"

interface Product {
  id: string
  name: string
  description: string
  price: number
  commission_value: number
  quantity: number
  image_urls: string[]
  category: string
  created_at: string
}

export function ProductSlider() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLatestProducts()
  }, [])

  const fetchLatestProducts = async () => {
    try {
      const response = await fetch("/api/agent/wholesale/latest-products")
      if (response.ok) {
        const data = await response.json()
        setProducts((data.products || []).slice(0, 4))
      }
    } catch (error) {
      console.error("Error fetching latest products:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full bg-white rounded-xl p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-purple-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-purple-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <Card className="w-full bg-white border-purple-200 shadow-lg">
        <CardContent className="p-6 text-center">
          <ShoppingBag className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-purple-800 mb-2">No Products Available</h3>
          <p className="text-purple-600 mb-4">Check back soon for new wholesale products!</p>
          <Button
            asChild
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Link href="/agent/wholesale">Browse Wholesale</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full bg-white border-purple-200 shadow-lg">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-purple-800">Latest Products</h3>
            <p className="text-purple-600 text-sm">Discover our newest wholesale items</p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-purple-300 text-purple-700 hover:bg-purple-100 bg-transparent"
          >
            <Link href="/agent/wholesale">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="relative">
                <div className="aspect-square w-full bg-gray-100 overflow-hidden relative">
                  <ImageWithFallback
                    src={(product.image_urls || [])[0]}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    fallbackSrc="/placeholder-product.jpg"
                  />
                  {product.image_urls && product.image_urls.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      +{product.image_urls.length - 1}
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-2 sm:p-3">
                <div className="space-y-2">
                  <h3 className="text-xs sm:text-sm font-medium text-emerald-800 line-clamp-2 leading-tight">
                    {product.name}
                  </h3>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-emerald-600">
                        GH₵{product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-emerald-500">+GH₵{product.commission_value.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Stock:</span>
                      <span
                        className={`text-xs font-medium ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {product.quantity}
                      </span>
                    </div>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="w-full text-xs py-1.5 h-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Link href="/agent/wholesale" className="inline-flex items-center justify-center gap-1">
                      <ShoppingBag className="h-3 w-3" />
                      Shop Now
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 md:mt-6 text-center">
          <Button
            asChild
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium px-6 py-2"
          >
            <Link href="/agent/wholesale" className="inline-flex items-center justify-center gap-2">
              <Package className="h-4 w-4" />
              Browse All Wholesale Products
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
