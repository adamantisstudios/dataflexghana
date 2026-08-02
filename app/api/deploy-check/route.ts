import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
    deployedAt: process.env.VERCEL_DEPLOYMENT_ID ?? "unknown",
    maintenanceFixVersion: "v5-maintenance-gate-js",
  })
}
