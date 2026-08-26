import { NextResponse } from "next/server"
import { APP_RELEASE } from "@/lib/app-release"

/** Redirects to the static APK in /public/app (CDN-friendly). */
export async function GET() {
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.dataflexghana.com"
  return NextResponse.redirect(new URL(APP_RELEASE.downloadPath, origin), 302)
}
