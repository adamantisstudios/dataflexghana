import { requireAdminSession } from "@/lib/api-auth"
import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client";

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {

    // Test 1: Check if admin_users table is accessible
    const { data: adminUsers, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", "sales.dataflex@gmail.com")


    // Test 2: Check if we can query the table at all
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from("admin_users")
      .select("id, email, is_active")
      .limit(5)


    // Test 3: Try to get table info
    const { data: tableInfo, error: tableError } = await supabase
      .rpc("exec_sql", {
        sql: "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name = 'admin_users' ORDER BY ordinal_position;",
      })
      .catch(() => ({ data: null, error: { message: "RPC not available" } }))

    return NextResponse.json({
      success: true,
      tests: {
        adminUser: {
          data: adminUsers,
          error: adminError?.message || null,
        },
        allAdmins: {
          data: allAdmins,
          error: allAdminsError?.message || null,
        },
        tableInfo: {
          data: tableInfo,
          error: tableError?.message || null,
        },
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Test auth error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { email, password } = await request.json()


    // Test the exact login logic
    const { data: adminUser, error: userError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single()


    return NextResponse.json({
      success: true,
      loginTest: {
        userFound: !!adminUser,
        userError: userError?.message || null,
        passwordMatch: adminUser ? adminUser.password_hash === password : false,
        userDetails: adminUser
          ? {
              id: adminUser.id,
              email: adminUser.email,
              role: adminUser.role,
              is_active: adminUser.is_active,
            }
          : null,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Login test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
