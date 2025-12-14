"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle, Loader2 } from "lucide-react"
import { getAllProducts, getProductById } from "@/lib/voucher-products-data"
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal"

export function VoucherOrderForm() {
  const products = getAllProducts()
  const [formData, setFormData] = useState({
    name: "",
    productId: 0,
    productTitle: "",
    quantity: "1",
    deliveryMode: "whatsapp",
    contact: "",
    additionalNotes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [pendingMessage, setPendingMessage] = useState("")

  const handleProductChange = (productId: string) => {
    const product = getProductById(Number.parseInt(productId))
    setFormData({
      ...formData,
      productId: Number.parseInt(productId),
      productTitle: product?.title || "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const selectedProduct = getProductById(formData.productId)
    const totalPrice = selectedProduct
      ? (selectedProduct.price * Number.parseInt(formData.quantity)).toFixed(2)
      : "0.00"

    const message = `
🎓 *New Educational Product Order*

👤 *Customer Name:* ${formData.name}
📚 *Product:* ${formData.productTitle}
💰 *Price:* GHS ${selectedProduct?.price.toFixed(2)} each
📦 *Quantity:* ${formData.quantity}
💵 *Total:* GHS ${totalPrice}
📬 *Delivery Mode:* ${formData.deliveryMode === "whatsapp" ? "WhatsApp" : "Email"}
📞 *Contact:* ${formData.contact}
${formData.additionalNotes ? `📝 *Notes:* ${formData.additionalNotes}` : ""}

💳 *PAYMENT CONFIRMATION:*
✅ Customer confirmed payment completed to 0557943392
Payment Name: Adamantis Solutions (Francis Ani-Johnson .K)
    `.trim()

    setPendingMessage(message)
    setShowPaymentModal(true)
  }

  const handlePaymentConfirmed = () => {
    setIsSubmitting(true)
    setShowPaymentModal(false)

    const whatsappNumber = "233242799990"
    const encodedMessage = encodeURIComponent(pendingMessage)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`

    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
      window.open(whatsappUrl, "_blank")

      setTimeout(() => {
        setIsSuccess(false)
        setFormData({
          name: "",
          productId: 0,
          productTitle: "",
          quantity: "1",
          deliveryMode: "whatsapp",
          contact: "",
          additionalNotes: "",
        })
      }, 3000)
    }, 1500)
  }

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6 text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800 mb-2">Order Submitted!</h3>
          <p className="text-green-700">
            Your order has been sent via WhatsApp. We'll process it shortly and get back to you!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-blue-200">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">Select Product *</Label>
              <Select value={formData.productId.toString()} onValueChange={handleProductChange} required>
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.title} - GHS {product.price.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {formData.productId > 0 &&
                (() => {
                  const selectedProduct = getProductById(formData.productId)
                  const totalPrice = selectedProduct
                    ? (selectedProduct.price * Number.parseInt(formData.quantity || "1")).toFixed(2)
                    : "0.00"

                  return selectedProduct ? (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                      <h4 className="font-semibold text-blue-900">Selected Product</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Product:</span>
                          <span className="font-medium text-blue-900">{selectedProduct.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Unit Price:</span>
                          <span className="font-medium text-blue-900">GHS {selectedProduct.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Quantity:</span>
                          <span className="font-medium text-blue-900">{formData.quantity}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-300">
                          <span className="text-blue-700 font-semibold">Total Cost:</span>
                          <span className="font-bold text-blue-900 text-lg">GHS {totalPrice}</span>
                        </div>
                      </div>
                    </div>
                  ) : null
                })()}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Enter quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Delivery Mode */}
            <div className="space-y-2">
              <Label>Delivery Mode *</Label>
              <RadioGroup
                value={formData.deliveryMode}
                onValueChange={(value) => setFormData({ ...formData, deliveryMode: value })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="cursor-pointer">
                    WhatsApp
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="cursor-pointer">
                    Email
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label htmlFor="contact">
                {formData.deliveryMode === "whatsapp" ? "WhatsApp Number *" : "Email Address *"}
              </Label>
              <Input
                id="contact"
                type={formData.deliveryMode === "whatsapp" ? "tel" : "email"}
                placeholder={formData.deliveryMode === "whatsapp" ? "Enter WhatsApp number" : "Enter email address"}
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                required
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or preferences..."
                value={formData.additionalNotes}
                onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                className="border-blue-200 focus:border-blue-500"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg py-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Order...
                </>
              ) : (
                "Submit Order"
              )}
            </Button>

            <p className="text-sm text-gray-600 text-center">
              Your order will be sent to our WhatsApp for processing. We'll contact you shortly!
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirmed}
        orderSummary={{
          service: formData.productTitle || "Educational Product",
          amount: formData.productId
            ? getProductById(formData.productId)?.price || 0 * Number.parseInt(formData.quantity || "1")
            : 0,
          total: formData.productId
            ? (getProductById(formData.productId)?.price || 0) * Number.parseInt(formData.quantity || "1")
            : 0,
        }}
      />
    </>
  )
}
