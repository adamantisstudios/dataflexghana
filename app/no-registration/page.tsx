"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NoRegistrationSlider } from "@/components/no-registration/no-registration-slider"
import { DevicesSection } from "@/components/no-registration/devices-section"
import { ECGTopUpForm } from "@/components/no-registration/ecg-topup-form"
import { NetworksSection } from "@/components/no-registration/networks-section"
import { SoftwareStore } from "@/components/no-registration/software-store"
import { AFAContextSection } from "@/components/no-registration/afa-context-section"
import { AFARegistrationForm } from "@/components/no-registration/afa-registration-form"
import { MTNSimForms } from "@/components/no-registration/mtn-sim-forms"
import { BusinessRegistrationForm } from "@/components/no-registration/business-registration-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AgentBenefitsSlideup } from "@/components/no-registration/agent-benefits-slideup"
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
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function NoRegistrationPage() {
  return (
    <main className="min-h-screen">
      <AgentBenefitsSlideup />

      <Header />

      <NoRegistrationSlider />

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-center mb-6">Why Choose No Registration?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Instant Access</h3>
                  <p className="text-green-100">No waiting, no forms - get what you need immediately</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Hidden Fees</h3>
                  <p className="text-green-100">Transparent pricing with no registration charges</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Quality Service</h3>
                  <p className="text-green-100">Same high-quality services without the paperwork</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Explore Our Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover more opportunities and connect with professionals in various fields
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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

            <Card className="hover:shadow-xl transition-all duration-300 overflow-hidden border-0 group">
              <CardContent className="p-0">
                <div className="relative w-full h-40 overflow-hidden bg-gray-200">
                  <Image
                    src="/assets/slide2.jpg"
                    alt="Custom Fashion Design Service"
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">Fashion Design</h3>
                  <p className="text-gray-600">Get custom fashion designs for every occasion. Professional styling services with remote consultations available.</p>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                  >
                    <Link href="https://fashionablyhired.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <span>Design Now</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Wholesale Agent Opportunity Section */}
      <section className="py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-5xl mx-auto border-0 overflow-hidden shadow-2xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="p-0 flex flex-col md:flex-row">
              {/* Image Section */}
              <div className="relative w-full md:w-2/5 h-64 md:h-auto min-h-64 bg-gradient-to-br from-amber-100 to-orange-100">
                <Image
                  src="/wholesale-opportunity.jpg"
                  alt="Wholesale Agent Opportunity"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Content Section */}
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
                    <Link href="/agent/register" className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      <span>Register as Agent Now</span>
                      <ChevronRight className="w-5 h-5" />
                    </Link>
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

      <NetworksSection />
      <DevicesSection />

      <MTNSimForms />

      <section className="py-16 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-emerald-300 hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardContent className="p-0 flex flex-col">
              <div className="relative w-full h-48 md:h-72 bg-gradient-to-br from-emerald-100 to-teal-100">
                <Image
                  src="/savings.jpg"
                  alt="Savings and investment plans visualization"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              <div className="p-8 md:p-10 flex flex-col space-y-6 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <PiggyBank className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold">Savings & Investment Plans</h3>
                    <p className="text-emerald-100">Grow your wealth with our flexible plans</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <TrendingUp className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Competitive Interest Rates</p>
                      <p className="text-sm text-emerald-100">Earn attractive returns on your investments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Flexible Withdrawal</p>
                      <p className="text-sm text-emerald-100">Access your funds when you need them</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                    <Shield className="w-5 h-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Secure & Transparent</p>
                      <p className="text-sm text-emerald-100">Track your investments in real-time</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm text-emerald-100 mb-4">
                    Both agents and non-agents can invest and earn interest on their savings. Sign up today to get
                    started!
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-bold text-base py-6"
                  >
                    <Link href="/agent/register" className="flex items-center justify-center gap-2">
                      <span>Sign Up Now</span>
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="ecg-topup" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">ECG Prepaid Top-Up</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Top up your ECG prepaid meter instantly with just ₵8 service charge
            </p>
          </div>
          <ECGTopUpForm />
        </div>
      </section>

      <section id="software" className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Software Installation & Store</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional software installation services for Windows, macOS, and more
            </p>
          </div>
          <SoftwareStore />
        </div>
      </section>

      <section id="afa-registration" className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AFA Registration</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Register for AFA membership and unlock exclusive benefits and priority support
            </p>
          </div>
          <AFARegistrationForm />
        </div>
      </section>

      <section className="py-12 md:py-16 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
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
                    {
                      icon: Sparkles,
                      text: "Free Sales Training Manual (PDF, Audio, Video)",
                      color: "text-yellow-600",
                    },
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
                    <Link href="/agent/register" className="flex items-center justify-center gap-2">
                      <span>Become an Agent Today</span>
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-blue-200 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13M0 6.253v13C0 18.477 1.586 18 3 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-blue-800">Educational Products & Services</h3>
                      <p className="text-blue-600">Results Checker Cards, School Forms & Subscriptions</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-lg">
                    Get instant access to BECE, WASSCE, ABCE results checker cards, university application forms, and
                    subscription services. Delivered via email or WhatsApp!
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {["BECE Results", "WASSCE Results", "University Forms", "School Forms", "Netflix", "Spotify"].map(
                      (item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ),
                    )}
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Link href="/voucher">
                      Shop Educational Products
                      <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </Button>
                </div>
                <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src="/educational-card.jpg"
                    alt="Educational products and services"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <AFAContextSection />

      <BusinessRegistrationForm />

      <section className="py-16 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            No registration, no hassle - just quality services at affordable prices. Contact us via WhatsApp to place
            your order today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              <a href="https://wa.me/233242799990" target="_blank" rel="noopener noreferrer">
                Order via WhatsApp
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 py-6 bg-transparent"
            >
              <Link href="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
