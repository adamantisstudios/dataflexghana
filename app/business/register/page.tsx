"use client";

import React, { useState, ChangeEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Users, CheckCircle, ArrowRight, Play, CreditCard } from "lucide-react";
import Link from "next/link";
import { PaystackPaymentModal } from "@/components/paystack-payment-modal";

export default function BusinessRegisterPage(): JSX.Element {
  const [formData, setFormData] = useState({
    businessName: "",
    location: "",
    services: "",
    email: "",
    contactNumbers: "",
    website: "",
    socialMedia: "",
    servicePackage: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"manual" | "paystack" | null>(null);
  const [paymentReference, setPaymentReference] = useState("");

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePackageChange = (value: string) => {
    setFormData((prev) => ({ ...prev, servicePackage: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.servicePackage) {
        alert("Please select a service package");
        setIsSubmitting(false);
        return;
      }
      const pinCode = String(Math.floor(1000 + Math.random() * 9000));
      setPaymentReference(pinCode);
      setShowPaymentOptions(true);
    } catch (error) {
      console.error("Registration error:", error);
      alert("There was an error processing your registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualPaymentSelected = () => {
    setSelectedPaymentMethod("manual");
    setShowPaymentOptions(false);
    setShowPaymentModal(true);
  };

  const handlePaystackPaymentSelected = () => {
    setSelectedPaymentMethod("paystack");
    setShowPaymentModal(true);
  };

  const handlePaymentCompleted = (paymentData: any) => {
    const pkg = servicePackages.find((p) => p.id === formData.servicePackage);
    const packageName = pkg?.price || formData.servicePackage;

    const message = `🏢 NEW BUSINESS REGISTRATION - PAYMENT RECEIVED

📋 BUSINESS INFORMATION:
• Business Name: ${formData.businessName}
• Location: ${formData.location}
• Services/Products: ${formData.services}

📞 CONTACT INFORMATION:
• Email: ${formData.email}
• Phone Numbers: ${formData.contactNumbers}
• Website: ${formData.website || "Not provided"}
• Social Media: ${formData.socialMedia || "Not provided"}

💰 SERVICE PACKAGE & PAYMENT:
• Package: ${packageName}/month
• Payment Method: ${paymentData.paymentMethod === "paystack" ? "Paystack Online" : "Manual Payment"}
• Payment Reference: ${paymentData.reference}
• Amount Paid: ₵${paymentData.amount}

⏰ Registration Time: ${new Date().toLocaleString()}

Please confirm receipt and activate this business registration immediately. Contact them to complete setup.`;

    const whatsappNumber = "233242799990";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    setShowPaymentModal(false);
    setShowPaymentOptions(false);
    window.open(whatsappUrl, "_blank");
    setTimeout(() => {
      window.location.href = "/business/success";
    }, 1000);
  };

  const servicePackages = [
    {
      id: "1000-monthly",
      price: "₵1,000",
      duration: "month",
      products: "Up to 5 products or services",
      description: "Ideal for small businesses starting out",
      popular: false,
    },
    {
      id: "2000-monthly",
      price: "₵2,000",
      duration: "month",
      products: "Up to 10 products or services",
      description: "Perfect for growing businesses with more offerings",
      popular: true,
    },
    {
      id: "3000-monthly",
      price: "₵3,000",
      duration: "month",
      products: "Up to 15 products or services",
      description: "Full access for established enterprises",
      popular: false,
    },
  ];

  const getPackageAmount = () => {
    const pkg = servicePackages.find((p) => p.id === formData.servicePackage);
    if (!pkg) return 0;
    const priceStr = pkg.price.replace("₵", "").replace(",", "");
    return parseFloat(priceStr);
  };

  return (
    <div className="bg-white text-gray-800">
      {/* Simple header - no gradients */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-700" />
            <span className="font-semibold text-gray-900">DataFlex Business</span>
          </Link>
          <Link href="/" className="text-gray-500 text-sm hover:text-gray-800">
            ← Back
          </Link>
        </div>
      </header>

      {/* Hero image - only image + simple overlay, no extra text below */}
      <div className="relative h-80 md:h-96 w-full overflow-hidden">
        <Image
          src="/company_image.jpg"
          alt="DataFlex business team"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-white">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
              Get your business on our network
            </h1>
            <p className="text-lg md:text-xl text-gray-100 max-w-2xl">
              We connect you with verified agents across Ghana. No upfront costs if you don't want them.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        {/* Intro - short and human */}
        <p className="text-gray-700 text-lg mb-12 text-center">
          You've built something good. Now let's get it in front of customers who actually buy.
          We've been doing this for years – agents in every region, real people promoting real products.
          Tell us about your business and we'll figure out the best way to work together.
        </p>

        {/* Partnership options – rewritten to sound like real advice */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Two ways to work with us
          </h2>
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Monthly subscription</h3>
              <p className="text-gray-600 text-sm mb-3">
                You pay a fixed fee every month. You keep full control over your products, prices, and inventory.
                We handle agent coordination.
              </p>
              <ul className="space-y-1 text-sm text-gray-700 mb-3">
                <li>• Predictable monthly cost</li>
                <li>• You decide what to sell and at what price</li>
                <li>• We manage the agent network</li>
                <li>• Sales reports every week</li>
              </ul>
              <p className="text-xs text-gray-500">Best for: Businesses with existing stock and clear margins.</p>
            </div>

            <div className="border-2 border-blue-300 rounded-lg p-6 bg-white relative">
              <span className="absolute -top-3 left-6 bg-blue-700 text-white text-xs px-3 py-0.5 rounded-full">
                Most popular
              </span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Wholesale partnership</h3>
              <p className="text-gray-600 text-sm mb-3">
                You pay nothing upfront. Our agents buy from you at wholesale prices and sell for a profit.
                You only make money when they sell – and so do we.
              </p>
              <ul className="space-y-1 text-sm text-gray-700 mb-3">
                <li>• Zero monthly fees</li>
                <li>• Agents are motivated – they only earn when they sell your products</li>
                <li>• Instant access to our nationwide network</li>
                <li>• You set wholesale prices, we handle the rest</li>
              </ul>
              <p className="text-xs text-gray-500">Best for: Growing businesses, limited marketing budget, or testing new markets.</p>
            </div>
          </div>
          <div className="mt-6 text-sm bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r">
            <span className="font-semibold">Honest advice:</span> Most of our partners start with wholesale to test demand, then add a subscription once sales are steady.
            We can also mix both – just ask.
          </div>
        </section>

        {/* Quick facts – no icons with circles, just clean */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16 text-center">
          <div>
            <Users className="h-7 w-7 text-blue-700 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Nationwide agents</h3>
            <p className="text-sm text-gray-500">Active in all 16 regions of Ghana</p>
          </div>
          <div>
            <CheckCircle className="h-7 w-7 text-blue-700 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Verified network</h3>
            <p className="text-sm text-gray-500">Every agent goes through ID and reference checks</p>
          </div>
          <div>
            <ArrowRight className="h-7 w-7 text-blue-700 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Fast setup</h3>
            <p className="text-sm text-gray-500">Most businesses are live within 48 hours</p>
          </div>
        </div>

        {/* Vimeo video – kept but less decorative */}
        <div className="mb-16 max-w-md mx-auto border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <Play className="h-4 w-4 text-blue-700" />
              <span>Watch: How we work with businesses</span>
            </div>
          </div>
          <div className="aspect-[9/16] w-full">
            <iframe
              src="https://player.vimeo.com/video/1191041607?badge=0&autopause=0&player_id=0&app_id=58479"
              className="w-full h-full"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              title="DataFlex Ghana partner explainer"
            />
          </div>
          <p className="text-xs text-gray-500 text-center py-2">Portrait mode – quick overview</p>
        </div>

        {/* Registration form - clean, no gradients */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Business info */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Your business details</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="businessName" className="text-sm font-medium">Business name *</Label>
                  <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleInputChange} placeholder="e.g., Tema Spices Ltd" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="location" className="text-sm font-medium">Location (city/region) *</Label>
                  <Input id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g., Kumasi, Ashanti" required className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="services" className="text-sm font-medium">What do you sell? *</Label>
                <Textarea id="services" name="services" value={formData.services} onChange={handleInputChange} rows={3} placeholder="Brief description of your products or services" required className="mt-1" />
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">How to reach you</h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">Business email *</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="hello@yourbusiness.com" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="contactNumbers" className="text-sm font-medium">Phone number(s) *</Label>
                  <Input id="contactNumbers" name="contactNumbers" value={formData.contactNumbers} onChange={handleInputChange} placeholder="024XXXXXX, 030XXXXXX" required className="mt-1" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="website" className="text-sm font-medium">Website (optional)</Label>
                  <Input id="website" name="website" type="url" value={formData.website} onChange={handleInputChange} placeholder="https://" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="socialMedia" className="text-sm font-medium">Social media handles</Label>
                  <Input id="socialMedia" name="socialMedia" value={formData.socialMedia} onChange={handleInputChange} placeholder="@instagram, facebook.com/..." className="mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Package selection - clean radio cards */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Choose a monthly package</h3>
              <p className="text-xs text-gray-500 mt-0.5">Only needed if you pick the subscription model. If you prefer wholesale, you can still select one – we'll adjust later.</p>
            </div>
            <div className="p-6 space-y-4">
              {servicePackages.map((pkg) => (
                <label
                  key={pkg.id}
                  className={`block border rounded-lg p-4 cursor-pointer transition ${
                    formData.servicePackage === pkg.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="servicePackage"
                    value={pkg.id}
                    checked={formData.servicePackage === pkg.id}
                    onChange={(e) => handlePackageChange(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <div>
                      <p className="font-bold text-gray-900">{pkg.price}<span className="font-normal text-gray-500 text-sm">/{pkg.duration}</span></p>
                      <p className="text-sm text-gray-700">{pkg.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{pkg.products}</p>
                    </div>
                    {pkg.popular && <Badge variant="outline" className="text-blue-700 border-blue-300">Popular</Badge>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div className="text-center pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.servicePackage}
              className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-2.5 text-base rounded-md shadow-sm"
            >
              {isSubmitting ? "Processing..." : "Continue to payment →"}
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              By continuing you agree to our <Link href="/business/terms" className="text-blue-600 underline">terms</Link>.
              We'll send a payment summary to your email.
            </p>
          </div>
        </form>
      </main>

      {/* Payment Options Modal - same logic, visually simplified */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">How would you like to pay?</h3>
              <p className="text-sm text-gray-500 mt-1">Choose an option below</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <div className="flex justify-between">
                  <span>Package:</span>
                  <span className="font-medium">{servicePackages.find(p => p.id === formData.servicePackage)?.price || "N/A"}/month</span>
                </div>
                <div className="flex justify-between font-semibold mt-1 pt-1 border-t">
                  <span>Total:</span>
                  <span>₵{getPackageAmount()}</span>
                </div>
              </div>

              <button
                onClick={handlePaystackPaymentSelected}
                className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-3"
              >
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Paystack (card, mobile money)</p>
                  <p className="text-xs text-gray-500">Instant online payment – secure</p>
                </div>
              </button>

              <button
                onClick={handleManualPaymentSelected}
                className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-3"
              >
                <span className="text-xl">💰</span>
                <div>
                  <p className="font-medium">Manual bank transfer</p>
                  <p className="text-xs text-gray-500">We'll provide account details after confirmation</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowPaymentOptions(false);
                  const msg = `Hello, I'm interested in registering ${formData.businessName}. Can we discuss custom payment or wholesale terms?`;
                  window.open(`https://wa.me/233242799990?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                className="w-full text-left p-3 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-3"
              >
                <span className="text-xl">💬</span>
                <div>
                  <p className="font-medium">Contact us directly</p>
                  <p className="text-xs text-gray-500">WhatsApp – discuss wholesale or custom terms</p>
                </div>
              </button>
            </div>
            <div className="p-4 border-t border-gray-100 text-right">
              <button onClick={() => setShowPaymentOptions(false)} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Paystack modal (unchanged) */}
      <PaystackPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setShowPaymentOptions(true);
          setSelectedPaymentMethod(null);
        }}
        onPaymentCompleted={handlePaymentCompleted}
        orderSummary={{
          service: `${servicePackages.find(p => p.id === formData.servicePackage)?.price || "N/A"}/month Business Package`,
          amount: getPackageAmount(),
          total: getPackageAmount(),
        }}
        paymentReference={paymentReference}
        customerPhone={formData.contactNumbers.split(",")[0]?.trim() || ""}
        customerName={formData.businessName}
        forcePaymentMethod={selectedPaymentMethod || undefined}
      />
    </div>
  );
}