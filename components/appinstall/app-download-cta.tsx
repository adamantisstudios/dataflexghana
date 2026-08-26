"use client"

import Link from "next/link"
import { Download, Smartphone, ShieldAlert, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_RELEASE } from "@/lib/app-release"

export default function AppDownloadCta() {
  return (
    <section id="get-the-app" className="scroll-mt-24 bg-emerald-800 py-12 text-white md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
              Android app · free
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Install DataFlex Agent on your phone
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-emerald-50/95">
              Sell data, manage Referral Hub, cash out commissions, and access agent services anywhere —
              install from this site (not on Play Store yet).
            </p>
            <ul className="space-y-2 text-sm text-emerald-100">
              <li className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-300" />
                Wallet, orders &amp; withdrawals on mobile
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-300" />
                Step-by-step Android install, including unknown apps
              </li>
              <li className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-300" />
                Official APK only from dataflexghana.com/appinstall
              </li>
            </ul>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-white text-emerald-900 hover:bg-emerald-50">
                <Link href={APP_RELEASE.installPagePath}>
                  <Download className="mr-2 h-5 w-5" />
                  Open install guide
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                <a href={APP_RELEASE.downloadPath} download={APP_RELEASE.fileName}>
                  Download APK now
                </a>
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-sm leading-relaxed text-emerald-50 backdrop-blur">
            <p className="font-semibold text-white">How to install (quick)</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>Download the APK</li>
              <li>
                Allow <strong>Install unknown apps</strong> for Chrome/Files
              </li>
              <li>Open the file → Install → Open</li>
              <li>Log in with your agent account</li>
            </ol>
            <p className="mt-4 text-emerald-200/90">Full screens &amp; safety tips on the install page.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
