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
import {
  ShoppingCartIcon,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle,
  Info,
  Copy,
  Check,
  PhoneCall,
} from "lucide-react"
import type { WholesaleProduct } from "@/lib/wholesale"
import type { Agent } from "@/lib/supabase"
import OrderProcessHeroSlider from "./OrderProcessHeroSlider"
import { generatePaymentPIN } from "@/lib/pin-generator"

const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-9999px"
      textArea.style.top = "0"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)
      return successful
    }
  } catch (err) {
    console.error("Failed to copy:", err)
    return false
  }
}

interface CartItem {
  product: WholesaleProduct
  quantity: number
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
  const [generatedPaymentCode, setGeneratedPaymentCode] = useState("")
  const [copied, setCopied] = useState(false)
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

  const removeItem = (productId: string) => {
    if (!cartItems) return
    const updatedItems = cartItems.filter((item) => item.product.id !== productId)
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
      const finalReference = effectivePaymentMethod === "manual" ? generatedPaymentCode : undefined
      console.log("[v0] Final payment reference being sent:", finalReference)

      await onCheckout({
        items: cartItems,
        paymentMethod: effectivePaymentMethod,
        paymentReference: finalReference,
        deliveryAddress,
        deliveryPhone,
        totalAmount,
        totalCommission,
      })
      setShowCheckoutDialog(false)
      setPaymentReference("")
      setGeneratedPaymentCode("")
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

  const handleCopyCode = async () => {
    if (generatedPaymentCode) {
      const success = await copyToClipboard(generatedPaymentCode)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
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
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex flex-col sm:flex-row gap-3 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm md:text-base text-emerald-800 truncate">{item.product.name}</h4>
                    <p className="text-xs md:text-sm text-emerald-600">
                      GH₵{item.product.price.toFixed(2)} × {item.quantity}
                    </p>
                    <p className="text-xs md:text-sm text-emerald-500">
                      Commission: GH₵{((item.product.commission_value || 0) * item.quantity).toFixed(2)}
                    </p>
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
                      onClick={() => removeItem(item.product.id)}
                      className="h-7 w-7 md:h-8 md:w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </div>
                </div>
              ))}

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

      <Dialog
        open={showCheckoutDialog}
        onOpenChange={(open) => {
          setShowCheckoutDialog(open)
          if (open) {
            const newCode = generatePaymentPIN()
            console.log("[v0] Generated payment code for order:", newCode)
            setGeneratedPaymentCode(newCode)
          } else {
            setGeneratedPaymentCode("")
          }
        }}
      >
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

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
              <PhoneCall className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-800">Delivery Information</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  A service person will call you shortly after your order is placed to discuss delivery fees or pick-up
                  arrangements with you for the items being purchased.
                </p>
              </div>
            </div>

            {effectivePaymentMethod === "manual" && (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-2 w-full">
                      <p className="text-sm font-medium text-emerald-800">Manual Payment Instructions</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">
                        Please make payment of{" "}
                        <span className="font-bold text-emerald-900">GH₵{totalAmount.toFixed(2)}</span> to our payment
                        line.{" "}
                        <span className="font-semibold text-emerald-800">
                          Use the 4-digit payment code below as your reference
                        </span>{" "}
                        to ensure your order is processed for you.
                      </p>
                      <div className="flex items-center justify-between bg-white border border-emerald-200 p-3 rounded-md mt-2 shadow-sm">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-emerald-500 uppercase tracking-tighter">
                            Your Payment Code
                          </span>
                          <span className="text-2xl font-mono font-bold tracking-[0.2em] text-emerald-800">
                            {generatedPaymentCode || "----"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyCode}
                          className="h-10 w-10 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        >
                          {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                        </Button>
                      </div>
                      <p className="text-[10px] text-emerald-500 italic text-center mt-1">
                        Copy and paste this code in your mobile money reference field.
                      </p>
                    </div>
                  </div>
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
                (effectivePaymentMethod === "wallet" && !isWalletBalanceSufficient)
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
