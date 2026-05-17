"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProtectedLink } from "@/components/protected-link";
import { NoRegistrationSlider } from "@/components/no-registration/no-registration-slider";
import { DevicesSection } from "@/components/no-registration/devices-section";
import { ECGTopUpForm } from "@/components/no-registration/ecg-topup-form";
import { NetworksSection } from "@/components/no-registration/networks-section";
import { SoftwareStore } from "@/components/no-registration/software-store";
import { AFAContextSection } from "@/components/no-registration/afa-context-section";
import { AFARegistrationForm } from "@/components/no-registration/afa-registration-form";
import { MTNSimForms } from "@/components/no-registration/mtn-sim-forms";
import { BusinessRegistrationForm } from "@/components/no-registration/business-registration-form";
import { SupportServices } from "@/components/no-registration/support-services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AgentBenefitsSlideup } from "@/components/no-registration/agent-benefits-slideup";
  import {
  CheckCircle,
  Shield,
  ChevronRight,
  PiggyBank,
  TrendingUp,
  Award,
  Sparkles,
  Users,
  Zap,
  CreditCard,
  DollarSign,
  Package,
  FileText,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NoRegistrationPage() {
  const searchParams = useSearchParams();
  const [paymentSuccess, setPaymentSuccess] = useState<{
    whatsappUrl: string;
    phone: string;
    network: string;
    bundle: string;
    reference: string;
    amount: string;
  } | null>(null);

  const openWhatsApp = useCallback((url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const whatsappUrl = searchParams.get("whatsapp_url");

    if (paymentStatus !== "success" || !whatsappUrl) return;

    const details = {
      whatsappUrl,
      phone: searchParams.get("phone") || "",
      network: searchParams.get("network") || "",
      bundle: searchParams.get("bundle") || searchParams.get("service") || "",
      reference: searchParams.get("reference") || "",
      amount: searchParams.get("amount") || "",
    };

    setPaymentSuccess(details);

    const timeout = setTimeout(() => {
      openWhatsApp(whatsappUrl);
    }, 600);

    return () => clearTimeout(timeout);
  }, [searchParams, openWhatsApp]);

  return (
    <main className="min-h-screen">
      <AgentBenefitsSlideup />
      <Header />

      {paymentSuccess && (
        <div className="container mx-auto px-4 pt-4 max-w-3xl">
          <div
            className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 sm:p-5 shadow-md"
            role="status"
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="font-semibold text-emerald-900">Payment successful</p>
                <p className="text-sm text-emerald-800">
                  Send your order details to our team on WhatsApp so we can process your data bundle.
                </p>
                {(paymentSuccess.network || paymentSuccess.bundle) && (
                  <ul className="text-sm text-emerald-900/90 space-y-0.5">
                    {paymentSuccess.phone && <li>Phone: {paymentSuccess.phone}</li>}
                    {paymentSuccess.network && <li>Network: {paymentSuccess.network}</li>}
                    {paymentSuccess.bundle && <li>Bundle: {paymentSuccess.bundle}</li>}
                    {paymentSuccess.amount && <li>Amount: GHS {paymentSuccess.amount}</li>}
                    {paymentSuccess.reference && <li>Ref: {paymentSuccess.reference}</li>}
                  </ul>
                )}
                <Button
                  type="button"
                  className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => openWhatsApp(paymentSuccess.whatsappUrl)}
                >
                  Open WhatsApp to confirm order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NoRegistrationSlider />

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-none">
          <Card className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-center mb-6">Why Choose No Registration?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Instant Access</h3>
                  <p className="text-green-100">No waiting, no forms – get what you need immediately</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Hidden Fees</h3>
                  <p className="text-green-100">Transparent pricing with no registration charges</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Quality Service</h3>
                  <p className="text-green-100">Same high‑quality services without the paperwork</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-4 max-w-none">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Services</h2>
            <p className="w-full text-xl text-gray-600">
              Discover more opportunities and connect with professionals in various fields
            </p>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Apple Service Center */}
            <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden border-0 group">
              <CardContent className="p-0">
                <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                  <Image
                    src="/apple-device-repair-center.jpg"
                    alt="Apple Service Center"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">Apple Service Center</h3>
                  <p className="text-gray-600">Professional Apple device repair and support services. Get your devices fixed by certified technicians.</p>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                  >
                    <Link href="/appleservicecenter" className="flex items-center justify-center gap-2">
                      <span>Visit Service Center</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Domestic Workers */}
            <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden border-0 group">
              <CardContent className="p-0">
                <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                  <Image
                    src="/domestic-worker-profile.jpg"
                    alt="Domestic Workers"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">Domestic Workers</h3>
                  <p className="text-gray-600">Find trusted domestic workers including housekeepers, nannies, and cleaners for your home.</p>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
                  >
                    <Link href="/domestic-workers" className="flex items-center justify-center gap-2">
                      <span>Browse Workers</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Job Board */}
            <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden border-0 group">
              <CardContent className="p-0">
                <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                  <Image
                    src="/professional-workplace.jpg"
                    alt="Job Board"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">Job Board</h3>
                  <p className="text-gray-600">Explore employment opportunities and connect with verified employers. Find your next career opportunity.</p>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    <Link href="/jobboard" className="flex items-center justify-center gap-2">
                      <span>View Jobs</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Candidates Search Engine */}
            <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden border-0 group">
              <CardContent className="p-0">
                <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                  <Image
                    src="/candidates-slider-1.jpg"
                    alt="Candidates Search Engine"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">Candidates Search Engine</h3>
                  <p className="text-gray-600">Find and connect with qualified job seekers. Search for talented professionals ready to work and build your team.</p>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white"
                  >
                    <Link href="/candidates-searchengine" className="flex items-center justify-center gap-2">
                      <span>Search Candidates</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Fashion Avenue */}
            <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden border-0 group lg:col-span-1">
              <CardContent className="p-0">
                <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                  <Image
                    src="/assets/slide2.jpg"
                    alt="Fashion Avenue Shopping"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">Fashion Avenue</h3>
                  <p className="text-gray-600">Discover elegant fashion pieces, stylish collections, and professional designs. Shop premium quality clothing for every occasion.</p>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-700 hover:from-pink-700 hover:to-purple-800 text-white"
                  >
                    <ProtectedLink href="/fashion-avenue" requiresPayment={true} className="flex items-center justify-center gap-2">
                      <span>Refer Or Shop Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </ProtectedLink>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Salon & Beauty */}
            <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden border-0 group lg:col-span-1">
              <CardContent className="p-0">
                <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                  <Image
                    src="/salon-hero.jpg"
                    alt="Salon & Beauty Services"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">Salon & Beauty</h3>
                  <p className="text-gray-600">Professional hair braiding, styling, makeup, and spa services. Book beauty treatments with experienced professionals across Accra.</p>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-700 hover:to-pink-800 text-white"
                  >
                    <Link href="/salon" className="flex items-center justify-center gap-2">
                      <span>Browse Services</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Business Compliance Hub Section - FOR NON-AGENTS */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4 max-w-none">
          <Card className="w-full border-0 overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-0 flex flex-col md:flex-row-reverse">
              <div className="relative w-full md:w-2/5 bg-gradient-to-br from-purple-100 to-pink-100">
                <div className="relative w-full aspect-[3/4] md:aspect-auto md:h-full">
                  <div className="absolute inset-0 rounded-xl shadow-lg border-4 border-white/80 transform transition-transform duration-300 hover:scale-105 overflow-hidden">
                    <Image
                      src="/compliance-hub.jpg"
                      alt="Business Compliance Hub"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-purple-600 to-pink-600 text-white flex-1">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold">Business Compliance Hub</h3>
                      <p className="text-purple-100 text-sm md:text-base">Access Services Without Commissions</p>
                    </div>
                  </div>
                  <p className="text-base md:text-lg text-purple-50 leading-relaxed">
                    Non-agents can now access a dedicated Business Compliance Hub to fill all forms and secure compliance services. Enjoy full access to document filing, business registration, and professional compliance support.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/20 mt-6">
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-white text-purple-600 hover:bg-purple-50 font-bold text-base md:text-lg py-6"
                  >
                    <a href="https://bizcomplianceforms.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <span>Visit Compliance Hub</span>
                      <ChevronRight className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* General Support Services Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 max-w-none">
          <Card className="w-full border-0 overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="relative w-full md:w-2/5 bg-gradient-to-br from-blue-100 to-indigo-100">
                <div className="relative w-full aspect-[3/4] md:aspect-auto md:h-full">
                  <div className="absolute inset-0 rounded-xl shadow-lg border-4 border-white/80 transform transition-transform duration-300 hover:scale-105 overflow-hidden">
                    <Image
                      src="/formsxzy.png"
                      alt="Business Compliance Forms Services"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex-1">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold">General Support Services</h3>
                      <p className="text-blue-100 text-sm md:text-base">Professional Form Filling & Compliance</p>
                    </div>
                  </div>
                  <p className="text-base md:text-lg text-blue-50 leading-relaxed">
                    We can support anyone to secure these services faster and with convenience. Contact our admin team for more information and personalized assistance.
                  </p>
                </div>
                <div className="pt-6 border-t border-white/20 mt-6">
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold text-base md:text-lg py-6"
                  >
                    <a href="https://bizcomplianceforms.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <span>Fill All Forms Here</span>
                      <ChevronRight className="w-5 h-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SupportServices />

      {/* Wholesale Agent Opportunity Section */}
      <section className="py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="container mx-auto px-4 max-w-none">
          <Card className="w-full border-0 overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="relative w-full md:w-2/5 h-64 md:h-auto min-h-64 bg-gradient-to-br from-amber-100 to-orange-100">
                <Image
                  src="/wholesale-opportunity.jpg"
                  alt="Wholesale Agent Opportunity"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-orange-600 to-red-600 text-white flex-1">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold">Shop Wholesale Direct From Abroad</h3>
                      <p className="text-orange-100 text-sm md:text-base">Shop Wholesale, Retail and earn commissions on every purchase</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-start gap-3 bg-white/10 p-3 md:p-4 rounded-lg backdrop-blur-sm">
                      <DollarSign className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm md:text-base">Earn Commissions</p>
                        <p className="text-xs md:text-sm text-orange-100">Get paid commission on every wholesale purchase you make</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/10 p-3 md:p-4 rounded-lg backdrop-blur-sm">
                      <Package className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm md:text-base">Wholesale Pricing</p>
                        <p className="text-xs md:text-sm text-orange-100">Access discounted bulk prices on quality products</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/10 p-3 md:p-4 rounded-lg backdrop-blur-sm">
                      <Users className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm md:text-base">Join Our Network</p>
                        <p className="text-xs md:text-sm text-orange-100">Connect with thousands of agents earning passive income</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/20 mt-6 space-y-3">
                  <p className="text-sm text-orange-100">
                    Register as an agent today and start shopping wholesale with instant commission rewards!
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold text-base md:text-lg py-6"
                  >
                    <ProtectedLink href="/agent/register" className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span>Register as Agent Now</span>
                      <ChevronRight className="w-5 h-5" />
                    </ProtectedLink>
                  </Button>
                  <p className="text-xs text-orange-100 text-center">
                    Already registered? <Link href="/agent/wholesale" className="underline font-semibold hover:text-white">Go to Wholesale</Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ========== FIXED: Data bundles collapsible – wider ========== */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-none">
          <Card className="w-full border border-gray-200">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="network-offerings" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline text-gray-800 font-medium hover:bg-gray-50 rounded-t-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📶</span>
                    <span className="text-base font-medium">Data bundles that actually save you money</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-6 pt-2 border-t border-gray-100">
                  <NetworksSection />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>
      </section>

      <DevicesSection />

      {/* ========== FIXED: MTN Agent & Merchant SIM Registration – much wider ========== */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="container mx-auto px-4 max-w-none">
          <Card className="w-full border-yellow-200 shadow-lg">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="mtn-sim" className="border-0">
                <AccordionTrigger className="hover:no-underline px-6 py-4 flex items-center justify-between bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-semibold">📱 MTN Agent & Merchant SIM Registration</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 py-0 border-t border-yellow-200 bg-white rounded-b-lg overflow-hidden">
                  {/* Removed the narrow pt-8 and added proper padding */}
                  <div className="p-6 md:p-8 w-full">
                    <MTNSimForms />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>
      </section>

      {/* AFA Context Section – already wide enough, but ensure full width */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-none">
          <Card className="w-full border border-gray-200">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="afa-context" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline text-gray-800 font-medium hover:bg-gray-50 rounded-t-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌾</span>
                    <span className="text-base font-medium">AFA Context & Opportunities</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-6 pt-2 border-t border-gray-100">
                  <AFAContextSection />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>
      </section>

      {/* ========== FIXED: AFA Registration Form – wider ========== */}
      <section id="afa-registration" className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-none">
          <Card className="w-full border border-gray-200">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="afa-registration" className="border-0">
                <AccordionTrigger className="px-6 py-4 hover:no-underline text-gray-800 font-medium hover:bg-gray-50 rounded-t-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🌾</span>
                    <span className="text-base font-medium">AFA Registration Form</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-6 pt-2 border-t border-gray-100">
                  {/* Removed the inner px-6 that was causing narrowness – now full width */}
                  <div className="w-full">
                    <AFARegistrationForm />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="container mx-auto px-4 max-w-none">
          <div className="w-full">
            <div className="text-center mb-8 md:mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Ready To Earn More? Register As Agent
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Unlock exclusive benefits and start earning commissions while enjoying discounted service costs
              </p>
            </div>

            <Card className="border-purple-200 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden mb-6">
              <CardHeader className="pb-3 sm:pb-4 bg-gradient-to-r from-purple-100 to-pink-100">
                <CardTitle className="flex items-center gap-2 text-purple-800 text-lg sm:text-xl">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                  What You Get As An Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 py-6">
                <div className="grid gap-3 sm:gap-4">
                  {[
                    { icon: Sparkles, text: "Free Sales Training Manual (PDF, Audio, Video)", color: "text-yellow-600" },
                    { icon: Users, text: "Part of 10,000+ Active Agents Nationwide", color: "text-blue-600" },
                    { icon: Shield, text: "Supportive & Friendly Admin Access 24/7", color: "text-purple-600" },
                    { icon: PiggyBank, text: "Personal Support Assistant Access", color: "text-orange-600" },
                    { icon: Zap, text: "Instant access to earning opportunities", color: "text-red-600" },
                    { icon: TrendingUp, text: "Start earning within 24 hours", color: "text-green-600" },
                    { icon: CreditCard, text: "Discounted Service Costs", color: "text-indigo-600" },
                    { icon: Award, text: "Attract Extra Commissions", color: "text-pink-600" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <item.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${item.color} flex-shrink-0`} />
                      <span className="font-medium text-gray-800 text-sm sm:text-base">{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold py-6"
                  >
                    <ProtectedLink href="/agent/register" className="flex items-center justify-center gap-2">
                      <span>Become an Agent Today</span>
                      <ChevronRight className="w-5 h-5" />
                    </ProtectedLink>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 max-w-none">
          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-blue-100">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13M0 6.253v13C0 18.477 1.586 18 3 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Educational Products & Services</h2>
                      <p className="text-blue-600 font-medium">Results Checker Cards, School Forms & Subscriptions</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed mb-6">
                    Get instant access to BECE, WASSCE, ABCE results checker cards, university application forms, and subscription services. Delivered via email or WhatsApp!
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                    {[
                      "BECE Results",
                      "WASSCE Results",
                      "ABCE Results",
                      "University Forms",
                      "School Forms",
                      "Netflix",
                      "Spotify",
                      "Showmax",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-700">
                        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button asChild size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all">
                    <Link href="/voucher" className="flex items-center justify-center gap-2">
                      Shop Educational Products
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </Button>
                </div>
                <div className="relative h-72 md:h-auto min-h-[280px] bg-blue-100">
                  <Image
                    src="/educational-card.jpg"
                    alt="Educational products showcase – results checkers, forms, and subscriptions"
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BusinessRegistrationForm />

      <section className="py-16 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="w-full text-xl mb-8">
            No registration, no hassle – just quality services at affordable prices. Contact us via WhatsApp to place your order today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-6">
              <a href="https://wa.me/233246827049" target="_blank" rel="noopener noreferrer">Order via WhatsApp</a>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 py-6 bg-transparent">
              <Link href="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}