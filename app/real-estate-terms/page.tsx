import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Home } from "lucide-react"

export const metadata = {
  title: "Real Estate Listing Terms | DataFlex",
  description: "Rules for agents listing properties on the Referral Powerhouse storefront.",
}

export default function RealEstateTermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <Home className="h-10 w-10 mx-auto text-amber-700" />
          <h1 className="text-2xl font-bold text-slate-900">Real Estate Listing Terms</h1>
          <p className="text-slate-600 text-sm">For agents using the Referral Hub marketplace and storefront</p>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5" />
              Important
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-900 space-y-2">
            <p>
              You must personally know the property owner and have their explicit permission before listing any
              property. Posting fake, misleading, or random listings is prohibited and will result in permanent
              suspension of your storefront.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4 text-sm text-slate-700">
            <section>
              <h2 className="font-semibold text-slate-900 mb-1">1. Eligibility</h2>
              <p>
                Only agents with property publishing permission may submit listings. All submissions require admin
                approval before they can appear on your storefront.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900 mb-1">2. Accurate listings</h2>
              <p>
                Listings must include at least two genuine photos, accurate pricing, location, and contact details you
                are authorized to share. Do not copy listings from other agents or portals without permission.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900 mb-1">3. Platform vs your listings</h2>
              <p>
                You may promote platform-owned properties on your storefront only if you can genuinely assist buyers or
                renters. When a platform property closes through your referral, commission may be credited per admin
                records.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900 mb-1">4. Agent-listed properties</h2>
              <p>
                When you list a property you sourced, you are responsible for its accuracy. If the deal closes, you may
                owe the platform a commission as recorded by admin in the property deal ledger.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900 mb-1">5. Suspension</h2>
              <p>
                Admins may suspend your entire storefront immediately for violations. While suspended, none of your
                products, services, or property listings will appear publicly.
              </p>
            </section>
            <section>
              <h2 className="font-semibold text-slate-900 mb-1">6. Customer contact</h2>
              <p>
                Buyers and renters contact you directly via your storefront. The platform does not guarantee sales or
                rentals; you handle viewings and negotiations with owners.
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="/agent/referralhub">Back to Referral Hub</Link>
          </Button>
          <Button asChild>
            <Link href="/agent/publish-properties">Publish a property</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
