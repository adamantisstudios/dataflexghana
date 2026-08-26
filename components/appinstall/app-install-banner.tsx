"use client"

import Link from "next/link"
import { Download, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_RELEASE } from "@/lib/app-release"

/** Compact strip for registration / payment pages */
export default function AppInstallBanner({
  compact = false,
}: {
  compact?: boolean
}) {
  return (
    <div
      className={`border border-emerald-700/20 bg-emerald-700 text-white ${
        compact ? "rounded-xl" : "border-x-0 border-t-0"
      }`}
    >
      <div
        className={`flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between ${
          compact ? "px-4 py-3" : "container mx-auto px-4 py-3 md:px-6"
        }`}
      >
        <div className="flex items-start gap-3 sm:items-center">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <Smartphone className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold leading-tight">Prefer the Android app?</p>
            <p className="text-sm text-emerald-100/90">
              Install DataFlex Agent free — register, sell, and manage your agency on your phone.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            asChild
            size="sm"
            className="rounded-full bg-white font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            <Link href={APP_RELEASE.installPagePath}>
              <Download className="mr-1.5 h-4 w-4" />
              Download &amp; install
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
