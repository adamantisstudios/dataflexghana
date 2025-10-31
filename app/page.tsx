"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RichTextRenderer } from "@/components/ui/rich-text-renderer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase, type Service, type DataBundle, type Job } from "@/lib/supabase"
import {
  PLATFORM_CONFIG,
  getJoiningFeeFormatted,
  getPlatformName,
  getSupportPhone,
  getSupportEmail,
} from "@/lib/config"
import { Footer } from "@/components/footer"
import { WhatsAppWidget } from "@/components/whatsapp-widget"
import { BackToTop } from "@/components/back-to-top"
import { HeroSlider } from "@/components/hero-slider"
import WholesaleProductSlider from "@/components/WholesaleProductSlider"
import {
  Users,
  Shield,
  Clock,
  Star,
  ArrowRight,
  Smartphone,
  Banknote,
  Globe,
  Award,
  MessageCircle,
  Phone,
  Mail,
  Menu,
  X,
  Briefcase,
  Calendar,
  DollarSign,
  Building2,
  ShoppingCart,
  Target,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Router,
  Download,
} from "lucide-react"
import Link from "next/link"
import PropertiesShowcase from "@/components/homepage/PropertiesShowcase"
import WhatsAppChannelPopup from "@/components/WhatsAppChannelPopup"

export default function HomePage() {
  const [services, setServices] = useState<Service[]>([])
  const [dataBundles, setDataBundles] = useState<DataBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [showDataBundles, setShowDataBundles] = useState(false)
  const [dataBundlesLoaded, setDataBundlesLoaded] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [servicesData, jobsData] = await Promise.all([
        supabase.from("services").select("*").order("created_at", { ascending: false }),
        supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(5),
      ])

      setServices(servicesData.data || [])
      setJobs(jobsData.data || [])
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadDataBundles = async () => {
    if (dataBundlesLoaded) return

    try {
      const bundlesData = await supabase.from("data_bundles").select("*").order("provider", { ascending: true })
      setDataBundles(bundlesData.data || [])
      setDataBundlesLoaded(true)
    } catch (error) {
      console.error("Error loading data bundles:", error)
    }
  }

  const handleShowDataBundles = () => {
    setShowDataBundles(!showDataBundles)
    if (!showDataBundles && !dataBundlesLoaded) {
      loadDataBundles()
    }
  }

  const testimonials = [
    {
      name: "Ama Mensah",
      role: "Senior Agent - Accra",
      image: "/images/user1-placeholder.jpg",
      content:
        "DataFlex has transformed my business! I earn consistent income selling data bundles and the commission structure is very fair. The platform is easy to use and payments are always on time.",
      rating: 5,
      earnings: "GH₵ 2,500/month",
    },
    {
      name: "Kwame Asante",
      role: "Regional Agent - Kumasi",
      image: "/images/user2-placeholder.jpg",
      content:
        "Being a DataFlex agent has given me financial independence. The support team is excellent and I love how I can track all my sales and commissions in real-time.",
      rating: 5,
      earnings: "GH₵ 3,200/month",
    },
    {
      name: "John Osei",
      role: "Community Agent - Tamale",
      image: "/images/user4-placeholder.jpg",
      content:
        "I started as a part-time agent and now this is my main source of income. The referral system works great and my customers are always satisfied with the service quality.",
      rating: 5,
      earnings: "GH₵ 1,800/month",
    },
  ]

  const features = [
    {
      icon: <Smartphone className="h-8 w-8 text-emerald-600" />,
      title: "All Networks Supported",
      description:
        "Purchase affordable data bundles for personal use from MTN, AirtelTigo, and Telecel networks with competitive rates and instant delivery.",
    },
    {
      icon: <Banknote className="h-8 w-8 text-emerald-600" />,
      title: "Attractive Savings",
      description:
        "Save money on your personal data purchases with our competitive rates and special offers for bulk personal use.",
    },
    {
      icon: <Shield className="h-8 w-8 text-emerald-600" />,
      title: "Secure Platform",
      description:
        "Your transactions and personal information are protected with bank-level security and encrypted data storage.",
    },
    {
      icon: <Clock className="h-8 w-8 text-emerald-600" />,
      title: "24/7 Support",
      description: "Get help anytime with our dedicated support team available round the clock via WhatsApp and phone.",
    },
    {
      icon: <Globe className="h-8 w-8 text-emerald-600" />,
      title: "Nationwide Coverage",
      description:
        "Access data services across all regions of Ghana with reliable network coverage and fast data delivery.",
    },
    {
      icon: <Award className="h-8 w-8 text-emerald-600" />,
      title: "Customer Benefits",
      description:
        "Enjoy exclusive deals, loyalty rewards, and special promotions for regular customers and bulk personal purchases.",
    },
  ]

  const stats = [
    { label: "Active Agents", value: "2,500+", icon: <Users className="h-6 w-6" /> },
    { label: "Data Bundles Sold", value: "50,000+", icon: <Smartphone className="h-6 w-6" /> },
    { label: "Total Commissions Paid", value: "GH₵ 500K+", icon: <Banknote className="h-6 w-6" /> },
    { label: "Customer Satisfaction", value: "98%", icon: <Star className="h-6 w-6" /> },
  ]

  const providers = [
    {
      name: "MTN",
      logo: "/images/mtn-new.jpg",
      logoAlt: "/images/mtn-logo-new.jpg",
      description: "Ghana's largest network with nationwide coverage",
      bundles: dataBundles.filter((bundle) => bundle.provider === "MTN").slice(0, 3),
      color: "from-yellow-400 to-orange-500",
    },
    {
      name: "AirtelTigo",
      logo: "/images/airteltigo-new.jpg",
      logoAlt: "/images/airteltigo-logo-new.jpg",
      description: "Reliable network with competitive data rates",
      bundles: dataBundles.filter((bundle) => bundle.provider === "AirtelTigo").slice(0, 3),
      color: "from-blue-500 to-red-500",
    },
    {
      name: "Telecel",
      logo: "/images/telecel-new.jpg",
      logoAlt: "/images/telecel-logo-new.jpg",
      description: "Growing network with excellent customer service",
      bundles: dataBundles.filter((bundle) => bundle.provider === "Telecel").slice(0, 3),
      color: "from-red-500 to-pink-500",
    },
  ]

  const serviceHighlights = [
    {
      title: "Apply for Jobs",
      description: "Access verified job opportunities from trusted employers",
      icon: <Briefcase className="h-8 w-8" />,
      image: "/images/job-seeker-2.jpg",
      color: "from-blue-500 to-indigo-600",
      features: ["Remote Work", "Full-time Jobs", "Part-time Gigs", "Freelance Projects"],
    },
    {
      title: "Invest in Dataflex Ghana",
      description: "Earn commissions when you buy data bundles from all networks",
      icon: <Smartphone className="h-8 w-8" />,
      image: "/images/hero-main-new.jpg",
      color: "from-emerald-500 to-green-600",
      features: ["15% Commission", "Instant Delivery", "All Networks", "24/7 Support"],
    },
    {
      title: "Wholesale Shopping",
      description: "Shop wholesale and dropship products nationwide",
      icon: <ShoppingCart className="h-8 w-8" />,
      image: "/images/job-seeker.jpg",
      color: "from-purple-500 to-pink-600",
      features: ["Wholesale Prices", "Dropshipping", "Doorstep Delivery", "Verified Suppliers"],
    },
    {
      title: "Promote Projects",
      description: "Earn high commissions promoting business services",
      icon: <Target className="h-8 w-8" />,
      image: "/images/bus-reg.jpg",
      color: "from-orange-500 to-red-600",
      features: ["₵50-₵4000 Earnings", "Business Services", "High Commissions", "Verified Projects"],
    },
  ]

  const ensureJobTitle = (job: Job): Job => {
    if (!job.title && job.industry) {
      return { ...job, title: job.industry }
    }
    return job
  }

  return (
    <div className="min-h-screen bg-white">
      <WhatsAppChannelPopup />

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2 border-2 border-emerald-200">
                <img src="/images/logo-new.png" alt="DataFlex Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {getPlatformName()}
                </h1>
                <p className="text-xs text-gray-600">{PLATFORM_CONFIG.platform.tagline}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Features
              </a>
              <a href="#services" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Services
              </a>
              <a href="#bundles" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Data Bundles
              </a>
              <Link
                href="/domestic-workers"
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
              >
                Domestic Workers
              </Link>
              <a href="#jobs" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Jobs
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
                Testimonials
              </a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                asChild
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
              >
                <Link href="/agent/login">Agent Login</Link>
              </Button>
              <Button
                asChild
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
              >
                <Link href="/agent/register">Join as Agent</Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 bg-white">
              <div className="flex flex-col gap-4">
                <a
                  href="#features"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Features
                </a>
                <a
                  href="#services"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Services
                </a>
                <a
                  href="#bundles"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Data Bundles
                </a>
                <Link
                  href="/domestic-workers"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Domestic Workers
                </Link>
                <a
                  href="#jobs"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Jobs
                </a>
                <a
                  href="#testimonials"
                  className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
                >
                  Testimonials
                </a>
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    asChild
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                  >
                    <Link href="/agent/login">Agent Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    <Link href="/agent/register">Join as Agent</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with 4 Sliders */}
      <HeroSlider />

      <div className="mb-16">
        <Card className="mx-auto max-w-5xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 sm:p-6 md:p-8">
              {/* Left Content */}
              <div className="space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                      {/* Icon */}
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-bold text-purple-800">Hire a Domestic Worker</h3>
                      <p className="text-purple-600 font-medium text-sm md:text-base">
                        Trusted, Experienced & Verified Professionals
                      </p>
                    </div>
                  </div>

                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Find reliable domestic workers for your home. All our candidates are carefully screened and
                    verified.
                    <span className="font-semibold text-purple-600">
                      {" "}
                      From child care to elder care, cooking to cleaning - we have the right person for you!
                    </span>
                  </p>

                  {/* Featured Worker - Instagram Card Style */}
                  <div className="bg-white border-2 border-purple-200 rounded-2xl shadow-md hover:shadow-lg transition w-full sm:max-w-sm md:max-w-md lg:max-w-sm">
                    {/* Image */}
                    <div className="w-full h-72 sm:h-80 md:h-96 lg:h-[28rem] overflow-hidden">
                      <img
                        src="/professional-african-woman-domestic-worker.jpg"
                        alt="Featured domestic worker"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info Section */}
                    <div className="p-4">
                      <h4 className="text-lg md:text-xl font-bold text-purple-800">Akosua Mensah</h4>
                      <p className="text-sm md:text-base text-purple-600">5 years experience • Child Care Specialist</p>
                      <p className="text-xs md:text-sm text-gray-600 mt-1">Available in Accra • Speaks Twi & English</p>

                      {/* Rating */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 md:h-5 md:w-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-xs md:text-sm text-gray-500">Highly Rated</p>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["Verified Professionals", "Background Checked", "Flexible Arrangements", "Affordable Rates"].map(
                      (item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                          <span className="text-sm md:text-base text-gray-700">{item}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Button */}
                <Button
                  size="lg"
                  asChild
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl text-base md:text-lg px-6 md:px-8 py-4 md:py-6"
                >
                  <Link href="/domestic-workers">
                    Browse Domestic Workers
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Link>
                </Button>

                <p className="text-center text-xs md:text-sm text-gray-600">
                  Find the perfect domestic worker for your family today!
                </p>
              </div>

              {/* Right Image */}
              <div className="relative">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="/happy-african-family-with-domestic-worker-at-home.jpg"
                    alt="Happy family with domestic worker"
                    className="w-full h-60 sm:h-72 md:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs md:text-sm font-semibold text-gray-900">Trusted Service</div>
                          <div className="text-xs text-gray-600">Verified Professionals</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-16">
        <Card className="mx-auto max-w-5xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
              {/* Left Content */}
              <div className="space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                      {/* Icon */}
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-orange-800">Business Registration & Promotion</h3>
                      <p className="text-orange-600 font-medium">Sell Your Products & Services Nationwide</p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    Register your business and reach customers across Ghana with our trusted agent network.
                    <span className="font-semibold text-orange-600">
                      {" "}
                      Professional promotion and nationwide support!
                    </span>
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["Nationwide Reach", "Trusted Agents", "Professional Setup", "Marketing Support"].map(
                      (item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">₵</span>
                      </div>
                      <span className="font-semibold text-orange-800">Flexible Pricing Packages</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      Starting from ₵50/month. Choose the package that fits your business size and needs.
                    </p>
                  </div>
                </div>

                {/* Button */}
                <Button
                  size="lg"
                  asChild
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-xl text-lg px-8 py-6"
                >
                  <Link href="/business/register">
                    Register Your Business
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <p className="text-center text-sm text-gray-600">Start selling today with nationwide agent support!</p>
              </div>

              {/* Right Image */}
              <div className="relative">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="/images/register-business.jpg"
                    alt="Business registration and promotion"
                    className="w-full h-72 sm:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Nationwide Network</div>
                          <div className="text-xs text-gray-600">Professional Support</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 100% Free Job search support Section */}
      <div className="mb-16">
        <Card className="mx-auto max-w-5xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
              {/* Left Content */}
              <div className="space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                      {/* Icon */}
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-green-800">100% Free Job search support</h3>
                      <p className="text-green-600 font-medium">
                        Work with Fast-Hired And Travels. Help friends, relatives, etc find jobs near them at Zero
                        Agency Fees
                      </p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    Assist friends, relatives, colleagues to find jobs near them without agency Fees.
                    <span className="font-semibold text-green-600">
                      {" "}
                      Completely free job placement support with no hidden charges
                    </span>
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      "No Form Filling fees",
                      "No Processing Fees",
                      "Free Private Job Search Support",
                      "Free On the job support",
                      "Free Interview Guide & Support",
                      "No Salary Deductions After landing Job",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Caption Box */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="font-semibold text-green-800">100% Free Job search support in Ghana</span>
                    </div>
                    <p className="text-sm text-green-700">
                      We remove the stress of searching for credible direct jobs from companies, businesses and from
                      home owners in Ghana, removing all job placement fees
                    </p>
                  </div>
                </div>

                {/* Button */}
                <Button
                  size="lg"
                  asChild
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl text-lg px-8 py-6"
                >
                  <Link href="https://fasthiredterms.netlify.app/" target="_blank" rel="noopener noreferrer">
                    Visit Registration Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Right Image */}
              <div className="relative">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="/images/hero.png"
                    alt="Job search and employment support"
                    className="w-full h-72 sm:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">100% Free</div>
                          <div className="text-xs text-gray-600">No Agency Fees</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Second Card */}
      <div className="mb-16">
        <Card className="mx-auto max-w-5xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
              {/* Left Content */}
              <div className="space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      {/* Icon */}
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-blue-800">GES Approved Books & School Items</h3>
                      <p className="text-blue-600 font-medium">Exclusively for Parents & Guardians</p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    Shop for authentic GES-approved textbooks, stationery, and school supplies at wholesale prices.
                    <span className="font-semibold text-blue-600"> Zero platform fees for parents!</span>
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["GES Certified Books", "Quality Stationery", "School Uniforms", "Educational Materials"].map(
                      (item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">₵</span>
                      </div>
                      <span className="font-semibold text-green-800">FREE Registration for Parents</span>
                    </div>
                    <p className="text-sm text-green-700">
                      No joining fees, no hidden charges. Just quality educational materials at affordable prices.
                    </p>
                  </div>
                </div>

                {/* Button */}
                <Button
                  size="lg"
                  asChild
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl text-lg px-8 py-6"
                >
                  <Link href="/parents/register">
                    Register as Parent - FREE
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Right Image */}
              <div className="relative">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="images/happy-ghanaian-children-with-school-books-and-unif.jpg"
                    alt="Happy Ghanaian children with school books"
                    className="w-full h-72 sm:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">GES Approved</div>
                          <div className="text-xs text-gray-600">Quality Guaranteed</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Business Registration & Compliance Section */}
      <div className="mb-16">
        <Card className="mx-auto max-w-5xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
              {/* Left Content */}
              <div className="space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                      {/* Icon */}
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-orange-800">Business Registration & Compliance</h3>
                      <p className="text-orange-600 font-medium">Help friends to legalize their business</p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    Assist friends, relatives, colleagues and the general public to register their businesses online.
                    <span className="font-semibold text-orange-600">
                      {" "}
                      Earn between 80-130 Cedis commission as an agent per registration
                    </span>
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      "100% Online form filling",
                      "No Paperworks or queues",
                      "Absolutely Free Nationwide Delivery",
                      "100% Secured Process",
                      "Waiting Period: 14 Working days",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Caption Box */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="font-semibold text-orange-800">100% online Business Registration</span>
                    </div>
                    <p className="text-sm text-orange-700">
                      We remove the busy up and down, hassle and bustle of city life, queuing or paperworks
                    </p>
                  </div>
                </div>

                {/* Button */}
                <Button
                  size="lg"
                  asChild
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-xl text-lg px-8 py-6"
                >
                  <Link href="https://bizcomplianceforms.netlify.app/" target="_blank" rel="noopener noreferrer">
                    Visit Registration Portal
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Right Image */}
              <div className="relative">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="/images/businessreg.jpg"
                    alt="Business registration documents and forms"
                    className="w-full h-72 sm:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Fully Legal</div>
                          <div className="text-xs text-gray-600">Government Approved</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-16">
        <Card className="mx-auto max-w-5xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
              {/* Left Content */}
              <div className="space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-blue-800">Educational Products & Services</h3>
                      <p className="text-blue-600 font-medium">Results Checker Cards, School Forms & Subscriptions</p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    Get instant access to BECE, WASSCE, ABCE results checker cards, university application forms, and
                    subscription services.
                    <span className="font-semibold text-blue-600"> Delivered via email or WhatsApp!</span>
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      "Results Checker Cards",
                      "School Application Forms",
                      "University Forms",
                      "Subscription Services",
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                      <span className="font-semibold text-blue-800">No Registration Required</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Order educational products without any registration. Simple, fast, and convenient!
                    </p>
                  </div>
                </div>

                {/* Button */}
                <Button
                  size="lg"
                  asChild
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl text-lg px-8 py-6"
                >
                  <Link href="/voucher">
                    Shop Educational Products
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <p className="text-center text-sm text-gray-600">Perfect for students and educational needs!</p>
              </div>

              {/* Right Image */}
              <div className="relative">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="/educational-card.jpg"
                    alt="Educational products and services"
                    className="w-full h-72 sm:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Instant Delivery</div>
                          <div className="text-xs text-gray-600">Email or WhatsApp</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gift Cards & Vouchers Section - This section seems to be replaced by the educational products one. */}
      {/* It's commented out or should be removed if it's a direct replacement. */}
      {/* Keeping it here for reference, but it's effectively superseded by the educational products section above */}
      {/*
      <div className="mb-16">
        <Card className="mx-auto max-w-5xl overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
              Left Content
              <div className="space-y-6 text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-purple-800">Gift Cards & Vouchers</h3>
                      <p className="text-purple-600 font-medium">Perfect Gift for Every Occasion</p>
                    </div>
                  </div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    Send the perfect gift instantly! Choose from a wide selection of digital vouchers and gift cards.
                    <span className="font-semibold text-purple-600"> Delivered via email or WhatsApp!</span>
                  </p>

                  Features
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {["Instant Delivery", "Multiple Options", "Email or WhatsApp", "Perfect for Gifting"].map(
                      (item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ),
                    )}
                  </div>

                  Info Box
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🎁</span>
                      </div>
                      <span className="font-semibold text-purple-800">No Registration Required</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Order gift cards and vouchers without any registration. Simple, fast, and convenient!
                    </p>
                  </div>
                </div>

                Button
                <Button
                  size="lg"
                  asChild
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl text-lg px-8 py-6"
                >
                  <Link href="/voucher">
                    Shop Voucher Cards
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                <p className="text-center text-sm text-gray-600">Perfect for birthdays, holidays, and celebrations!</p>
              </div>

              Right Image
              <div className="relative">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src="/colorful-gift-cards-vouchers-celebration.jpg"
                    alt="Gift cards and vouchers"
                    className="w-full h-72 sm:h-80 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Instant Delivery</div>
                          <div className="text-xs text-gray-600">Email or WhatsApp</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      */}

      {/* Service Highlights */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Our Services</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Four Ways to <span className="text-emerald-600">Build Your Income</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your path to financial freedom. Mix and match services to maximize your earning potential.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {serviceHighlights.map((service, index) => (
              <Card
                key={index}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 border-gray-200 group"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-80`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                        {service.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{service.title}</h3>
                      <p className="text-white/90">{service.description}</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    asChild
                  >
                    <Link href="/agent/register">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Wholesale Product Slider */}
      <WholesaleProductSlider />

      <PropertiesShowcase />

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Why Choose DataFlex</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Everything You Need to <span className="text-emerald-600">Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide all the tools, support, and opportunities you need to access quality services and save money
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg bg-white"
              >
                <CardHeader>
                  <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Data Bundles Section */}
      <section id="bundles" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Data Bundles</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              All Networks <span className="text-emerald-600">Available</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Purchase affordable data bundles for personal use from all major networks in Ghana with competitive rates
              and instant delivery
            </p>
          </div>

          {/* Buy Affordable Data Button */}
          <div className="text-center mb-8">
            <Button
              onClick={handleShowDataBundles}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-xl text-lg px-8 py-6"
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Buy Affordable Data
              {showDataBundles ? <ChevronUp className="ml-2 h-5 w-5" /> : <ChevronDown className="ml-2 h-5 w-5" />}
            </Button>
          </div>

          {/* Collapsible Data Bundles Content */}
          {showDataBundles && (
            <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
              {/* Network Showcase */}
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {providers.map((provider, index) => (
                  <Card key={index} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={provider.logo || "/placeholder.svg"}
                        alt={`${provider.name} Network`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${provider.color} opacity-80`}></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-20 h-20 bg-white rounded-xl p-3 mx-auto mb-4">
                            <img
                              src={provider.logoAlt || provider.logo}
                              alt={`${provider.name} Logo`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <h3 className="text-2xl font-bold">{provider.name}</h3>
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <p className="text-gray-600 mb-4">{provider.description}</p>
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-2">Available Bundles</p>
                        <p className="text-2xl font-bold text-emerald-600">{provider.bundles.length}+</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {dataBundlesLoaded && (
                <Tabs defaultValue="MTN" className="space-y-8">
                  <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-emerald-50 border border-emerald-200">
                    <TabsTrigger
                      value="MTN"
                      className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2"
                    >
                      <img src="/images/mtn-logo-new.jpg" alt="MTN logo" className="w-5 h-5 rounded object-cover" />
                      <span className="hidden sm:inline">MTN</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="AirtelTigo"
                      className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2"
                    >
                      <img
                        src="/images/airteltigo-logo-new.jpg"
                        alt="AirtelTigo logo"
                        className="w-5 h-5 rounded object-cover"
                      />
                      <span className="hidden sm:inline">AirtelTigo</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="Telecel"
                      className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white flex items-center gap-2"
                    >
                      <img
                        src="/images/telecel-logo-new.jpg"
                        alt="Telecel logo"
                        className="w-5 h-5 rounded object-cover"
                      />
                      <span className="hidden sm:inline">Telecel</span>
                    </TabsTrigger>
                  </TabsList>

                  {providers.map((provider) => (
                    <TabsContent key={provider.name} value={provider.name} className="space-y-8">
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden border border-emerald-100">
                          <img
                            src={provider.logoAlt || provider.logo || "/placeholder.svg"}
                            alt={`${provider.name} Logo`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{provider.name}</h3>
                        <p className="text-gray-600">{provider.description}</p>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {provider.bundles.map((bundle) => (
                          <Card
                            key={bundle.id}
                            className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg"
                          >
                            <CardHeader className="text-center">
                              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Smartphone className="h-8 w-8 text-white" />
                              </div>
                              <CardTitle className="text-2xl">{bundle.size_gb}GB</CardTitle>
                              <CardDescription>{provider.name} Data Bundle</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4">
                              <div>
                                <p className="text-3xl font-bold text-emerald-600">GH₵ {bundle.price.toFixed(2)}</p>
                                <p className="text-sm text-gray-600">Valid for {bundle.validity_months} months</p>
                              </div>
                              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                <p className="text-sm text-gray-600">Personal Use</p>
                                <p className="text-lg font-bold text-emerald-600">Affordable Rates</p>
                              </div>
                              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
                                <Link href="/agent/register">Purchase Now</Link>
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {provider.bundles.length === 0 && (
                        <div className="text-center py-12">
                          <Smartphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">More {provider.name} bundles coming soon!</p>
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              {!dataBundlesLoaded && showDataBundles && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading data bundles...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Latest Jobs Section */}
      <section id="jobs" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4">Latest Opportunities</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Find Your Next <span className="text-blue-600">Career</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover authentic, verified job opportunities from trusted companies, homeowners, and businesses across
              Ghana
            </p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-4xl mx-auto">
              <p className="text-sm text-blue-700">
                <strong>Disclaimer:</strong> All job postings are screened for authenticity. We prioritize verified,
                credible jobs from trusted companies, homeowners, and businesses that comply with Ghana's labor laws and
                employee rights.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-blue-100">
                  <CardHeader>
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jobs.slice(0, 5).map((job) => {
                  const jobWithTitle = ensureJobTitle(job)

                  return (
                    <Card
                      key={job.id}
                      className="border-blue-100 hover:border-blue-200 transition-all duration-300 hover:shadow-lg overflow-hidden bg-white"
                    >
                      <CardHeader>
                        <CardTitle className="text-xl text-blue-800 mb-2">{jobWithTitle.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <Building2 className="h-4 w-4" />
                          <span>{jobWithTitle.company}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600">{jobWithTitle.industry}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600">
                              Deadline: {new Date(jobWithTitle.application_deadline).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="text-blue-600">{jobWithTitle.salary_range || "Not specified"}</span>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div
                            className="text-sm text-blue-700 line-clamp-3"
                            dangerouslySetInnerHTML={{
                              __html: jobWithTitle.description
                                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                .replace(/• (.*?)(?=\n|$)/g, "• $1")
                                .split("\n")
                                .slice(0, 3)
                                .join("<br>"),
                            }}
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {jobWithTitle.contact_email && (
                            <Button
                              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 flex-1"
                              asChild
                            >
                              <a
                                href={`mailto:${jobWithTitle.contact_email}?subject=Application for ${jobWithTitle.title}`}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                Apply via Email
                              </a>
                            </Button>
                          )}
                          {jobWithTitle.contact_phone && (
                            <Button
                              variant="outline"
                              className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex-1 bg-transparent"
                              asChild
                            >
                              <a href={`tel:${jobWithTitle.contact_phone}`}>
                                <Smartphone className="mr-2 h-4 w-4" />
                                Call Now
                              </a>
                            </Button>
                          )}
                          {jobWithTitle.application_url && (
                            <Button
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex-1"
                              asChild
                            >
                              <a href={jobWithTitle.application_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Apply Online
                              </a>
                            </Button>
                          )}
                          {/* Fallback for jobs without new contact fields */}
                          {!jobWithTitle.contact_email &&
                            !jobWithTitle.contact_phone &&
                            !jobWithTitle.application_url && (
                              <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-600"
                                asChild
                              >
                                <Link href="/agent/login">
                                  Apply Now
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No job opportunities are available at the moment. Please check back later!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Additional Services Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 mb-4">Additional Services</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Expand Your <span className="text-purple-600">Business</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Beyond data bundles, offer additional services to your customers and earn even more commissions
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-purple-100">
                  <CardHeader>
                    <div className="w-full h-56 bg-gray-200 rounded-lg animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services
                .filter((s) => s.service_type !== "data_bundle")
                .slice(0, 6)
                .map((service) => (
                  <Card
                    key={service.id}
                    className="border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-lg overflow-hidden"
                  >
                    {service.image_url && (
                      <div className="w-full h-56 overflow-hidden">
                        <img
                          src={service.image_url || "/placeholder.svg?height=224&width=400"}
                          alt={service.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground mb-4">
                        <RichTextRenderer content={service.description} />
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Commission</p>
                          <p className="text-2xl font-bold text-purple-600">
                            GH₵ {service.commission_amount.toLocaleString()}
                          </p>
                        </div>
                        <Button asChild className="bg-purple-600 hover:bg-purple-700">
                          <Link href="/agent/register">
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">What Our Agents Say</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Success <span className="text-emerald-600">Stories</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from our successful agents who are earning consistent income through our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg bg-white"
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-emerald-200">
                      <AvatarImage src={testimonial.image || "/placeholder.svg"} alt={testimonial.name} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-semibold">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 italic">"{testimonial.content}"</p>
                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Earnings</span>
                      <span className="font-bold text-emerald-600">{testimonial.earnings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold">Ready to Start Your Journey?</h2>
            <p className="text-xl opacity-90">
              Join thousands of successful agents earning consistent income through our platform. Start your Side gig
              business today!
            </p>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <p className="text-lg mb-2">💰 One-time joining fee</p>
              <p className="text-4xl font-bold mb-2">{getJoiningFeeFormatted()}</p>
              <p className="text-emerald-100">Start earning immediately after approval!</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-6"
              >
                <Link href="/agent/register">
                  Become an Agent
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-6 bg-transparent"
              >
                <Link href="/agent/login">Agent Login</Link>
              </Button>
            </div>

            <div className="mt-12 pt-8 border-t border-white/20">
              <h3 className="text-2xl font-bold mb-4">Don't Want to Register?</h3>
              <p className="text-lg opacity-90 mb-6">
                Access our affordable deals without registration! Get data bundles, ECG top-ups, software installation,
                MiFi devices, and more with no joining fees.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-6">
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <Smartphone className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Data Bundles</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <Zap className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">ECG Top-Up</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <Router className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">MiFi Devices</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <Download className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Software</p>
                </div>
              </div>
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="bg-white/20 text-white hover:bg-white hover:text-emerald-600 text-lg px-8 py-6 border border-white/30"
              >
                <Link href="/no-registration">
                  Browse Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mb-4">Get in Touch</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Need Help? <span className="text-emerald-600">We're Here</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our support team is available 24/7 to help you succeed. Reach out anytime!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>Phone Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Call us anytime for immediate assistance</p>
                <p className="font-semibold text-emerald-600">{getSupportPhone()}</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>WhatsApp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Quick support via WhatsApp</p>
                <p className="font-semibold text-emerald-600">{getSupportPhone()}</p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-lg text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Send us your questions anytime</p>
                <p className="font-semibold text-emerald-600">{getSupportEmail()}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppWidget />
      <BackToTop />
    </div>
  )
}
