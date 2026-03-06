"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { supabase, type DataBundle } from "@/lib/supabase"
import { generatePaymentPIN } from "@/lib/pin-generator"
import { Wifi, CreditCard, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface OrderFormData {
  beneficiaryNumber: string
  network: string
  dataBundle: string
  quantity: number
  phoneNumber: string
  paymentMethod: "manual" | "paystack"
  payingPin?: string
}

const NETWORKS = [
  { value: "MTN", label: "MTN Ghana" },
  { value: "AirtelTigo", label: "AirtelTigo" },
  { value: "Telecel", label: "Telecel" },
]

export function DataBundleOrderForm() {
  const [bundles, setBundles] = useState<DataBundle[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState("")
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState<OrderFormData>({
    beneficiaryNumber: "",
    network: "",
    dataBundle: "",
    quantity: 1,
    phoneNumber: "",
    paymentMethod: "manual",
  })

  useEffect(() => {
    loadBundles()
  }, [])

  const loadBundles = async () => {
    try {
      const { data, error } = await supabase.from("data_bundles").select("*").order("provider").order("size_gb")
      if (error) throw error
      setBundles(data || [])
    } catch (error) {
      console.error("[v0] Error loading bundles:", error)
      toast.error("Failed to load data bundles")
    }
  }

  const networkBundles = selectedNetwork ? bundles.filter((b) => b.provider === selectedNetwork) : []

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network)
    setFormData({ ...formData, network, dataBundle: "" })
    setSelectedBundle(null)
  }

  const handleBundleSelect = (bundleId: string) => {
    const bundle = networkBundles.find((b) => b.id === bundleId)
    if (bundle) {
      setSelectedBundle(bundle)
      setFormData({
        ...formData,
        dataBundle: bundle.name,
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "quantity" ? Math.max(1, parseInt(value) || 1) : value,
    })
  }

  const handleSubmitOrder = async () => {
    // Validation - only required fields
    if (!selectedNetwork) {
      toast.error("Please select a network");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!selectedBundle) {
      toast.error("Please select a data bundle");
      return;
    }

    setSubmitting(true);
    try {
      // Generate reference code for this order
      const referenceCode = generatePaymentPIN();
      const totalAmount = selectedBundle.price * formData.quantity;

      console.log("[v0] Submitting data order with reference code:", referenceCode);
      console.log("[v0] Order data:", {
        network: selectedNetwork,
        data_bundle: selectedBundle.name,
        amount: totalAmount,
        phone_number: formData.phoneNumber,
        reference_code: referenceCode,
        payment_method: formData.paymentMethod,
      });

      // Log the order to database
      const response = await fetch("/api/admin/data-orders/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: selectedNetwork,
          data_bundle: selectedBundle.name,
          amount: totalAmount,
          phone_number: formData.phoneNumber,
          reference_code: referenceCode,
          payment_method: formData.paymentMethod,
        }),
      });

      const result = await response.json();
      console.log("[v0] API response:", result);

      if (!response.ok || !result.success) {
        console.error("[v0] Order logging failed:", result);
        throw new Error(result.message || "Failed to log order");
      }

      console.log("[v0] Order logged successfully to database:", result.data);
      toast.success("Order placed successfully! Admin will contact you shortly.");

      // Handle different payment methods AFTER logging
      if (formData.paymentMethod === "paystack") {
        console.log("[v0] Initializing Paystack payment for data bundle order");
        // Initialize Paystack payment
        try {
          const paystackResponse = await fetch("/api/paystack/initialize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: `user_${formData.phoneNumber}@dataflexghana.com`,
              amount: Math.round(totalAmount * 100),
              phone: formData.phoneNumber,
              reference: referenceCode,
              service: `Data Bundle: ${selectedBundle.name} (${selectedNetwork})`,
            }),
          });

          if (!paystackResponse.ok) {
            const errorData = await paystackResponse.json();
            console.error("[v0] Paystack initialization error:", errorData);
            throw new Error(errorData.error || "Failed to initialize Paystack payment");
          }

          const paystackData = await paystackResponse.json();
          if (paystackData.authorizationUrl) {
            window.location.href = paystackData.authorizationUrl;
          } else {
            throw new Error("No authorization URL received from Paystack");
          }
        } catch (paystackError) {
          console.error("[v0] Paystack payment error:", paystackError);
          toast.error("Failed to initialize Paystack. Please try again.");
          setSubmitting(false);
          return;
        }
      } else {
        // Manual payment - Open WhatsApp for payment confirmation with reference code
        const whatsappMessage = `I want to order ${formData.quantity}x ${selectedBundle.name} for ₵${totalAmount.toFixed(2)}. Reference Code: ${referenceCode}`;
        const whatsappUrl = `https://wa.me/233242799990?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappUrl, "_blank");
      }

      // Reset form
      setFormData({
        beneficiaryNumber: "",
        network: "",
        dataBundle: "",
        quantity: 1,
        phoneNumber: "",
        paymentMethod: "manual",
      });
      setSelectedNetwork("");
      setSelectedBundle(null);
      setShowPaymentModal(false);
    } catch (error) {
      console.error("[v0] Error submitting order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white">
          <div className="flex items-center gap-3">
            <Wifi className="h-6 w-6" />
            <div>
              <CardTitle className="text-white">Order Data Bundles</CardTitle>
              <CardDescription className="text-emerald-50">Quick and easy data bundle orders - No registration needed</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Network Selection */}
          <div className="space-y-3">
            <Label htmlFor="network" className="text-sm font-semibold">
              Select Network
            </Label>
            <Select value={selectedNetwork} onValueChange={handleNetworkChange}>
              <SelectTrigger id="network" className="border-emerald-200">
                <SelectValue placeholder="Choose a network provider..." />
              </SelectTrigger>
              <SelectContent>
                {NETWORKS.map((network) => (
                  <SelectItem key={network.value} value={network.value}>
                    {network.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bundle Selection */}
          {selectedNetwork && networkBundles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Select Data Bundle</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {networkBundles.map((bundle) => (
                  <button
                    key={bundle.id}
                    onClick={() => handleBundleSelect(bundle.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedBundle?.id === bundle.id
                        ? "border-emerald-600 bg-emerald-50 shadow-lg"
                        : "border-gray-200 hover:border-emerald-300 bg-white"
                    }`}
                  >
                    <div className="font-semibold text-emerald-800">{bundle.name}</div>
                    <div className="text-sm text-gray-600">{bundle.size_gb}GB</div>
                    <div className="text-lg font-bold text-emerald-600 mt-2">₵{bundle.price.toLocaleString()}</div>
                    {selectedBundle?.id === bundle.id && (
                      <CheckCircle className="h-5 w-5 text-emerald-600 mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedBundle && (
            <>
              {/* Quantity */}
              <div className="space-y-3">
                <Label htmlFor="quantity" className="text-sm font-semibold">
                  Quantity
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="border-emerald-200"
                />
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="phoneNumber" className="text-sm font-semibold">
                    Your Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    placeholder="Your contact number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="border-emerald-200"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="paymentMethod" className="text-sm font-semibold">
                    Payment Method
                  </Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as "manual" | "paystack" })}>
                    <SelectTrigger id="paymentMethod" className="border-emerald-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Payment</SelectItem>
                      <SelectItem value="paystack">Paystack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Order Summary */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Bundle Price:</span>
                    <span className="font-semibold">₵{selectedBundle.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Quantity:</span>
                    <span className="font-semibold">{formData.quantity}x</span>
                  </div>
                  <div className="border-t border-emerald-200 pt-2 flex justify-between text-lg">
                    <span className="font-bold text-emerald-800">Total Amount:</span>
                    <span className="font-bold text-emerald-600">₵{(selectedBundle.price * formData.quantity).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                onClick={() => setShowPaymentModal(true)}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-6 font-bold text-lg"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                {submitting ? "Processing Order..." : "Proceed to Payment"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Confirmation Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Bundle:</span>
                <span className="font-semibold">{selectedBundle?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Network:</span>
                <span className="font-semibold">{selectedNetwork}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quantity:</span>
                <span className="font-semibold">{formData.quantity}x</span>
              </div>
              <div className="border-t border-emerald-200 pt-2 flex justify-between text-base font-bold">
                <span>Total:</span>
                <span className="text-emerald-600">₵{(selectedBundle?.price || 0) * formData.quantity}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                You will be redirected to WhatsApp to confirm payment. Our admin team will process your order shortly.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? "Processing..." : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
