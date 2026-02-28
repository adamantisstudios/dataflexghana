import type { Metadata } from "next";
import {
  ShieldCheck,
  FileText,
  Lock,
  Cookie,
  Users,
  Smartphone,
  CreditCard,
  TrendingUp,
  Shield,
  Globe,
  Home,
  BookOpen,
  GraduationCap,
  ShoppingCart,
  HelpCircle,
  Clock,
  Check,
  AlertCircle,
  X,
  Phone,
  Mail,
  Award,
  Wallet,
  BarChart,
  Building,
  Users as UsersIcon,
  Package,
  Target,
  Zap,
  Globe as GlobeIcon,
  Heart,
  Star,
  ChevronRight,
  MessageSquare,
  Megaphone,
  Radio,
  CheckCircle,
  Calendar,
  Lightbulb,
  Database,
  BarChart3,
  Share2,
  Archive,
  UserCheck,
  Settings,
  Wrench,
  Tag,
  Facebook,
  Twitter,
  Instagram,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CVImageDisplay } from "@/components/cv-image-display";

export const metadata: Metadata = {
  title: "Terms & Policies | Dataflex Ghana - Complete Agent Platform Documentation",
  description:
    "Full terms, conditions, policies, and guidelines for Dataflex Ghana agent platform. Includes GH₵47 platform entry fee, wallet policies, service terms, and professional profile writing service.",
  robots: "index,follow",
  keywords: "Dataflex Ghana terms, agent platform, GH₵47 fee, wallet policy, professional CV writing, Ghana data reseller",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-950">
      {/* Header with Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Dataflex Ghana</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Terms & Policies</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#overview" className="text-sm font-medium text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors">
                Overview
              </a>
              <a href="#fees" className="text-sm font-medium text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors">
                Fees
              </a>
              <a href="#services" className="text-sm font-medium text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors">
                Services
              </a>
              <a href="#wallet" className="text-sm font-medium text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 transition-colors">
                Wallet
              </a>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/register">Register Now</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/10 dark:to-blue-900/10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
              <ShieldCheck className="mr-2 h-3 w-3" />
              Official Documentation
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              <span className="block">Complete Platform</span>
              <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Terms & Policies
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Everything you need to know about the Dataflex Ghana platform. Agent guidelines, fee structure,
              service policies, and exclusive benefits for registered members.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="#fees" className="flex items-center">
                  View Entry Fee Details
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link href="#contact">Contact Support</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left Sidebar - Table of Contents */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
                    Quick Navigation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 sm:space-y-2">
                  {[
                    { id: "overview", label: "Platform Overview", icon: Globe },
                    { id: "fees", label: "Platform Entry Fee", icon: CreditCard },
                    { id: "profile-service", label: "Free Profile Service", icon: Award },
                    { id: "services", label: "Service Categories", icon: ShoppingCart },
                    { id: "wallet", label: "Wallet & Payments", icon: Wallet },
                    { id: "why-choose", label: "Why Choose Us", icon: Star },
                    { id: "agent-registration", label: "Agent Registration", icon: Users },
                    { id: "agent-rules", label: "Agent Rules", icon: Shield },
                    { id: "commission", label: "Commission System", icon: TrendingUp },
                    { id: "data-delivery", label: "Data Delivery", icon: Clock },
                    { id: "reporting", label: "Issue Reporting", icon: AlertCircle },
                    { id: "order-process", label: "Order Process", icon: ShoppingCart },
                    { id: "data-policy", label: "Data Sales Policy", icon: Smartphone },
                    { id: "payment-integration", label: "Payment Integration", icon: CreditCard },
                    { id: "wallet-refund", label: "Wallet Refund", icon: Wallet },
                    { id: "account-management", label: "Account Management", icon: UsersIcon },
                    { id: "platform-responsibilities", label: "Platform Responsibilities", icon: ShieldCheck },
                    { id: "usage-rules", label: "Usage Rules", icon: FileText },
                    { id: "dispute-resolution", label: "Dispute Resolution", icon: AlertCircle },
                    { id: "privacy-policy", label: "Privacy Policy", icon: Lock },
                    { id: "cookie-policy", label: "Cookie Policy", icon: Cookie },
                    { id: "contact", label: "Contact & Support", icon: Phone },
                  ].map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="flex items-center gap-3 rounded-lg p-3 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <item.icon className="h-4 w-4 text-gray-500" />
                      <span>{item.label}</span>
                    </a>
                  ))}
                </CardContent>
              </Card>

              {/* Important Notice */}
              <Card className="border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">
                        Critical Information
                      </h4>
                      <p className="text-sm text-amber-800 dark:text-amber-400">
                        Read all sections carefully. By using our platform, you agree to these terms in full.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-4 order-1 lg:order-2 space-y-10 sm:space-y-12">
            {/* Platform Overview */}
            <section id="overview" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-blue-100 px-4 py-2 dark:from-emerald-900/30 dark:to-blue-900/30 mb-4">
                  <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Platform Overview
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">About Dataflex Ghana Platform</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  Dataflex Ghana is Ghana's premier multi-service digital ecosystem, integrating business solutions,
                  digital services, and financial opportunities into one comprehensive platform.
                </p>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800 shadow-lg">
                <CardContent className="p-6 sm:p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {[
                      {
                        icon: Smartphone,
                        title: "Bulk Data Bundles",
                        description: "Affordable bulk data for MTN, AirtelTigo, Telecel networks",
                        color: "emerald",
                        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
                        iconColor: "text-emerald-600 dark:text-emerald-400",
                      },
                      {
                        icon: Home,
                        title: "Real Estate Promotion",
                        description: "Free property listing and promotion services",
                        color: "blue",
                        bgColor: "bg-blue-50 dark:bg-blue-900/20",
                        iconColor: "text-blue-600 dark:text-blue-400",
                      },
                      {
                        icon: TrendingUp,
                        title: "Investment Opportunities",
                        description: "Save, invest, and earn attractive returns",
                        color: "purple",
                        bgColor: "bg-purple-50 dark:bg-purple-900/20",
                        iconColor: "text-purple-600 dark:text-purple-400",
                      },
                      {
                        icon: Users,
                        title: "Service Referrals",
                        description: "Promote 50+ services and earn commissions",
                        color: "orange",
                        bgColor: "bg-orange-50 dark:bg-orange-900/20",
                        iconColor: "text-orange-600 dark:text-orange-400",
                      },
                      {
                        icon: FileText,
                        title: "Business Registration",
                        description: "Remote business registration in Ghana",
                        color: "amber",
                        bgColor: "bg-amber-50 dark:bg-amber-900/20",
                        iconColor: "text-amber-600 dark:text-amber-400",
                      },
                      {
                        icon: BookOpen,
                        title: "Professional Writing",
                        description: "Business plans, contracts, and documents",
                        color: "teal",
                        bgColor: "bg-teal-50 dark:bg-teal-900/20",
                        iconColor: "text-teal-600 dark:text-teal-400",
                      },
                      {
                        icon: GraduationCap,
                        title: "Teaching Channels",
                        description: "Learn from industry experts and mentors",
                        color: "indigo",
                        bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
                        iconColor: "text-indigo-600 dark:text-indigo-400",
                      },
                      {
                        icon: ShoppingCart,
                        title: "Wholesale Products",
                        description: "Exclusive wholesale catalog for resellers",
                        color: "cyan",
                        bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
                        iconColor: "text-cyan-600 dark:text-cyan-400",
                      },
                      {
                        icon: BarChart,
                        title: "Job Board",
                        description: "Curated job opportunities across industries",
                        color: "red",
                        bgColor: "bg-red-50 dark:bg-red-900/20",
                        iconColor: "text-red-600 dark:text-red-400",
                      },
                    ].map((service, index) => (
                      <div
                        key={index}
                        className={`${service.bgColor} rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-md`}
                      >
                        <div className={`p-3 ${service.bgColor} rounded-lg w-fit mb-4`}>
                          <service.icon className={`h-6 w-6 ${service.iconColor}`} />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{service.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Platform Entry Fee - NON-REFUNDABLE */}
            <section id="fees" className="scroll-mt-24 w-full">
              <div className="mb-8 w-full text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-red-100 px-4 py-2 dark:from-amber-900/30 dark:to-red-900/30 mb-4 w-fit mx-auto">
                  <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Platform Entry Fee
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">GH₵47 Platform Entry Fee</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  One-time lifetime access fee to the complete Dataflex Ghana ecosystem
                </p>
              </div>

              {/* Warning Banner */}
              <div className="mb-8 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 w-full">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  <div>
                    <h3 className="font-bold text-red-900 dark:text-red-300 text-lg">
                      IMPORTANT: NON-REFUNDABLE FEE
                    </h3>
                    <p className="text-red-800 dark:text-red-400 mt-1">
                      The GH₵47 platform entry fee is strictly non-refundable under any circumstances.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fee Display */}
              <div className="text-center mb-10">
                <div className="inline-block rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-1 mb-6">
                  <div className="rounded-xl bg-white dark:bg-gray-900 px-6 sm:px-12 py-6 sm:py-8">
                    <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">GH₵47</div>
                    <div className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-300">
                      One-Time Platform Entry Fee
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/30 px-4 py-2 w-fit mx-auto">
                      <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="font-bold text-red-700 dark:text-red-300 text-sm">NON-REFUNDABLE</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 w-full px-2 sm:px-0">
                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">What You Get</h3>
                  {[
                    "Lifetime access to all platform services",
                    "GH₵5 automatic wallet credit upon approval",
                    "Access to 50+ integrated services",
                    "No recurring fees or hidden charges",
                    "24/7 customer support included",
                    "Commission earnings from day one",
                    "Professional tools and resources",
                    "Regular platform updates and new features",
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-xl text-gray-900 dark:text-white">Fee Details</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Platform Entry Fee</span>
                        <span className="font-bold text-lg">GH₵47.00</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        One-time payment for lifetime access
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Auto Credit on Approval</span>
                        <span className="font-bold text-lg text-emerald-600">+ GH₵5.00</span>
                      </div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-400">
                        Immediate wallet credit to start using platform
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Total Value</span>
                        <span className="font-bold text-lg text-blue-600">GH₵52.00</span>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Immediate value received upon registration
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-6 w-full mb-10">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  Important Notes About the Entry Fee
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded">
                        <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Fee is non-refundable once paid
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded">
                        <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        No refunds for account suspension due to terms violation
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded">
                        <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        No refunds for voluntary account closure
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Fee covers lifetime platform access
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Includes all current and future services
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        No additional fees for platform usage
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 w-full mb-16">
                <h4 className="font-bold text-xl mb-6 text-center">Platform Fee Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  <div className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
                    <div className="text-xl sm:text-2xl font-bold mb-2">Free Platforms</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Monetize through ads and data selling
                    </p>
                    <div className="text-red-600 font-semibold">Hidden Costs</div>
                  </div>
                  <div className="p-4 sm:p-6 rounded-xl border-2 border-emerald-500 dark:border-emerald-600 text-center bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/10 dark:to-gray-900">
                    <div className="text-xl sm:text-2xl font-bold mb-2">Dataflex Ghana</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Transparent one-time GH₵47 fee
                    </p>
                    <div className="text-emerald-600 font-semibold">No Hidden Costs</div>
                  </div>
                  <div className="p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
                    <div className="text-xl sm:text-2xl font-bold mb-2">Monthly Platforms</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Recurring fees that add up over time
                    </p>
                    <div className="text-amber-600 font-semibold">Ongoing Costs</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Free Professional Profile Writing Service */}
            <section id="profile-service" className="scroll-mt-24 w-full">
              <div className="mb-8 w-full text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 dark:from-blue-900/30 dark:to-cyan-900/30 mb-4 w-fit mx-auto">
                  <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Exclusive Agent Benefit
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Free Professional Profile Writing Service</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                  Premium value-added service exclusively for registered Dataflex Ghana agents
                </p>
              </div>

              <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full mb-6 w-fit mx-auto">
                  <Award className="h-5 sm:h-6 w-5 sm:w-6" />
                  <span className="text-lg sm:text-xl font-bold">FREE FOR REGISTERED AGENTS</span>
                </div>
                <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                  Dataflex Ghana offers a comprehensive professional profile writing service completely free
                  to all registered agents. This exclusive benefit helps executives, professionals, and job
                  seekers enhance their career prospects.
                </p>
              </div>

              {/* Service Coverage */}
              <div className="mb-10 w-full">
                <h3 className="font-bold text-2xl mb-8 text-center text-gray-900 dark:text-white">
                  Service Coverage Includes:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
                  {[
                    {
                      title: "Professional Executive Profile",
                      description: "Executive summaries, leadership profiles, and professional bios tailored for senior roles",
                      icon: UsersIcon,
                      color: "blue",
                    },
                    {
                      title: "Resume & CV Writing",
                      description: "Complete resume and CV creation with ATS optimization and industry-specific formatting",
                      icon: FileText,
                      color: "emerald",
                    },
                    {
                      title: "Career Profile Enhancement",
                      description: "Profile optimization for LinkedIn and professional networking platforms",
                      icon: TrendingUp,
                      color: "purple",
                    },
                  ].map((service, index) => (
                    <div
                      key={index}
                      className={`bg-${service.color}-50 dark:bg-${service.color}-900/20 rounded-xl border border-${service.color}-200 dark:border-${service.color}-800 p-4 sm:p-6 text-center`}
                    >
                      <div className={`inline-flex p-3 sm:p-4 bg-${service.color}-100 dark:bg-${service.color}-900/30 rounded-full mb-4 w-fit mx-auto`}>
                        <service.icon className={`h-7 sm:h-8 w-7 sm:w-8 text-${service.color}-600 dark:text-${service.color}-400`} />
                      </div>
                      <h4 className="font-bold text-base sm:text-lg mb-3">{service.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{service.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Section - CV Template Display */}
              <div className="w-full bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg mb-10">
                <h3 className="font-bold text-xl sm:text-2xl mb-6 text-center text-gray-900 dark:text-white pt-6 sm:pt-8">
                  Professional CV Sample Format
                </h3>

                <div className="w-full px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-300 dark:border-gray-600 w-full">
                    {/* CV Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 sm:p-6">
                      <div className="flex items-center justify-between max-w-6xl mx-auto">
                        <div>
                          <h4 className="text-xl sm:text-2xl font-bold text-white mb-2">Professional CV Template</h4>
                          <p className="text-emerald-100 text-sm">Dataflex Ghana Agent Exclusive</p>
                        </div>
                        <div className="p-2 sm:p-3 bg-white/20 rounded-full">
                          <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* CV Content Area */}
                    <div className="w-full p-0">
                      <div className="grid grid-cols-1 lg:grid-cols-2 w-full">
                        {/* CV Image Display (Left) */}
                        <div className="w-full p-4 sm:p-6">
                          <CVImageDisplay />
                        </div>

                        {/* CV Features (Right) */}
                        <div className="space-y-4 sm:space-y-6 w-full p-4 sm:p-6">
                          <div>
                            <h5 className="font-bold text-base sm:text-lg mb-3 text-gray-900 dark:text-white">
                              Template Features:
                            </h5>
                            <ul className="space-y-2 sm:space-y-3">
                              <li className="flex items-start gap-2 sm:gap-3">
                                <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Professional A4 format design</span>
                              </li>
                              <li className="flex items-start gap-2 sm:gap-3">
                                <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">ATS-friendly layout</span>
                              </li>
                              <li className="flex items-start gap-2 sm:gap-3">
                                <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Modern, clean typography</span>
                              </li>
                              <li className="flex items-start gap-2 sm:gap-3">
                                <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Section-based organization</span>
                              </li>
                              <li className="flex items-start gap-2 sm:gap-3">
                                <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Customizable content areas</span>
                              </li>
                            </ul>
                          </div>

                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 sm:p-6 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3">
                              <Award className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                              <h5 className="font-bold text-base sm:text-lg text-emerald-900 dark:text-emerald-300">
                                Free for Registered Agents
                              </h5>
                            </div>
                            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
                              This professional CV template is provided completely free to all registered
                              Dataflex Ghana agents as part of our value-added service.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="w-full mb-10">
                <h3 className="font-bold text-xl sm:text-2xl mb-6 text-center text-gray-900 dark:text-white">
                  Service Details & Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-6xl mx-auto">
                  <div className="space-y-4">
                    <h4 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">Eligibility Requirements:</h4>
                    <ul className="space-y-2 sm:space-y-3">
                      <li className="flex items-start gap-2 sm:gap-3">
                        <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">Must be a registered agent on Dataflex Ghana platform</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">Must have completed GH₵47 platform entry fee payment</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base">Account must be in good standing with no violations</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">Service Limits:</h4>
                    <ul className="space-y-2 sm:space-y-3">
                      <li className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                          <FileText className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm sm:text-base">One free professional profile or resume per agent</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                          <Clock className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm sm:text-base">Processing time: 3-5 business days</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                          <Award className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm sm:text-base">Completely free with no hidden charges</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How to Request */}
              <div className="w-full rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 sm:p-8 border border-blue-200 dark:border-blue-800 mb-16">
                <div className="text-center mb-6">
                  <h3 className="font-bold text-xl sm:text-2xl mb-3 text-blue-900 dark:text-blue-300">
                    How to Request Your Free Profile Service
                  </h3>
                  <p className="text-blue-800 dark:text-blue-400 text-sm sm:text-base">
                    Follow these simple steps to access your free professional profile writing service
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
                  {[
                    { number: "1", title: "Register", desc: "Become a Dataflex Ghana agent" },
                    { number: "2", title: "Pay Fee", desc: "Complete GH₵47 platform entry fee" },
                    { number: "3", title: "Contact", desc: "Call or WhatsApp our support team" },
                    { number: "4", title: "Receive", desc: "Get your professional profile" },
                  ].map((step, index) => (
                    <div key={index} className="text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-lg sm:text-xl mb-3 mx-auto">
                        {step.number}
                      </div>
                      <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="inline-flex p-1 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-2 sm:mb-3">
                          <div className="text-blue-600 text-sm sm:text-base">{step.title.charAt(0)}</div>
                        </div>
                        <h5 className="font-bold mb-1 text-sm sm:text-base">{step.title}</h5>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Phone className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Contact Support</div>
                        <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">+233 551 999 901</div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Required Information</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        Full Name • Contact Details • Agent ID
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
                    Provide your registered agent details for prompt preparation of your profile or resume
                  </p>
                </div>
              </div>

              {/* Terms for Profile Service */}
              <div className="w-full mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 mb-16">
                <h4 className="font-bold text-xl mb-4 text-gray-900 dark:text-white text-center">
                  Terms for Free Profile Service:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-4xl mx-auto">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-sm sm:text-base">Service Availability</h5>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Available only to registered agents</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-sm sm:text-base">No Hidden Charges</h5>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Completely free with no additional fees</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded">
                        <AlertCircle className="h-3 sm:h-4 w-3 sm:w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm sm:text-base">One-Time Service</h5>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Limited to one profile per agent</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <div className="p-1 bg-amber-100 dark:bg-amber-900/30 rounded">
                        <AlertCircle className="h-3 sm:h-4 w-3 sm:w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm sm:text-base">Agent Status</h5>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Must maintain active agent status</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* Wallet Funding & Payment Reward Policy */}
            <section id="wallet" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 dark:from-emerald-900/30 dark:to-teal-900/30 mb-4">
                  <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Wallet & Payment Policy
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Wallet Funding & Payment Reward Policy</h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  Incentives for funding your wallet and using wallet payments for transactions
                </p>
              </div>

              <Card className="border border-emerald-200 dark:border-emerald-800 shadow-lg">
                <CardContent className="p-6 sm:p-8">
                  {/* Purpose */}
                  <div className="mb-8 sm:mb-10">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <Target className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-emerald-900 dark:text-emerald-300">Policy Purpose</h3>
                        <p className="text-emerald-800 dark:text-emerald-400 text-sm sm:text-base">
                          This policy encourages customers and agents to fund their wallets and make payments
                          directly from their wallet instead of manual payments.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Funding Requirement */}
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded">
                        <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      Wallet Funding Requirements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 sm:p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 text-amber-900 dark:text-amber-300">Qualifying Funding</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                            <span className="text-sm">Minimum funding amount: 500 Ghana Cedis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                            <span className="text-sm">Single transaction of 500 GHS or more</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                            <span className="text-sm">Funds must be used for wallet payments</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/10 p-4 sm:p-6 rounded-xl border border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 text-red-900 dark:text-red-300">Non-Qualifying Funding</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            <span className="text-sm">Funding below 500 Ghana Cedis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            <span className="text-sm">Multiple small transactions totalling 500 GHS</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            <span className="text-sm">Funds not used for wallet payments</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                 {/* Reward Structure Table */}
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                        <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                      Reward Structure for Wallet Funding
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                      <table className="w-full min-w-[500px]">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th className="p-3 sm:p-4 text-left font-bold border-b text-sm">Funding Amount (GHS)</th>
                            <th className="p-3 sm:p-4 text-left font-bold border-b text-sm">Reward Amount (GHS)</th>
                            <th className="p-3 sm:p-4 text-left font-bold border-b text-sm">Conditions</th>
                            <th className="p-3 sm:p-4 text-left font-bold border-b text-sm">Payment Timing</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">500–1,000</td>
                            <td className="p-3 sm:p-4">
                              <span className="inline-flex items-center gap-2">
                                <span className="text-base sm:text-lg font-bold text-green-600">5-7</span>
                                <span className="text-xs sm:text-sm text-gray-500">GHS</span>
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600">After successful wallet payment</td>
                            <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600">Within 24 hours</td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">2,000–4,900</td>
                            <td className="p-3 sm:p-4">
                              <span className="inline-flex items-center gap-2">
                                <span className="text-base sm:text-lg font-bold text-green-600">7-10</span>
                                <span className="text-xs sm:text-sm text-gray-500">GHS</span>
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600">After successful wallet payment</td>
                            <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600">Within 24 hours</td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">5,000+</td>
                            <td className="p-3 sm:p-4">
                              <span className="inline-flex items-center gap-2">
                                <span className="text-base sm:text-lg font-bold text-green-600">10-30</span>
                                <span className="text-xs sm:text-sm text-gray-500">GHS</span>
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600">After successful wallet payment</td>
                            <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600">Within 24 hours</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-3 sm:mt-4">
                      <strong>Note:</strong> Rewards are applied once per qualifying wallet funding and only after
                      a successful wallet payment has been made. Minimum funding amount to qualify is 500 GHS.
                    </p>
                  </div>

                  {/* Reward Conditions */}
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <Lock className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Reward Conditions & Restrictions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="font-bold text-base sm:text-lg text-blue-900 dark:text-blue-300">Qualifying Actions</h4>
                        <ul className="space-y-2 sm:space-y-3">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Reward credited only after successful wallet payment</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Minimum 500 GHS funding in single transaction</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Wallet payment must be for platform services</span>
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <h4 className="font-bold text-base sm:text-lg text-red-900 dark:text-red-300">Non-Qualifying Actions</h4>
                        <ul className="space-y-2 sm:space-y-3">
                          <li className="flex items-start gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Funding without making wallet payment</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Manual payments (non-wallet transactions)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Rewards are not withdrawable as cash</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Wallet Balance Withdrawal */}
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <CreditCard className="h-4 sm:h-5 w-4 sm:w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      Wallet Balance Withdrawal Policy
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      <div className="bg-purple-50 dark:bg-purple-900/10 p-4 sm:p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                        <h4 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-purple-900 dark:text-purple-300">Minimum Balance</h4>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="text-2xl sm:text-3xl font-bold text-purple-600">500</div>
                          <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-400">
                            GHS minimum for withdrawal requests
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/10 p-4 sm:p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                        <h4 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-purple-900 dark:text-purple-300">Processing Time</h4>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-purple-600" />
                          <div>
                            <div className="text-base sm:text-lg font-bold">14 working days</div>
                            <div className="text-xs sm:text-sm text-purple-700">After submission</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/10 p-4 sm:p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                        <h4 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-purple-900 dark:text-purple-300">Withdrawal Method</h4>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Wallet className="h-6 sm:h-8 w-6 sm:w-8 text-purple-600" />
                          <div>
                            <div className="text-base sm:text-lg font-bold">Mobile Money</div>
                            <div className="text-xs sm:text-sm text-purple-700">To registered number</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 p-6 sm:p-8 border border-red-200 dark:border-red-800">
                    <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                        <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400" />
                      </div>
                      Important Policy Notes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1 text-sm sm:text-base">Policy Changes</h4>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400">
                              Dataflex Ghana reserves the right to adjust or withdraw this wallet reward policy
                              at any time without prior notice.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1 text-sm sm:text-base">Abuse Prevention</h4>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400">
                              Any abuse, manipulation, or fraudulent activity related to wallet funding or
                              rewards may lead to immediate suspension of wallet privileges and rewards.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1 text-sm sm:text-base">Platform Discretion</h4>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400">
                              All reward allocations are at the sole discretion of Dataflex Ghana management.
                              Decisions regarding reward eligibility are final.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold mb-1 text-sm sm:text-base">Account Standing</h4>
                            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-400">
                              Accounts must be in good standing with no terms violations to qualify for
                              wallet rewards and withdrawal privileges.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Policy Summary</h3>
                      <div className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 p-6 sm:p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                          <div className="p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <ShieldCheck className="h-6 sm:h-8 w-6 sm:w-8 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-lg sm:text-xl mb-2 text-emerald-900 dark:text-emerald-300">
                              Key Takeaways
                            </h4>
                            <p className="text-emerald-800 dark:text-emerald-400 text-sm sm:text-base">
                              Fund your wallet with at least 500 GHS, make payments from your wallet, earn rewards,
                              and optionally withdraw your balance after 14 working days.
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                          <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-600">500 GHS</div>
                            <div className="text-xs sm:text-sm text-gray-600">Minimum Funding</div>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-600">7-10 GHS</div>
                            <div className="text-xs sm:text-sm text-gray-600">Reward Range</div>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="text-xl sm:text-2xl font-bold text-emerald-600">14 Days</div>
                            <div className="text-xs sm:text-sm text-gray-600">Withdrawal Processing</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Agent Registration & Fees */}
            <section id="agent-registration" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 dark:from-amber-900/30 dark:to-orange-900/30 mb-4">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Agent Registration
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Agent Registration & Platform Entry</h2>
              </div>

              <Card className="border border-amber-200 dark:border-amber-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-amber-900 dark:text-amber-300">
                      GH₵47 Platform Entry Fee + GH₵5 Auto-Credit
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                      The Dataflex Ghana agent registration process includes a one-time platform entry fee that
                      provides lifetime access to our complete business ecosystem.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Why Choose Dataflex */}
                    <div>
                      <h4 className="font-bold text-lg sm:text-xl mb-3 sm:mb-4 text-gray-900 dark:text-white">
                        Why Choose Dataflex at GH₵47?
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                        Unlike most free platforms that monetize through ads or data selling, Dataflex operates
                        with complete transparency. Our GH₵47 one-time fee is an investment in a comprehensive
                        business ecosystem with 50+ revenue streams.
                      </p>
                      <ul className="space-y-2 sm:space-y-3">
                        {[
                          "Access to 50+ earning services immediately",
                          "No recurring fees or hidden charges ever",
                          "GH₵5 automatic wallet credit upon approval",
                          "Lifetime access to all platform services",
                          "24/7 customer support included",
                          "Multiple commission streams available",
                          "Professional tools and resources",
                          "Regular platform updates and new features",
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-2 sm:gap-3">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Auto Credit Details */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 p-6 sm:p-8 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-emerald-900 dark:text-emerald-300">
                        Automatic Wallet Credit Explained
                      </h4>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold mb-1 text-sm sm:text-base">Timing</h5>
                            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
                              Your wallet is credited with GH₵5 immediately after admin approves your registration
                              (usually within 24-48 hours).
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Wallet className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold mb-1 text-sm sm:text-base">Usage</h5>
                            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
                              Use the credit to purchase data bundles, digital products, or any services on the platform.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Target className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold mb-1 text-sm sm:text-base">Purpose</h5>
                            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
                              Designed to help you test the system and make your first purchases immediately.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3">
                          <Zap className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-semibold mb-1 text-sm sm:text-base">No Expiration</h5>
                            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
                              Your wallet credit has no expiration date. Use it whenever you're ready.
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm sm:text-base">Auto Credit Value:</span>
                          <span className="text-xl sm:text-2xl font-bold text-emerald-600">GH₵5.00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registration Process */}
                  <div className="mt-8 sm:mt-12 pt-8 sm:pt-12 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold text-xl sm:text-2xl mb-6 sm:mb-8 text-center text-gray-900 dark:text-white">
                      Agent Registration Process
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4">
                      {[
                        {
                          step: "01",
                          title: "Visit Platform",
                          desc: "Go to DataflexGhana.com",
                          icon: GlobeIcon,
                        },
                        {
                          step: "02",
                          title: "Register",
                          desc: "Fill agent registration form",
                          icon: FileText,
                        },
                        {
                          step: "03",
                          title: "Pay Fee",
                          desc: "Complete GH₵47 platform entry fee",
                          icon: CreditCard,
                        },
                        {
                          step: "04",
                          title: "Get Approved",
                          desc: "Receive GH₵5 credit & start earning",
                          icon: Check,
                        },
                      ].map((step, index) => (
                        <div key={index} className="text-center">
                          <div className="relative mb-3 sm:mb-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-lg sm:text-xl">
                              {step.step}
                            </div>
                            <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-300 dark:bg-gray-700 hidden md:block"></div>
                          </div>
                          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="inline-flex p-1 sm:p-2 bg-white dark:bg-gray-800 rounded-lg mb-2 sm:mb-3">
                              <step.icon className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h5 className="font-bold mb-1 text-sm sm:text-base">{step.title}</h5>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="mt-8 sm:mt-12 p-6 sm:p-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-bold text-xl sm:text-2xl mb-4 sm:mb-6 text-center text-gray-900 dark:text-white">
                      Fee Structure Breakdown
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Description</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Amount (GHS)</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Type</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">Platform Entry Fee</td>
                            <td className="p-3 sm:p-4">
                              <span className="text-lg sm:text-xl font-bold text-amber-600">47.00</span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm">
                                <CreditCard className="h-3 w-3" />
                                One-time
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400 text-sm">Once only</td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">Auto Wallet Credit</td>
                            <td className="p-3 sm:p-4">
                              <span className="text-lg sm:text-xl font-bold text-emerald-600">+5.00</span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm">
                                <Wallet className="h-3 w-3" />
                                Credit
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400 text-sm">On approval</td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">Total Immediate Value</td>
                            <td className="p-3 sm:p-4">
                              <span className="text-xl sm:text-2xl font-bold text-blue-600">52.00</span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs sm:text-sm">
                                <Award className="h-3 w-3" />
                                Value
                              </span>
                            </td>
                            <td className="p-3 sm:p-4 text-gray-600 dark:text-gray-400 text-sm">Immediate</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Non-Refundable Warning */}
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-red-50 to-amber-50 dark:from-red-900/10 dark:to-amber-900/10 rounded-xl border-2 border-red-300 dark:border-red-700">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <AlertCircle className="h-6 sm:h-8 w-6 sm:w-8 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div>
                        <h5 className="font-bold text-base sm:text-lg text-red-900 dark:text-red-300 mb-2">
                          NON-REFUNDABLE FEE ACKNOWLEDGEMENT
                        </h5>
                        <p className="text-red-800 dark:text-red-400 text-sm sm:text-base">
                          By proceeding with agent registration and paying the GH₵47 platform entry fee, you
                          acknowledge and agree that this fee is strictly non-refundable under any circumstances,
                          including but not limited to account suspension, voluntary closure, or any other reason.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Agent Rules */}
            <section id="agent-rules" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-100 to-orange-100 px-4 py-2 dark:from-red-900/30 dark:to-orange-900/30 mb-4">
                  <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">
                    Agent Rules & Guidelines
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Agent Conduct & Operational Rules</h2>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {/* Data Resale Restrictions */}
                <Card className="border border-red-200 dark:border-red-800">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-red-900 dark:text-red-300">
                      Data Resale Restrictions
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 sm:p-6 rounded-xl border border-red-200 dark:border-red-800 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400" />
                        <h4 className="font-bold text-base sm:text-lg text-red-900 dark:text-red-300">Important Notice</h4>
                      </div>
                      <p className="text-red-800 dark:text-red-400 text-sm sm:text-base">
                        Data bundles purchased through the Dataflex Ghana platform are exclusively for resale to
                        friends, relatives, and close acquaintances only. This is NOT a public retail service.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* SIM Card Restrictions */}
                <Card className="border border-red-200 dark:border-red-800">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-red-900 dark:text-red-300">
                      SIM Card Restrictions
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 sm:p-6 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400" />
                        <h4 className="font-bold text-base sm:text-lg text-red-900 dark:text-red-300">
                          We Do NOT Serve These SIM Types
                        </h4>
                      </div>
                      <p className="text-red-800 dark:text-red-400 mb-4 sm:mb-6 text-sm sm:text-base">
                        No refunds will be provided for orders placed on these SIM types. Verify SIM type before ordering.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                        {[
                          "Agent SIM", "Merchant SIM", "EVD SIM", "Turbonet SIM", "Broadband SIM",
                          "Blacklisted SIM", "Roaming SIM", "Company/Group SIM", "Different network",
                          "Wrong/Invalid numbers"
                        ].map((simType, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-100 dark:border-red-900">
                            <X className="h-3 sm:h-4 w-3 sm:w-4 text-red-500" />
                            <span className="text-xs sm:text-sm font-medium">{simType}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <p className="font-bold text-red-900 dark:text-red-300 text-center text-sm sm:text-base">
                          VERIFY SIM TYPE BEFORE ORDERING. NO REFUNDS FOR THESE SIM TYPES.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Promotion Channels */}
                <Card className="border border-gray-200 dark:border-gray-800">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-6 sm:mb-8 text-gray-900 dark:text-white">
                      Promotion Channels Guidelines
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                      {/* Allowed Channels */}
                      <div>
                        <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-emerald-900 dark:text-emerald-300">
                          <div className="p-1 sm:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          Allowed Promotion Channels
                        </h4>
                        <ul className="space-y-2 sm:space-y-3">
                          <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                            <Users className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm sm:text-base">WhatsApp groups (private/personal)</span>
                          </li>
                          <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                            <Heart className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm sm:text-base">Close friends & family</span>
                          </li>
                          <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                            <UsersIcon className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm sm:text-base">Trusted associates and colleagues</span>
                          </li>
                          <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                            <MessageSquare className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm sm:text-base">Personal messaging and communication</span>
                          </li>
                        </ul>
                      </div>

                      {/* Forbidden Channels */}
                      <div>
                        <h4 className="font-bold text-base sm:text-lg mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-red-900 dark:text-red-300">
                          <div className="p-1 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400" />
                          </div>
                          Forbidden Promotion Channels
                        </h4>
                        <ul className="space-y-2 sm:space-y-3">
                          <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <Globe className="h-4 w-4 text-red-600" />
                            <span className="text-sm sm:text-base">TikTok, Facebook, Instagram, LinkedIn, X (Twitter)</span>
                          </li>
                          <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <Megaphone className="h-4 w-4 text-red-600" />
                            <span className="text-sm sm:text-base">Public advertising using Dataflex brand name</span>
                          </li>
                          <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <ShoppingCart className="h-4 w-4 text-red-600" />
                            <span className="text-sm sm:text-base">Public marketplaces or e-commerce platforms</span>
                          </li>
                          <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <Radio className="h-4 w-4 text-red-600" />
                            <span className="text-sm sm:text-base">Radio, TV, or print media advertisements</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Violation Warning */}
                    <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <AlertCircle className="h-5 sm:h-6 w-5 sm:w-6 text-red-600 dark:text-red-400" />
                        <div>
                          <h4 className="font-bold text-base sm:text-lg text-red-900 dark:text-red-300 mb-1 sm:mb-2">
                            Violation Consequences
                          </h4>
                          <p className="text-red-800 dark:text-red-400 italic text-sm sm:text-base">
                            Violation of promotion channel guidelines results in permanent ban and loss of all
                            agent privileges. No refunds of entry fees or outstanding commissions.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Commission System */}
            <section id="commission" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 dark:from-green-900/30 dark:to-emerald-900/30 mb-4">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Commission System
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Commission System & Earnings</h2>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                      Multiple Revenue Streams
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
                      Dataflex Ghana provides multiple commission streams for agents to maximize earning potential.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
                    {[
                      {
                        title: "Data Bundle Commissions",
                        description: "Earn competitive commissions on every data bundle sale with varying rates by bundle type",
                        icon: Smartphone,
                        color: "blue",
                        commissions: "3-15% per sale",
                      },
                      {
                        title: "Service Referral Commissions",
                        description: "Fixed commission amounts for successful service referrals and completed projects",
                        icon: Users,
                        color: "purple",
                        commissions: "Fixed rates",
                      },
                      {
                        title: "Wholesale Product Commissions",
                        description: "Commission on wholesale product sales with transparent commission structures",
                        icon: Package,
                        color: "amber",
                        commissions: "5-20% per sale",
                      },
                    ].map((stream, index) => (
                      <div
                        key={index}
                        className={`bg-${stream.color}-50 dark:bg-${stream.color}-900/20 rounded-xl border border-${stream.color}-200 dark:border-${stream.color}-800 p-4 sm:p-6`}
                      >
                        <div className={`inline-flex p-2 sm:p-3 bg-${stream.color}-100 dark:bg-${stream.color}-900/30 rounded-lg mb-3 sm:mb-4`}>
                          <stream.icon className={`h-5 sm:h-6 w-5 sm:w-6 text-${stream.color}-600 dark:text-${stream.color}-400`} />
                        </div>
                        <h4 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">{stream.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 sm:mb-4">{stream.description}</p>
                        <div className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full bg-${stream.color}-100 dark:bg-${stream.color}-900/30`}>
                          <TrendingUp className={`h-3 w-3 text-${stream.color}-600`} />
                          <span className={`text-xs sm:text-sm font-semibold text-${stream.color}-800 dark:text-${stream.color}-300`}>
                            {stream.commissions}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Withdrawal System */}
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 p-6 sm:p-8 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-bold text-xl sm:text-2xl mb-4 sm:mb-6 text-emerald-900 dark:text-emerald-300">
                      Commission Withdrawal System
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                      <div className="text-center">
                        <div className="inline-flex p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3 sm:mb-4">
                          <Wallet className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h5 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">Request Anytime</h5>
                        <p className="text-xs sm:text-sm text-gray-600">Withdraw commissions anytime</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3 sm:mb-4">
                          <Clock className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h5 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">Processing Time</h5>
                        <p className="text-xs sm:text-sm text-gray-600">24-48 hours processing</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3 sm:mb-4">
                          <Smartphone className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h5 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">Payment Method</h5>
                        <p className="text-xs sm:text-sm text-gray-600">Mobile Money transfer</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3 sm:mb-4">
                          <CreditCard className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h5 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">Minimum Withdrawal</h5>
                        <p className="text-xs sm:text-sm text-gray-600">No minimum amount</p>
                      </div>
                    </div>
                  </div>

                  {/* Commission Example */}
                  <div className="mt-8 sm:mt-10 p-6 sm:p-8 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-gray-900 dark:text-white">
                      Commission Earnings Example
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-800">
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Service Type</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Transaction Value</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Commission Rate</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Agent Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">Data Bundle Sale</td>
                            <td className="p-3 sm:p-4 text-sm">GH₵100</td>
                            <td className="p-3 sm:p-4">
                              <span className="text-emerald-600 font-semibold text-sm">10%</span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="font-bold text-base sm:text-lg">GH₵10</span>
                            </td>
                          </tr>
                          <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">Service Referral</td>
                            <td className="p-3 sm:p-4 text-sm">GH₵500</td>
                            <td className="p-3 sm:p-4">
                              <span className="text-emerald-600 font-semibold text-sm">Fixed GH₵50</span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="font-bold text-base sm:text-lg">GH₵50</span>
                            </td>
                          </tr>
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                            <td className="p-3 sm:p-4 font-semibold text-sm">Wholesale Product</td>
                            <td className="p-3 sm:p-4 text-sm">GH₵1,000</td>
                            <td className="p-3 sm:p-4">
                              <span className="text-emerald-600 font-semibold text-sm">15%</span>
                            </td>
                            <td className="p-3 sm:p-4">
                              <span className="font-bold text-base sm:text-lg">GH₵150</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Data Delivery & Processing Times */}
            <section id="data-delivery" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 dark:from-amber-900/30 dark:to-orange-900/30 mb-4">
                  <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Data Delivery Times
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Data Delivery & Processing Times</h2>
              </div>

              <Card className="border border-amber-200 dark:border-amber-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-amber-900 dark:text-amber-300">
                      Why Data Delivery Takes Time
                    </h3>
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 sm:p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                      <p className="text-amber-800 dark:text-amber-400 mb-3 sm:mb-4 text-sm sm:text-base">
                        <strong>Question:</strong> Why does data take time to deliver?
                      </p>
                      <p className="text-amber-800 dark:text-amber-400 text-sm sm:text-base">
                        <strong>Answer:</strong> Data delivery takes 10 minutes to 24 hours depending on several factors:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-10">
                    {[
                      {
                        title: "Time of Order",
                        points: [
                          "Early morning orders (6–10am) process fastest",
                          "Peak hours (11am–4pm) may take up to an hour",
                          "Evening (5pm–9:30pm) processing varies",
                          "Orders after 9:30pm process after we reopen at 6am",
                        ],
                        icon: Clock,
                        color: "amber",
                      },
                      {
                        title: "Network Conditions",
                        points: [
                          "Network providers perform maintenance affecting delivery",
                          "System upgrades and technical issues",
                          "Peak network congestion periods",
                          "Regional network stability variations",
                        ],
                        icon: Zap,
                        color: "blue",
                      },
                      {
                        title: "Operational Hours",
                        points: [
                          "Active from 6:00 AM to 9:30 PM daily",
                          "Orders during closed period (9:30 PM to 6:00 AM) process after reopening",
                          "Sundays operate normally but delivery may be slower",
                          "Holiday periods may have extended processing times",
                        ],
                        icon: Building,
                        color: "purple",
                      },
                    ].map((factor, index) => (
                      <div key={index} className={`bg-${factor.color}-50 dark:bg-${factor.color}-900/10 p-4 sm:p-6 rounded-xl border border-${factor.color}-200 dark:border-${factor.color}-800`}>
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className={`p-1 sm:p-2 bg-${factor.color}-100 dark:bg-${factor.color}-900/30 rounded-lg`}>
                            <factor.icon className={`h-4 sm:h-5 w-4 sm:w-5 text-${factor.color}-600 dark:text-${factor.color}-400`} />
                          </div>
                          <h4 className="font-bold text-base sm:text-lg">{factor.title}</h4>
                        </div>
                        <ul className="space-y-1 sm:space-y-2">
                          {factor.points.map((point, pointIndex) => (
                            <li key={pointIndex} className="flex items-start gap-2">
                              <div className={`p-1 bg-${factor.color}-100 dark:bg-${factor.color}-900/30 rounded mt-0.5`}>
                                <div className={`h-1.5 w-1.5 rounded-full bg-${factor.color}-600`}></div>
                              </div>
                              <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Critical: Reporting Delays */}
                  <div className="rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 p-6 sm:p-8 border-2 border-red-300 dark:border-red-700">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <AlertCircle className="h-6 sm:h-8 w-6 sm:w-8 text-red-600 dark:text-red-400" />
                      <h3 className="text-xl sm:text-2xl font-bold text-red-900 dark:text-red-300">
                        CRITICAL: Reporting Delays Protocol
                      </h3>
                    </div>

                    <div className="mb-6 sm:mb-8">
                      <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-red-900 dark:text-red-300">
                        When to Report Issues
                      </h4>
                      <p className="text-red-800 dark:text-red-400 mb-3 sm:mb-4 text-sm sm:text-base">
                        Report immediately if a data order is marked as <strong>"Completed"</strong> but the client
                        hasn't received the bundle AND the delay exceeds <strong>1 hour</strong>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <div>
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-red-900 dark:text-red-300">Required Information</h4>
                        <ul className="space-y-2 sm:space-y-3">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Client's current data balance screenshot (with timestamp)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Order details from the agent platform</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm">Phone number and specific bundle ordered</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-red-900 dark:text-red-300">Contact Method</h4>
                        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border border-red-200">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <Phone className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            <span className="font-bold text-base sm:text-lg">WhatsApp: +233242799990</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600">Contact admin with all required information</p>
                        </div>
                      </div>
                    </div>

                    {/* Time Limit Warning */}
                    <div className="p-4 sm:p-6 bg-red-100 dark:bg-red-900/30 rounded-xl border border-red-300 dark:border-red-800">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <AlertCircle className="h-5 sm:h-6 w-5 sm:w-6 text-red-600 dark:text-red-400" />
                        <div>
                          <h4 className="font-bold text-base sm:text-lg text-red-900 dark:text-red-300 mb-1 sm:mb-2">
                            TIME LIMIT WARNING
                          </h4>
                          <p className="text-red-800 dark:text-red-400 text-sm sm:text-base">
                            <strong>Failure to report within 24 hours</strong> means the issue{" "}
                            <strong>cannot be resolved</strong>. No refunds or resends will be possible after
                            24 hours from order completion time.
                          </p>
                          <p className="text-red-800 dark:text-red-400 mt-1 sm:mt-2 font-semibold text-sm sm:text-base">
                            Note: Dataflex Ghana is not liable for unresolved issues due to late reporting.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* How to Report Issues */}
            <section id="reporting" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-100 to-pink-100 px-4 py-2 dark:from-red-900/30 dark:to-pink-900/30 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">
                    Issue Reporting
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">How to Report Issues & Problems</h2>
              </div>

              <div className="space-y-6 sm:space-y-8">
                {/* When NOT to Contact Support */}
                <Card className="border border-red-200 dark:border-red-800">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-red-900 dark:text-red-300">
                      When NOT to Contact Support
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 sm:p-6 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400" />
                        <h4 className="font-bold text-base sm:text-lg">Do Not Contact Support For:</h4>
                      </div>
                      <p className="text-red-800 dark:text-red-400 text-sm sm:text-base">
                        If your order status is <strong>Pending</strong> or <strong>Processing</strong>, do NOT
                        contact support. We will ignore you. Wait for delivery to complete.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Critical: Client SIM Requirements */}
                <Card className="border border-amber-200 dark:border-amber-800">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <AlertCircle className="h-6 sm:h-8 w-6 sm:w-8 text-amber-600 dark:text-amber-400" />
                      <h3 className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-300">
                        CRITICAL: Client SIM Requirements Before Ordering
                      </h3>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 sm:p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-amber-900 dark:text-amber-300">
                          You may ONLY report a completed order if the client's SIM card meets BOTH requirements:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            <div>
                              <h5 className="font-semibold text-sm sm:text-base">No Data Debt</h5>
                              <p className="text-xs sm:text-sm text-gray-600">SIM does NOT owe data bundles</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            <div>
                              <h5 className="font-semibold text-sm sm:text-base">No Mobile Money Debt</h5>
                              <p className="text-xs sm:text-sm text-gray-600">SIM does NOT owe mobile money (momo)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/10 p-4 sm:p-6 rounded-xl border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 dark:text-red-400" />
                          <h4 className="font-bold text-base sm:text-lg text-red-900 dark:text-red-300">
                            IMPORTANT WARNING
                          </h4>
                        </div>
                        <p className="text-red-800 dark:text-red-400 mb-2 sm:mb-3 text-sm sm:text-base">
                          If the SIM owes data or momo, it is 99% likely the order will fail. In that situation,
                          we cannot be blamed and the money paid cannot be recovered.
                        </p>
                        <div className="bg-red-100 dark:bg-red-900/30 p-3 sm:p-4 rounded-lg">
                          <p className="font-bold text-red-900 dark:text-red-300 text-sm sm:text-base">
                            Who loses in this situation? The client loses. We have also lost the money since
                            we paid for the data. This is why data is not given for free.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Responsibility */}
                <Card className="border border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-blue-900 dark:text-blue-300">
                      Agent Responsibility: Client Verification
                    </h3>

                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 sm:p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-blue-900 dark:text-blue-300">
                          Mandatory Client Verification
                        </h4>
                        <p className="text-blue-800 dark:text-blue-400 mb-3 sm:mb-4 text-sm sm:text-base">
                          The agent is <strong>REQUIRED</strong> to confirm from the client whether they owe any
                          data or momo on their SIM before proceeding with an order.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <h5 className="font-semibold mb-1 sm:mb-2 text-green-700 dark:text-green-400 text-sm sm:text-base">If Client Confirms Debt</h5>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Processing may fail. <strong>Do not proceed with the order.</strong>
                            </p>
                          </div>
                          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                            <h5 className="font-semibold mb-1 sm:mb-2 text-red-700 dark:text-red-400 text-sm sm:text-base">If Client Hides Debt</h5>
                            <p className="text-xs sm:text-sm text-gray-600">
                              Responsibility is <strong>NOT on the agent</strong>. It is on the client.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-100 dark:bg-blue-900/30 p-4 sm:p-6 rounded-lg">
                        <p className="font-bold text-blue-900 dark:text-blue-300 text-center text-sm sm:text-base">
                          Any financial loss due to client SIM debt cannot be recovered. Such money is
                          unrecoverable once the failed transaction occurs.
                        </p>
                      </div>

                      <div className="text-center">
                        <p className="font-medium text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                          For smooth operations, always confirm with clients before processing any order.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What to Report */}
                <Card className="border border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-emerald-900 dark:text-emerald-300">
                      What to Share When Reporting Issues
                    </h3>

                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 sm:p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <p className="text-emerald-800 dark:text-emerald-400 mb-3 sm:mb-4 text-sm sm:text-base">
                          If you've confirmed the client does NOT owe data or momo and data still wasn't received,
                          provide the following information:
                        </p>
                        <div className="space-y-2 sm:space-y-3">
                          {[
                            "Screenshot of the client's current data balance (with time clearly shown)",
                            "The phone number you bundled data for and the specific bundle purchased",
                            "Screenshot of the order from the agent platform",
                            "Transaction reference number if available",
                            "Time of order placement",
                          ].map((item, index) => (
                            <div key={index} className="flex items-start gap-2 sm:gap-3">
                              <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 sm:pt-6 border-t border-emerald-200 dark:border-emerald-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-emerald-900 dark:text-emerald-300">
                          After Submission Process
                        </h4>
                        <p className="text-emerald-800 dark:text-emerald-400 mb-3 sm:mb-4 text-sm sm:text-base">
                          We will forward the details to our engineers for investigation. Possible outcomes:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                          <div className="text-center p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                            <div className="inline-flex p-1 sm:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-2 sm:mb-3">
                              <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                            </div>
                            <h5 className="font-semibold text-sm sm:text-base">Issue Resolved</h5>
                            <p className="text-xs sm:text-sm text-gray-600">Data resent at no cost</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                            <div className="inline-flex p-1 sm:p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-2 sm:mb-3">
                              <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600" />
                            </div>
                            <h5 className="font-semibold text-sm sm:text-base">Advice Given</h5>
                            <p className="text-xs sm:text-sm text-gray-600">Next steps provided</p>
                          </div>
                          <div className="text-center p-3 sm:p-4 bg-red-50 dark:bg-red-900/10 rounded-lg">
                            <div className="inline-flex p-1 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-full mb-2 sm:mb-3">
                              <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                            </div>
                            <h5 className="font-semibold text-sm sm:text-base">Request Rejected</h5>
                            <p className="text-xs sm:text-sm text-gray-600">If SIM owes data/momo</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20 p-4 sm:p-6 rounded-xl">
                        <p className="font-medium text-emerald-900 dark:text-emerald-300 text-center text-sm sm:text-base">
                          If investigation confirms data wasn't sent and the SIM is clear, we'll resend at no cost.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* How to Order */}
            <section id="order-process" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 dark:from-blue-900/30 dark:to-cyan-900/30 mb-4">
                  <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Order Process
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">How to Order on Dataflex Ghana</h2>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                      Two Simple Ordering Methods
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                      Choose the ordering method that works best for you. Both methods are fully supported.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
                    {/* Manual Order */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 p-6 sm:p-8 rounded-2xl border border-blue-200 dark:border-blue-800">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="inline-flex p-3 sm:p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3 sm:mb-4">
                          <Smartphone className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-bold text-xl sm:text-2xl mb-2 sm:mb-3 text-blue-900 dark:text-blue-300">1. Manual Order</h4>
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <Users className="h-3 sm:h-4 w-3 sm:w-4 text-blue-600" />
                          <span className="text-xs sm:text-sm font-semibold text-blue-800">Most Popular</span>
                        </div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg sm:text-xl font-bold text-blue-600">1</div>
                          <div>
                            <h5 className="font-semibold text-sm sm:text-base">Make Payment</h5>
                            <p className="text-xs sm:text-sm text-gray-600">Mobile Money transfer to official MoMo line</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg sm:text-xl font-bold text-blue-600">2</div>
                          <div>
                            <h5 className="font-semibold text-sm sm:text-base">Confirm Payment</h5>
                            <p className="text-xs sm:text-sm text-gray-600">Confirm payment on the platform</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg sm:text-xl font-bold text-blue-600">3</div>
                          <div>
                            <h5 className="font-semibold text-sm sm:text-base">Order Processing</h5>
                            <p className="text-xs sm:text-sm text-gray-600">We verify and process your order</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wallet Payment Order */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 p-6 sm:p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                      <div className="text-center mb-4 sm:mb-6">
                        <div className="inline-flex p-3 sm:p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3 sm:mb-4">
                          <Wallet className="h-6 sm:h-8 w-6 sm:w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h4 className="font-bold text-xl sm:text-2xl mb-2 sm:mb-3 text-emerald-900 dark:text-emerald-300">2. Wallet Payment</h4>
                        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                          <Zap className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600" />
                          <span className="text-xs sm:text-sm font-semibold text-emerald-800">Fastest Method</span>
                        </div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg sm:text-xl font-bold text-emerald-600">1</div>
                          <div>
                            <h5 className="font-semibold text-sm sm:text-base">Load Wallet</h5>
                            <p className="text-xs sm:text-sm text-gray-600">Load your Dataflex Wallet (min. GH₵100)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg sm:text-xl font-bold text-emerald-600">2</div>
                          <div>
                            <h5 className="font-semibold text-sm sm:text-base">Instant Checkout</h5>
                            <p className="text-xs sm:text-sm text-gray-600">Enjoy instant checkout with no delays</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-lg sm:text-xl font-bold text-emerald-600">3</div>
                          <div>
                            <h5 className="font-semibold text-sm sm:text-base">Fast Processing</h5>
                            <p className="text-xs sm:text-sm text-gray-600">Fast, smooth, and seamless ordering</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platform Activity */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/10 dark:to-gray-800/10 p-6 sm:p-8 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-gray-900 dark:text-white text-center">
                      Platform User Statistics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl">
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">150+</div>
                        <div className="text-xs sm:text-sm text-gray-600">Active Daily Users</div>
                      </div>
                      <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl">
                        <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1 sm:mb-2">60%</div>
                        <div className="text-xs sm:text-sm text-gray-600">Prefer Manual Orders</div>
                      </div>
                      <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl">
                        <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">40%</div>
                        <div className="text-xs sm:text-sm text-gray-600">Use Wallet Payments</div>
                      </div>
                    </div>
                    <p className="text-center mt-4 sm:mt-6 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                      Around 150 users actively use the platform daily. More than half prefer manual orders
                      and are completely satisfied. The rest pre-load wallets and purchase daily.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Data Sales Policy */}
            <section id="data-policy" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 dark:from-blue-900/30 dark:to-indigo-900/30 mb-4">
                  <Smartphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Data Sales Policy
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Data Sales Policy & Guidelines</h2>
              </div>

              <Card className="border border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-blue-900 dark:text-blue-300">
                      Data Processing Guidelines
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {[
                        {
                          title: "No Instant Processing",
                          description: "Inform clients there is a processing window. For instant data, direct them to network providers.",
                          icon: Clock,
                        },
                        {
                          title: "Delivery Time Expectations",
                          description: "Data takes 10 minutes to 24 hours depending on network conditions and time of order.",
                          icon: Clock,
                        },
                        {
                          title: "Sunday Orders",
                          description: "Processing is slower on Sundays. Exercise patience as processing takes longer than usual.",
                          icon: Calendar,
                        },
                        {
                          title: "Order Status Protocol",
                          description: "Do NOT contact support during 'Pending' or 'Processing' statuses. Wait for completion.",
                          icon: AlertCircle,
                        },
                        {
                          title: "When to Contact Support",
                          description: "Only contact support when order status is 'Completed' AND client did NOT receive data.",
                          icon: Phone,
                        },
                        {
                          title: "Report Requirements",
                          description: "Provide screenshot of client's data balance (with time) and order screenshot.",
                          icon: FileText,
                        },
                        {
                          title: "Our Response Protocol",
                          description: "We will review and confirm if data was sent or resend at no extra cost.",
                          icon: CheckCircle,
                        },
                      ].map((guideline, index) => (
                        <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                          <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                            <guideline.icon className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1 text-sm sm:text-base">{guideline.title}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{guideline.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-6 sm:p-8 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-amber-900 dark:text-amber-300">
                      Important Sales Policy Notes
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <h5 className="font-semibold mb-2 sm:mb-3 text-amber-800 dark:text-amber-400 text-sm sm:text-base">Agent Responsibilities:</h5>
                        <ul className="space-y-1 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <Check className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Set proper client expectations</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Verify SIM eligibility before ordering</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Follow reporting protocols</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2 sm:mb-3 text-amber-800 dark:text-amber-400 text-sm sm:text-base">Client Education:</h5>
                        <ul className="space-y-1 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <Check className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Explain processing times</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Inform about SIM requirements</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-3 sm:h-4 w-3 sm:w-4 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Provide order status updates</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Why We Don't Use Payment Integration */}
            <section id="payment-integration" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 dark:from-emerald-900/30 dark:to-teal-900/30 mb-4">
                  <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Payment Integration
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Why We Don't Use Payment Integration (Paystack)</h2>
              </div>

              <Card className="border border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-emerald-900 dark:text-emerald-300">
                      Cost-Saving Approach
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                      Paystack charges a flat <strong>1.95%</strong> on all local Ghana transactions. Instead of
                      passing these costs to you, we encourage direct wallet loading for free transactions.
                    </p>
                  </div>

                  {/* Fee Comparison Table */}
                  <div className="mb-8 sm:mb-10">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-gray-900 dark:text-white">
                      Paystack Fee Comparison (1.95%)
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                      <table className="w-full min-w-[500px]">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900">
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Amount (GHS)</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Paystack Fee (1.95%)</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">You Receive</th>
                            <th className="p-3 sm:p-4 text-left font-bold text-sm">Dataflex Approach</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[5, 10, 25, 50, 100, 200, 500, 1000].map((amount) => (
                            <tr key={amount} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                              <td className="p-3 sm:p-4 font-semibold text-sm">GH₵{amount}</td>
                              <td className="p-3 sm:p-4">
                                <span className="text-red-600 font-semibold text-sm">GH₵{(amount * 0.0195).toFixed(2)}</span>
                              </td>
                              <td className="p-3 sm:p-4 text-sm">
                                GH₵{(amount - (amount * 0.0195)).toFixed(2)}
                              </td>
                              <td className="p-3 sm:p-4">
                                <span className="text-emerald-600 font-semibold text-sm">GH₵{amount}.00</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Our Approach */}
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 p-6 sm:p-8 border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-emerald-900 dark:text-emerald-300">
                      Dataflex Ghana's Cost-Saving Approach
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <h5 className="font-semibold mb-2 sm:mb-3 text-emerald-800 dark:text-emerald-400 text-sm sm:text-base">Our Benefits:</h5>
                        <ul className="space-y-2 sm:space-y-3">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">No percentage fees on transactions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Free wallet loading with no extra charges</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Only MTN transfer fees apply when transferring via MTN Mobile Money</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">You keep more of your earnings without unnecessary deductions</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2 sm:mb-3 text-emerald-800 dark:text-emerald-400 text-sm sm:text-base">Savings Example:</h5>
                        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg">
                          <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-1 sm:mb-2">GH₵100 Transaction</div>
                            <div className="space-y-1 sm:space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">With Paystack:</span>
                                <span className="text-red-600 text-sm">- GH₵1.95</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span className="text-sm">With Dataflex:</span>
                                <span className="text-emerald-600 text-sm">- GH₵0.00</span>
                              </div>
                              <div className="border-t pt-1 sm:pt-2 mt-1 sm:mt-2">
                                <div className="flex justify-between font-bold">
                                  <span className="text-sm">You Save:</span>
                                  <span className="text-emerald-600 text-sm">GH₵1.95</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Lightbulb className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h5 className="font-bold text-base sm:text-lg text-blue-900 dark:text-blue-300 mb-1 sm:mb-2">
                          Recommended Approach
                        </h5>
                        <p className="text-blue-800 dark:text-blue-400 text-sm sm:text-base">
                          Load your Dataflex wallet directly to avoid payment processor fees. This saves you money
                          and ensures you receive full value for every transaction.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Wallet Refund Policy */}
            <section id="wallet-refund" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2 dark:from-green-900/30 dark:to-emerald-900/30 mb-4">
                  <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Wallet Refund Policy
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Wallet Refund & Withdrawal Policy</h2>
              </div>

              <Card className="border border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-emerald-900 dark:text-emerald-300">
                      Refund & Withdrawal Processing Timeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                      {/* Below 500 Cedis */}
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 sm:p-6 lg:p-8 rounded-2xl border border-amber-200 dark:border-amber-800 w-full">
                        <div className="text-center">
                          <p className="text-xs sm:text-sm font-semibold text-amber-600 mb-1 sm:mb-2">Amounts Below GH₵500</p>
                          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-600 mb-2 sm:mb-4">30 Days</div>
                          <p className="text-xs sm:text-sm lg:text-base text-amber-800 dark:text-amber-400 mb-4 sm:mb-6">
                            Waiting period before refund processing begins
                          </p>
                          <div className="inline-flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-1 sm:py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <Clock className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 text-amber-600 flex-shrink-0" />
                            <span className="font-semibold text-amber-800 text-xs sm:text-sm">Refund Period</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* 500 Cedis and Above */}
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 sm:p-6 lg:p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800 w-full">
                        <div className="text-center">
                          <p className="text-xs sm:text-sm font-semibold text-emerald-600 mb-1 sm:mb-2">GH₵500 & Above</p>
                          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-emerald-600 mb-2 sm:mb-4">14 Days</div>
                          <p className="text-xs sm:text-sm lg:text-base text-emerald-800 dark:text-emerald-400 mb-4 sm:mb-6">
                            Notice period for withdrawal processing
                          </p>
                          <div className="inline-flex items-center gap-2 px-3 sm:px-4 lg:px-6 py-1 sm:py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                            <Shield className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 text-emerald-600 flex-shrink-0" />
                            <span className="font-semibold text-emerald-800 text-xs sm:text-sm">Withdrawal Period</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Processing Details */}
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-gray-900 dark:text-white">
                        How the Refund & Withdrawal Process Works
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        <div className="p-3 sm:p-4 lg:p-6 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                          <h5 className="font-semibold mb-2 text-amber-900 dark:text-amber-300 flex items-center gap-1 sm:gap-2">
                            <Clock className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                            <span className="text-sm sm:text-base">Refunds Below GH₵500</span>
                          </h5>
                          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-400">
                            For amounts under GH₵500, we apply a <strong>30-day waiting period</strong> before processing your refund. This security measure helps us verify all transactions and prevent fraudulent activity while keeping your account safe.
                          </p>
                        </div>
                        <div className="p-3 sm:p-4 lg:p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
                          <h5 className="font-semibold mb-2 text-emerald-900 dark:text-emerald-300 flex items-center gap-1 sm:gap-2">
                            <Clock className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                            <span className="text-sm sm:text-base">Withdrawals GH₵500 & Above</span>
                          </h5>
                          <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-400">
                            For amounts of GH₵500 or more, we require a <strong>14-day notice period</strong> before processing your withdrawal. This allows us to ensure secure processing and verify your account details for your protection.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Refund Conditions */}
                    <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 p-4 sm:p-6 lg:p-8 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-bold text-base sm:text-lg lg:text-xl mb-3 sm:mb-4 lg:mb-6 text-blue-900 dark:text-blue-300">
                        Important Requirements & Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                        <div>
                          <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-400 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
                            <Check className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 flex-shrink-0" />
                            <span>Account Requirements</span>
                          </h5>
                          <ul className="space-y-1 sm:space-y-2 lg:space-y-3">
                            <li className="flex items-start gap-1 sm:gap-2">
                              <AlertCircle className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">Your account must be in good standing with no violations</span>
                            </li>
                            <li className="flex items-start gap-1 sm:gap-2">
                              <AlertCircle className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">You must have a verified mobile money account registered</span>
                            </li>
                            <li className="flex items-start gap-1 sm:gap-2">
                              <AlertCircle className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">All refund and withdrawal requests are subject to verification</span>
                            </li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-semibold mb-2 text-blue-800 dark:text-blue-400 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
                            <Clock className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 flex-shrink-0" />
                            <span>Processing Timeline</span>
                          </h5>
                          <ul className="space-y-1 sm:space-y-2 lg:space-y-3">
                            <li className="flex items-start gap-1 sm:gap-2">
                              <Clock className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs sm:text-sm"><strong>Below GH₵500:</strong> 30 days from request submission</span>
                            </li>
                            <li className="flex items-start gap-1 sm:gap-2">
                              <Clock className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs sm:text-sm"><strong>GH₵500 & Above:</strong> 14 days from request submission</span>
                            </li>
                            <li className="flex items-start gap-1 sm:gap-2">
                              <AlertCircle className="h-3 sm:h-4 lg:h-5 w-3 sm:w-4 lg:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">You'll receive notification when your request is processed</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Important Notes */}
                    <div className="p-4 sm:p-6 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600" />
                        <h5 className="font-bold text-red-900 dark:text-red-300 text-sm sm:text-base">Important Note:</h5>
                      </div>
                      <p className="text-red-800 dark:text-red-400 mt-1 sm:mt-2 text-sm sm:text-base">
                        Refunds are not instant as we need time to verify all transactions for security and
                        platform integrity. This protects both you and the platform from fraudulent activities.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Account Management */}
            <section id="account-management" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-100 to-blue-100 px-4 py-2 dark:from-gray-900/30 dark:to-blue-900/30 mb-4">
                  <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                    Account Management
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Account Management & Security</h2>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-6 sm:space-y-8">
                    {[
                      {
                        title: "Account Verification",
                        description: "All accounts require Admin verification. Provide valid full name, region, contact, and payment details for approval.",
                        icon: ShieldCheck,
                        color: "blue",
                      },
                      {
                        title: "Account Suspension",
                        description: "Accounts may be suspended for term violations, suspicious activity, or non-compliance with platform rules. Suspended accounts cannot access platform services.",
                        icon: AlertCircle,
                        color: "amber",
                      },
                      {
                        title: "Data Security",
                        description: "We employ industry-standard security measures including encryption, secure servers, and access controls to protect your personal and financial information.",
                        icon: Lock,
                        color: "emerald",
                      },
                      {
                        title: "Account Termination",
                        description: "Accounts may be terminated for serious term violations. Outstanding commissions are processed per withdrawal policy. Wallet balances are paid, but commissions may be denied for violations.",
                        icon: X,
                        color: "red",
                      },
                    ].map((item, index) => (
                      <div key={index} className={`bg-${item.color}-50 dark:bg-${item.color}-900/10 p-4 sm:p-6 rounded-xl border border-${item.color}-200 dark:border-${item.color}-800`}>
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`p-2 sm:p-3 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-lg flex-shrink-0`}>
                            <item.icon className={`h-5 sm:h-6 w-5 sm:w-6 text-${item.color}-600 dark:text-${item.color}-400`} />
                          </div>
                          <div>
                            <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{item.title}</h4>
                            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Security Tips */}
                  <div className="mt-8 sm:mt-10 p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-blue-900 dark:text-blue-300">
                      Account Security Tips
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <h5 className="font-semibold mb-2 sm:mb-3 text-blue-800 dark:text-blue-400 text-sm sm:text-base">Do's:</h5>
                        <ul className="space-y-1 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Use strong, unique passwords</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Keep login credentials private</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Log out from shared devices</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Report suspicious activity immediately</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2 sm:mb-3 text-red-800 dark:text-red-400 text-sm sm:text-base">Don'ts:</h5>
                        <ul className="space-y-1 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Share account credentials</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Use public Wi-Fi for transactions</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Save passwords on shared devices</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Ignore security notifications</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Platform Responsibilities */}
            <section id="platform-responsibilities" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 dark:from-purple-900/30 dark:to-indigo-900/30 mb-4">
                  <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Platform Responsibilities
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Platform Responsibilities & Limitations</h2>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-6 sm:space-y-8">
                    {[
                      {
                        title: "Service Availability",
                        description: "We strive for 99.9% uptime but cannot guarantee uninterrupted service due to maintenance, network issues, or unforeseen circumstances.",
                        icon: Globe,
                        color: "blue",
                      },
                      {
                        title: "Third-Party Services",
                        description: "We are not responsible for issues arising from third-party services, network provider problems, or mobile money failures beyond our control.",
                        icon: AlertCircle,
                        color: "amber",
                      },
                      {
                        title: "Commission Disputes",
                        description: "Commission calculations are automated and transparent. Report disputes within 30 days of the transaction for investigation.",
                        icon: TrendingUp,
                        color: "emerald",
                      },
                      {
                        title: "Platform Updates",
                        description: "We reserve the right to update platform features, commission structures, and policies with notice through our official WhatsApp Channel.",
                        icon: Zap,
                        color: "purple",
                      },
                      {
                        title: "Maintenance Mode",
                        description: "We reserve the right to put the platform in 'Maintenance Mode' to improve security, add features, or perform upgrades without prior notice.",
                        icon: Wrench,
                        color: "gray",
                      },
                      {
                        title: "Price Changes",
                        description: "Prices are market-driven and may change without notice based on network provider rates and market conditions.",
                        icon: Tag,
                        color: "orange",
                      },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <div className={`p-2 sm:p-3 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-lg flex-shrink-0`}>
                          <item.icon className={`h-5 sm:h-6 w-5 sm:w-6 text-${item.color}-600 dark:text-${item.color}-400`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">{item.title}</h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Limitation of Liability */}
                  <div className="mt-8 sm:mt-10 p-6 sm:p-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl border border-amber-200 dark:border-amber-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-amber-900 dark:text-amber-300">
                      Limitation of Liability
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-amber-800 dark:text-amber-400 text-sm sm:text-base">
                        Dataflex Ghana's liability is limited to the value of the transaction in question. We are
                        not liable for indirect, incidental, or consequential damages arising from platform use.
                      </p>
                      <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600 mt-0.5" />
                        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-400">
                          While we take all reasonable precautions, we cannot guarantee against all possible
                          service interruptions, data loss, or security breaches.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Usage Rules */}
            <section id="usage-rules" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-100 to-blue-100 px-4 py-2 dark:from-gray-900/30 dark:to-blue-900/30 mb-4">
                  <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                    Usage Rules
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Usage Rules & Best Practices</h2>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                      Platform Usage Guidelines
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
                      Follow these rules and best practices for optimal platform experience and compliance.
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {[
                      "Join our official WhatsApp Channel immediately after registration for updates and support",
                      "Never use the platform for mass marketing or public advertising of Dataflex services",
                      "Contact Dataflex support only for bundle issues—not network provider issues",
                      "Do not use SIMs with borrowed airtime; bundles may auto-expire on such SIMs",
                      "Sent bundles cannot be cancelled or corrected once processed. Double-check before submission",
                      "Use only DataflexGhana.com referral links for platform promotions",
                      "Maintain professional conduct in all client interactions and communications",
                      "Report technical issues, bugs, or suspicious activities immediately to support",
                      "Keep your account credentials secure and never share login details",
                      "Comply with all applicable Ghanaian laws and regulations in your platform activities",
                      "Regularly update your profile information for accurate records",
                      "Respect platform operational hours and processing timelines",
                      "Use appropriate channels for different types of inquiries and support requests",
                      "Keep records of important transactions and communications",
                      "Participate in platform training and updates when available",
                    ].map((rule, index) => (
                      <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-xs sm:text-sm">
                            {index + 1}
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{rule}</p>
                      </div>
                    ))}
                  </div>

                  {/* Best Practices */}
                  <div className="mt-8 sm:mt-10 p-6 sm:p-8 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-emerald-900 dark:text-emerald-300">
                      Agent Best Practices
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl">
                        <div className="inline-flex p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3 sm:mb-4">
                          <CheckCircle className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" />
                        </div>
                        <h5 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Client Verification</h5>
                        <p className="text-xs sm:text-sm text-gray-600">Always verify SIM status before ordering</p>
                      </div>
                      <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl">
                        <div className="inline-flex p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3 sm:mb-4">
                          <Clock className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" />
                        </div>
                        <h5 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Timely Reporting</h5>
                        <p className="text-xs sm:text-sm text-gray-600">Report issues within 24-hour window</p>
                      </div>
                      <div className="text-center p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl">
                        <div className="inline-flex p-2 sm:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-3 sm:mb-4">
                          <Users className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" />
                        </div>
                        <h5 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Professional Communication</h5>
                        <p className="text-xs sm:text-sm text-gray-600">Maintain professional client relationships</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Dispute Resolution */}
            <section id="dispute-resolution" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 dark:from-amber-900/30 dark:to-orange-900/30 mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Dispute Resolution
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Dispute Resolution & Complaints</h2>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                      Complaint Handling Process
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                      Our complaint team handles two primary cases: pending payments and data not received issues.
                      Follow proper procedures for efficient resolution.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 sm:p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-blue-900 dark:text-blue-300">
                          Before Reporting a Complaint
                        </h4>
                        <ul className="space-y-2 sm:space-y-3">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Check the client's data balance first</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Take screenshots as proof</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Confirm SIM eligibility carefully</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Verify order status is 'Completed'</span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 sm:p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-emerald-900 dark:text-emerald-300">
                          Complaint Submission
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <MessageSquare className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                            <span className="font-medium text-sm sm:text-base">WhatsApp: +233242799990</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Send all required information to this number for complaint processing
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-amber-50 dark:bg-amber-900/10 p-4 sm:p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-amber-900 dark:text-amber-300">
                          Response Timeline
                        </h4>
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Initial Response</span>
                            <span className="font-bold text-emerald-600 text-sm">Within 2 hours</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Investigation</span>
                            <span className="font-bold text-amber-600 text-sm">24-48 hours</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Resolution</span>
                            <span className="font-bold text-blue-600 text-sm">3-5 business days</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/10 p-4 sm:p-6 rounded-xl border border-red-200 dark:border-red-800">
                        <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 text-red-900 dark:text-red-300">
                          Important Notes
                        </h4>
                        <ul className="space-y-1 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Complaints must be submitted within 24 hours</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Incomplete information delays processing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">False complaints may lead to account suspension</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Process */}
                  <div className="p-6 sm:p-8 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-2xl border border-purple-200 dark:border-purple-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-purple-900 dark:text-purple-300 text-center">
                      Dispute Resolution Process
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                      {[
                        { step: "Submission", desc: "Submit complaint with all required evidence" },
                        { step: "Review", desc: "Our team reviews provided information" },
                        { step: "Investigation", desc: "Technical investigation of the issue" },
                        { step: "Resolution", desc: "Issue resolved and communicated to you" },
                      ].map((step, index) => (
                        <div key={index} className="text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
                            {index + 1}
                          </div>
                          <h5 className="font-semibold mb-1 text-xs sm:text-sm">{step.step}</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Privacy Policy */}
            <section id="privacy-policy" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gray-100 to-blue-100 px-4 py-2 dark:from-gray-900/30 dark:to-blue-900/30 mb-4">
                  <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                    Privacy Policy
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Privacy Policy & Data Protection</h2>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Lock className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-blue-900 dark:text-blue-300">Your Privacy Matters</h3>
                        <p className="text-blue-800 dark:text-blue-400 text-sm sm:text-base">
                          We are committed to protecting your personal information and being transparent about our data practices.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 sm:space-y-8">
                    {[
                      {
                        title: "1. Data Collection",
                        description: "We collect personal information when you register, purchase bundles, make referrals, or contact support. This includes contact information, transaction history, and platform usage data essential for service delivery.",
                        icon: Database,
                      },
                      {
                        title: "2. Data Usage",
                        description: "Your data is used solely for platform operations, commission calculations, customer support, and legal compliance. Aggregated, anonymized data helps us improve the platform and services.",
                        icon: BarChart3,
                      },
                      {
                        title: "3. Data Sharing",
                        description: "We do not sell personal information. Data may be shared with service providers for platform operations and with authorities when required by law. We ensure all partners maintain adequate data protection standards.",
                        icon: Share2,
                      },
                      {
                        title: "4. Data Storage & Security",
                        description: "All data is stored on secure servers with industry-standard encryption, access controls, and regular security audits. We implement technical and organizational measures to protect against unauthorized access.",
                        icon: Shield,
                      },
                      {
                        title: "5. Data Retention",
                        description: "Transaction data is retained for a minimum of seven years for audit compliance with Ghanaian tax regulations. Personal data is retained while your account is active or as required by law.",
                        icon: Archive,
                      },
                      {
                        title: "6. Your Rights",
                        description: "You have the right to access, correct, or delete your personal information. Contact us to exercise these rights, subject to legal and operational requirements. We respond to requests within 30 days.",
                        icon: UserCheck,
                      },
                      {
                        title: "7. Contact for Privacy Matters",
                        description: "For privacy enquiries, data access requests, or concerns about data handling, email sales.dataflex@gmail.com. We take all privacy concerns seriously and investigate promptly.",
                        icon: Mail,
                      },
                    ].map((section, index) => (
                      <div key={index} className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                        <h4 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3">{section.title}</h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">{section.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Privacy Commitment */}
                  <div className="mt-8 sm:mt-10 p-6 sm:p-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className="inline-flex p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-3 sm:mb-4">
                        <ShieldCheck className="h-6 sm:h-8 w-6 sm:w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4 text-blue-900 dark:text-blue-300">
                        Our Privacy Commitment
                      </h4>
                      <p className="text-blue-800 dark:text-blue-400 text-sm sm:text-base">
                        We are committed to protecting your privacy and being transparent about how we collect,
                        use, and protect your personal information. Your trust is important to us.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Cookie Policy */}
            <section id="cookie-policy" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 dark:from-amber-900/30 dark:to-orange-900/30 mb-4">
                  <Cookie className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Cookie Policy
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Cookie Policy & Tracking</h2>
              </div>

              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10">
                    <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">
                      How We Use Cookies
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                      We use essential cookies for functionality and security, plus optional analytics cookies to
                      improve your experience. By using the Dataflex Ghana platform, you agree to our cookie use
                      as described in this policy.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
                    {[
                      {
                        title: "Essential Cookies",
                        description: "Required for platform functionality, security, and user authentication. These cannot be disabled.",
                        icon: Shield,
                        color: "blue",
                      },
                      {
                        title: "Analytics Cookies",
                        description: "Help us understand platform usage patterns and improve user experience. These are optional.",
                        icon: BarChart,
                        color: "emerald",
                      },
                      {
                        title: "Preference Cookies",
                        description: "Remember your settings, preferences, and login status for convenience.",
                        icon: Settings,
                        color: "purple",
                      },
                    ].map((cookie, index) => (
                      <div
                        key={index}
                        className={`bg-${cookie.color}-50 dark:bg-${cookie.color}-900/20 rounded-xl border border-${cookie.color}-200 dark:border-${cookie.color}-800 p-4 sm:p-6`}
                      >
                        <div className={`inline-flex p-2 sm:p-3 bg-${cookie.color}-100 dark:bg-${cookie.color}-900/30 rounded-full mb-3 sm:mb-4`}>
                          <cookie.icon className={`h-5 sm:h-6 w-5 sm:w-6 text-${cookie.color}-600 dark:text-${cookie.color}-400`} />
                        </div>
                        <h4 className="font-bold text-base sm:text-lg mb-2 sm:mb-3">{cookie.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{cookie.description}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cookie Management */}
                  <div className="rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/10 dark:to-gray-800/10 p-6 sm:p-8 border border-gray-200 dark:border-gray-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-gray-900 dark:text-white">
                      Managing Your Cookie Preferences
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                        You can control cookie settings through your browser preferences. However, disabling
                        essential cookies may prevent certain platform features from working correctly.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <h5 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Browser Settings</h5>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Adjust cookie settings in your browser's privacy or security settings
                          </p>
                        </div>
                        <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <h5 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Platform Impact</h5>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Disabling cookies may affect login, preferences, and some features
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Consent */}
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-amber-600" />
                      <p className="text-amber-800 dark:text-amber-400 text-sm sm:text-base">
                        By continuing to use the Dataflex Ghana platform, you consent to our use of cookies as
                        described in this policy. You may withdraw consent by adjusting your browser settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Contact Section */}
            <section id="contact" className="scroll-mt-24">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 px-4 py-2 dark:from-emerald-900/30 dark:to-teal-900/30 mb-4">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Contact & Support
                  </span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Contact Information & Support</h2>
              </div>

              <Card className="border border-emerald-200 dark:border-emerald-800 shadow-lg">
                <CardContent className="p-6 sm:p-8">
                  <div className="mb-8 sm:mb-10 text-center">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-emerald-900 dark:text-emerald-300">
                      We're Here to Help
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                      Reach out to our support team for assistance, inquiries, or any platform-related questions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
                    {/* Contact Methods */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 p-4 sm:p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className="p-1 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Phone className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base sm:text-lg">Phone & WhatsApp Support</h4>
                            <p className="text-xs sm:text-sm text-gray-600">Primary contact for urgent issues</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-base sm:text-lg">+233 242 799 990</div>
                            <p className="text-xs sm:text-sm text-gray-600">Technical support and inquiries</p>
                          </div>
                          <div className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <div className="font-bold text-base sm:text-lg">+233 551 999 901</div>
                            <p className="text-xs sm:text-sm text-gray-600">Profile service and agent support</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 p-4 sm:p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className="p-1 sm:p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Mail className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base sm:text-lg">Email Support</h4>
                            <p className="text-xs sm:text-sm text-gray-600">For detailed inquiries and documentation</p>
                          </div>
                        </div>
                        <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="font-bold text-base sm:text-lg text-center">sales.dataflex@gmail.com</div>
                          <p className="text-xs sm:text-sm text-gray-600 text-center mt-1 sm:mt-2">
                            Response within 24-48 hours
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Support Hours & Resources */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-4 sm:p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className="p-1 sm:p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Clock className="h-5 sm:h-6 w-5 sm:w-6 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base sm:text-lg">Support Hours</h4>
                            <p className="text-xs sm:text-sm text-gray-600">When our team is available</p>
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <span className="font-semibold text-sm">Days</span>
                            <span className="font-bold text-amber-600 text-sm">Monday - Sunday</span>
                          </div>
                          <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <span className="font-semibold text-sm">Hours</span>
                            <span className="font-bold text-amber-600 text-sm">6:00 AM - 9:30 PM</span>
                          </div>
                          <div className="flex justify-between items-center p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg">
                            <span className="font-semibold text-sm">Timezone</span>
                            <span className="font-bold text-amber-600 text-sm">GMT (Accra Time)</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10 p-4 sm:p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                          <div className="p-1 sm:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <HelpCircle className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base sm:text-lg">Additional Resources</h4>
                            <p className="text-xs sm:text-sm text-gray-600">Helpful links and documentation</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <a
                            href="/faq"
                            className="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <HelpCircle className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                              <span className="font-semibold text-sm sm:text-base">FAQ & Help Center</span>
                            </div>
                            <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                          </a>
                          <a
                            href="/agent/register"
                            className="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <Users className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                              <span className="font-semibold text-sm sm:text-base">Agent Registration</span>
                            </div>
                            <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                          </a>
                          <a
                            href="/services"
                            className="flex items-center justify-between p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <ShoppingCart className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600" />
                              <span className="font-semibold text-sm sm:text-base">Service Catalog</span>
                            </div>
                            <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Support Tips */}
                  <div className="rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/10 dark:to-gray-800/10 p-6 sm:p-8 border border-gray-200 dark:border-gray-800">
                    <h4 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 text-gray-900 dark:text-white text-center">
                      Getting the Best Support
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <h5 className="font-semibold mb-2 sm:mb-3 text-gray-800 dark:text-gray-300 text-sm sm:text-base">Before Contacting Support:</h5>
                        <ul className="space-y-1 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Check order status on platform</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Gather all relevant information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Check FAQ for common solutions</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold mb-2 sm:mb-3 text-gray-800 dark:text-gray-300 text-sm sm:text-base">When Contacting Support:</h5>
                        <ul className="space-y-1 sm:space-y-2">
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Provide clear, detailed information</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Include screenshots when relevant</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-600 mt-0.5" />
                            <span className="text-xs sm:text-sm">Be patient for response</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Effective Date */}
            <section className="pt-8 sm:pt-12 border-t border-gray-200 dark:border-gray-800">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  These terms, conditions, and policies are effective as of February 1, 2026, and supersede
                  all previous versions. Continued use of the Dataflex Ghana platform constitutes acceptance
                  of these terms in full.
                </p>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Last updated: February 1, 2026 • Version 3.0
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
        >
          <Link href="/agent/register" className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Register Now
          </Link>
        </Button>
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-gradient-to-b from-emerald-950 to-emerald-900 text-white">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-10">
            {/* Brand Section */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white rounded-full p-2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-2 border-emerald-500 shadow-lg">
                  <ShieldCheck className="h-5 sm:h-6 w-5 sm:w-6 text-emerald-600" />
                </div>
                <span className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Dataflexghana.com</span>
              </div>
              <p className="text-emerald-100 leading-relaxed text-xs sm:text-sm lg:text-base">
                Ghana's premier multi-service platform. Connect with opportunities and earn substantial commissions.
              </p>
              <div className="flex space-x-3 mt-4">
                <a
                  href="https://facebook.com/dataflexgh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-500 transition-colors"
                >
                  <Facebook className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                </a>
                <a
                  href="https://twitter.com/dataflexgh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500 rounded-full flex items-center justify-center hover:bg-emerald-400 transition-colors"
                >
                  <Twitter className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                </a>
                <a
                  href="https://instagram.com/dataflexgh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-500 transition-colors"
                >
                  <Instagram className="h-4 sm:h-5 w-4 sm:w-5 text-white" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Quick Links</h3>
              <ul className="space-y-2 text-xs sm:text-sm lg:text-base">
                <li>
                  <Link href="/agent/register" className="text-emerald-100 hover:text-white transition-colors">
                    Become an Agent
                  </Link>
                </li>
                <li>
                  <Link href="/agent/login" className="text-emerald-100 hover:text-white transition-colors">
                    Agent Login
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-emerald-100 hover:text-white transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-emerald-100 hover:text-white transition-colors flex items-center gap-2">
                    <HelpCircle className="h-3 sm:h-4 w-3 sm:w-4" />
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Support</h3>
              <ul className="space-y-2 text-xs sm:text-sm lg:text-base">
                <li className="flex items-center space-x-2 text-emerald-100">
                  <Phone className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                  <span>0242799990</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-100">
                  <Mail className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                  <span className="break-all">sales.dataflex@gmail.com</span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-100">
                  <MapPin className="h-3 sm:h-4 w-3 sm:w-4 flex-shrink-0" />
                  <span>Accra, Ghana</span>
                </li>
              </ul>
            </div>

            {/* Security Section - Hidden Admin Access */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Security</h3>
              <p className="text-emerald-100 text-xs sm:text-sm">Platform security and protection</p>
              <div className="flex items-center space-x-2">
                <button
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-800 rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors cursor-pointer border border-emerald-600"
                  title="Security"
                >
                  <Shield className="h-4 sm:h-5 w-4 sm:w-5 text-emerald-100" />
                </button>
                <span className="text-emerald-200 text-xs sm:text-sm">Secure Platform</span>
              </div>
              <p className="text-xs text-emerald-200">Advanced security measures protect all user data</p>
            </div>
          </div>

          <Separator className="my-6 lg:my-8 bg-emerald-800" />

          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-emerald-100 text-xs sm:text-sm">© 2026 Dataflexghana.com. All rights reserved.</div>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
              <Link href="/terms" className="text-emerald-100 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-emerald-100 hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/terms" className="text-emerald-100 hover:text-white transition-colors">
                Cookie Policy
              </Link>
              <Link href="/faq" className="text-emerald-100 hover:text-white transition-colors flex items-center gap-1">
                <HelpCircle className="h-3 sm:h-4 w-3 sm:w-4" />
                FAQ & Help
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}