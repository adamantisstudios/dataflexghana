"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraduationCap, ShoppingCart } from "lucide-react"
import { getAllProducts, categorizeProduct } from "@/lib/voucher-products-data"

export function VoucherProductsDisplay() {
  const products = getAllProducts()
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", "Results Checker", "School Forms", "Subscriptions", "Other"]

  const filteredProducts =
    selectedCategory === "All" ? products : products.filter((p) => categorizeProduct(p.title) === selectedCategory)

  return (
    <div className="space-y-8">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className={
              selectedCategory === category
                ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                : "border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
            }
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No products available in this category.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="border-blue-200 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <div className="w-full h-48 overflow-hidden rounded-t-lg bg-gray-100">
                <img
                  src={product.image_url || "/placeholder.svg?height=200&width=400"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/educational-card.jpg"
                  }}
                />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-blue-100 text-blue-800">{categorizeProduct(product.title)}</Badge>
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl line-clamp-2">{product.title}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-600">GHS {product.price.toFixed(2)}</span>
                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                      In Stock: {product.quantity}
                    </Badge>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <a href="#order-form">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Order Now
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
