import { type NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return pool
}

export async function POST(request: NextRequest) {
  try {
    const dbPool = getPool()
    const { searchTerm } = await request.json()

    if (!searchTerm || typeof searchTerm !== "string") {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 })
    }

    const searchQuery = `
      SELECT
        a.*,
        COALESCE(a.status, CASE WHEN a.isapproved = true THEN 'active' ELSE 'pending' END) as status,
        a.last_login,
        a.region,
        a.full_name,
        a.phone_number,
        a.wallet_balance,
        a.isapproved,
        a.created_at
      FROM agents a
      WHERE (
        LOWER(a.full_name) LIKE LOWER($1) OR
        LOWER(a.phone_number) LIKE LOWER($1) OR
        LOWER(a.id::text) LIKE LOWER($1)
      )
      ORDER BY a.created_at DESC
      LIMIT 50
    `

    const searchPattern = `%${searchTerm}%`
    const result = await dbPool.query(searchQuery, [searchPattern])

    return NextResponse.json({
      success: true,
      agents: result.rows,
      count: result.rows.length,
    })
  } catch (error) {
    console.error("❌ Agent search error:", error)

    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL")) {
        return NextResponse.json(
          { error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to search agents" }, { status: 500 })
  }
}
