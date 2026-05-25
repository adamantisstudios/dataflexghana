import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Scale, Ban, Users, Percent } from "lucide-react"
import { InfluencerTermsNav, InfluencerTermsFooterLinks } from "@/components/influencer/InfluencerTermsNav"

const BRAND = "#0E8F3D"

export default function InfluencerTermsPage() {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white"
      style={{ fontFamily: "Inter, Poppins, sans-serif" }}
    >
      <InfluencerTermsNav />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND}, #35B24A)` }}>
          <p className="text-sm uppercase tracking-wider text-white/80">Dataflex Micro-Influencers</p>
          <h2 className="text-2xl font-bold mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
            Platform terms for influencers &amp; clients
          </h2>
          <p className="mt-2 text-white/90 text-sm">
            By using the Micro-Influencer Marketplace you agree to these terms. Both influencers and clients pay an 8%
            platform service fee.
          </p>
          <p className="mt-3 text-white/90 text-sm">
            Not yet on the platform?{" "}
            <Link href="/influencers/register" className="underline font-semibold text-white">
              Apply directly as an influencer
            </Link>{" "}
            — no agent registration payment required.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-5 w-5" style={{ color: BRAND }} />
              Dataflex as middle ground
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              Dataflex Ghana connects verified micro-influencers with clients who need promotional content. We are not
              the employer of either party—we provide escrow, payment processing, and dispute support.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-5 w-5" style={{ color: BRAND }} />
              Dual platform fees (8% each side)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>Influencers:</strong> 8% of the package price is deducted from your payout when an order is
              completed.
            </p>
            <p>
              <strong>Clients:</strong> 8% of the package price is added as a platform service fee at checkout.
            </p>
            <p className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-emerald-900">
              Example: GHS 1,000 package → client pays GHS 1,080; influencer receives GHS 920 after completion.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" style={{ color: BRAND }} />
              Dispute resolution
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>Funds are held until the client confirms delivery or admin resolves a dispute.</p>
            <p>
              Either party may report an issue; Dataflex admin will review requirements, deliverables, and communication
              before releasing or refunding escrow.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban className="h-5 w-5 text-red-600" />
              No backdoor deals
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              Circumventing the platform (sharing payment details to complete work off-platform) violates these terms.
              Consequences include profile removal, withheld payouts, and permanent ban from the marketplace.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5" style={{ color: BRAND }} />
              Why both parties need the platform
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-3">
            <p>
              <strong>Clients</strong> get escrow protection—you only release payment after work is done.
            </p>
            <p>
              <strong>Influencers</strong> get verified buyers, secure Paystack checkout, and no chasing payments.
            </p>
          </CardContent>
        </Card>

        <InfluencerTermsFooterLinks />
      </main>
    </div>
  )
}
