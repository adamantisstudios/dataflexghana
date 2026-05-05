import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { admin_id, current_password, new_password } = await request.json()

    if (!admin_id || !current_password || !new_password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get current admin from database
    const { data: admin, error: fetchError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", admin_id)
      .single()

    if (fetchError || !admin) {
      console.error("[v0] Admin fetch error:", fetchError)
      return NextResponse.json(
        { error: "Admin not found" },
        { status: 404 }
      )
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(current_password, admin.password_hash)
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10)

    // Update admin password in database
    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admins")
      .update({ password_hash: hashedPassword, updated_at: new Date().toISOString() })
      .eq("id", admin_id)
      .select()
      .single()

    if (updateError) {
      console.error("[v0] Password update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    // Return updated admin (without password hash)
    const { password_hash, ...safeAdmin } = updatedAdmin
    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
      admin: safeAdmin,
    })
  } catch (error) {
    console.error("[v0] Password update endpoint error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
