"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package } from "lucide-react"
import { WholesaleProduct, getRecentWholesaleProducts } from "@/lib/wholesale"
import WholesaleProductCard from "./WholesaleProductCard"

export default function WholesaleProductSlider() {
  const [products, setProducts] = useState<WholesaleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    loadRecentProducts()
  }, [])

  const loadRecentProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getRecentWholesaleProducts(2)
      setProducts(data)
    } catch (error) {
      console.error('Error loading recent wholesale products:', error)
      setError('Failed to load wholesale products')
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)
  }

  // Auto-slide every 5 seconds if there are multiple products
  useEffect(() => {
    if (products.length > 1) {
      const interval = setInterval(nextSlide, 5000)
      return () => clearInterval(interval)
    }
  }, [products.length])

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-4">
              Latest Wholesale Products
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Start Your <span className="text-purple-600">Wholesale Business</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the latest wholesale products available for agents. Buy at wholesale prices and earn commissions!
            </p>
          </div>

          {/* Loading State */}
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          </div>
        </div>
      </section>
    )
  }

  if (error || products.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-4">
              Latest Wholesale Products
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Start Your <span className="text-purple-600">Wholesale Business</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the latest wholesale products available for agents. Buy at wholesale prices and earn commissions!
            </p>
          </div>

          {/* Empty State */}
          <Card className="border-purple-200 bg-white/90 backdrop-blur-sm max-w-md mx-auto">
            <CardContent className="pt-6 text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-purple-300" />
              <h3 className="text-xl font-semibold text-purple-800 mb-2">
                {error ? 'Unable to Load Products' : 'No Products Available'}
              </h3>
              <p className="text-purple-600">
                {error ? 'Please try again later.' : 'New wholesale products will appear here soon!'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-4">
            Latest Wholesale Products
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Start Your <span className="text-purple-600">Wholesale Business</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the latest wholesale products available for agents. Buy at wholesale prices and earn commissions!
          </p>
        </div>

        {/* Product Slider */}
        <div className="relative max-w-4xl mx-auto">
          {products.length === 1 ? (
            // Single product - no slider needed
            <div className="max-w-md mx-auto">
              <WholesaleProductCard product={products[0]} />
            </div>
          ) : (
            // Multiple products - show slider
            <div className="relative overflow-hidden rounded-xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {products.map((product, index) => (
                  <div key={product.id} className="w-full flex-shrink-0 px-4">
                    <div className="max-w-md mx-auto">
                      <WholesaleProductCard product={product} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dots Indicator */}
              {products.length > 1 && (
                <div className="flex justify-center mt-8 space-x-2">
                  {products.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentIndex 
                          ? 'bg-purple-600' 
                          : 'bg-purple-200 hover:bg-purple-300'
                      }`}
                      aria-label={`Go to product ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-4">
            Ready to start your wholesale business? Join as an agent today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/agent/register"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Become an Agent
            </a>
            <a
              href="/agent/login"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-medium rounded-lg transition-all duration-300"
            >
              Agent Login
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
