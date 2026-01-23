import type { Metadata } from "next"
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
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Terms & Policies | Dataflexghana.com",
  description:
    "Read the full Terms & Conditions, Privacy Policy and Cookie Policy for using Dataflexghana.com – Ghana's premier data-reseller platform.",
  robots: "index,follow",
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 prose prose-headings:font-semibold prose-a:text-emerald-600 dark:prose-invert">
      {/* hero */}
      <header className="mb-12 text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/images/social-preview-new.jpg"
            alt="DataFlex Agent Platform"
            width={400}
            height={200}
            className="rounded-lg shadow-lg"
          />
        </div>
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold">
          <FileText className="h-8 w-8 text-emerald-600" />
          {"Terms & Conditions"}
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: January 2, 2026</p>
      </header>

      {/* Unified Terms for Agents and Non-Registration Users */}
      <section
        id="unified-terms"
        className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-200 mb-12"
      >
        <h2 className="flex items-center gap-2 mt-0">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          {"Unified Terms of Service"}
        </h2>
        <p className="text-sm leading-relaxed">
          These Terms and Conditions apply to <strong>all users</strong> of the DataFlex Ghana platform, including
          registered agents and customers using the <strong>No-Registration Services</strong>. By accessing any part of
          our platform, you agree to be bound by these terms.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Applies to Registered Agents</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Applies to No-Registration Users</span>
          </div>
        </div>
      </section>

      {/* PLATFORM OVERVIEW */}
      <section id="platform-overview">
        <h2 className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {"About DataFlex Agent Platform"}
        </h2>
        <p>
          DataFlex Agent is Ghana's premier multi-service digital platform, empowering individuals and businesses with
          innovative solutions to grow, save, and earn. Our platform is designed to help you:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <Smartphone className="h-5 w-5 text-emerald-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Bulk Data Bundles</h4>
              <p className="text-sm">
                Purchase affordable bulk data bundles for MTN, AirtelTigo, and Telecel networks—ideal for companies,
                staff, or personal use.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Home className="h-5 w-5 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Real Estate Promotion</h4>
              <p className="text-sm">
                List or promote real estate properties for free, and connect with potential buyers or tenants
                effortlessly.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <CreditCard className="h-5 w-5 text-purple-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Investment Opportunities</h4>
              <p className="text-sm">
                Save, invest, and earn attractive returns on your investments with our curated financial solutions.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <Users className="h-5 w-5 text-orange-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Service Referrals & Commissions</h4>
              <p className="text-sm">
                Promote over 50 professional services and earn commissions for every successful referral.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <FileText className="h-5 w-5 text-amber-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Business Registration</h4>
              <p className="text-sm">
                Register any type of business in Ghana remotely, with expert guidance and hassle-free processing.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <BookOpen className="h-5 w-5 text-teal-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Professional Writing Services</h4>
              <p className="text-sm">
                Access top-tier writing services for all your documents, from business plans to legal contracts.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <GraduationCap className="h-5 w-5 text-indigo-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Teaching & Mentorship Channels</h4>
              <p className="text-sm">
                Join exclusive teaching channels and learn directly from experienced mentors and industry experts.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-red-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Job Board</h4>
              <p className="text-sm">
                Explore curated job opportunities across diverse industries and take the next step in your career.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
            <ShoppingCart className="h-5 w-5 text-cyan-600 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Wholesale Products</h4>
              <p className="text-sm">
                Access an exclusive catalog of wholesale products at competitive prices, perfect for resellers and
                entrepreneurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="why-choose-dataflex">
        <h2 className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {"Why Choose DataFlex Ghana"}
        </h2>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border-l-4 border-amber-500 mb-6">
          <h3 className="font-semibold text-amber-900 mb-3">Platform Entry Fee: GH₵50 (One-Time, Lifetime Access)</h3>
          <p className="text-sm text-amber-800 mb-3">
            Unlike free platforms that monetize through ads or data sales, DataFlex Ghana operates transparently with a
            single platform entry fee of GH₵50. This one-time payment grants you lifetime access to our ecosystem of 50+
            services—never pay again.
          </p>
          <p className="text-sm text-amber-800">
            Think of it like a cinema: pay once at the gate and enjoy unlimited movies within that session. With
            DataFlex, you pay once and access everything forever.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Verify Our Uniqueness</h3>
          <p className="text-sm text-blue-800 mb-3">
            To confirm DataFlex Ghana is the only comprehensive platform offering all these services, search on Google:
          </p>
          <div className="bg-white dark:bg-blue-900/30 p-4 rounded border border-blue-300 my-3">
            <p className="text-xs sm:text-sm text-blue-900 font-mono">
              "I want to be an agent and make around GH₵700 daily remotely. I want to buy data, buy GES books, buy
              wholesale goods, register businesses and earn commissions, and promote services. List the top 5 platforms
              in Ghana. I want only platforms offering ALL these services."
            </p>
          </div>
          <p className="text-sm text-blue-800">
            You will see DataFlex Ghana as the first and only platform providing all these services in one ecosystem.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500 mb-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Check className="h-5 w-5" />
            Why Thousands Choose Us
          </h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Verified & Reliable:</strong> Consistent delivery with transparent operations.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Fast Processing:</strong> Data delivered within an hour on average.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Responsive Support:</strong> Friendly customer service team ready to help.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Safe Payments:</strong> Mobile Money and wallet topup options.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* GENERAL TERMS */}
      <section id="general-terms">
        <h2 className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {"General Terms"}
        </h2>
        <ul>
          <li>
            <strong>Operational Hours:</strong> Our team is active and processing orders from{" "}
            <strong>6:00 AM to 9:30 PM DAILY</strong>. Orders placed outside these hours will be processed starting at
            6:00 AM the following day.
          </li>
          <li>
            <strong>No-Registration Services:</strong> Users opting for services without registration (e.g., ECG Top-up,
            Instant Data, Software Store) are subject to the same verification and delivery protocols as registered
            agents.
          </li>
          <li>No refunds – double-check all phone numbers & amounts before submitting.</li>
          <li>
            <strong>Data delivery takes between 10 minutes to 24 hours depending on network conditions.</strong>
          </li>
          <li>Bundles are valid for 90 days and roll over with the next purchase.</li>
          <li>Platform operates 24/7 including weekends.</li>
          <li>
            Prices are market-driven and may change without notice&nbsp;
            <em>(e.g. ₵6 MTN bundle can drop to ₵4 and remain low for a week)</em>.
          </li>
        </ul>
      </section>

      {/* DATA DELIVERY & PROCESSING TIMES SECTION */}
      <section id="data-delivery" className="pt-8">
        <h2 className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {"Data Delivery & Processing Times"}
        </h2>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border-l-4 border-amber-500 space-y-4">
          <div>
            <h3 className="font-semibold mb-2 text-amber-900">Question: Why does data take time to deliver?</h3>
            <p className="text-sm mb-3">
              <strong>Answer:</strong> Data delivery takes 10 minutes to 24 hours depending on several factors:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>
                <strong>Time of Order</strong> - Early morning orders (6–10am) process fastest. Peak hours (11am–4pm)
                may take up to an hour. Evening (5pm–9:30pm) varies. Orders after 9:30pm process after we reopen at 6am.
              </li>
              <li>
                <strong>Network Conditions</strong> - Network providers perform maintenance and upgrades that affect
                delivery speed.
              </li>
              <li>
                <strong>Operational Hours</strong> - We're active from 6:00 AM to 9:30 PM. Orders during the closed
                period (9:30 PM to 6:00 AM) process after reopening. Sundays operate normally but delivery may be
                slower.
              </li>
            </ol>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
            <h3 className="font-semibold mb-2 text-red-900">
              <AlertCircle className="h-5 w-5 inline mr-1" />
              Critical: Reporting Delays
            </h3>
            <p className="text-sm text-red-800 mb-2">
              If a data order is marked as <strong>"Completed"</strong> but the client hasn't received the bundle:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-red-800">
              <li>
                Report the issue <strong>immediately</strong> if the delay exceeds <strong>1 hour</strong>.
              </li>
              <li>
                Contact admin on WhatsApp: <strong>+233242799990</strong> with:
                <ul className="list-disc pl-6 mt-1 space-y-1">
                  <li>Client’s current data balance screenshot (with timestamp).</li>
                  <li>Order details from the agent platform.</li>
                </ul>
              </li>
              <li>
                <strong>Failure to report within 24 hours</strong> means the issue <strong>cannot be resolved</strong>.
                No refunds or resends will be possible.
              </li>
            </ul>
            <p className="text-xs font-medium mt-3 text-red-900">
              <strong>Note:</strong> DataFlex Ghana is not liable for unresolved issues due to late reporting.
            </p>
          </div>
        </div>
      </section>

      {/* AGENT REGISTRATION & FEES */}
      <section id="agent-registration">
        <h2 className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {"Agent Registration & Platform Entry Fee"}
        </h2>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border-l-4 border-amber-500">
          <h3 className="text-lg font-semibold mb-3">GH₵47 Platform Entry Fee + GH₵5 Auto-Credit</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Why Choose DataFlex at 47 GHS?</h4>
              <p className="text-sm mb-2">
                Unlike most free platforms, DataFlex operates transparently. Our 47 GHS one-time fee is an investment in
                a comprehensive business ecosystem with 50+ revenue streams. Plus, you get an immediate 5 GHS wallet
                credit upon approval to test the system.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                <li>Access to 50+ earning services</li>
                <li>No recurring fees or hidden charges</li>
                <li>5 GHS automatic credit to your wallet on approval</li>
                <li>Lifetime access to all services</li>
                <li>24/7 customer support included</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-amber-900/40 p-4 rounded-lg border-l-4 border-green-500 mt-4">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Automatic Wallet Credit Explained
              </h4>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                <p>
                  <strong>Timing:</strong> Your wallet will be credited with GH₵5 immediately after the admin approves
                  your registration (usually within 24-48 hours of registration).
                </p>
                <p>
                  <strong>Usage:</strong> This credit is automatically available in your wallet and can be used just
                  like any other wallet balance. Use it to purchase data bundles, digital products, or any other
                  services on the platform.
                </p>
                <p>
                  <strong>Purpose:</strong> The automatic credit is designed to help you get started immediately. You
                  can test the system, make your first purchases, and begin earning commissions right away without
                  additional investment.
                </p>
                <p>
                  <strong>No Expiration:</strong> Your wallet credit has no expiration date. Use it whenever you're
                  ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AGENT RULES */}
      <section id="agent-rules">
        <h2 className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {"Agent Rules & Guidelines"}
        </h2>
        <h3 className="mt-4">Data Resale Restrictions</h3>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500">
          <p className="font-semibold mb-2">
            Data bundles are exclusively for resale to friends, relatives, and close acquaintances only
          </p>
          <p>This is not a public retail service.</p>
        </div>

        <h3 className="mt-6">SIM Card Restrictions</h3>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500 mb-6">
          <p className="font-semibold mb-3">We do NOT serve these SIM types. No refunds for invalid SIM orders:</p>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Agent SIM</li>
            <li>Merchant SIM</li>
            <li>EVD SIM</li>
            <li>Turbonet SIM</li>
            <li>Broadband SIM</li>
            <li>Blacklisted SIM</li>
            <li>Roaming SIM</li>
            <li>Company/Group SIM</li>
            <li>Different network</li>
            <li>Wrong/Invalid numbers</li>
          </ol>
          <p className="mt-3 font-medium text-red-800 dark:text-red-200">
            Verify your SIM type before ordering. No refunds for these SIM types.
          </p>
        </div>

        <h3>Allowed promotion channels</h3>
        <ul>
          <li>WhatsApp groups (private/personal)</li>
          <li>Close friends & family</li>
          <li>Trusted associates and colleagues</li>
        </ul>
        <h3>Forbidden promotion channels</h3>
        <ul className="list-disc pl-6 marker:text-red-600">
          <li>TikTok, Facebook, Instagram, LinkedIn, X (Twitter)</li>
          <li>Public advertising using the DataFlex brand name</li>
          <li>Public marketplaces or e-commerce platforms</li>
          <li>Mass marketing campaigns or bulk SMS</li>
          <li>Radio, TV, or print media advertisements</li>
        </ul>
        <blockquote className="border-l-4 border-emerald-600 pl-4 italic">
          Violation results in permanent ban and loss of all agent privileges. No refunds of entry fees or commissions.
        </blockquote>
      </section>

      {/* HOW TO REPORT SECTION */}
      <section id="how-to-report" className="pt-8">
        <h2 className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {"How to Report Issues"}
        </h2>

        <p className="mb-4 font-medium text-emerald-900">
          Contact us only after data is marked "Completed" but the client hasn't received it.
        </p>

        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-l-4 border-red-500 mb-6">
          <h3 className="font-semibold text-red-900 mb-3">When NOT to Contact Support</h3>
          <p className="text-sm text-red-800">
            If your order status is <strong>Pending</strong> or <strong>Processing</strong>, do not contact support. We
            will ignore you. Wait for delivery to complete.
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border-l-4 border-amber-500 mb-6">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            CRITICAL: Client SIM Requirements Before Ordering
          </h3>
          <div className="space-y-4 text-sm text-amber-800">
            <p className="font-semibold">
              You may ONLY report a completed order if the client's SIM card meets BOTH requirements:
            </p>
            <ul className="space-y-2 ml-6 list-disc">
              <li>
                <strong>The client's SIM card does NOT owe data bundles</strong>
              </li>
              <li>
                <strong>The client's SIM card does NOT owe mobile money (momo)</strong>
              </li>
            </ul>
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg border border-red-300 mt-4">
              <p className="font-semibold text-red-900 mb-2">IMPORTANT WARNING:</p>
              <p className="text-red-800">
                If the SIM owes data or momo, it is 99% likely the order will fail. In that situation, we cannot be
                blamed and the money paid cannot be recovered. The liability falls on the client who hid this
                information.
              </p>
              <p className="text-red-800 mt-2">
                <strong>Who loses in this situation?</strong> The client loses. We have also lost the money since we
                paid for the data. This is why data is not given for free.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Agent Responsibility: Client Verification</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p className="font-semibold">
              The agent is REQUIRED to confirm from the client whether they owe any data or momo on their SIM before
              proceeding with an order.
            </p>
            <p>
              If the client confirms they owe data or momo, the processing may fail.{" "}
              <strong>It is advised not to proceed with the order.</strong>
            </p>
            <p>
              If a client hides the fact that they owe or fails to disclose it, the{" "}
              <strong>responsibility is NOT on you as the agent. It is on the client.</strong>
            </p>
            <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-lg mt-3">
              <p className="font-semibold text-blue-900">
                Any financial loss in this situation cannot be recovered. Such money is unrecoverable once the failed
                transaction occurs.
              </p>
            </div>
            <p className="font-medium mt-3">
              For smooth operations, it is highly recommended to always confirm with clients before processing an order.
            </p>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="font-semibold text-green-900 mb-3">What to Share With Us When Reporting</h3>
          <p className="text-sm text-green-800 mb-3">
            If you've confirmed the client does NOT owe data or momo and data still wasn't received, provide:
          </p>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Screenshot of the client's current data balance (with time clearly shown)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>The phone number you bundled data for and the specific bundle you paid for</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Screenshot of the order from the agent platform</span>
            </li>
          </ul>

          <div className="mt-4 pt-4 border-t border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">After Submission:</h4>
            <p className="text-sm text-green-800 mb-2">
              We will forward the details to our engineers for investigation. Possible outcomes:
            </p>
            <ul className="space-y-1 text-sm text-green-800 ml-6 list-disc">
              <li>The issue will be resolved</li>
              <li>You will be advised on next steps</li>
              <li>The request may be rejected if the SIM is found to owe data or momo</li>
            </ul>
          </div>

          <p className="text-sm text-green-800 mt-4 font-medium">
            If investigation confirms data wasn't sent and the SIM is clear, we'll resend at no cost.
          </p>
        </div>
      </section>

      {/* COMMISSION SYSTEM */}
      <section id="commission-system">
        <h2 className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {"Commission System & Earnings"}
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Data Bundle Commissions</h4>
            <p>Earn competitive commissions on every data bundle sale with rates varying by bundle type and size.</p>
          </div>
          <div>
            <h4 className="font-semibold">Service Referral Commissions</h4>
            <p>Receive fixed commission amounts for successful service referrals that result in completed projects.</p>
          </div>
          <div>
            <h4 className="font-semibold">Wholesale Product Commissions</h4>
            <p>Earn commissions on wholesale product sales with transparent commission structures.</p>
          </div>
          <div>
            <h4 className="font-semibold">Withdrawal System</h4>
            <p>
              Request withdrawals anytime with processing within 24-48 hours to your registered mobile money account.
            </p>
          </div>
        </div>
      </section>

      {/* WHY WE DONT USE PAYMENT INTEGRATION */}
      <section id="payment-integration-explanation" className="pt-8">
        <h2 className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {"Why We Don't Use Payment Integration (Paystack)"}
        </h2>
        <p className="mb-4">
          Paystack charges a flat <strong>1.95%</strong> on all local Ghana transactions. Instead, we encourage you to
          load your DataFlex wallet directly for free.
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm border border-emerald-200">
            <thead>
              <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                <th className="border border-emerald-200 p-2 text-left font-semibold text-emerald-900">Amount (GHS)</th>
                <th className="border border-emerald-200 p-2 text-left font-semibold text-emerald-900">Fee (1.95%)</th>
              </tr>
            </thead>
            <tbody>
              {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100].map((amount) => (
                <tr
                  key={amount}
                  className="border-t border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                >
                  <td className="border border-emerald-200 p-2 text-emerald-900">{amount}</td>
                  <td className="border border-emerald-200 p-2 text-emerald-900">{(amount * 0.0195).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg border-l-4 border-emerald-500">
          <h3 className="font-semibold text-emerald-900 mb-3">Our Approach</h3>
          <ul className="space-y-3 text-sm text-emerald-800">
            <li>• No percentage fees - we avoid third-party payment processors.</li>
            <li>• Free wallet loading - load directly with no extra charges.</li>
            <li>• MTN transfer fees only - only charge applies when you transfer via MTN Mobile Money.</li>
            <li>• Keep more money - you retain more earnings without unnecessary deductions.</li>
          </ul>
        </div>
      </section>

      {/* HOW TO ORDER SECTION */}
      <section id="how-to-order" className="pt-8">
        <h2 className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          {`How to Order on DataFlex Ghana`}
        </h2>
        <p className="mb-4">We offer two simple ordering methods:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-blue-900 mb-3 text-lg">1. Manual Order</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Make a Mobile Money transfer to our official MoMo line.</li>
              <li>• Confirm the payment on the platform.</li>
              <li>• We verify and process your order.</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
            <h3 className="font-semibold text-green-900 mb-3 text-lg">2. Wallet Payment Order</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>• Load your DataFlex Wallet with minimum GHS 100.</li>
              <li>• Enjoy instant checkout with no delays.</li>
              <li>• Fast, smooth, and seamless ordering.</li>
            </ul>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg border-l-4 border-emerald-500">
          <h3 className="font-semibold text-emerald-900 mb-3">Platform Activity</h3>
          <p className="text-sm text-emerald-800">
            Around 150 users actively use the platform. More than half prefer manual orders and are completely
            satisfied. The rest pre-load wallets and purchase daily.
          </p>
        </div>
      </section>

      {/* DATA SALES POLICY */}
      <section id="data-sales-policy" className="pt-8">
        <h2 className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          {"Data Sales Policy"}
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500 space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-blue-900">Processing Guidelines</h3>
            <ul className="space-y-3 text-sm text-blue-800">
              <li>
                <strong>No Instant Processing:</strong> Inform clients there is a processing window. For instant data,
                direct them to network providers.
              </li>
              <li>
                <strong>Delivery Time:</strong> Data takes 10 minutes to 24 hours depending on network conditions.
              </li>
              <li>
                <strong>Sunday Orders:</strong> Processing is slower on Sundays. Exercise patience as processing takes
                longer than usual.
              </li>
              <li>
                <strong>Pending/Processing Status:</strong> Do NOT contact support during these statuses. Wait for
                completion.
              </li>
              <li>
                <strong>Contact Support Only When:</strong> Order status is "Completed" AND client did NOT receive data.
              </li>
              <li>
                <strong>Report Requirements:</strong> Provide screenshot of client's data balance (with time) and order
                screenshot.
              </li>
              <li>
                <strong>Our Response:</strong> We will review and confirm if data was sent or resend at no extra cost.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* WALLET REFUND POLICY */}
      <section id="wallet-refund-policy" className="pt-8">
        <h2 className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {"Wallet Refund Policy"}
        </h2>
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-4 text-green-900">Withdrawal Processing</h3>
          <p className="text-sm text-green-800 mb-3">
            Wallet refund requests take up to 1 week for processing. Refunds are not instant as we need time to verify
            all transactions for security and integrity.
          </p>
        </div>
      </section>

      {/* ACCOUNT MANAGEMENT */}
      <section id="account-management">
        <h2 className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {"Account Management & Security"}
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Account Verification</h4>
            <p>
              All accounts require Admin verification. Provide valid full name, region, contact, and payment details.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Account Suspension</h4>
            <p>
              Accounts may be suspended for term violations, suspicious activity, or non-compliance with platform rules.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Data Security</h4>
            <p>We employ industry-standard security measures to protect your personal and financial information.</p>
          </div>
          <div>
            <h4 className="font-semibold">Account Termination</h4>
            <p>
              Accounts may be terminated for term violations. Outstanding commissions are processed per our withdrawal
              policy. Wallet balances are paid, but commissions may be denied for violations.
            </p>
          </div>
        </div>
      </section>

      {/* PLATFORM RESPONSIBILITIES */}
      <section id="platform-responsibilities">
        <h2 className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {"Platform Responsibilities & Limitations"}
        </h2>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Service Availability</h4>
            <p>
              We strive for 99.9% uptime but cannot guarantee uninterrupted service due to maintenance or network
              issues.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Third-Party Services</h4>
            <p>
              We are not responsible for issues from third-party services, network provider problems, or mobile money
              failures.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Commission Disputes</h4>
            <p>
              Commission calculations are automated and transparent. Report disputes within 30 days of the transaction.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Platform Updates</h4>
            <p>
              We reserve the right to update platform features and commission structures with notice through our
              official WhatsApp Channel.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Maintenance Mode</h4>
            <p>
              We reserve the right to put the platform in "Maintenance Mode" to improve security and add features
              without prior notice.
            </p>
          </div>
        </div>
      </section>

      {/* IMPORTANT USAGE RULES - CONSOLIDATED */}
      <section id="usage-rules">
        <h2 className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {"Usage Rules & Best Practices"}
        </h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Join our official WhatsApp Channel after registration.</li>
          <li>Never use the platform for mass marketing or public advertising.</li>
          <li>Contact DataFlex support only for bundle issues—not network providers.</li>
          <li>Do not use SIMs with borrowed airtime; bundles may auto-expire.</li>
          <li>Sent bundles cannot be cancelled or corrected once processed.</li>
          <li>Use only Dataflexghana.com referral links for promotions.</li>
          <li>Maintain professional conduct in all client interactions.</li>
          <li>Report technical issues or suspicious activities immediately.</li>
          <li>Keep your account credentials secure.</li>
          <li>Comply with all applicable Ghanaian laws and regulations.</li>
        </ol>
      </section>

      {/* DISPUTE RESOLUTION */}
      <section id="dispute-resolution" className="pt-8">
        <h2 className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {"Dispute Resolution & Complaints"}
        </h2>
        <p>
          Our complaint team handles two cases: pending payments and data not received issues. Check the client's data
          balance first, take screenshots as proof, and confirm carefully before reporting to us.
        </p>
      </section>

      {/* PRIVACY POLICY */}
      <section id="privacy-policy" className="pt-12">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Lock className="h-6 w-6" />
          {"Privacy Policy"}
        </h1>
        <p>
          Your privacy is important. We collect only necessary data for service operations—name, phone, email, and
          transaction history. We never sell your data to third parties.
        </p>
        <h3>1. Data Collection</h3>
        <p>
          We collect personal information when you register, purchase bundles, make referrals, or contact support. This
          includes contact information, transaction history, and platform usage data.
        </p>
        <h3>2. Data Usage</h3>
        <p>
          Your data is used solely for platform operations, commission calculations, customer support, and legal
          compliance. Aggregated, anonymized data improves the platform.
        </p>
        <h3>3. Cookies</h3>
        <p>
          Cookies are used for authentication, session management, and analytics only. You can disable cookies but the
          platform may not function correctly.
        </p>
        <h3>4. Data Storage & Security</h3>
        <p>
          All data is stored on secure servers with industry-standard encryption, access controls, and regular security
          audits.
        </p>
        <h3>5. Data Sharing</h3>
        <p>
          We do not sell personal information. Data may be shared with service providers for platform operations and
          with authorities when required by law.
        </p>
        <h3>6. Data Retention</h3>
        <p>
          Transaction data is retained for a minimum of seven years for audit compliance with Ghanaian tax regulations.
          Personal data is retained while your account is active or as required by law.
        </p>
        <h3>7. Your Rights</h3>
        <p>
          You have the right to access, correct, or delete your personal information. Contact us to exercise these
          rights, subject to legal and operational requirements.
        </p>
        <h3>8. Contact</h3>
        <p>
          For privacy enquiries, email&nbsp;
          <a href="mailto:sales.dataflex@gmail.com">sales.dataflex@gmail.com</a>.
        </p>
      </section>

      {/* COOKIE POLICY */}
      <section id="cookie-policy" className="pt-12">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Cookie className="h-6 w-6" />
          {"Cookie Policy"}
        </h1>
        <p>
          We use essential cookies for functionality and security, plus optional analytics cookies to improve your
          experience. By using the site you agree to our cookie use.
        </p>
        <h3>Types of Cookies</h3>
        <ul>
          <li>
            <strong>Essential:</strong> Required for platform functionality and security
          </li>
          <li>
            <strong>Analytics:</strong> Help us understand usage and improve user experience
          </li>
          <li>
            <strong>Preference:</strong> Remember your settings and preferences
          </li>
        </ul>
      </section>

      {/* CONTACT */}
      <section id="contact" className="pt-12">
        <h2>Contact Information</h2>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg">
          <p className="mb-4">
            <strong>For support, technical issues, and inquiries:</strong>
          </p>
          <p>
            Email:&nbsp;
            <a href="mailto:sales.dataflex@gmail.com" className="font-medium">
              sales.dataflex@gmail.com
            </a>
            <br />
            WhatsApp:&nbsp;
            <a href="https://wa.me/233242799990" target="_blank" rel="noreferrer noopener">
              +233 242 799 990
            </a>
            <br />
            Hours: Monday - Sunday, 6:00 AM - 9:30 PM (GMT)
          </p>
        </div>
      </section>

      {/* FAQ Link Card */}
      <Card className="my-12 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex-shrink-0">
              <HelpCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Have Questions?</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-4">
                Check our comprehensive FAQ section for answers about the platform, agent registration, data bundles,
                commissions, and more.
              </p>
              <Link href="/faq">
                <Button
                  variant="outline"
                  className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20 bg-transparent"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Visit FAQ & Help Center
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EFFECTIVE DATE */}
      <section id="effective-date" className="pt-8 border-t">
        <p className="text-sm text-muted-foreground text-center">
          These terms are effective as of September 2, 2025, and supersede all previous versions. Continued use of the
          platform constitutes acceptance of these terms.
        </p>
      </section>
    </main>
  )
}
