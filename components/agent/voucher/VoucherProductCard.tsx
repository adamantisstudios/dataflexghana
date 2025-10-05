"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ShoppingCart, Eye } from "lucide-react"

interface VoucherProduct {
  id: string
  title: string
  description: string
  image_url: string
  price: number
  quantity: number
  status: 'published' | 'hidden' | 'out_of_stock'
  created_at: string
}

interface VoucherProductCardProps {
  product: VoucherProduct
  onBuyNow: (product: VoucherProduct) => void
  onViewDetails?: (product: VoucherProduct) => void
}

export function VoucherProductCard({ product, onBuyNow, onViewDetails }: VoucherProductCardProps) {
  const [imageError, setImageError] = useState(false)

  const isOutOfStock = product.status === 'out_of_stock' || product.quantity <= 0

  const handleBuyClick = () => {
    if (!isOutOfStock) {
      onBuyNow(product)
    }
  }

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-emerald-200 bg-white/90 backdrop-blur-sm hover:scale-105 relative">
      {isOutOfStock && (
        <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center z-10">
          <Badge variant="destructive" className="text-white font-semibold">
            Out of Stock
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg mb-3 overflow-hidden">
          <ImageWithFallback
            src={product.image_url || "/placeholder.svg"}
            alt={product.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
            onClick={() => onViewDetails?.(product)}
            fallbackSrc="/placeholder.svg?height=192&width=400"
            onError={() => setImageError(true)}
          />
        </div>
        
        <CardTitle className="text-lg text-emerald-800 line-clamp-2">
          {product.title}
        </CardTitle>
        
        {product.description && (
          <p className="text-sm text-emerald-600 line-clamp-3 mt-2">
            {product.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-800">
                GH₵ {product.price.toFixed(2)}
              </div>
              <div className="text-xs text-emerald-600">
                {product.quantity} available
              </div>
            </div>
            <Badge 
              variant={product.status === 'published' ? 'default' : 'secondary'}
              className={
                product.status === 'published' 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              }
            >
              {product.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleBuyClick}
              disabled={isOutOfStock}
              className={`flex-1 ${
                isOutOfStock 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'
              }`}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
            </Button>
            
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(product)}
                className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
