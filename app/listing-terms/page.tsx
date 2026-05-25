import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Scale, Shield, Ban, Package } from "lucide-react"

const BRAND = "#0E8F3D"

export default function ListingTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">Listing Package Terms</h1>
          <p className="text-sm text-muted-foreground">Dataflex Ghana — agent storefront product listings</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div
          className="rounded-2xl p-6 text-white"
          style={{ background: `linear-gradient(135deg, ${BRAND}, #35B24A)` }}
        >
          <p className="text-sm text-white/80 uppercase tracking-wide">Agent listings</p>
          <h2 className="text-2xl font-bold mt-1">Terms &amp; conditions</h2>
          <p className="mt-2 text-white/90 text-sm">
            By purchasing a listing package you agree to these rules. Payment is offline between you and your
            customers via MoMo — Dataflex does not process product sales.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5" style={{ color: BRAND }} />
              Your products only
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>Only list products you own or are authorised to sell. No reselling others&apos; inventory without permission.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban className="h-5 w-5" style={{ color: BRAND }} />
              Prohibited items
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>No illegal, counterfeit, stolen, or restricted goods. No misleading listings or bait-and-switch pricing.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-5 w-5" style={{ color: BRAND }} />
              Quality &amp; fairness
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>Use clear photos and accurate descriptions. Deal honestly with customers on price, delivery, and refunds.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" style={{ color: BRAND }} />
              Platform role &amp; refunds
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              Dataflex provides listing space and optional analytics. We are not a party to MoMo payments between you and
              buyers. Disputes are between you and the customer.
            </p>
            <p>Fraudulent listings result in immediate suspension. Listing fees are non-refundable once a package is activated.</p>
          </CardContent>
        </Card>

        <Link href="/agent/referralhub?hubTab=listings">
          <Button className="text-white" style={{ backgroundColor: BRAND }}>
            Back to My Listings
          </Button>
        </Link>
      </main>
    </div>
  )
}
