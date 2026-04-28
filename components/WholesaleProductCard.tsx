"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ShoppingCart, Package, DollarSign } from "lucide-react"
import Link from "next/link"
import { WholesaleProduct } from "@/lib/wholesale"

interface WholesaleProductCardProps {
  product: WholesaleProduct
  className?: string
}

export default function WholesaleProductCard({ product, className = "" }: WholesaleProductCardProps) {
  return (
    <Card className={`border-purple-200 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden mb-4">
          <ImageWithFallback
            src={(product.image_urls || [])[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            fallbackSrc="/placeholder-product.jpg"
          />
        </div>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg text-purple-800 line-clamp-2 flex-1">
            {product.name}
          </CardTitle>
          <Badge variant="secondary" className="ml-2 text-xs">
            {product.category}
          </Badge>
        </div>
        <CardDescription className="text-sm line-clamp-2">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Price and Commission */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-gray-600">Cost Price:</span>
            </div>
            <span className="text-xl font-bold text-purple-600">
              GH₵{product.price.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-gray-600">Your Commission:</span>
            </div>
            <span className="text-lg font-bold text-emerald-600">
              GH₵{product.commission_value.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Stock Info */}
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-600">Stock Available:</span>
            <span className={`font-medium ${product.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.quantity} units
            </span>
          </div>
        </div>

        {/* Shop Now Button */}
        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3"
          asChild
        >
          <Link href="/agent/register">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Shop Now
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
