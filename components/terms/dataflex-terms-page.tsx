import Link from "next/link"
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
  ShoppingCart,
  Clock,
  Check,
  AlertCircle,
  X,
  Phone,
  Mail,
  Award,
  Wallet,
  Package,
  MessageSquare,
  UserCheck,
  BookOpen,
  GraduationCap,
  Home,
  Ticket,
  Store,
  PiggyBank,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/footer"
import { CVImageDisplay } from "@/components/cv-image-display"
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_LAST_UPDATED,
  TERMS_VERSION,
  PLATFORM_ENTRY_FEE_MANUAL,
  PLATFORM_ENTRY_FEE_PAYSTACK,
  PLATFORM_WALLET_CREDIT,
  SUPPORT,
  TERMS_NAV,
  PLATFORM_SERVICE_GROUPS,
  NON_REFUNDABLE_STATEMENTS,
} from "@/lib/terms-config"
import { TermsBadge, TermsSection, AlertBanner, BulletList, PolicyCard } from "@/components/terms/terms-ui"

const iconByNav: Record<string, typeof Globe> = {
  overview: Globe,
  "platform-fit": Users,
  fees: CreditCard,
  services: ShoppingCart,
  registration: Users,
  "profile-service": Award,
  wallet: Wallet,
  "agent-rules": Shield,
  commission: TrendingUp,
  "data-delivery": Clock,
  reporting: AlertCircle,
  "order-process": ShoppingCart,
  "data-policy": Smartphone,
  "payment-integration": CreditCard,
  "account-management": UserCheck,
  "platform-responsibilities": ShieldCheck,
  "usage-rules": FileText,
  "dispute-resolution": AlertCircle,
  "privacy-policy": Lock,
  "cookie-policy": Cookie,
  contact: Phone,
}

export function DataflexTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-950">
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Dataflex Ghana</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Terms & Policies</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#fees" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
                Fees
              </a>
              <a href="#services" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
                Services
              </a>
              <a href="#wallet" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
                Wallet
              </a>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link href="/agent/register">Register</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/10 dark:to-blue-900/10" />
        <div className="container relative mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              Effective {TERMS_EFFECTIVE_DATE} · Version {TERMS_VERSION}
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="block">Dataflex Ghana</span>
              <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Terms & Conditions
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Official policies for agents and users: multi-service platform rules, non-refundable registration fee,
              wallet, data delivery, commissions, and add-on services.
            </p>
            <p className="mt-2 text-sm text-gray-500">Last updated: {TERMS_LAST_UPDATED}</p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          <aside className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 space-y-4">
              <Card className="border border-gray-200 dark:border-gray-800 shadow-sm max-h-[70vh] overflow-y-auto">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Quick navigation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {TERMS_NAV.map((item) => {
                    const Icon = iconByNav[item.id] ?? FileText
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="flex items-center gap-2 rounded-lg p-2.5 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                        <span>{item.label}</span>
                      </a>
                    )
                  })}
                </CardContent>
              </Card>
              <Card className="border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-300">Non-refundable entry fee</p>
                  <p className="text-xs text-red-800 dark:text-red-400 mt-1">
                    GH₵{PLATFORM_ENTRY_FEE_MANUAL} (manual) / GH₵{PLATFORM_ENTRY_FEE_PAYSTACK} (Paystack) — see{" "}
                    <a href="#fees" className="underline font-medium">
                      Entry Fee
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </aside>

          <div className="lg:col-span-4 order-1 lg:order-2 space-y-12">
            <TermsSection
              id="overview"
              badge={<TermsBadge icon={Globe} label="Platform overview" />}
              title="About Dataflex Ghana"
              description="Ghana's multi-service digital ecosystem for agents: data, referrals, commerce, property, education, and professional services in one platform."
            >
              <Card className="border border-gray-200 dark:border-gray-800">
                <CardContent className="p-6 sm:p-8">
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    By registering, logging in, or using Dataflex Ghana (&quot;Dataflex&quot;, &quot;we&quot;, &quot;the
                    Platform&quot;), you agree to these terms in full. We may update policies; continued use after notice
                    constitutes acceptance.
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { icon: Smartphone, title: "Bulk data", desc: "MTN, AirtelTigo, Telecel bundles" },
                      { icon: Store, title: "Referral Hub", desc: "Storefront, QR & 50+ services" },
                      { icon: Home, title: "Properties", desc: "List and promote real estate" },
                      { icon: PiggyBank, title: "Savings", desc: "Plans and progress tracking" },
                      { icon: Package, title: "Wholesale", desc: "Bulk products for resellers" },
                      { icon: BookOpen, title: "Channels & courses", desc: "Teaching and online learning" },
                      { icon: FileText, title: "Compliance", desc: "Business & registration forms" },
                      { icon: GraduationCap, title: "Jobs & writing", desc: "Job board and CV services" },
                      { icon: Ticket, title: "Vouchers", desc: "Exam vouchers & digital products" },
                    ].map(({ icon: Icon, title, desc }) => (
                      <div
                        key={title}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-emerald-50/50 dark:bg-emerald-900/10"
                      >
                        <Icon className="h-6 w-6 text-emerald-600 mb-2" />
                        <h3 className="font-semibold">{title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TermsSection>

            <TermsSection
              id="platform-fit"
              badge={<TermsBadge icon={Users} label="Who should register" className="from-amber-100 to-orange-100" />}
              title="Multi-service platform — not data-only"
              description="Registration is for agents who want the full Dataflex business ecosystem."
            >
              <AlertBanner variant="amber" title="Important before you pay">
                <p>
                  Dataflex is <strong>not</strong> a data-only reseller site. It includes data bundles plus referrals,
                  wholesale, properties, savings, teaching channels, compliance, vouchers, salon, fashion, domestic
                  workers, Apple service center, blogs, courses, and more. If you only want cheap data bundles with no
                  interest in other services, <strong>do not register</strong> — use a data-only provider instead.
                </p>
              </AlertBanner>
            </TermsSection>

            <TermsSection
              id="fees"
              badge={<TermsBadge icon={CreditCard} label="Platform entry fee" className="from-amber-100 to-red-100" />}
              title="Registration fee (non-refundable)"
              description="One-time lifetime platform access after admin approval."
            >
              <AlertBanner variant="red" title="IMPORTANT: NON-REFUNDABLE FEE">
                <BulletList items={NON_REFUNDABLE_STATEMENTS} icon={X} iconClass="text-red-600" />
              </AlertBanner>

              <div className="mt-8 text-center">
                <div className="inline-block rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-1">
                  <div className="rounded-xl bg-white dark:bg-gray-900 px-8 py-6">
                    <div className="text-4xl font-bold">GH₵{PLATFORM_ENTRY_FEE_MANUAL}</div>
                    <p className="text-gray-600 dark:text-gray-300">Manual Mobile Money (primary)</p>
                    <p className="text-sm mt-2 text-gray-500">
                      Paystack checkout: GH₵{PLATFORM_ENTRY_FEE_PAYSTACK} (includes processor cost)
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-100 dark:bg-red-900/30 px-4 py-2">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="font-bold text-red-700 text-sm">NON-REFUNDABLE</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-lg mb-3">What you receive</h3>
                  <BulletList
                    icon={Check}
                    items={[
                      `GH₵${PLATFORM_WALLET_CREDIT} automatic wallet credit after approval`,
                      "Lifetime access to current and future platform services",
                      "Referral Hub, commissions, and 50+ service categories",
                      "No recurring platform subscription fee",
                      "24/7 support channels (see Contact)",
                    ]}
                  />
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between">
                    <span>Entry fee (manual)</span>
                    <span className="font-bold">GH₵{PLATFORM_ENTRY_FEE_MANUAL}.00</span>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex justify-between">
                    <span>Auto wallet credit</span>
                    <span className="font-bold text-emerald-600">+ GH₵{PLATFORM_WALLET_CREDIT}.00</span>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between">
                    <span>Immediate value (fee + credit)</span>
                    <span className="font-bold text-blue-600">
                      GH₵{PLATFORM_ENTRY_FEE_MANUAL + PLATFORM_WALLET_CREDIT}.00
                    </span>
                  </div>
                </div>
              </div>
            </TermsSection>

            <TermsSection
              id="services"
              badge={<TermsBadge icon={ShoppingCart} label="Services catalog" />}
              title="Platform services & add-ons"
              description="All offerings available to registered agents (subject to approval and service-specific rules in your dashboard)."
            >
              <div className="space-y-6">
                {PLATFORM_SERVICE_GROUPS.map((group) => (
                  <PolicyCard key={group.title} title={group.title}>
                    <ul className="list-disc pl-5 space-y-1">
                      {group.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </PolicyCard>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Service availability, pricing, and commissions are shown in your agent dashboard and may change with
                market or partner conditions.
              </p>
            </TermsSection>

            <TermsSection
              id="registration"
              badge={<TermsBadge icon={Users} label="Registration" />}
              title="Agent registration process"
            >
              <Card>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <ol className="grid md:grid-cols-4 gap-4 text-center text-sm">
                    {[
                      { n: "1", t: "Register", d: "DataflexGhana.com → agent signup" },
                      { n: "2", t: "Pay fee", d: `GH₵${PLATFORM_ENTRY_FEE_MANUAL} or Paystack GH₵${PLATFORM_ENTRY_FEE_PAYSTACK}` },
                      { n: "3", t: "Admin approval", d: "Usually 24–48 hours" },
                      { n: "4", t: "Start", d: `GH₵${PLATFORM_WALLET_CREDIT} wallet credit + full access` },
                    ].map((s) => (
                      <li key={s.n} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center mx-auto mb-2">
                          {s.n}
                        </div>
                        <p className="font-semibold">{s.t}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{s.d}</p>
                      </li>
                    ))}
                  </ol>
                  <p className="text-sm text-gray-600">
                    You must agree to these terms before payment (see registration payment page). Entry fee terms are
                    defined in <a href="#fees" className="text-emerald-600 underline font-medium">Entry Fee</a> only —
                    not duplicated here.
                  </p>
                  <p className="text-sm">
                    Provide accurate name, region, contact, and payment references. One account per person unless
                    approved otherwise. You are responsible for all activity under your account.
                  </p>
                </CardContent>
              </Card>
            </TermsSection>

            <TermsSection
              id="profile-service"
              badge={<TermsBadge icon={Award} label="Agent benefit" />}
              title="Free professional profile / CV writing"
              description="One complimentary profile or CV per approved agent."
            >
              <Card>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="grid md:grid-cols-3 gap-4 text-center">
                    {[
                      "Executive profile & bio",
                      "Resume / CV with ATS-friendly layout",
                      "LinkedIn & career profile enhancement",
                    ].map((t) => (
                      <div key={t} className="p-4 rounded-xl border bg-blue-50 dark:bg-blue-900/10">
                        <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium text-sm">{t}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid lg:grid-cols-2 gap-6 border rounded-xl overflow-hidden">
                    <div className="p-4">
                      <CVImageDisplay />
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="font-bold">Requirements</h4>
                      <BulletList
                        icon={Check}
                        items={[
                          "Approved agent with entry fee paid",
                          "Account in good standing",
                          "One free request per agent; processing 3–5 business days",
                        ]}
                      />
                      <p className="text-sm pt-2">
                        Request via WhatsApp {SUPPORT.whatsappProfile} with full name, contact, and Agent ID.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TermsSection>

            <TermsSection
              id="wallet"
              badge={<TermsBadge icon={Wallet} label="Wallet policy" />}
              title="Wallet funding, rewards & withdrawals"
            >
              <Card>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  <p>
                    We encourage wallet funding and paying for orders from your balance. Qualifying single top-ups of{" "}
                    <strong>GH₵500+</strong> used for platform wallet payments may earn a one-time reward (GH₵5–30 by
                    tier, credited within 24 hours after a successful wallet payment). Rewards are not withdrawable as
                    cash. Multiple small top-ups that sum to 500 do not qualify.
                  </p>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="p-3 text-left">Funding (GHS)</th>
                          <th className="p-3 text-left">Reward (GHS)</th>
                          <th className="p-3 text-left">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-3">500 – 1,000</td>
                          <td className="p-3">5 – 7</td>
                          <td className="p-3">After wallet payment</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3">2,000 – 4,900</td>
                          <td className="p-3">7 – 10</td>
                          <td className="p-3">After wallet payment</td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-3">5,000+</td>
                          <td className="p-3">10 – 30</td>
                          <td className="p-3">After wallet payment</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-200">
                      <p className="font-bold text-purple-900">Withdrawals (GH₵500+ balance)</p>
                      <p className="text-sm mt-1">14 working days processing to registered Mobile Money</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200">
                      <p className="font-bold text-amber-900">Refunds below GH₵500</p>
                      <p className="text-sm mt-1">30-day waiting period before refund processing begins</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border">
                      <p className="font-bold">Policy changes</p>
                      <p className="text-sm mt-1">Rewards may be adjusted or withdrawn without prior notice</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Abuse of wallet rewards may result in suspension. Commission balances and wallet balances follow
                    separate rules; fraudulent or reversed transactions may be held or reversed.
                  </p>
                </CardContent>
              </Card>
            </TermsSection>

            <TermsSection
              id="agent-rules"
              badge={<TermsBadge icon={Shield} label="Agent rules" className="from-red-100 to-orange-100" />}
              title="Conduct, data resale & promotion"
            >
              <div className="space-y-4">
                <AlertBanner variant="red" title="Data resale">
                  Bundles are for resale to friends, relatives, and close contacts only — not public retail or mass
                  marketing under the Dataflex brand.
                </AlertBanner>
                <PolicyCard title="Ineligible SIM types (no refunds)">
                  <p className="mb-3">Verify before ordering. No refunds for orders on:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Agent SIM",
                      "Merchant SIM",
                      "EVD SIM",
                      "Turbonet",
                      "Broadband",
                      "Blacklisted",
                      "Roaming",
                      "Company/Group",
                      "Wrong network",
                      "Invalid number",
                    ].map((s) => (
                      <span key={s} className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-800">
                        {s}
                      </span>
                    ))}
                  </div>
                </PolicyCard>
                <div className="grid md:grid-cols-2 gap-4">
                  <PolicyCard title="Allowed promotion">
                    <BulletList
                      icon={Check}
                      items={[
                        "Private WhatsApp groups",
                        "Friends, family, trusted colleagues",
                        "Personal messaging",
                      ]}
                    />
                  </PolicyCard>
                  <PolicyCard title="Forbidden promotion">
                    <BulletList
                      icon={X}
                      iconClass="text-red-600"
                      items={[
                        "TikTok, Facebook, Instagram, LinkedIn, X",
                        "Public ads using Dataflex brand",
                        "Marketplaces, radio, TV, print",
                      ]}
                    />
                  </PolicyCard>
                </div>
                <p className="text-sm text-red-800 dark:text-red-400 font-medium">
                  Violations may result in permanent ban without refund of entry fee or commissions.
                </p>
              </div>
            </TermsSection>

            <TermsSection
              id="commission"
              badge={<TermsBadge icon={TrendingUp} label="Commissions" />}
              title="Commission system"
              description="Rates vary by service; see your dashboard for current percentages and fixed referral amounts."
            >
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: "Data bundles", desc: "Typically 3–15% per sale", icon: Smartphone },
                  { title: "Service referrals", desc: "Fixed amounts per completed referral", icon: Users },
                  { title: "Wholesale", desc: "Typically 5–20% per sale", icon: Package },
                ].map(({ title, desc, icon: Icon }) => (
                  <div key={title} className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-900/10">
                    <Icon className="h-6 w-6 text-emerald-600 mb-2" />
                    <h4 className="font-bold">{title}</h4>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm">
                Withdraw commission earnings via the withdrawals section; processing typically 24–48 hours to Mobile
                Money where applicable. Dispute commission errors within 30 days.
              </p>
            </TermsSection>

            <TermsSection
              id="data-delivery"
              badge={<TermsBadge icon={Clock} label="Data delivery" />}
              title="Delivery times & reporting window"
            >
              <Card>
                <CardContent className="p-6 space-y-4 text-sm sm:text-base">
                  <p>
                    Delivery usually takes <strong>10 minutes to 24 hours</strong> depending on time of order, network
                    maintenance, and operational hours (<strong>6:00 AM – 9:30 PM</strong>). Orders after 9:30 PM process
                    after reopening at 6:00 AM.
                  </p>
                  <AlertBanner variant="red" title="Report within 24 hours">
                    <p>
                      If status is <strong>Completed</strong> but the client has no bundle after <strong>1 hour</strong>,
                      report on WhatsApp {SUPPORT.whatsappTechnical} with balance screenshot (with time), order
                      screenshot, number, and bundle details. Late reports cannot be resolved. Dataflex is not liable for
                      issues reported after 24 hours from completion.
                    </p>
                  </AlertBanner>
                </CardContent>
              </Card>
            </TermsSection>

            <TermsSection
              id="reporting"
              badge={<TermsBadge icon={AlertCircle} label="Support" />}
              title="When to report issues"
            >
              <div className="space-y-4">
                <AlertBanner variant="red" title="Do not contact support">
                  While order status is <strong>Pending</strong> or <strong>Processing</strong> — wait for completion.
                </AlertBanner>
                <PolicyCard title="Client SIM must be clear (Strictly No Refunds)">
                  <p className="mb-2">
                    We do not serve data to SIM cards that owe mobile money or credits (such as borrowed airtime/data).
                  </p>
                  <p>
                    Before ordering, confirm the client does <strong>not</strong> owe data bundles or Mobile Money debt on
                    the SIM. If they owe, failure is likely. If any client orders and the data fails due to this, they cannot ask for a refund. The funds have been spent or paid out to the network providers immediately and cannot be recovered. The agent should verify; hidden client debt is the client&apos;s responsibility.
                  </p>
                </PolicyCard>
                <PolicyCard title="Valid complaints">
                  <p>
                    After completion, if SIM is clear and data missing, send evidence to {SUPPORT.whatsappTechnical}. We
                    may resend at no cost if investigation confirms non-delivery.
                  </p>
                </PolicyCard>
              </div>
            </TermsSection>

            <TermsSection
              id="order-process"
              badge={<TermsBadge icon={ShoppingCart} label="Ordering" />}
              title="How to order"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <PolicyCard title="1. Manual payment">
                  Pay via official MoMo line → confirm on platform → order processes after verification.
                </PolicyCard>
                <PolicyCard title="2. Wallet payment (recommended)">
                  Load wallet (min. GH₵100 typical for checkout) → instant wallet checkout → faster processing.
                </PolicyCard>
              </div>
            </TermsSection>

            <TermsSection
              id="data-policy"
              badge={<TermsBadge icon={Smartphone} label="Data sales" />}
              title="Data sales guidelines"
            >
              <BulletList
                icon={Check}
                items={[
                  "Set expectations: not instant; direct clients needing instant data to network providers",
                  "Sundays and peak hours may be slower",
                  "Do not contact support during pending/processing",
                  "Only report when completed and client confirms no receipt",
                ]}
              />
            </TermsSection>

            <TermsSection
              id="payment-integration"
              badge={<TermsBadge icon={CreditCard} label="Payments" />}
              title="Why we avoid Paystack on every transaction"
            >
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Paystack charges ~1.95% on local transactions. We use direct wallet loading and MoMo so you keep full
                value on platform purchases. Paystack is available for registration fee checkout (GH₵
                {PLATFORM_ENTRY_FEE_PAYSTACK}) where you choose that method.
              </p>
            </TermsSection>

            <TermsSection
              id="account-management"
              badge={<TermsBadge icon={UserCheck} label="Account" />}
              title="Account management & security"
            >
              <div className="space-y-3">
                <PolicyCard title="Verification">
                  Admin verification required; provide accurate registration and payment details.
                </PolicyCard>
                <PolicyCard title="Suspension & termination">
                  We may suspend for fraud, terms breaches, or risk. Legitimate balances may still be paid after review;
                  serious violations may forfeit commissions.
                </PolicyCard>
                <PolicyCard title="Security">
                  Use strong passwords; do not share credentials. Activity is logged (IP, device, timestamps) for fraud
                  prevention and legal compliance.
                </PolicyCard>
              </div>
            </TermsSection>

            <TermsSection
              id="platform-responsibilities"
              badge={<TermsBadge icon={ShieldCheck} label="Limitations" />}
              title="Platform responsibilities"
            >
              <BulletList
                icon={AlertCircle}
                iconClass="text-amber-600"
                items={[
                  "We strive for high uptime but cannot guarantee uninterrupted service",
                  "Not liable for third-party networks, registries, or MoMo failures beyond our control",
                  "Prices and commissions may change; notice via official WhatsApp channel where applicable",
                  "Maintenance mode may apply without prior notice for security or upgrades",
                  "Liability limited to direct loss on the transaction in question where permitted by law",
                ]}
              />
            </TermsSection>

            <TermsSection
              id="usage-rules"
              badge={<TermsBadge icon={FileText} label="Usage" />}
              title="Usage rules"
            >
              <BulletList
                icon={Check}
                items={[
                  "Join the official WhatsApp channel after registration",
                  "No hacking, scraping, credential stuffing, or unauthorized access",
                  "Double-check numbers before submitting data orders — sent bundles cannot be cancelled",
                  "Do not use SIMs with borrowed airtime (bundles may auto-expire)",
                  "Comply with Ghanaian law; report bugs and suspicious activity",
                  "Use only official DataflexGhana.com links for referrals",
                ]}
              />
            </TermsSection>

            <TermsSection
              id="dispute-resolution"
              badge={<TermsBadge icon={MessageSquare} label="Disputes" />}
              title="Disputes & complaints"
            >
              <p className="text-gray-700 dark:text-gray-300">
                Contact {SUPPORT.whatsappTechnical} with complete evidence. Target initial response within 2 hours;
                investigation 24–48 hours; resolution often 3–5 business days. False or abusive complaints may lead to
                suspension. These terms are governed by the laws of Ghana.
              </p>
            </TermsSection>

            <TermsSection
              id="privacy-policy"
              badge={<TermsBadge icon={Lock} label="Privacy" />}
              title="Privacy policy"
            >
              <div className="space-y-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                <p>
                  We collect data needed to operate the platform (registration, transactions, support). We do not sell
                  personal data. Data is stored securely; retention follows legal and audit requirements (e.g. transaction
                  records). Contact {SUPPORT.email} for access or correction requests.
                </p>
              </div>
            </TermsSection>

            <TermsSection
              id="cookie-policy"
              badge={<TermsBadge icon={Cookie} label="Cookies" />}
              title="Cookie policy"
            >
              <p className="text-gray-700 dark:text-gray-300">
                Essential cookies support login and security; optional analytics help improve the product. You may adjust
                browser settings; disabling essential cookies may limit functionality. Continued use constitutes consent.
              </p>
            </TermsSection>

            <TermsSection
              id="contact"
              badge={<TermsBadge icon={Phone} label="Contact" />}
              title="Contact & support"
            >
              <Card className="border-emerald-200">
                <CardContent className="p-6 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" /> WhatsApp (technical / data)
                    </p>
                    <p className="text-lg font-bold">{SUPPORT.whatsappTechnical}</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4" /> WhatsApp (profile service)
                    </p>
                    <p className="text-lg font-bold">{SUPPORT.whatsappProfile}</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Email
                    </p>
                    <p>{SUPPORT.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" /> Hours
                    </p>
                    <p className="text-sm">{SUPPORT.hours}</p>
                  </div>
                </CardContent>
              </Card>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/faq">FAQ</Link>
                </Button>
                <Button size="sm" className="bg-emerald-600" asChild>
                  <Link href="/agent/register">Become an agent</Link>
                </Button>
              </div>
            </TermsSection>

            <section className="pt-8 border-t text-center">
              <p className="text-gray-600 dark:text-gray-400">
                These terms are effective as of <strong>{TERMS_EFFECTIVE_DATE}</strong> and supersede prior versions.
                Continued use of Dataflex Ghana constitutes acceptance.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Last updated: {TERMS_LAST_UPDATED} · Version {TERMS_VERSION}
              </p>
            </section>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
        <Button size="lg" className="rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/agent/register" className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Register
          </Link>
        </Button>
      </div>

      <Footer />
    </div>
  )
}
