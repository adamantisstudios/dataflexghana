"use client"

import Link from "next/link"
import { Shield, Heart, Ban, Camera, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatingTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div className="mb-8 text-center">
          <Heart className="mx-auto mb-3 h-10 w-10 text-rose-500" />
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Find a Meaningful Connection — Terms</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: May 2026</p>
        </div>

        <Card className="mb-6 border-rose-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-rose-600" />
              Our commitment to meaningful connections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-gray-700">
            <p>
              DataFlex Ghana&apos;s &quot;Find a Date&quot; feature is designed exclusively for approved agents
              seeking serious relationships, marriage-minded connections, or meaningful friendships — not casual
              hookups.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>No hookup-seeking behaviour.</strong> Profiles or messages promoting casual sexual
                encounters, explicit content, or solicitation will result in immediate suspension and possible
                account termination.
              </li>
              <li>
                <strong>No screenshotting or sharing.</strong> Private photos, conversations, and personal
                details must never be captured, shared on social media, or distributed without explicit consent.
              </li>
              <li>
                <strong>Respect &quot;Ladies First.&quot;</strong> When enabled, only the woman may initiate
                conversation after a match. Attempting to bypass this violates our community standards.
              </li>
              <li>
                <strong>Report abuse.</strong> Use the in-app Report button for harassment, fraud, impersonation,
                or any behaviour that makes you feel unsafe.
              </li>
              <li>
                <strong>Legal consequences.</strong> Violations may be logged with IP address and device
                information. DataFlex Ghana reserves the right to pursue civil and criminal remedies under Ghanaian
                law for harassment, fraud, or unauthorised data sharing.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6 border-amber-100 bg-amber-50/50">
          <CardContent className="flex gap-3 p-5 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              By activating your dating profile you confirm you are 18+, your intentions are genuine, and you
              agree to our counselling-first approach to building healthy relationships.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex gap-3 p-5 text-sm text-gray-700">
              <Camera className="h-5 w-5 shrink-0 text-rose-500" />
              <p>Photos are served through authenticated proxies. Downloading or redistributing them is prohibited.</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex gap-3 p-5 text-sm text-gray-700">
              <Ban className="h-5 w-5 shrink-0 text-rose-500" />
              <p>Blocking removes matches permanently. Blocked agents cannot appear in each other&apos;s discover stack.</p>
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Questions?{" "}
          <a href="mailto:sales.dataflex@gmail.com" className="text-rose-600 underline">
            Contact support
          </a>
          {" · "}
          <Link href="/agent/dating" className="text-rose-600 underline">
            Back to Find a Date
          </Link>
        </p>
      </div>
    </div>
  )
}
