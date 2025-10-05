"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ImageWithFallback } from "@/components/ui/image-with-fallback"
import { ShoppingCart, CreditCard, Mail, MessageSquare, Copy, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { toast } from "sonner"

interface VoucherProduct {
  id: string
  title: string
  description: string
  image_url: string
  price: number
  quantity: number
  status: "published" | "hidden" | "out_of_stock"
}

interface VoucherOrderDialogProps {
  isOpen: boolean
  onClose: () => void
  product: VoucherProduct | null
  agentName: string
  onOrderComplete: (orderData: any) => void
}

export function VoucherOrderDialog({ isOpen, onClose, product, agentName, onOrderComplete }: VoucherOrderDialogProps) {
  const [step, setStep] = useState<"product" | "payment" | "delivery">("product")
  const [quantity, setQuantity] = useState(1)
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "whatsapp">("email")
  const [deliveryContact, setDeliveryContact] = useState("")
  const [paymentReference, setPaymentReference] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  const totalCost = product ? product.price * quantity : 0
  const momoNumber = "0557943392"
  const momoRecipient = "Adamantis Solutions"

  // Generate unique 5-digit code for payment reference
  useEffect(() => {
    if (isOpen && product) {
      const uniqueCode = Math.floor(10000 + Math.random() * 90000).toString()
      setPaymentReference(`${uniqueCode} ${agentName}`)
    }
  }, [isOpen, product, agentName])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("product")
      setQuantity(1)
      setDeliveryMethod("email")
      setDeliveryContact("")
      setIsSubmitting(false)
      setCopied(false)
    }
  }, [isOpen])

  const handleQuantityChange = (value: string) => {
    const num = Number.parseInt(value)
    if (num > 0 && num <= (product?.quantity || 0)) {
      setQuantity(num)
    }
  }

  const handleCopyReference = async () => {
    try {
      await navigator.clipboard.writeText(paymentReference)
      setCopied(true)
      toast.success("Payment reference copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy reference")
    }
  }

  const handleNextStep = () => {
    if (step === "product") {
      setStep("payment")
    } else if (step === "payment") {
      setStep("delivery")
    }
  }

  const handlePreviousStep = () => {
    if (step === "delivery") {
      setStep("payment")
    } else if (step === "payment") {
      setStep("product")
    }
  }

  const handlePlaceOrder = async () => {
    if (!product || !deliveryContact.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        product_id: product.id,
        quantity,
        total_cost: totalCost,
        payment_reference: paymentReference,
        delivery_method: deliveryMethod,
        delivery_contact: deliveryContact.trim(),
      }

      await onOrderComplete(orderData)

      toast.success("Order placed successfully! Redirecting to your orders...")
      onClose()
    } catch (error) {
      console.error("Order placement error:", error)
      toast.error("Failed to place order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-800">
            <ShoppingCart className="h-5 w-5" />
            Order Voucher Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            <div className={`flex items-center ${step === "product" ? "text-emerald-600" : "text-gray-400"}`}>
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  step === "product" ? "bg-emerald-600 text-white" : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Product</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step === "payment" ? "text-emerald-600" : "text-gray-400"}`}>
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  step === "payment" ? "bg-emerald-600 text-white" : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Payment</span>
            </div>
            <div className="w-4 sm:w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step === "delivery" ? "text-emerald-600" : "text-gray-400"}`}>
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                  step === "delivery" ? "bg-emerald-600 text-white" : "bg-gray-200"
                }`}
              >
                3
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium">Delivery</span>
            </div>
          </div>

          {/* Step 1: Product Selection */}
          {step === "product" && (
            <div className="space-y-4">
              <Card className="border-emerald-200">
                <CardContent className="p-4 sm:p-6">
                  {/* Product Image at Top */}
                  <div className="w-full mb-4">
                    <div className="aspect-video w-full bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg overflow-hidden">
                      <ImageWithFallback
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        fallbackSrc="/placeholder.svg?height=200&width=400"
                      />
                    </div>
                  </div>

                  {/* Product Title */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-emerald-800 mb-2">{product.title}</h3>
                  </div>

                  {/* Product Description */}
                  <div className="mb-4">
                    <p className="text-sm sm:text-base text-emerald-600 text-center leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Cost and Availability Info */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-sm text-emerald-700 font-medium mb-1">Unit Price</p>
                        <p className="text-2xl sm:text-3xl font-bold text-emerald-800">
                          GH₵ {product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-sm text-emerald-700 font-medium mb-1">Available Quantity</p>
                        <div className="flex items-center justify-center sm:justify-end gap-2">
                          <Badge variant="outline" className="border-emerald-300 text-emerald-600 text-base px-3 py-1">
                            {product.quantity} items
                          </Badge>
                          {product.quantity > 0 ? (
                            <Badge className="bg-green-100 text-green-800 text-sm">In Stock</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-sm">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Label htmlFor="quantity" className="text-emerald-700 font-medium text-base">
                  Select Quantity
                </Label>
                <Select value={quantity.toString()} onValueChange={handleQuantityChange}>
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-500 h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: Math.min(product.quantity, 10) }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()} className="text-base">
                        {num} {num === 1 ? "item" : "items"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-center sm:text-left">
                      <p className="text-emerald-700 font-medium text-base mb-1">Total Cost</p>
                      <p className="text-3xl sm:text-4xl font-bold text-emerald-800">GH₵ {totalCost.toFixed(2)}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-sm text-emerald-600">
                        {quantity} × GH₵ {product.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-emerald-500 mt-1">Digital delivery included</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Payment Instructions */}
          {step === "payment" && (
            <div className="space-y-4">
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Important:</strong> You must complete the MoMo payment BEFORE placing your order.
                </AlertDescription>
              </Alert>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <CreditCard className="h-5 w-5" />
                    <h3 className="font-semibold">MoMo Payment Instructions</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-700">Amount to Pay:</span>
                      <span className="font-bold text-blue-800 text-lg">GH₵ {totalCost.toFixed(2)}</span>
                    </div>

                    <Separator className="bg-blue-200" />

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-700">MoMo Number:</span>
                        <span className="font-semibold text-blue-800">{momoNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Recipient:</span>
                        <span className="font-semibold text-blue-800">{momoRecipient}</span>
                      </div>
                    </div>

                    <Separator className="bg-blue-200" />

                    <div className="space-y-2">
                      <Label className="text-blue-700 font-medium">Payment Reference:</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={paymentReference}
                          readOnly
                          className="bg-white border-blue-200 text-blue-800 font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyReference}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                        >
                          {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-blue-600">Use this exact reference when making your MoMo payment</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert className="border-emerald-200 bg-emerald-50">
                <Info className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  After completing the MoMo payment, proceed to the next step to provide delivery details.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 3: Delivery Details */}
          {step === "delivery" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-emerald-700 font-medium">Delivery Method</Label>
                <Select
                  value={deliveryMethod}
                  onValueChange={(value: "email" | "whatsapp") => setDeliveryMethod(value)}
                >
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Delivery
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        WhatsApp Delivery
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="delivery-contact" className="text-emerald-700 font-medium">
                  {deliveryMethod === "email" ? "Email Address" : "WhatsApp Number"}
                </Label>
                <Input
                  id="delivery-contact"
                  type={deliveryMethod === "email" ? "email" : "tel"}
                  placeholder={
                    deliveryMethod === "email"
                      ? "Enter your email address"
                      : "Enter your WhatsApp number (e.g., +233XXXXXXXXX)"
                  }
                  value={deliveryContact}
                  onChange={(e) => setDeliveryContact(e.target.value)}
                  className="border-emerald-200 focus:border-emerald-500"
                />
                <p className="text-xs text-emerald-600">
                  Your voucher card will be delivered to this {deliveryMethod === "email" ? "email" : "WhatsApp number"}
                </p>
              </div>

              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-emerald-800 mb-2">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Product:</span>
                      <span className="text-emerald-800">{product.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Quantity:</span>
                      <span className="text-emerald-800">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Unit Price:</span>
                      <span className="text-emerald-800">GH₵ {product.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Payment Reference:</span>
                      <span className="text-emerald-800 font-mono text-xs">{paymentReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Delivery:</span>
                      <span className="text-emerald-800 capitalize">{deliveryMethod}</span>
                    </div>
                    <Separator className="bg-emerald-200" />
                    <div className="flex justify-between font-semibold">
                      <span className="text-emerald-700">Total:</span>
                      <span className="text-emerald-800">GH₵ {totalCost.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <div className="flex gap-2 order-2 sm:order-1">
            {step !== "product" && (
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex-1 sm:flex-none bg-transparent"
              >
                Previous
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-600 hover:bg-gray-50 flex-1 sm:flex-none bg-transparent"
            >
              Cancel
            </Button>
          </div>

          <div className="order-1 sm:order-2">
            {step !== "delivery" ? (
              <Button
                onClick={handleNextStep}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full sm:w-auto"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || !deliveryContact.trim()}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 w-full sm:w-auto"
              >
                {isSubmitting ? "Placing Order..." : "Place Order"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
