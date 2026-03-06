"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ShoppingCartIcon, Plus, Minus, Trash2, CreditCard, Wallet, AlertCircle, CheckCircle } from "lucide-react"
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator"
import { Copy, CheckCircle2 } from "lucide-react"
import type { WholesaleProduct } from "@/lib/wholesale"
import type { Agent } from "@/lib/supabase"
import OrderProcessHeroSlider from "./OrderProcessHeroSlider"

interface CartItem {
  product: WholesaleProduct
  quantity: number
  selectedVariants?: Record<string, string>
}

interface ShoppingCartProps {
  cartItems: CartItem[]
  onUpdateCart: (items: CartItem[]) => void
  onCheckout: (orderData: CheckoutData) => Promise<void>
  agent: Agent | null
}

export interface CheckoutData {
  items: CartItem[]
  paymentMethod: "wallet" | "manual"
  paymentReference?: string
  deliveryAddress: string
  deliveryPhone: string
  totalAmount: number
  totalCommission: number
}

export default function ShoppingCart({ cartItems, onUpdateCart, onCheckout, agent }: ShoppingCartProps) {
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "manual">("wallet")
  const [paymentReference, setPaymentReference] = useState("")
  const [copiedPaymentCode, setCopiedPaymentCode] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryPhone, setDeliveryPhone] = useState(agent?.phone_number || "")

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (!cartItems) return

    if (newQuantity <= 0) {
      removeItem(productId)
      return
    }

    const updatedItems = cartItems.map((item) =>
      item.product.id === productId ? { ...item, quantity: Math.min(newQuantity, item.product.quantity) } : item,
    )
    onUpdateCart(updatedItems)
  }

  const removeItem = (productId: string, selectedVariants?: Record<string, string>) => {
    if (!cartItems) return
    const updatedItems = cartItems.filter((item) => {
      if (item.product.id !== productId) return true
      // If variants exist, only filter out the exact variant combination
      if (selectedVariants && Object.keys(selectedVariants).length > 0) {
        return JSON.stringify(item.selectedVariants || {}) !== JSON.stringify(selectedVariants)
      }
      // If no variants specified, remove all instances of the product
      return false
    })
    onUpdateCart(updatedItems)
  }

  const clearCart = () => {
    onUpdateCart([])
  }

  const calculateTotals = () => {
    const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const totalCommission = cartItems.reduce(
      (sum, item) => sum + (item.product.commission_value || 0) * item.quantity,
      0,
    )
    return { totalAmount, totalCommission }
  }

  const { totalAmount, totalCommission } = calculateTotals()

  const walletBalance = agent?.wallet_balance || 0
  const isWalletBalanceSufficient = walletBalance >= totalAmount

  const effectivePaymentMethod = isWalletBalanceSufficient ? paymentMethod : "manual"

  const handleCheckout = async () => {
    if (!deliveryAddress.trim() || !deliveryPhone.trim()) {
      return
    }

    if (effectivePaymentMethod === "wallet" && !isWalletBalanceSufficient) {
      return
    }

    setCheckingOut(true)
    try {
      await onCheckout({
        items: cartItems,
        paymentMethod: effectivePaymentMethod,
        paymentReference: effectivePaymentMethod === "manual" ? paymentReference : undefined,
        deliveryAddress,
        deliveryPhone,
        totalAmount,
        totalCommission,
      })
      setShowCheckoutDialog(false)
      setPaymentReference("")
      setDeliveryAddress("")
      setShowOrderConfirmation(true)
      setTimeout(() => {
        setShowOrderConfirmation(false)
        window.dispatchEvent(new CustomEvent("navigateToOrders"))
      }, 3000)
    } catch (error) {
      console.error("Checkout failed:", error)
    } finally {
      setCheckingOut(false)
    }
  }

  const handleGeneratePaymentCode = () => {
    const code = generatePaymentReferenceCode()
    setPaymentReference(code)
    navigator.clipboard.writeText(code)
    setCopiedPaymentCode(true)
    setTimeout(() => setCopiedPaymentCode(false), 2000)
  }

  const handleCopyPaymentCode = () => {
    if (paymentReference) {
      navigator.clipboard.writeText(paymentReference)
      setCopiedPaymentCode(true)
      setTimeout(() => setCopiedPaymentCode(false), 2000)
    }
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="space-y-6">
        <OrderProcessHeroSlider />
        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6" />
              Shopping Cart
            </CardTitle>
            <CardDescription className="text-sm md:text-base">Your wholesale cart is empty</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ShoppingCartIcon className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 md:mb-4 text-emerald-300" />
              <p className="text-emerald-600 text-sm md:text-base">Add products to your cart to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <OrderProcessHeroSlider />
        <Card className="border-emerald-200 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl text-emerald-800 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ShoppingCartIcon className="h-5 w-5 md:h-6 md:w-6" />
                Shopping Cart
              </span>
              <Badge variant="secondary" className="text-xs md:text-sm">
                {cartItems.length} items
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm md:text-base">Review your wholesale order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {cartItems.map((item) => {
                // Parse variants if they exist
                let variants = null
                if (item.product.variants) {
                  if (typeof item.product.variants === 'string') {
                    try {
                      variants = JSON.parse(item.product.variants)
                    } catch (e) {
                      variants = null
                    }
                  } else if (Array.isArray(item.product.variants)) {
                    variants = item.product.variants
                  }
                }

                return (
                <div key={item.product.id} className="flex flex-col sm:flex-row gap-3 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm md:text-base text-emerald-800 truncate">{item.product.name}</h4>
                    <p className="text-xs md:text-sm text-emerald-600">
                      GH₵{item.product.price.toFixed(2)} × {item.quantity}
                    </p>
                    <p className="text-xs md:text-sm text-emerald-500">
                      Commission: GH₵{((item.product.commission_value || 0) * item.quantity).toFixed(2)}
                    </p>

                    {/* Display selected variants */}
                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 space-y-1 bg-emerald-50 p-2 rounded">
                        <p className="text-xs font-medium text-emerald-700 mb-1">Selected Options:</p>
                        {Object.entries(item.selectedVariants).map(([type, value], idx) => (
                          <p key={idx} className="text-xs text-emerald-700">
                            <span className="font-medium">{type}:</span> {value}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="h-7 w-7 md:h-8 md:w-8"
                    >
                      <Minus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>

                    <span className="text-sm md:text-base font-medium w-8 text-center">{item.quantity}</span>

                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.quantity}
                      className="h-7 w-7 md:h-8 md:w-8"
                    >
                      <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.product.id, item.selectedVariants)}
                      className="h-7 w-7 md:h-8 md:w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
                )
              })}

              <div className="border-t pt-3 md:pt-4 space-y-2">
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-emerald-600">Subtotal:</span>
                  <span className="font-medium">GH₵{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm md:text-base">
                  <span className="text-emerald-600">Total Commission:</span>
                  <span className="font-medium text-green-600">GH₵{totalCommission.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base md:text-lg font-bold">
                  <span className="text-emerald-800">Total:</span>
                  <span className="text-emerald-800">GH₵{totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-3 md:pt-4">
                <Button variant="outline" onClick={clearCart} className="text-sm md:text-base bg-transparent">
                  Clear Cart
                </Button>
                <Button
                  onClick={() => setShowCheckoutDialog(true)}
                  disabled={cartItems.length === 0}
                  className="flex-1 text-sm md:text-base"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Checkout</DialogTitle>
            <DialogDescription className="text-sm md:text-base">Complete your wholesale order</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-sm md:text-base">Payment Method</Label>
              <Select
                value={isWalletBalanceSufficient ? paymentMethod : "manual"}
                onValueChange={(value: "wallet" | "manual") => setPaymentMethod(value)}
              >
                <SelectTrigger className="text-sm md:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet" disabled={!isWalletBalanceSufficient}>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      <span className="text-sm md:text-base">Wallet Balance (GH₵{walletBalance.toFixed(2)})</span>
                      {!isWalletBalanceSufficient && (
                        <Badge variant="destructive" className="text-xs ml-2">
                          Insufficient
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm md:text-base">Manual Payment</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {!isWalletBalanceSufficient && (
                <Alert className="mt-2 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 text-sm">
                    Insufficient wallet balance. You need GH₵{(totalAmount - walletBalance).toFixed(2)} more to use
                    wallet payment.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {effectivePaymentMethod === "manual" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm md:text-base font-semibold mb-2 block">Payment Code</Label>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">
                    Generate a 4-digit code to use when making manual payment
                  </p>
                  {paymentReference ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Your Payment Code</p>
                        <p className="text-2xl font-mono font-bold text-emerald-900">{paymentReference}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyPaymentCode}
                        className="flex-shrink-0 h-10 w-10 p-0 bg-transparent"
                      >
                        {copiedPaymentCode ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={handleGeneratePaymentCode}
                      className="w-full text-sm md:text-base bg-emerald-600 hover:bg-emerald-700"
                    >
                      Generate Payment Code
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm md:text-base">Delivery Address</Label>
              <Textarea
                placeholder="Enter delivery address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                className="text-sm md:text-base"
              />
            </div>

            <div>
              <Label className="text-sm md:text-base">Delivery Phone</Label>
              <Input
                type="tel"
                placeholder="Enter delivery phone"
                value={deliveryPhone}
                onChange={(e) => setDeliveryPhone(e.target.value)}
                className="text-sm md:text-base"
              />
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm md:text-base">
                <span>Subtotal:</span>
                <span>GH₵{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base">
                <span>Commission:</span>
                <span className="text-green-600">GH₵{totalCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base md:text-lg font-bold">
                <span>Total:</span>
                <span>GH₵{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckoutDialog(false)}
              disabled={checkingOut}
              className="text-sm md:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={
                checkingOut ||
                !deliveryAddress.trim() ||
                !deliveryPhone.trim() ||
                (effectivePaymentMethod === "wallet" && !isWalletBalanceSufficient) ||
                (effectivePaymentMethod === "manual" && !paymentReference)
              }
              className="text-sm md:text-base"
            >
              {checkingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showOrderConfirmation} onOpenChange={setShowOrderConfirmation}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl text-center flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Order Placed Successfully!
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base text-center">
              Your wholesale order has been successfully placed. Redirecting to Orders tab...
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm">
              You can track your order status and receive updates via SMS and WhatsApp.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
              <span className="text-sm">Moving to Orders...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
