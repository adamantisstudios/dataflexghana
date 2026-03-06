"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ImageModal } from "@/components/ui/image-modal"
import WholesaleHeroSlider from "./WholesaleHeroSlider"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, Filter, ShoppingCart, Plus, Minus, Eye, Package } from "lucide-react"
import {
  type WholesaleProduct,
  WHOLESALE_CATEGORIES,
  getActiveWholesaleProducts,
  searchWholesaleProducts,
} from "@/lib/wholesale"

interface CartItem {
  product: WholesaleProduct
  quantity: number
  selectedVariants?: Record<string, string>
}

interface ProductBrowserProps {
  onAddToCart: (product: WholesaleProduct, quantity: number, selectedVariants?: Record<string, string>) => void
  cartItems: CartItem[]
  onCartUpdate: (items: CartItem[]) => void
}

export default function ProductBrowser({ onAddToCart, cartItems, onCartUpdate }: ProductBrowserProps) {
  const [products, setProducts] = useState<WholesaleProduct[]>([])
  const [filteredProducts, setFilteredProducts] = useState<WholesaleProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [priceFilter, setPriceFilter] = useState("All")
  const [selectedProduct, setSelectedProduct] = useState<WholesaleProduct | null>(null)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  // Image modal state - replicating Admin ProductManagement functionality
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImages, setModalImages] = useState<string[]>([])
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [modalImageAlt, setModalImageAlt] = useState("")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 12

  // Variant selection state
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({})

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, categoryFilter, priceFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, priceFilter])

  const loadProducts = async () => {
    try {
      const data = await getActiveWholesaleProducts()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = async () => {
    try {
      let filtered = products

      if (searchTerm || categoryFilter !== "All") {
        filtered = await searchWholesaleProducts(searchTerm, categoryFilter === "All" ? undefined : categoryFilter)
      }

      if (priceFilter !== "All") {
        switch (priceFilter) {
          case "Under 50":
            filtered = filtered.filter((p) => p.price < 50)
            break
          case "50-200":
            filtered = filtered.filter((p) => p.price >= 50 && p.price <= 200)
            break
          case "200-500":
            filtered = filtered.filter((p) => p.price >= 200 && p.price <= 500)
            break
          case "Over 500":
            filtered = filtered.filter((p) => p.price > 500)
            break
        }
      }

      setFilteredProducts(filtered)
    } catch (error) {
      console.error("Error filtering products:", error)
      setFilteredProducts([])
    }
  }

  const openProductDialog = (product: WholesaleProduct) => {
    setSelectedProduct(product)
    setSelectedVariants({}) // Reset variant selections
    setShowProductDialog(true)
  }

  // Image modal functions - replicating Admin ProductManagement functionality
  const openImageModal = (images: string[], index: number, alt: string) => {
    // Filter out invalid images and ensure we have valid URLs
    const validImages = images.filter(
      (img) => img && typeof img === "string" && img.trim() !== "" && img !== "/placeholder.svg",
    )

    if (validImages.length === 0) {
      // If no valid images, show placeholder
      setModalImages(["/placeholder.svg"])
      setModalImageIndex(0)
    } else {
      // Ensure index is within bounds
      const adjustedIndex = Math.min(Math.max(0, index), validImages.length - 1)
      setModalImages([...validImages]) // Create new array to trigger re-render
      setModalImageIndex(adjustedIndex)
    }

    setModalImageAlt(alt)
    setShowImageModal(true)
  }

  // Add a new function to handle index changes from the modal
  const handleModalIndexChange = (newIndex: number) => {
    setModalImageIndex(newIndex)
  }

  const getCartQuantity = (productId: string): number => {
    const item = cartItems.find((item) => item.product.id === productId)
    return item ? item.quantity : 0
  }

  const updateQuantity = (productId: string, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }))
  }

  const getQuantity = (productId: string): number => {
    return quantities[productId] || 1
  }

  const handleAddToCart = (product: WholesaleProduct) => {
    const quantity = getQuantity(product.id)
    
    // Check if product has variants and validate selection
    let variants = product.variants
    if (typeof variants === 'string') {
      try {
        variants = JSON.parse(variants)
      } catch (e) {
        variants = null
      }
    }
    
    if (Array.isArray(variants) && variants.length > 0) {
      // Product has variants - check if all are selected
      const allSelected = variants.every((v: any) => selectedVariants[v.type])
      if (!allSelected) {
        return // Don't add to cart if variants not selected
      }
    }
    
    onAddToCart(product, quantity, selectedVariants)
    setQuantities((prev) => ({ ...prev, [product.id]: 1 })) // Reset to 1 after adding
    setSelectedVariants({}) // Reset variant selections
  }

  // Pagination calculations
  const totalProducts = filteredProducts.length
  const totalPages = Math.ceil(totalProducts / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = filteredProducts.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const renderBrowserImage = (product: WholesaleProduct) => {
    const imageUrl = (product.image_urls || [])[0] || "/placeholder-product.jpg"
    console.log(`[v0] Rendering agent browser image for ${product.name}:`, imageUrl)
    return (
      <div className="aspect-square w-full bg-gray-100 overflow-hidden relative">
        <ImageWithFallback
          src={imageUrl || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
          onClick={() => openImageModal(product.image_urls || [], 0, product.name)}
          fallbackSrc="/placeholder-product.jpg"
        />
        {product.image_urls && product.image_urls.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            +{product.image_urls.length - 1}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-emerald-800 flex items-center gap-2">
          <Package className="h-5 w-5 md:h-6 md:w-6" />
          Wholesale Products
        </h2>
        <p className="text-emerald-600 text-sm md:text-base">Browse and purchase wholesale products</p>
      </div>

      <WholesaleHeroSlider />

      {/* Filters */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 shadow-lg">
        <CardContent className="pt-4 md:pt-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <Search className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-800">Find Your Perfect Products</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4 group-focus-within:text-emerald-600 transition-colors" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm md:text-base border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 bg-white/80 backdrop-blur-sm"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="text-sm md:text-base border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {WHOLESALE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="text-sm md:text-base border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Prices</SelectItem>
                  <SelectItem value="Under 50">Under GH₵50</SelectItem>
                  <SelectItem value="50-200">GH₵50 - GH₵200</SelectItem>
                  <SelectItem value="200-500">GH₵200 - GH₵500</SelectItem>
                  <SelectItem value="Over 500">Over GH₵500</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("All")
                  setPriceFilter("All")
                }}
                className="text-sm md:text-base border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 bg-white/80 backdrop-blur-sm transition-all duration-300"
              >
                <Filter className="h-4 w-4 mr-1 md:mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-6 text-center py-12">
            <Package className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-emerald-300" />
            <h3 className="text-lg md:text-xl font-semibold text-emerald-800 mb-1 md:mb-2">No Products Found</h3>
            <p className="text-emerald-600 text-sm md:text-base">
              Try adjusting your search criteria or check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Product count and pagination info */}
          <div className="flex justify-between items-center text-sm text-emerald-600">
            <span>
              Showing {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} products
            </span>
            {totalPages > 1 && (
              <span>
                Page {currentPage} of {totalPages}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {currentProducts.map((product) => {
              const cartQuantity = getCartQuantity(product.id)
              const currentQuantity = getQuantity(product.id)

              return (
                <Card
                  key={product.id}
                  className="border-emerald-200 bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="relative">{renderBrowserImage(product)}</div>

                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="text-sm md:text-base font-medium text-emerald-800 line-clamp-2 leading-tight">
                        {product.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <span className="text-xs md:text-sm font-bold text-emerald-600">
                          GH₵{product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-emerald-500">+GH₵{product.commission_value.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Stock:</span>
                        <span
                          className={`text-xs font-medium ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {product.quantity} units
                        </span>
                      </div>

                      {cartQuantity > 0 && (
                        <Badge variant="outline" className="text-xs py-0">
                          In cart: {cartQuantity}
                        </Badge>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(product.id, currentQuantity - 1)}
                          disabled={currentQuantity <= 1}
                          className="h-6 w-6 md:h-7 md:w-7"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="text-xs md:text-sm font-medium w-6 md:w-8 text-center">{currentQuantity}</span>

                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(product.id, currentQuantity + 1)}
                          disabled={currentQuantity >= product.quantity}
                          className="h-6 w-6 md:h-7 md:w-7"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.quantity === 0}
                          className="flex-1 text-xs px-2 py-1"
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openProductDialog(product)}
                        className="w-full text-xs py-1 h-7"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  let pageNumber
                  if (totalPages <= 5) {
                    pageNumber = index + 1
                  } else if (currentPage <= 3) {
                    pageNumber = index + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + index
                  } else {
                    pageNumber = currentPage - 2 + index
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(totalPages)} className="cursor-pointer">
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl text-left">{selectedProduct?.name}</DialogTitle>
            <DialogDescription className="text-sm md:text-base text-left">
              {selectedProduct?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-4">
              {(selectedProduct.image_urls || []).length > 0 && (
                <div className="w-full">
                  <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden relative">
                    <ImageWithFallback
                      src={(selectedProduct.image_urls || [])[0]}
                      alt={`${selectedProduct.name}`}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageModal(selectedProduct.image_urls, 0, selectedProduct.name)}
                      fallbackSrc="/placeholder-product.jpg"
                    />
                    {selectedProduct.image_urls.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        +{selectedProduct.image_urls.length - 1} images
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-center text-emerald-600 mt-2">Click image to view full gallery</p>
                </div>
              )}

              {/* Mobile-Optimized Product Details - Clean Vertical Layout */}
              <div className="space-y-4">
                {/* Price and Category */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-2xl font-bold text-emerald-600">GH₵{selectedProduct.price.toFixed(2)}</span>
                  <Badge className="self-start sm:self-center">{selectedProduct.category}</Badge>
                </div>

                {/* Commission and Stock - Mobile Vertical Layout */}
                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                  <div className="flex justify-between sm:flex-col sm:justify-start">
                    <span className="text-emerald-600 text-sm">Commission:</span>
                    <span className="font-medium text-sm sm:text-base sm:mt-1">
                      GH₵{selectedProduct.commission_value.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between sm:flex-col sm:justify-start">
                    <span className="text-emerald-600 text-sm">Stock:</span>
                    <span className="font-medium text-sm sm:text-base sm:mt-1">{selectedProduct.quantity} units</span>
                  </div>
                </div>

                {/* Features - Mobile Optimized */}
                {(Array.isArray(selectedProduct.features) ? selectedProduct.features : []).length > 0 && (
                  <div>
                    <span className="text-emerald-600 text-sm font-medium">Features:</span>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {(Array.isArray(selectedProduct.features) ? selectedProduct.features : []).map(
                        (feature, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            {feature}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

                {/* Variants Selection - INTERACTIVE */}
                {selectedProduct.variants && (
                  (() => {
                    let variants = selectedProduct.variants
                    if (typeof variants === 'string') {
                      try {
                        variants = JSON.parse(variants)
                      } catch (e) {
                        variants = null
                      }
                    }
                    
                    if (Array.isArray(variants) && variants.length > 0) {
                      const allSelected = variants.every((v: any) => selectedVariants[v.type])
                      return (
                        <div className="space-y-3 bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                          <div className="flex items-start justify-between">
                            <span className="text-emerald-800 text-sm font-semibold">Choose Your Options:</span>
                            {allSelected && <Badge className="bg-green-500">All Selected</Badge>}
                          </div>
                          <div className="space-y-3">
                            {variants.map((variant: any, idx: number) => (
                              <div key={idx} className="space-y-2">
                                <label className="text-xs font-medium text-emerald-700 block">
                                  {variant.type} {!selectedVariants[variant.type] && <span className="text-red-500">*</span>}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {Array.isArray(variant.values) && 
                                    variant.values.map((value: string, vidx: number) => (
                                      <button
                                        key={vidx}
                                        onClick={() => setSelectedVariants(prev => ({ ...prev, [variant.type]: value }))}
                                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all duration-200 cursor-pointer ${
                                          selectedVariants[variant.type] === value
                                            ? 'bg-emerald-600 text-white border-2 border-emerald-700'
                                            : 'bg-white border-2 border-emerald-300 text-emerald-700 hover:border-emerald-500 hover:bg-emerald-100'
                                        }`}
                                      >
                                        {value}
                                      </button>
                                    ))
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()
                )}

                {/* Add to Cart Button - Mobile Optimized */}
                {(() => {
                  let variants = selectedProduct.variants
                  if (typeof variants === 'string') {
                    try {
                      variants = JSON.parse(variants)
                    } catch (e) {
                      variants = null
                    }
                  }
                  
                  const hasVariants = Array.isArray(variants) && variants.length > 0
                  const allVariantsSelected = !hasVariants || variants.every((v: any) => selectedVariants[v.type])
                  
                  return (
                    <>
                      <Button
                        onClick={() => {
                          handleAddToCart(selectedProduct)
                          setShowProductDialog(false)
                        }}
                        disabled={selectedProduct.quantity === 0 || !allVariantsSelected}
                        className="w-full py-3 text-base font-medium"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {selectedProduct.quantity === 0 
                          ? "Out of Stock" 
                          : !allVariantsSelected
                          ? "Select All Options"
                          : "Add to Cart"}
                      </Button>
                      {hasVariants && !allVariantsSelected && (
                        <p className="text-xs text-center text-red-500 mt-1">Please select all product options before adding to cart</p>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Modal - replicating Admin ProductManagement functionality */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        images={modalImages}
        currentIndex={modalImageIndex}
        onIndexChange={handleModalIndexChange}
        alt={modalImageAlt}
      />
    </div>
  )
}
