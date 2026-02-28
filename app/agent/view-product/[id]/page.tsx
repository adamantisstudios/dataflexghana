"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, AlertCircle, Image as ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface ProductVariant {
  type: string
  values: string[]
}

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  commission_value: number
  quantity: number
  delivery_time: string
  image_urls: string[]
  variants: ProductVariant[] | null
  is_active: boolean
  submitted_by_agent_id: string
  created_at: string
  updated_at: string
}

export default function ViewProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from("wholesale_products")
        .select("*")
        .eq("id", productId)
        .single()

      if (fetchError || !data) {
        setError("Product not found")
        return
      }

      // Parse variants if they exist
      let parsedVariants: ProductVariant[] | null = null
      if (data.variants) {
        try {
          parsedVariants = typeof data.variants === "string" ? JSON.parse(data.variants) : data.variants
        } catch (e) {
          console.error("Error parsing variants:", e)
          parsedVariants = null
        }
      }

      setProduct({
        ...data,
        variants: parsedVariants,
      })
    } catch (err) {
      console.error("Error fetching product:", err)
      setError("Failed to load product")
      toast.error("Failed to load product details")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/agent/publish-products">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
            </Link>
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                  <p className="text-red-700">{error || "Product not found. Please check the URL and try again."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" size="sm" asChild className="mb-6">
            <Link href="/agent/publish-products">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
            </Link>
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex gap-2 flex-wrap">
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{product.category}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {product.image_urls && product.image_urls.length > 0 ? (
                  <div className="space-y-4 p-6">
                    {/* Main Image */}
                    <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "4/3" }}>
                      <Image
                        src={product.image_urls[selectedImageIndex]}
                        alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>

                    {/* Thumbnail Gallery */}
                    {product.image_urls.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {product.image_urls.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                              selectedImageIndex === index ? "border-blue-600" : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <Image
                              src={url}
                              alt={`Thumbnail ${index + 1}`}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      <p>No images available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm mb-1">Price</p>
                  <p className="text-3xl font-bold text-gray-900">GH₵ {product.price.toFixed(2)}</p>
                </div>
                {product.commission_value > 0 && (
                  <div>
                    <p className="text-gray-600 text-sm mb-1">Commission Value</p>
                    <p className="text-xl font-semibold text-green-600">GH₵ {product.commission_value.toFixed(2)}</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <p className="text-gray-600 text-sm mb-1">Available Quantity</p>
                  <p className="text-2xl font-bold text-gray-900">{product.quantity} units</p>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Category</p>
                  <p className="font-medium text-gray-900">{product.category}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Delivery Time</p>
                  <p className="font-medium text-gray-900">{product.delivery_time}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Created</p>
                  <p className="font-medium text-gray-900">{new Date(product.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(product.variants) &&
                  product.variants.map((variant, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{variant.type}</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(variant.values) &&
                          variant.values.map((value, valueIndex) => (
                            <Badge key={valueIndex} variant="secondary">
                              {value}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <Button variant="outline" asChild>
            <Link href="/agent/publish-products">Back to Products</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/agent/wholesale">View Wholesale</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
