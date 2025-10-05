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

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dbPool = getPool()
    const { status } = await request.json()
    const agentId = params.id

    if (!status || !["active", "inactive", "suspended"].includes(status)) {
      return NextResponse.json({ error: "Valid status is required (active, inactive, suspended)" }, { status: 400 })
    }

    const updateQuery = `
      UPDATE agents 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, agent_id, name, status, updated_at
    `

    const result = await dbPool.query(updateQuery, [status, agentId])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      agent: result.rows[0],
      message: `Agent status updated to ${status}`,
    })
  } catch (error) {
    console.error("❌ Failed to update agent status:", error)

    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL")) {
        return NextResponse.json(
          { error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to update agent status" }, { status: 500 })
  }
}
