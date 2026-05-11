"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateWhatsAppLink } from "@/utils/whatsapp";
import { Users, UserCheck, Copy, CheckCircle } from "lucide-react";
import { PaymentConfirmationModal } from "@/components/payment-confirmation-modal";
import { toast } from "sonner";
import { generatePaymentReferenceCode } from "@/lib/reference-code-generator";

export function AFARegistrationForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    location: "",
    dateOfBirth: "",
    ghanaCardId: "",
    referringAgent: "",
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const registrationFee = 15;

  const generateNewReference = () => {
    const reference = generatePaymentReferenceCode();
    setPaymentReference(reference);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reference = paymentReference || generatePaymentReferenceCode();
    if (!paymentReference) {
      setPaymentReference(reference);
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

    const message = `AFA Registration Request:

Registration Type: AFA Registration
Registration Fee: ₵${registrationFee}

Personal Information:
Full Name: ${formData.fullName}
Phone Number: ${formData.phone}
Email: ${formData.email}
Ghana Card ID: ${formData.ghanaCardId}
Location: ${formData.location}
Date of Birth: ${formData.dateOfBirth}
Referring Agent: ${formData.referringAgent || "None"}

💳 PAYMENT REFERENCE: ${reference}
Bank Transfer/MoMo Account: 0557943392
Business Name: Adamantis Solutions (Francis Ani-Johnson .K)

⏱️ ORDER PLACED AT: ${timeString}
🏢 CLOSING TIME: 9:30 PM

🔗 TERMS & CONDITIONS: https://dataflexghana.com/terms

Instructions:
1. Use the payment reference above when making payment
2. Send payment to: 0557943392
3. Share this message via WhatsApp after confirming payment`;

    setPendingMessage(message);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirmed = async () => {
    // Log the AFA registration order
    try {
      await fetch("/api/admin/data-orders/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "afa_registration",
          full_name: formData.fullName,
          phone_number: formData.phone,
          email: formData.email,
          ghana_card: formData.ghanaCardId,
          location: formData.location,
          date_of_birth: formData.dateOfBirth,
          referring_agent: formData.referringAgent || null,
          amount: 30,
          payment_reference: paymentReference,
        }),
      });
    } catch (error) {
      console.error("[v0] Failed to log data order:", error);
    }

    const whatsappUrl = generateWhatsAppLink(pendingMessage);
    window.open(whatsappUrl, "_blank");
    setShowPaymentModal(false);

    // Reset form
    setFormData({
      fullName: "",
      phone: "",
      email: "",
      location: "",
      dateOfBirth: "",
      ghanaCardId: "",
      referringAgent: "",
    });
    setPaymentReference("");
  };

  const copyReference = () => {
    if (paymentReference) {
      navigator.clipboard.writeText(paymentReference);
      toast.success("Payment reference copied!");
    }
  };

  const afaBenefits = [
    "Free or heavily discounted calls to other AFA members",
    "Discounted call rates to non-AFA MTN numbers",
    "Included call minutes to other networks",
    "Better value for airtime through bundled talk time",
    "Flexible weekly or monthly bundle options",
    "Affordable communication within groups or communities",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Main registration card – clean, no floating badge */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="text-center pb-4 border-b border-gray-100">
          <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
            <Users className="h-7 w-7 text-green-700" />
          </div>
          <CardTitle className="text-2xl font-semibold text-gray-800">AFA registration</CardTitle>
          <CardDescription className="text-gray-500">
            Fill in your details to get started with the AFA bundle
          </CardDescription>
          <div className="mt-3">
            <span className="text-3xl font-bold text-green-700">₵30</span>
            <span className="text-gray-500 text-sm ml-1">one‑time fee</span>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Benefits – simpler list, no badges or colorful icons */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3">What you get:</h3>
            <ul className="space-y-2">
              {afaBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="e.g., John Mensah"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="024XXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ghanaCardId" className="text-sm font-medium">
                Ghana Card ID *
              </Label>
              <Input
                id="ghanaCardId"
                type="text"
                placeholder="e.g., GHA-123456789-1"
                value={formData.ghanaCardId}
                onChange={(e) => setFormData({ ...formData, ghanaCardId: e.target.value })}
                required
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm font-medium">
                  Location / Region
                </Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Kumasi, Ashanti"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob" className="text-sm font-medium">
                  Date of birth
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="referringAgent" className="text-sm font-medium">
                Referring agent contact (optional)
              </Label>
              <Input
                id="referringAgent"
                type="text"
                placeholder="Agent's phone number or name"
                value={formData.referringAgent}
                onChange={(e) => setFormData({ ...formData, referringAgent: e.target.value })}
                className="h-10"
              />
            </div>

            {/* Payment reference section – less boxy */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Payment reference code</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateNewReference}
                  className="text-xs text-green-700 hover:text-green-800"
                >
                  Generate new
                </Button>
              </div>
              {paymentReference ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white p-2 rounded border border-gray-300">
                    <p className="font-mono font-semibold text-green-800 text-base">{paymentReference}</p>
                    <p className="text-xs text-gray-500">Use this code when you pay</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyReference}
                    className="border-gray-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateNewReference}
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                >
                  Generate payment reference
                </Button>
              )}
            </div>

            <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white py-2">
              Submit registration
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Agent redirect card – simpler and less distracting */}
      <Card className="border border-blue-200 bg-blue-50/50">
        <CardContent className="p-5 text-center">
          <h3 className="text-lg font-semibold text-blue-800 mb-1">Want to become an agent?</h3>
          <p className="text-blue-700 text-sm mb-4">
            Earn commissions on referrals and get access to exclusive reseller benefits.
          </p>
          <Button
            asChild
            variant="outline"
            className="border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white"
          >
            <a href="/register">Agent registration →</a>
          </Button>
        </CardContent>
      </Card>

      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirmPayment={handlePaymentConfirmed}
        orderSummary={{
          service: "AFA Registration",
          amount: registrationFee,
          total: registrationFee,
        }}
      />
    </div>
  );
}