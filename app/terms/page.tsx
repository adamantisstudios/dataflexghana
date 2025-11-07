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
} from "lucide-react"
import Image from "next/image"

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

      {/* AGENT REGISTRATION & FEES */}
      <section id="agent-registration">
        <h2 className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          {"Agent Registration & Platform Entry Fee"}
        </h2>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-lg border-l-4 border-amber-500">
          <h3 className="text-lg font-semibold mb-3">Platform Entry Fee: ₵50 (Non-Refundable)</h3>
          <p className="mb-4">
            Think of this as your ticket to enter a movie theater – once you pay, you gain access to all the
            entertainment inside. Similarly, your ₵50 platform entry fee grants you access to our comprehensive business
            ecosystem with unlimited earning potential.
          </p>
          <div className="space-y-2">
            <p>
              <strong>What you get access to:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Wholesale data bundle pricing (up to 40% profit margins)</li>
              <li>Exclusive service referral opportunities</li>
              <li>Wholesale product catalog access</li>
              <li>Job board with premium listings</li>
              <li>Commission tracking and withdrawal system</li>
              <li>24/7 platform support</li>
              <li>Agent training materials and resources</li>
            </ul>
          </div>
          <p className="mt-4 font-medium text-amber-800 dark:text-amber-200">
            <strong>Important:</strong> This fee is non-refundable. Your account may be automatically put on "pending"
            mode when you are inactive on the platform for a period of 1 month. You can request re-activation if you
            notice you cannot login.
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
