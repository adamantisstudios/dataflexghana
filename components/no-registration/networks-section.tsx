"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateWhatsAppLink } from "@/utils/whatsapp";
import { PaystackPaymentModal, type PaymentCompletedData } from "@/components/paystack-payment-modal";
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator";
import { ChevronDown, Phone, CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";

const networks = {
  mtn: {
    name: "MTN",
    image: "/assets/mtn.jpg",
    description: "We offer the best MTN prices while maintaining healthy profit margins.",
    plans: [
      { size: "1GB", price: 6.0 },
      { size: "2GB", price: 12.5 },
      { size: "3GB", price: 19.5 },
      { size: "4GB", price: 27.5 },
      { size: "5GB", price: 30.5 },
      { size: "6GB", price: 33.5 },
      { size: "8GB", price: 42.5 },
      { size: "10GB", price: 47.5 },
      { size: "15GB", price: 72.5 },
      { size: "20GB", price: 89.5 },
      { size: "25GB", price: 109.5 },
      { size: "30GB", price: 131.0 },
      { size: "40GB", price: 170.0 },
      { size: "50GB", price: 218.0 },
      { size: "100GB", price: 404.0 },
    ],
  },
  telecel: {
    name: "Telecel",
    image: "/assets/telecel.jpg",
    description: "Competitive pricing for Telecel users with reliable connectivity.",
    plans: [
      { size: "5GB", price: 32.0 },
      { size: "10GB", price: 54.0 },
      { size: "15GB", price: 73.0 },
      { size: "20GB", price: 93.0 },
      { size: "25GB", price: 125.0 },
      { size: "30GB", price: 132.0 },
      { size: "40GB", price: 174.0 },
      { size: "50GB", price: 219.0 },
      { size: "100GB", price: 410.0 },
    ],
  },
  airteltigo: {
    name: "AirtelTigo",
    image: "/assets/airteltigo.jpg",
    description: "The absolute cheapest data in Ghana with bulk discounts that beat everyone.",
    plans: [
      { size: "1GB", price: 6.0 },
      { size: "2GB", price: 10.0 },
      { size: "3GB", price: 14.0 },
      { size: "4GB", price: 19.0 },
      { size: "5GB", price: 23.0 },
      { size: "6GB", price: 27.0 },
      { size: "7GB", price: 31.0 },
      { size: "8GB", price: 35.0 },
      { size: "9GB", price: 49.0 },
      { size: "10GB", price: 52.0 },
      { size: "12GB", price: 56.0 },
      { size: "15GB", price: 64.0 },
      { size: "20GB", price: 80.0 },
      { size: "25GB", price: 95.0 },
      { size: "30GB", price: 99.0 },
      { size: "40GB", price: 117.0 },
      { size: "50GB", price: 129.0 },
      { size: "60GB", price: 137.0 },
      { size: "80GB", price: 166.0 },
      { size: "100GB", price: 229.0 },
    ],
  },
};

export function NetworksSection() {
  const [activeNetwork, setActiveNetwork] = useState<keyof typeof networks>("mtn");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const logDataOrderSilently = async (params: {
    network: string;
    dataBundle: string;
    amount: number;
    phoneNumber: string;
    referenceCode: string;
    paymentMethod: "manual" | "paystack";
  }) => {
    try {
      const response = await fetch("/api/admin/data-orders/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          network: params.network,
          data_bundle: params.dataBundle,
          amount: params.amount,
          phone_number: params.phoneNumber,
          reference_code: params.referenceCode,
          payment_method: params.paymentMethod,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        console.error("[v0] Failed to log data bundle order (networks section):", {
          status: response.status,
          result,
        });
      } else {
        console.log("[v0] Data bundle order logged successfully (networks section):", result.data);
      }
    } catch (error) {
      console.error("[v0] Error logging data bundle order (networks section):", error);
    }
  };

  const handleSelectPlan = (plan: (typeof networks.mtn.plans)[0]) => {
    const planValue = `${plan.size} - ₵${plan.price.toFixed(2)}`;
    setSelectedPlan(planValue);

    setTimeout(() => {
      phoneInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      phoneInputRef.current?.focus();
    }, 100);
  };

  const handleOrder = () => {
    if (!selectedPlan || !phoneNumber) {
      toast.error("Please select a plan and enter a phone number");
      return;
    }

    const reference = generatePaymentReferenceCode();
    setPaymentReference(reference);
    setShowPaymentModal(true);
  };

  const getOrderSummary = () => {
    if (!selectedPlan) {
      return {
        service: "Data Bundle",
        amount: 0,
        total: 0,
      };
    }

    const [size, priceStr] = selectedPlan.split(" - ₵");
    const price = Number.parseFloat(priceStr);

    return {
      service: `${networks[activeNetwork].name} ${size} Data Bundle`,
      amount: price,
      total: price,
    };
  };

  const handlePaymentCompleted = (paymentData: PaymentCompletedData) => {
    const [size, priceStr] = selectedPlan.split(" - ₵");
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

    if (paymentData.paymentMethod === "paystack") {
      toast.success("Payment successful! Check your WhatsApp for order confirmation.");
      setSelectedPlan("");
      setPhoneNumber("");
      setPaymentReference("");
      setShowPaymentModal(false);
      return;
    }

    const networkName = networks[activeNetwork].name;
    const amount = Number.parseFloat(priceStr);

    // Log manual payment order silently to backend before opening WhatsApp
    (async () => {
      await logDataOrderSilently({
        network: networkName,
        dataBundle: `${networkName} ${size} Data Bundle`,
        amount: Number.isNaN(amount) ? paymentData.amount : amount,
        phoneNumber: phoneNumber.trim(),
        referenceCode: paymentReference,
        paymentMethod: "manual",
      });
    })();

    const message = `DATA BUNDLE ORDER

Network: ${networks[activeNetwork].name}
Plan: ${size}
Price: ₵${priceStr}
Phone Number: ${phoneNumber}

💳 PAYMENT REFERENCE: ${paymentReference}

✅ PAYMENT CONFIRMED
Customer has confirmed payment to:
Payment Name: Adamantis Solutions (Francis Ani-Johnson .K)
Payment Line: 0557943392

⏱️ ORDER PLACED AT: ${timeString}
🏢 CLOSING TIME: 9:30 PM

🔗 TERMS & CONDITIONS: https://dataflexghana.com/terms

⏱️ PROCESSING TIME: Data processing and delivery takes 10-30 minutes after payment confirmation.

Please process this order using the payment reference above.`;

    const whatsappUrl = generateWhatsAppLink(message);
    window.open(whatsappUrl, "_blank");

    setSelectedPlan("");
    setPhoneNumber("");
    setPaymentReference("");
    setShowPaymentModal(false);
  };

  return (
    <>
      <section id="networks" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Network Offerings
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Choose from Ghana's top 3 networks with our exclusive discounted rates
            </p>
          </div>

          {/* Processing time notice */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Processing & Delivery Time:</span> Data bundles are processed and
                delivered within <strong>10-30 minutes</strong> after payment confirmation.
              </p>
            </div>
          </div>

          {/* Network tabs - full width on all screens */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-2xl">
              {Object.entries(networks).map(([key, network]) => (
                <button
                  key={key}
                  onClick={() => setActiveNetwork(key as keyof typeof networks)}
                  className={`
                    py-3 px-2 rounded-xl font-medium text-sm transition-all duration-200
                    ${
                      activeNetwork === key
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-transparent text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                    }
                  `}
                >
                  {network.name}
                </button>
              ))}
            </div>
          </div>

          {/* Main card */}
          <Card className="max-w-6xl mx-auto border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Image side */}
                <div className="relative h-64 lg:h-auto min-h-[320px] bg-gray-100">
                  <Image
                    src={networks[activeNetwork].image || "/placeholder.svg"}
                    alt={networks[activeNetwork].name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Content side */}
                <div className="p-6 md:p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {networks[activeNetwork].name} Data Bundles
                  </h3>
                  <p className="text-gray-600 mb-6">{networks[activeNetwork].description}</p>

                  {/* Plan grid */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Select a plan
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {networks[activeNetwork].plans.map((plan, index) => {
                        const isSelected = selectedPlan.startsWith(plan.size);
                        return (
                          <button
                            key={index}
                            onClick={() => handleSelectPlan(plan)}
                            className={`
                              p-3 rounded-xl text-center transition-all duration-200
                              ${
                                isSelected
                                  ? "bg-green-600 text-white shadow-md scale-[1.02] ring-2 ring-green-200"
                                  : "bg-gray-50 text-gray-700 hover:bg-green-50 hover:scale-105"
                              }
                            `}
                          >
                            <div className="font-bold text-sm">{plan.size}</div>
                            <div className={`text-xs ${isSelected ? "text-green-100" : "text-green-600"}`}>
                              ₵{plan.price.toFixed(2)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order form */}
                  <div className="space-y-4">
                    {selectedPlan && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-gray-600">Selected plan</span>
                          <p className="font-semibold text-green-700">{selectedPlan}</p>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    )}

                    {!selectedPlan && (
                      <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                        <SelectTrigger className="border-gray-300 focus:ring-green-500">
                          <SelectValue placeholder="Or select a plan from dropdown" />
                        </SelectTrigger>
                        <SelectContent>
                          {networks[activeNetwork].plans.map((plan, index) => (
                            <SelectItem key={index} value={`${plan.size} - ₵${plan.price.toFixed(2)}`}>
                              {networks[activeNetwork].name} {plan.size} - ₵{plan.price.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1.5">
                        <Phone className="h-4 w-4 text-gray-400" />
                        Phone number
                      </label>
                      <Input
                        ref={phoneInputRef}
                        type="tel"
                        placeholder="e.g., 0541234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    <Button
                      onClick={handleOrder}
                      disabled={!selectedPlan || !phoneNumber}
                      size="lg"
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg disabled:opacity-50 py-6 rounded-xl"
                    >
                      Order Now & Proceed to Payment
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <PaystackPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentCompleted={handlePaymentCompleted}
        orderSummary={getOrderSummary()}
        paymentReference={paymentReference}
        customerPhone={phoneNumber}
        customerName=""
        orderMetadata={{
          network: networks[activeNetwork].name,
          dataBundle: getOrderSummary().service,
        }}
      />
    </>
  );
}