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
    const { agentIds, action } = await request.json()

    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json({ error: "Agent IDs are required" }, { status: 400 })
    }

    if (!action || typeof action !== "string") {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    let updateQuery = ""
    let newStatus = ""

    switch (action) {
      case "activate":
        newStatus = "active"
        break
      case "deactivate":
        newStatus = "inactive"
        break
      case "suspend":
        newStatus = "suspended"
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    updateQuery = `
      UPDATE agents 
      SET status = $1, updated_at = NOW()
      WHERE id = ANY($2::uuid[])
      RETURNING id, agent_id, name, status
    `

    const result = await dbPool.query(updateQuery, [newStatus, agentIds])

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${result.rows.length} agent(s)`,
      updatedAgents: result.rows,
    })
  } catch (error) {
    console.error("❌ Bulk action error:", error)

    if (error instanceof Error) {
      if (error.message.includes("DATABASE_URL")) {
        return NextResponse.json(
          { error: "Database configuration error. Please check environment variables." },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 })
  }
}
