"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase-client";
  import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader,
  Shield,
  Zap,
  Clock,
  Lock,
  X,
  TrendingUp,
  Play,
  Package,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const REGISTRATION_FEE = 50;
const REGISTRATION_FEE_MANUAL = 47;
const WALLET_TOPUP = 5;

const featuredTestimonies = [
  {
    id: 1,
    videoUrl: "/testimonials/agent0.mp4",
    thumbnail: "/testimonials/alhassan_issah.png",
    agentName: "Alhassan Issah",
    title: "Multiple income streams - Data + Registration + Wholesale",
  },
  {
    id: 2,
    videoUrl: "/testimonials/agent2.mp4",
    thumbnail: "/testimonials/successful-female-agent-smiling.png",
    agentName: "Atta Alhassan Imoro",
    title: "Making daily cashouts - See how she does it",
  },
];

interface PaystackResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

function buildRegisterRedirectUrl(reference: string, name?: string, email?: string): string {
  const params = new URLSearchParams({
    payment: "success",
    reference,
  });
  if (name?.trim()) params.set("name", name.trim());
  if (email?.trim()) params.set("email", email.trim());
  return `/agent/register?${params.toString()}`;
}

function RegistrationPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [agentName, setAgentName] = useState("New Agent");
  const [agentEmail, setAgentEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualProcessing, setManualProcessing] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<(typeof featuredTestimonies)[0] | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"manual" | "paystack" | null>(null);
  const paymentRedirectHandled = useRef(false);
  const registerRedirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateCode = () => Math.floor(10000 + Math.random() * 90000).toString();
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const name = searchParams.get("name");
    const mailParam = searchParams.get("email");
    if (name) setAgentName(decodeURIComponent(name));
    if (mailParam) setAgentEmail(decodeURIComponent(mailParam));
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (registerRedirectTimerRef.current != null) {
        clearTimeout(registerRedirectTimerRef.current);
        registerRedirectTimerRef.current = null;
      }
    };
  }, []);


  const openVideoModal = (video: (typeof featuredTestimonies)[0]) => {
    setCurrentVideo(video);
    setShowVideo(true);
  };

  const closeVideoModal = () => {
    setShowVideo(false);
    setCurrentVideo(null);
  };

  const handleManualStart = () => {
    setManualCode(generateCode());
    setShowManualDialog(true);
  };

  const handleManualComplete = async () => {
    if (!manualCode) return;
    setManualProcessing(true);
    try {
      const timestamp = new Date().toLocaleString();
      const message = `✅ *NEW AGENT REGISTRATION - MANUAL PAYMENT RECEIVED*

Hello Admin,

A new agent has completed manual payment and is ready to be registered on the platform.

📋 *PAYMENT INFORMATION:*
• Amount Received: ₵${REGISTRATION_FEE_MANUAL}
• Reference Code: ${manualCode}
• Payment Method: Manual (Mobile Money)
• Transaction Date: ${timestamp}

✅ *REQUIRED ACTION:*
1. Register this new agent in the admin dashboard
2. Credit their account with ₵${WALLET_TOPUP} wallet credit for platform testing
3. Mark their account as APPROVED and ACTIVE

📱 *WHAT THE AGENT WILL DO NEXT:*
The agent will immediately complete their full registration form with:
- Full Name
- Phone Number
- Region/Location
- Password

⏱️ *PRIORITY:* Please process this registration within the next 30 minutes so the agent can access their dashboard.

Reference Code: *${manualCode}*

Thank you!`;

      window.open(`https://wa.me/233246827049?text=${encodeURIComponent(message)}`, "_blank");
      setShowManualDialog(false);
      toast.success("✅ WhatsApp opened! Admin will register your account. Check back soon to login.");

      localStorage.setItem("payment_reference", manualCode);
      localStorage.setItem("payment_method", "manual");

      setTimeout(() => router.push(`/agent/login`), 2000);
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setManualProcessing(false);
    }
  };

  const handlePaystack = async () => {
    if (!agentEmail.trim() || !validateEmail(agentEmail)) {
      setEmailError("Valid email required for Paystack payment");
      return;
    }
    setIsProcessing(true);
    setError("");
    setEmailError("");
    try {
      const res = await fetch("/api/paystack/register/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName,
          amount: REGISTRATION_FEE * 100,
          email: agentEmail,
        }),
      });
      if (!res.ok) throw new Error("Payment initialization failed");
      const data: PaystackResponse = await res.json();
      localStorage.setItem("paystack_email", agentEmail);
      localStorage.setItem("paystack_name", agentName);
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment error");
      setIsProcessing(false);
    }
  };

  const verifyPaystackPayment = async (reference: string) => {
    try {
      const res = await fetch("/api/paystack/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) toast.success("Payment verified!")
      }
    } catch (err) {
      console.warn("Paystack verification error (user already redirected):", err)
    }
  }

  const completePaymentRedirect = useCallback(
    (reference: string) => {
      if (typeof window !== "undefined" && window.location.pathname === "/agent/register") {
        return;
      }

      const nameFromUrl = searchParams.get("name");
      const emailFromUrl = searchParams.get("email");
      const resolvedName = nameFromUrl
        ? decodeURIComponent(nameFromUrl)
        : agentName;
      const resolvedEmail = emailFromUrl
        ? decodeURIComponent(emailFromUrl)
        : agentEmail;

      localStorage.setItem("payment_verified", "true");
      localStorage.setItem("payment_reference", reference);
      localStorage.setItem("paystack_email", resolvedEmail);
      localStorage.setItem("paystack_name", resolvedName);
      localStorage.setItem("payment_method", "paystack");

      setVerifyingPayment(true);
      const target = buildRegisterRedirectUrl(reference, resolvedName, resolvedEmail);
      if (registerRedirectTimerRef.current != null) {
        clearTimeout(registerRedirectTimerRef.current);
      }
      registerRedirectTimerRef.current = setTimeout(() => {
        registerRedirectTimerRef.current = null;
        window.location.replace(target);
      }, 2000);
    },
    [searchParams, agentName, agentEmail],
  );

  useEffect(() => {
    const reference =
      searchParams.get("reference") ||
      searchParams.get("trxref") ||
      searchParams.get("ref");

    if (!reference || paymentRedirectHandled.current) return;
    if (typeof window !== "undefined" && window.location.pathname === "/agent/register") {
      return;
    }

    paymentRedirectHandled.current = true;
    completePaymentRedirect(reference);
    void verifyPaystackPayment(reference);
  }, [searchParams, completePaymentRedirect]);

  const handleContinue = () => {
    if (!selectedMethod) return;
    if (selectedMethod === "manual") handleManualStart();
    else handlePaystack();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {verifyingPayment ? (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Verifying payment…</h3>
              <p className="text-sm text-slate-600 mt-2">This will only take a moment.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Hero section with square image */}
          <section className="bg-white border-b border-slate-100">
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
              <div className="w-full md:w-1/2 flex-shrink-0">
                <div className="aspect-square rounded-xl overflow-hidden shadow-lg border border-slate-200">
                  <img
                    src="/images/hero-main.jpg"
                    alt="DataFlex Agent Registration"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-full md:w-1/2 text-center md:text-left">
                <div className="inline-flex h-14 w-14 bg-emerald-600 rounded-xl items-center justify-center mb-4 shadow-md">
                  <CreditCard className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Complete Payment to Register</h1>
                <p className="text-slate-600 mt-3 max-w-md">
                  Pay now to unlock your agent registration. After payment, you&apos;ll complete your registration form
                  and access your dashboard. Both options include{" "}
                  <span className="font-semibold text-emerald-600">₵{WALLET_TOPUP} free wallet credit</span>.
                </p>
              </div>
            </div>
          </section>

          {/* Main content */}
          <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
            {/* Payment card */}
            <Card className="border-0 shadow-xl">
              <CardContent className="p-5 md:p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Manual */}
                  <div
                    onClick={() => setSelectedMethod("manual")}
                    className={`relative border-2 rounded-xl p-5 transition-all cursor-pointer ${
                      selectedMethod === "manual"
                        ? "border-emerald-500 bg-emerald-50 shadow-md"
                        : "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300"
                    }`}
                  >
                    <div className="absolute -top-3 left-4">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
                        ✅ RECOMMENDED
                      </span>
                    </div>
                    <div className="flex justify-between items-start mt-2">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Manual payment</h3>
                        <p className="text-sm text-slate-600">Mobile Money transfer</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-700">₵{REGISTRATION_FEE_MANUAL}</p>
                        <p className="text-xs text-slate-400 line-through">₵{REGISTRATION_FEE}</p>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-600" /> Instant activation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" /> Contact admin directly
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" /> No waiting
                      </li>
                    </ul>
                    {selectedMethod === "manual" && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                    )}
                  </div>

                  {/* Paystack */}
                  <div
                    onClick={() => setSelectedMethod("paystack")}
                    className={`border rounded-xl p-5 transition-all cursor-pointer ${
                      selectedMethod === "paystack"
                        ? "border-emerald-500 bg-emerald-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">Paystack</h3>
                        <p className="text-sm text-slate-600">Card, mobile money, bank</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">₵{REGISTRATION_FEE}</p>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm text-slate-700">
                      <li className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" /> 10‑15 min validation
                      </li>
                      <li className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-amber-600" /> Automated process
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" /> Delayed approval
                      </li>
                    </ul>
                    {selectedMethod === "paystack" && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                    )}
                  </div>
                </div>

                {selectedMethod === "paystack" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={agentEmail}
                      onChange={(e) => {
                        setAgentEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder="you@example.com"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {emailError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {emailError}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 text-red-800 text-sm p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleContinue}
                  disabled={
                    !selectedMethod ||
                    isProcessing ||
                    manualProcessing ||
                    (selectedMethod === "paystack" && (!agentEmail || !validateEmail(agentEmail)))
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 text-base"
                >
                  {isProcessing || manualProcessing ? (
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-5 w-5 mr-2" />
                  )}
                  {selectedMethod === "manual"
                    ? "Continue with Manual Payment"
                    : selectedMethod === "paystack"
                    ? "Continue with Paystack"
                    : "Select a payment method"}
                </Button>

                <p className="text-center text-sm text-emerald-700 font-medium">
                  💚 Save ₵14 – choose manual for instant access
                </p>

                <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" /> SSL encrypted
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full" />
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Verified merchant
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 🔥 Agent Data Pricing & Platform Benefits – only 1GB plan, elegant */}
            <Card className="border border-slate-100 shadow-lg bg-white overflow-hidden">
              <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-6 py-6">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,#10b981,transparent)]" />
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                  Agent Data Pricing
                </h2>
                <p className="mt-1 text-emerald-400 text-sm font-medium">Exclusive rates for registered agents.</p>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-1">
                  {/* 1GB pricing card */}
                  <div className="px-6 py-8 flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <Package className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">MTN 1GB</h3>
                        <p className="text-sm text-slate-500">Instant, reliable delivery</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <span className="text-xs text-slate-400 line-through block">₵6.50</span>
                        <span className="text-3xl font-extrabold text-emerald-600">₵3.70</span>
                      </div>
                      <div className="hidden sm:block w-px h-8 bg-slate-200" />
                      <div className="flex flex-col items-start text-sm">
                        <span className="font-medium text-slate-700">Agent only</span>
                        <span className="text-xs text-slate-400">Full price list inside dashboard</span>
                      </div>
                    </div>
                  </div>

                  {/* Key stats row */}
                  <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold">200+</span>
                      <span>Companies on the platform</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold">₵800</span>
                      <span>Daily income achievable</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Don&apos;t limit yourself to data alone.
                    </p>
                    <p className="text-sm text-amber-800 mt-1">
                      Agents earn <span className="font-bold">GHS 200 – 800 daily</span> by promoting services to
                      businesses, schools, churches, and people around them.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                      <ShoppingBag className="h-5 w-5 text-emerald-600" />
                      Promote & Earn From
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {[
                        "Cheap Data Bundles",
                        "Business Registration",
                        "Wholesale & Dropshipping",
                        "Job Recruitment",
                        "School Forms & Admission",
                        "GES Approved Books",
                        "ECG & Digital Payments",
                        "Gift Cards & Vouchers",
                        "Apple Device Repairs",
                        "Domestic Worker Recruitment",
                        "Fashion & Beauty Services",
                        "Candidate Search Portal",
                        "Salon & Beauty Bookings",
                        "Product Promotion & Commissions",
                        "Free Marketing Training",
                      ].map((service) => (
                        <div key={service} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button asChild variant="outline" className="border-emerald-600 text-emerald-700 font-semibold flex-1">
                      <Link href="https://dataflexghana.com/no-registration">
                        Order Without Registration
                      </Link>
                    </Button>
					</div>
                </div>
              </CardContent>
            </Card>

            {/* Vimeo video */}
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-emerald-600" />
                  Platform Overview
                </CardTitle>
                <CardDescription>Watch how DataFlex works</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex justify-center bg-black/5 py-6 px-4">
                  <div className="relative w-full max-w-[360px] md:max-w-[400px] rounded-xl overflow-hidden shadow-lg">
                    <div className="aspect-[9/16]">
                      <iframe
                        src="https://player.vimeo.com/video/1191024760?badge=0&autopause=0&player_id=0&app_id=58479"
                        className="absolute top-0 left-0 w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        title="DataFlex agent intro"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-2 text-sm text-slate-600 border-t border-slate-100 bg-slate-50/30">
                  <p className="flex items-center gap-2">
                    <span className="text-emerald-600">📱</span> See the dashboard in action
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* What you get */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  What You Get
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Verified agent account
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> All agent features
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> ₵5 free wallet credit
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Priority support
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> WhatsApp confirmation
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" /> Earn immediately
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Video testimonials */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-emerald-600" />
                  Agent Success Stories
                </CardTitle>
                <CardDescription>See how others are earning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {featuredTestimonies.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => openVideoModal(t)}
                      className="group cursor-pointer rounded-xl overflow-hidden bg-slate-900 hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-[9/16] w-full overflow-hidden">
                        <img
                          src={t.thumbnail}
                          alt={t.agentName}
                          className="w-full h-full object-cover group-hover:brightness-75 transition"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/90 group-hover:bg-white rounded-full p-3 transform group-hover:scale-110 transition">
                            <Play className="h-4 w-4 text-emerald-600 fill-emerald-600" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <p className="text-white font-semibold text-xs">{t.agentName}</p>
                          <p className="text-white/80 text-xs line-clamp-2">{t.title}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/testimonials"
                  target="_blank"
                  className="inline-block mt-4 text-sm text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Watch more stories →
                </Link>
              </CardContent>
            </Card>

            {/* Agent success stories */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Real Agents, Real Income
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-700 text-sm">AM</div>
                  <div>
                    <p className="font-semibold text-slate-900">Ama Mensah</p>
                    <p className="text-sm text-slate-600">Data Bundles + Wholesale · Accra</p>
                    <p className="text-sm font-medium text-emerald-700 mt-1">₵2,500/month</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-700 text-sm">KA</div>
                  <div>
                    <p className="font-semibold text-slate-900">Kwame Asante</p>
                    <p className="text-sm text-slate-600">Data + Real Estate · Kumasi</p>
                    <p className="text-sm font-medium text-amber-700 mt-1">₵7,000 in a month</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">JO</div>
                  <div>
                    <p className="font-semibold text-slate-900">John Osei</p>
                    <p className="text-sm text-slate-600">Referrals + Services · Tamale</p>
                    <p className="text-sm font-medium text-blue-700 mt-1">₵10,000 from referrals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Manual payment dialog */}
      {showManualDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md shadow-xl rounded-lg">
            <CardHeader className="bg-emerald-600 text-white py-3 px-5 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" />
                Manual Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-medium text-emerald-700">Amount to Pay:</p>
                  <p className="text-2xl font-bold text-emerald-900">₵{REGISTRATION_FEE_MANUAL}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700 mb-1.5">Your Reference Code:</p>
                  <div className="bg-white border-2 border-emerald-400 rounded-lg py-2 px-3 text-center">
                    <p className="text-lg font-mono font-bold text-emerald-900 tracking-wider">{manualCode}</p>
                  </div>
                  <p className="text-xs text-emerald-600 mt-1.5 text-center">Include this code in your payment note</p>
                </div>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm font-bold text-amber-900 mb-2">📱 Send Payment To:</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg">
                    <span className="text-sm font-medium text-amber-700">Phone:</span>
                    <span className="font-mono font-bold text-base text-amber-900">+233 557 943 392</span>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2.5 rounded-lg">
                    <span className="text-sm font-medium text-amber-700">Receiver:</span>
                    <span className="font-semibold text-amber-900">Adamantis Solutions</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-bold text-blue-900 mb-2">📋 Steps:</p>
                <ol className="space-y-1 text-sm text-blue-900 list-decimal list-inside">
                  <li>Send ₵{REGISTRATION_FEE_MANUAL} via Mobile Money</li>
                  <li>Include reference code <strong>{manualCode}</strong></li>
                  <li>Click &quot;Payment Sent&quot; below</li>
                  <li>Admin will confirm & activate your account</li>
                </ol>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowManualDialog(false)} className="flex-1 h-10 text-sm">
                  Cancel
                </Button>
                <Button
                  onClick={handleManualComplete}
                  disabled={manualProcessing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 font-medium text-sm"
                >
                  {manualProcessing ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "✓ Payment Sent"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Video modal */}
      {showVideo && currentVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-black rounded-lg w-full max-w-sm max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-3 bg-black border-b border-slate-800">
              <h3 className="text-white font-bold text-sm truncate">{currentVideo.agentName}</h3>
              <button onClick={closeVideoModal} className="text-white hover:bg-slate-800 rounded-full p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-black flex items-center justify-center">
              <video src={currentVideo.videoUrl} controls autoPlay className="w-full h-full object-contain" />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <p className="text-white text-xs font-semibold mb-2">{currentVideo.agentName}</p>
              <p className="text-slate-300 text-xs mb-4 line-clamp-2">{currentVideo.title}</p>
              <div className="flex gap-2">
                <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-sm h-10">
                  <Link href="/testimonials" target="_blank">Watch More</Link>
                </Button>
                <Button variant="outline" className="flex-1 text-sm h-10" onClick={closeVideoModal}>
                  Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegistrationPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <Loader className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <RegistrationPaymentContent />
    </Suspense>
  );
}