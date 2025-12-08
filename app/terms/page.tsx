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
  AlertTriangle,
  Check,
  AlertCircle,
  Briefcase,
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
        <p className="text-sm text-muted-foreground">Last updated: September 2, 2025</p>
      </header>

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

      {/* ABOUT DATAFLEX GHANA SECTION - ADD AFTER PLATFORM OVERVIEW */}
      <section id="dataflex-ghana-why-choose">
        <h2 className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {`💳 5 Things People Pay For Everyday Before Receiving Value`}
        </h2>
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-900 mb-2">1. Online Shopping (e.g., Amazon, Alibaba)</h4>
            <p className="text-sm text-blue-800">
              You pay for the item, but it can take days or even weeks before it arrives.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-900 mb-2">2. Ordering Food via Apps (e.g., UberEats, Glovo)</h4>
            <p className="text-sm text-blue-800">
              You pay upfront, then wait for the restaurant to prepare and a delivery person to bring the food—usually
              30–60 minutes.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-900 mb-2">
              3. Buying Airtime or Utility Credits from Third-Party Vendors
            </h4>
            <p className="text-sm text-blue-800">
              Especially when done through social media or less-known platforms, you pay first and may wait several
              minutes to hours for the credit or token to be processed.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-900 mb-2">4. Movie or Event Tickets</h4>
            <p className="text-sm text-blue-800">
              You pay now for a movie, concert, or event happening later—sometimes weeks ahead.
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-blue-900 mb-2">5. Paying ECG Prepaid or DSTV via Mobile Money Apps</h4>
            <p className="text-sm text-blue-800">
              After payment, there's often a delay before the token or subscription reflects—sometimes up to an hour,
              depending on network traffic or system lag.
            </p>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg border-l-4 border-emerald-500 mb-6">
          <h3 className="font-semibold text-emerald-900 mb-3">
            📱 Now Compare That to Buying Data Bundles from https://dataflexGhana.com
          </h3>
          <p className="text-sm text-emerald-800 mb-3">
            Just like the examples above, when you buy data from <strong>https://dataflexGhana.com</strong>, you pay
            first, and then wait for your data bundle to be allocated to your number. This usually happens within 1
            hour, which is quite fast compared to other forms of payments discussed.
          </p>
          <p className="text-sm text-emerald-800">
            This waiting time is not unusual—most modern services come with a short processing window.
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-l-4 border-red-500 mb-6">
          <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            ⚠️ Beware of Fraud in the Data Market
          </h3>
          <p className="text-sm text-red-800">
            The rising demand for discounted data has opened the door for fraudulent dealers, especially on WhatsApp,
            Telegram, and Instagram. Some take your money and vanish without a trace.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500 mb-6">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <Check className="h-5 w-5" />✅ Why https://dataflexGhana.com
          </h3>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Verified & Reliable:</strong> A well-known brand with consistent delivery.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Fast Delivery:</strong> You get your data typically within an hour.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Support You Can Reach:</strong> Friendly and responsive customer service.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Safe Payments:</strong> MoMo and wallet topup.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border-l-4 border-amber-500">
          <p className="text-sm text-amber-900 font-medium mb-3">
            Paying first and waiting is normal in today's world—from ordering food to paying ECG. The most important
            thing is trusting who you're dealing with. That's why thousands choose{" "}
            <strong>https://dataflexGhana.com</strong> —because they deliver, every time.
          </p>
          <div className="bg-white dark:bg-amber-900/30 p-3 rounded mt-3">
            <p className="text-sm font-semibold text-amber-900">
              🌐 <strong>MAIN WEBSITE:</strong>{" "}
              <a href="https://dataflexghana.com" className="text-amber-600 hover:text-amber-700 underline">
                https://dataflexghana.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* GENERAL TERMS */}
      <section id="general-terms">
        <h2 className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {"General Terms"}
        </h2>
        <ul>
          <li>No refunds – double-check all phone numbers & amounts before submitting.</li>
          <li>
            <strong>Data delivery now takes between 10 minutes to 24 hours depending on network conditions.</strong>
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
            <h3 className="font-semibold mb-2 text-amber-900">Question: Does it really take long to deliver data?</h3>
            <p className="text-sm mb-3">
              <strong>Answer:</strong> Delivery usually takes 10 minutes and upwards, depending on several factors:
            </p>
            <ol className="list-decimal pl-6 space-y-2 text-sm">
              <li>
                <strong>Time of Order</strong> - Orders placed early morning (6–10am) are typically processed faster.
                Between 11am–4pm, delivery may take up to an hour or more. From 5pm–9pm, it may vary — sometimes under
                an hour, sometimes longer.
              </li>
              <li>
                <strong>Network Conditions</strong> - Network providers occasionally perform maintenance, upgrades, or
                system audits, which can slow down delivery.
              </li>
              <li>
                <strong>Operational Hours</strong> - Data delivery may halt or slow after business hours. We're
                generally closed from 9:50pm to 6am, so orders placed during this period will process after we reopen.
              </li>
              <li>
                <strong>Sundays</strong> - We also operate on Sundays, but Sunday delivery may or may not be fast.
              </li>
            </ol>
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
          <h3 className="text-lg font-semibold mb-3">Platform Entry Fee: ₵50 (Non-Refundable)</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">1. PLATFORM ENTRY FEE</h4>
              <p className="text-sm mb-2">
                Dataflex Ghana is not a free platform. To gain access, you are required to pay a Platform Entry Fee —
                think of it as a gate fee you pay to watch a movie. Without payment, access cannot be granted.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-amber-900 mb-2">2. REGISTRATION RESPONSIBILITY</h4>
              <p className="text-sm mb-2">
                We have provided all necessary information to guide and educate potential members before registration.
                This includes a clear notice that if you are not ready to make payment, please do not register. Despite
                these instructions, some still register without paying. Please note that such accounts will be blocked
                and denied access to the platform.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-amber-900 mb-2">3. PAYMENT TIMELINE</h4>
              <p className="text-sm mb-4">
                After registration, you have one (1) hour to complete your Platform Entry Fee payment. Failure to do so
                within this period will result in automatic denial of access. Kindly take this seriously.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-amber-900 mb-2">4. OUR VISION AND SERVICES</h4>
              <p className="text-sm">
                Dataflex Ghana has partnered with numerous businesses and companies nationwide, offering over 50
                services. Our platform was not built solely for data sales — it's a full-fledged business ecosystem. We
                encourage only serious and committed individuals to join us.
              </p>
            </div>

            <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded">
              <p className="text-sm font-medium text-amber-900">
                If the client wants it instantly, advise them to buy it directly from MTN or their network provider.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM ENTRY FEE & PROOF OF UNIQUENESS */}
      <section id="entry-fee-explanation" className="pt-8">
        <h2 className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {"Platform Entry Fee & Ghana's Biggest Multi-Service Platform"}
        </h2>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border-l-4 border-amber-500 mb-6">
          <h3 className="font-semibold text-amber-900 mb-3">💳 GH₵50 Entry Fee – Lifetime Access, Never Again</h3>
          <p className="text-sm text-amber-800 mb-3">
            Pay to get your account approved. The platform entry fee is only <strong>GH₵50.00</strong> — a small
            one-time payment that unlocks full access forever. You never pay again.
          </p>
          <p className="text-sm text-amber-800">
            Think of it like entering a cinema: you pay at the gate before you can watch the movie. The difference is
            that with <strong>DataFlex Ghana</strong>, once you pay that single entry fee, you enjoy{" "}
            <strong>lifetime access</strong> to Ghana's Biggest Multi-Service Platform without ever paying another
            pesewa.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="font-semibold text-blue-900 mb-3">🔍 Proof: Search on Google</h3>
          <p className="text-sm text-blue-800 mb-3">
            To confirm that DataFlex Ghana is truly the biggest and only platform offering all these services in one
            place, just go to Google and search:
          </p>
          <div className="bg-white dark:bg-blue-900/30 p-4 rounded border border-blue-300 my-3">
            <p className="text-xs sm:text-sm text-blue-900 font-mono">
              "I want to be an agent and make around GH₵700 daily remotely working as an agent in Ghana. I want to buy
              data, buy GES books, buy goods at wholesale, register businesses around me and get a commission, and
              promote services. List the top 5 platforms in Ghana that can help me. I do not want any platform that does
              not offer all these services. Strictly Ghana platforms."
            </p>
          </div>
          <p className="text-sm text-blue-800">
            You will clearly see <strong>DataFlex Ghana</strong> appear as the first and only platform that provides
            every single one of these services — data, GES books, wholesale shopping, business registration, result
            checkers, commissions, remote work opportunities, and more — all in one place.
          </p>
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
          <p className="font-semibold mb-2">⚠️ CRITICAL: Data bundles are NOT for public advertisement or consumption</p>
          <p>
            Our wholesale data bundles are exclusively for resale to{" "}
            <strong>friends, relatives, and close acquaintances only</strong>. This is not a public retail service.
          </p>
        </div>

        <h3 className="mt-6">SIM Card Restrictions</h3>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-500 mb-6">
          <p className="font-semibold mb-3">
            We do NOT serve the following SIM cards. No refund will be made when you request for the below SIM cards:
          </p>
          <ol className="list-decimal pl-6 space-y-1 text-sm">
            <li>Agent SIM</li>
            <li>Merchant SIM</li>
            <li>EVD SIM</li>
            <li>Turbonet SIMS</li>
            <li>Broadband SIMS</li>
            <li>Blacklisted SIM</li>
            <li>Roaming SIM</li>
            <li>Company/Group Sim</li>
            <li>Different network</li>
            <li>Wrong Number/Invalid Numbers</li>
          </ol>
          <p className="mt-3 font-medium text-red-800 dark:text-red-200">
            Please verify your SIM type before placing an order. No refunds will be issued for orders sent to these SIM
            types.
          </p>
        </div>

        <h3>Allowed promotion channels</h3>
        <ul>
          <li>WhatsApp groups (private/personal)</li>
          <li>Close friends & family</li>
          <li>Trusted associates and colleagues</li>
          <li>Personal network contacts</li>
        </ul>
        <h3>Strictly forbidden promotion channels</h3>
        <ul className="list-disc pl-6 marker:text-red-600">
          <li>TikTok, Facebook, Instagram, LinkedIn, X (Twitter)</li>
          <li>Any form of public advertising using the DataFlex brand name</li>
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
          {"📋 How to Report Issues"}
        </h2>

        <p className="mb-4 font-medium text-emerald-900">
          Please only contact us after the data has been marked as completed, but the client says they have still not
          received their data.
        </p>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg border-l-4 border-emerald-500 mb-6">
          <h3 className="font-semibold text-emerald-900 mb-3">Order Status Timeline</h3>
          <div className="space-y-3 text-sm text-emerald-800">
            <div className="bg-white dark:bg-emerald-900/20 p-3 rounded border border-emerald-200">
              <p>
                <strong>Manual Orders:</strong> Pending → Processing → Completed
              </p>
            </div>
            <div className="bg-white dark:bg-emerald-900/20 p-3 rounded border border-emerald-200">
              <p>
                <strong>Wallet Orders:</strong> Processing → Completed
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-l-4 border-red-500 mb-6">
          <h3 className="font-semibold text-red-900 mb-3">⚠️ When NOT to Contact Support</h3>
          <p className="text-sm text-red-800 mb-3">
            If you contact us when the data order status is <strong>Pending</strong> or <strong>Processing</strong>, we
            will ignore you, since this is not an alert or an issue.
          </p>
          <p className="text-sm text-red-800 font-medium">
            You must <strong>wait</strong> for the delivery of the data to be completed.
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="font-semibold text-green-900 mb-3">✅ How to Report (Correct Way)</h3>
          <p className="text-sm text-green-800 mb-3">
            When reporting an issue, share whatever you need to share with us so that we can carry out an investigation.
            You must provide:
          </p>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Screenshot of the client's data balance (with time clearly shown)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Screenshot of the order from the agent platform</span>
            </li>
          </ul>
          <p className="text-sm text-green-800 mt-4 font-medium">
            We will review and give a final verdict. If data was successfully sent or if not, the data will be resent at
            no extra cost.
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
          Paystack charges a flat <strong>1.95%</strong> on all local Ghana transactions. This reduces your earnings
          significantly. Instead, we encourage you to load your DataFlex wallet directly for free.
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
          <h3 className="font-semibold text-emerald-900 mb-3">Why DataflexGhana.com does not use Paystack</h3>
          <ul className="space-y-3 text-sm text-emerald-800">
            <li>
              • <strong>No percentage fees:</strong> We do not use Paystack because their percentage fees reduce your
              earnings.
            </li>
            <li>
              • <strong>Free wallet loading:</strong> Instead, we encourage you to load your Dataflex wallet directly
              with no extra charges.
            </li>
            <li>
              • <strong>MTN transfer fees only:</strong> The only time you ever pay a charge is when you manually
              transfer money to us through MTN Mobile Money, and MTN applies their standard transfer fees.
            </li>
            <li>
              • <strong>Keep more of your money:</strong> This way, you keep more of your money and avoid unnecessary
              deductions.
            </li>
          </ul>
        </div>
      </section>

      {/* IMPORTANT USAGE RULES */}
      <section id="usage-rules">
        <h2 className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {"Important Usage Rules"}
        </h2>
        <ol className="list-decimal pl-5">
          <li>Join our official WhatsApp Channel after registration.</li>
          <li>Do not advertise the platform publicly or use it for mass marketing.</li>
          <li>Never contact MTN, AirtelTigo, Vodafone or Telecel for bundle issues—contact DataFlex support only.</li>
          <li>Do not use SIMs with borrowed airtime/data; bundles may auto-expire.</li>
          <li>Sent bundles cannot be cancelled or corrected once processed.</li>
          <li>Only refer people through Dataflexghana.com referral links.</li>
          <li>Maintain professional conduct in all client interactions.</li>
          <li>Report any technical issues or suspicious activities immediately.</li>
          <li>Keep your account information and login credentials secure.</li>
          <li>Comply with all applicable Ghanaian laws and regulations.</li>
        </ol>
      </section>

      {/* QUICK GUIDE SECTION */}
      <section id="quick-guide" className="pt-8">
        <h2 className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {"📖 Quick Guide to DataFlex Ghana"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-sm">
                1️⃣
              </div>
              <div>
                <h4 className="font-semibold text-emerald-900 mb-1">💳 Top Up Wallet & Start Shopping</h4>
                <p className="text-sm text-emerald-700 mb-2">
                  Top up your wallet with GH₵100 or more and start buying or shopping online.
                </p>
                <div className="space-y-1 text-xs text-emerald-600">
                  <p>
                    • Login:{" "}
                    <a href="https://dataflexghana.com/agent/login" className="text-emerald-600 hover:underline">
                      https://dataflexghana.com/agent/login
                    </a>
                  </p>
                  <p>
                    • Order Data:{" "}
                    <a href="https://dataflexghana.com/agent/data-order" className="text-emerald-600 hover:underline">
                      https://dataflexghana.com/agent/data-order
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-sm">
                2️⃣
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">🔗 Wallet Top-Up</h4>
                <p className="text-sm text-blue-700">Request a secure top-up here:</p>
                <p className="text-xs text-blue-600 mt-2">
                  <a href="https://dataflexghana.com/agent/wallet" className="text-blue-600 hover:underline">
                    https://dataflexghana.com/agent/wallet
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-sm">
                3️⃣
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">📦 Manage Data Orders</h4>
                <p className="text-sm text-purple-700">View and track your data requests:</p>
                <p className="text-xs text-purple-600 mt-2">
                  <a href="https://dataflexghana.com/agent/data-orders" className="text-purple-600 hover:underline">
                    https://dataflexghana.com/agent/data-orders
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-sm">
                4️⃣
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">💰 High-Yield Savings</h4>
                <p className="text-sm text-amber-700">
                  Invest part of your wallet balance and withdraw when it matures:
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  <a href="https://dataflexghana.com/agent/savings" className="text-amber-600 hover:underline">
                    https://dataflexghana.com/agent/savings
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-lg border border-cyan-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-600 text-white font-bold text-sm">
                5️⃣
              </div>
              <div>
                <h4 className="font-semibold text-cyan-900 mb-1">🛒 Wholesale Shop</h4>
                <p className="text-sm text-cyan-700">Buy wholesale products directly from the platform:</p>
                <p className="text-xs text-cyan-600 mt-2">
                  <a href="https://dataflexghana.com/agent/wholesale" className="text-cyan-600 hover:underline">
                    https://dataflexghana.com/agent/wholesale
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-600 text-white font-bold text-sm">
                6️⃣
              </div>
              <div>
                <h4 className="font-semibold text-red-900 mb-1">💵 Withdraw Earnings</h4>
                <p className="text-sm text-red-700">Withdraw your commissions anytime:</p>
                <p className="text-xs text-red-600 mt-2">
                  <a href="https://dataflexghana.com/agent/withdraw" className="text-red-600 hover:underline">
                    https://dataflexghana.com/agent/withdraw
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />👥 Referral Bonus
            </h4>
            <p className="text-sm text-indigo-700">
              Invite friends and family to register and earn a <strong>GH₵15.00 wallet top-up</strong> once they fund
              their wallet and make their first purchase.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />🚀 Promote Services
            </h4>
            <p className="text-sm text-green-700">
              Promote our <strong>Free-Forever Website Development Service</strong> and earn{" "}
              <strong>over GH₵700</strong> in commission once your client pays.
            </p>
          </div>
        </div>
      </section>

      {/* HOW TO ORDER SECTION */}
      <section id="how-to-order" className="pt-8">
        <h2 className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          {`🌐 How to Order on https://DataflexGhana.com`}
        </h2>
        <p className="mb-4">We offer two simple ways to place your orders:</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-blue-900 mb-3 text-lg">1️⃣ Manual Order</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Make a direct Mobile Money (MoMo) transfer to our official MoMo line.</li>
              <li>• After payment, confirm it on the platform and we will verify and process your order.</li>
              <li>• You can also follow the basic, simple instructions shown during the manual order process.</li>
            </ul>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
            <h3 className="font-semibold text-green-900 mb-3 text-lg">2️⃣ Wallet Payment Order</h3>
            <ul className="space-y-2 text-sm text-green-800">
              <li>
                • Load your DataFlex Wallet with a minimum of <strong>GHS 100</strong>.
              </li>
              <li>• Enjoy instant checkout — no delays, no manual payment, no confirmations.</li>
              <li>• Fast, smooth, and seamless ordering.</li>
            </ul>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg border-l-4 border-emerald-500 mb-6">
          <h3 className="font-semibold text-emerald-900 mb-3">👥 Platform Activity</h3>
          <p className="text-sm text-emerald-800 mb-2">
            We currently have around <strong>150 users</strong> actively using the platform.
          </p>
          <ul className="space-y-2 text-sm text-emerald-800">
            <li>• More than half prefer the manual method and they are completely satisfied.</li>
            <li>• The rest pre-load their wallets and make purchases daily.</li>
          </ul>
          <p className="text-sm text-emerald-800 mt-3 font-medium">
            ✨ Choose the option that works best for you. 📦 Order today, accumulate commissions, and cash out.
          </p>
        </div>
      </section>

      {/* DATA SALES POLICY */}
      <section id="data-sales-policy" className="pt-8">
        <h2 className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          {"Data Sales Policy"}
        </h2>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Processing Window & Support Guidelines</h3>
          <ul className="space-y-3">
            <li>
              <strong>We DO NOT process data instantly.</strong> Agents MUST inform clients that there is a processing
              window.
            </li>
            <li>If a client wants instant data, they should buy directly from their network provider.</li>
            <li>
              <strong>Data delivery takes between 10 minutes to 24 hours</strong> depending on network conditions.
            </li>
            <li>
              <strong>⚠️ Sunday Data Sales Notice:</strong> Data sales and processing on Sundays is slow but not fast.
              Please exercise patience and understand that processing may take longer than usual on Sundays. We
              appreciate your understanding.
            </li>
            <li>
              <strong>Agents must wait patiently during processing.</strong> If an order is still "Pending" or
              "Processing", DO NOT contact support. No action will be taken during processing.
            </li>
            <li>
              <strong>Contact support ONLY if:</strong>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>The status is "Completed"</li>
                <li>The client DID NOT receive the data</li>
              </ul>
            </li>
            <li>
              <strong>To report an issue, agents must submit:</strong>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Screenshot of the client's data balance (with time clearly shown)</li>
                <li>Screenshot of the order from the agent platform</li>
              </ul>
            </li>
            <li>
              We will review and give a final verdict:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>If data was successfully sent</li>
                <li>If not, the data will be resent at no extra cost</li>
              </ul>
            </li>
          </ul>
        </div>
      </section>

      {/* WALLET REFUND POLICY */}
      <section id="wallet-refund-policy" className="pt-8">
        <h2 className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {"Wallet Refund Policy"}
        </h2>
        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
          <h3 className="text-lg font-semibold mb-4">Withdrawal Processing Timeline</h3>
          <p className="mb-4">
            If an agent joins the platform and later requests to withdraw their wallet balance, they must wait up to{" "}
            <strong>1 WEEK</strong> for the refund to be processed.
          </p>
          <p className="font-medium text-green-800 dark:text-green-200">
            <strong>Important:</strong> Refunds are NOT instant. We need time to verify all transactions before
            processing. This ensures the security and integrity of all platform transactions.
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
              All agent accounts require verification by platform Admin. You must also provide valid info such as your
              full name, region, contact line and payment line for payment.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Account Suspension</h4>
            <p>
              Accounts may be suspended for violation of terms, suspicious activity, or non-compliance with platform
              rules.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Data Security</h4>
            <p>We employ industry-standard security measures to protect your personal and financial information.</p>
          </div>
          <div>
            <h4 className="font-semibold">Account Termination</h4>
            <p>
              Your account may be terminated by platform Admin for violating the terms and conditions of the platform.
              All Outstanding commissions will be processed according to our withdrawal policy. If you violate our terms
              and conditions and you are reported, any wallet balance remaining on the platform will be paid to you, but
              your commissions will be denied you.
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
              We strive for 99.9% uptime but cannot guarantee uninterrupted service due to maintenance, network issues,
              or force majeure events.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Third-Party Services</h4>
            <p>
              We are not responsible for issues arising from third-party services, network provider problems, or mobile
              money transaction failures.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Commission Disputes</h4>
            <p>
              All commission calculations are automated and transparent. Disputes must be reported within 30 days of the
              transaction.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Platform Updates</h4>
            <p>
              We reserve the right to update platform features, commission structures, and terms with reasonable notice
              to agents through our platform official WhatsApp Channel.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Platform Maintenance Mode</h4>
            <p>
              We reserve the right to put the site under "Maintenance Mode" in order to improve platform security, add
              more features and to maintain it at anytime without notice.
            </p>
          </div>
        </div>
      </section>

      {/* DISPUTE RESOLUTION */}
      <section id="dispute-resolution" className="pt-8">
        <h2 className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {"Dispute Resolution & Complaints"}
        </h2>
        <p>
          The complaint team handles only two cases: pending payments and not received issues. All matters related to
          the specific data bundle will be ignored unless these issues are related to other matters not in contention.
        </p>
        <p>
          If a customer complains of not receiving a data bundle, first check their data balance, take a clear
          screenshot as proof, and confirm carefully before reporting to us.
        </p>
      </section>

      {/* PRIVACY POLICY */}
      <section id="privacy-policy" className="pt-12">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Lock className="h-6 w-6" />
          {"Privacy Policy"}
        </h1>
        <p>
          Your privacy is important to us. We collect only the data required to operate the service, such as your name,
          phone number, email address and transaction history. We never sell your data to third parties.
        </p>
        <h3>1. Data collection</h3>
        <p>
          We collect personal information when you register as an agent, purchase bundles, make referrals, or interact
          with our support team. This includes contact information, transaction history, and platform usage data.
        </p>
        <h3>2. Data Usage</h3>
        <p>
          Your data is used solely for platform operations, commission calculations, customer support, and compliance
          with legal requirements. We may use aggregated, anonymized data for platform improvements and analytics.
        </p>
        <h3>3. Cookies</h3>
        <p>
          Small cookies are used solely for authentication, session management, and analytics. You can disable cookies
          in your browser but the platform may not function correctly.
        </p>
        <h3>4. Data storage & security</h3>
        <p>
          All data is stored on secure servers provided by Supabase and protected with industry-standard encryption,
          access controls, and regular security audits.
        </p>
        <h3>5. Data sharing</h3>
        <p>
          We do not sell or rent your personal information. Data may be shared with service providers (payment
          processors, SMS providers) strictly for platform operations, and with authorities when required by law.
        </p>
        <h3>6. Data retention</h3>
        <p>
          Transaction data is retained for audit purposes for a minimum of seven years in compliance with Ghanaian tax
          regulations. Personal data is retained as long as your account is active or as required by law.
        </p>
        <h3>7. Your rights</h3>
        <p>
          You have the right to access, correct, or delete your personal information. Contact us to exercise these
          rights, subject to legal and operational requirements.
        </p>
        <h3>8. Contact</h3>
        <p>
          For any privacy enquiries, email&nbsp;
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
          Dataflexghana.com uses essential cookies to keep you logged in and to remember your preferences. Optional
          analytics cookies help us improve the service. By using the site you agree to our use of cookies.
        </p>
        <h3>Types of cookies we use:</h3>
        <ul>
          <li>
            <strong>Essential cookies:</strong> Required for platform functionality and security
          </li>
          <li>
            <strong>Analytics cookies:</strong> Help us understand platform usage and improve user experience
          </li>
          <li>
            <strong>Preference cookies:</strong> Remember your settings and preferences
          </li>
        </ul>
      </section>

      {/* CONTACT */}
      <section id="contact" className="pt-12">
        <h2>Contact Information</h2>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-lg">
          <p className="mb-4">
            <strong>For all support, technical issues, and general inquiries:</strong>
          </p>
          <p>
            Email:&nbsp;
            <a href="mailto:sales.dataflex@gmail.com" className="font-medium">
              sales.dataflex@gmail.com
            </a>
            <br />
            WhatsApp Support:&nbsp;
            <a href="https://wa.me/233242799990" target="_blank" rel="noreferrer noopener">
              +233 242 799 990
            </a>
            <br />
            Business Hours: Monday - Sunday, 6:00 AM - 10:00 PM (GMT)
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
                Check out our comprehensive FAQ section for answers to common questions about the platform, agent
                registration, data bundles, commissions, and more.
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
          These terms and conditions are effective as of September 2, 2025, and supersede all previous versions.
          Continued use of the platform constitutes acceptance of these terms.
        </p>
      </section>
    </main>
  )
}
