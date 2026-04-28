import { type NextRequest, NextResponse } from "next/server"
import { getCacheStats, clearPreviewCache } from "@/lib/link-preview-cache"

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get("action")

    if (action === "stats") {
      const stats = await getCacheStats()
      return NextResponse.json(stats)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] Error getting cache stats:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      {
        error: "Failed to get cache stats",
        totalEntries: 0,
        activeEntries: 0,
        expiredEntries: 0,
        cacheSize: "0 MB",
      },
      { status: 200 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const result = await clearPreviewCache()
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error clearing cache:", error instanceof Error ? error.message : String(error))
    return NextResponse.json({ error: "Failed to clear cache", success: false }, { status: 200 })
  }
}
