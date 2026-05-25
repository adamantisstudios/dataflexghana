import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

const BRAND = "#0E8F3D"

export default function InfluencerRegisterThankYouPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/90 to-white flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full rounded-2xl border-emerald-100 shadow-lg text-center">
        <CardContent className="p-8 space-y-4">
          <CheckCircle2 className="h-14 w-14 mx-auto" style={{ color: BRAND }} />
          <h1 className="text-xl font-bold text-slate-900">Application submitted!</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Your application has been submitted! We&apos;ll review it and get back to you within 48 hours.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link href="/influencers">
              <Button className="w-full text-white" style={{ backgroundColor: BRAND }}>
                Browse influencers
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
