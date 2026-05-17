import type { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Shield, FileText, Scale, Lock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Terms & Conditions | DataFlex Ghana",
  description:
    "Terms and conditions for DataFlex Ghana agents and users: platform use, commissions, payments, security, privacy, and prohibited conduct.",
  robots: "index,follow",
}

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: `By registering, logging in, or using DataFlex Ghana ("DataFlex", "we", "us", "the Platform"), you agree to these Terms & Conditions and our policies. If you do not agree, do not use the Platform. We may update these terms; continued use after notice constitutes acceptance.`,
  },
  {
    id: "platform",
    title: "2. Platform Use",
    body: `DataFlex provides tools for registered agents to promote and fulfil services including data bundles, referral services, compliance forms, storefront sales, savings, teaching channels, wholesale, vouchers, and related offerings. You must use the Platform only for lawful purposes in Ghana and in line with instructions provided in your dashboard and FAQ.`,
  },
  {
    id: "registration",
    title: "3. Agent Registration & Accounts",
    body: `You must provide accurate information during registration and keep your credentials confidential. One person per agent account unless we approve otherwise. Accounts require approval and, where applicable, payment of registration fees. You are responsible for all activity under your account. Sharing passwords or selling access is prohibited.`,
  },
  {
    id: "commissions",
    title: "4. Commissions, Wallet & Withdrawals",
    body: `Commissions are earned as described per service in your dashboard. Amounts may show as pending until transactions are verified. Wallet top-ups and commission balances are separate. Withdrawals are processed to your registered Mobile Money number subject to minimum amounts, verification, and anti-fraud checks. We may hold or reverse commissions linked to disputed, fraudulent, or reversed transactions.`,
  },
  {
    id: "payments",
    title: "5. Payments to DataFlex",
    body: `Some services require you to pay DataFlex or designated payment numbers before processing (e.g. compliance submissions, registration fees, manual order payments). You must use the reference codes provided. DataFlex is not responsible for payments sent to wrong numbers without valid references.`,
  },
  {
    id: "conduct",
    title: "6. Prohibited Conduct",
    body: `You must not: commit fraud or misrepresentation; create duplicate accounts; harass customers or staff; spam or scrape the Platform; attempt unauthorized access, hacking, tampering, SQL injection, credential stuffing, or bypassing security controls; reverse-engineer or overload our systems; use bots to extract data; impersonate others; or use the Platform for illegal goods or services. Violations may result in immediate suspension, termination, and legal action.`,
  },
  {
    id: "monitoring",
    title: "7. Monitoring, Logging & Law Enforcement",
    body: `We log platform activity including logins, orders, payments, IP addresses, device/browser data, and timestamps for security, fraud prevention, dispute resolution, and legal compliance. By using the Platform you consent to this logging. We cooperate with law enforcement and may prosecute violators to the full extent of the law in Ghana and applicable jurisdictions.`,
  },
  {
    id: "termination",
    title: "8. Suspension & Termination",
    body: `We may suspend or terminate accounts for breach of these terms, inactivity policies, fraud risk, chargebacks, or regulatory requirements. Terminated agents forfeit access; outstanding legitimate balances may still be paid subject to investigation. You may stop using the Platform at any time; accrued obligations survive termination.`,
  },
  {
    id: "privacy",
    title: "9. Data Protection & Privacy",
    body: `We process personal data to operate the Platform, verify identity, process payments, and comply with law. Customer data you collect must be handled lawfully and only for service delivery. Do not sell or misuse personal information. Contact us to request access or correction of your agent profile data where applicable.`,
  },
  {
    id: "disclaimers",
    title: "10. Disclaimers & Limitation of Liability",
    body: `Services may depend on third parties (networks, government registries, payment providers). We do not guarantee uninterrupted access. To the maximum extent permitted by law, DataFlex is not liable for indirect or consequential losses. Our liability for proven direct loss is limited to fees you paid to us in the twelve months before the claim.`,
  },
  {
    id: "disputes",
    title: "11. Disputes & Governing Law",
    body: `Disputes should first be reported via support channels. These terms are governed by the laws of Ghana. Courts in Ghana have exclusive jurisdiction unless mandatory consumer law requires otherwise.`,
  },
  {
    id: "contact",
    title: "12. Contact",
    body: `DataFlex Ghana (Adamantis Solutions). Support: WhatsApp/phone 0246827049 · sales.dataflex@gmail.com · Accra, Ghana. For platform help, see our FAQ at /faq.`,
  },
]

export default function TermsPage() {
  const updated = "17 May 2026"

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
        <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="font-bold text-emerald-700 text-lg">
              DataFlex Ghana
            </Link>
            <nav className="flex flex-wrap gap-2 text-sm">
              <Button variant="outline" size="sm" asChild>
                <Link href="/faq">FAQ</Link>
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link href="/agent/register">Become an Agent</Link>
              </Button>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 mb-4">
              <Scale className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="text-slate-600 mt-2 text-sm md:text-base">Last updated: {updated}</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-8 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-950 leading-relaxed">
              <strong>Security:</strong> Unauthorized access, hacking, tampering, or abuse of this
              platform is illegal. Activity is logged (IP, device, timestamps). Violators will be
              prosecuted. Read our{" "}
              <Link href="/faq" className="underline font-medium text-amber-900">
                FAQ
              </Link>{" "}
              for service-specific policies.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                  {s.title}
                </h2>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {s.body}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-xl border bg-white p-6 shadow-sm text-center">
            <Shield className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
            <p className="text-slate-700 text-sm mb-4">
              Questions? Read the{" "}
              <Link href="/faq" className="text-emerald-600 font-medium underline">
                FAQ
              </Link>{" "}
              or contact support before registering.
            </p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/agent/register">Register as Agent</Link>
            </Button>
          </div>
        </main>
      </div>
      <Footer />
    </>
  )
}
