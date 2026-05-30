import bcrypt from "bcryptjs"
import { getAdminClient } from "@/lib/supabase-base"

export async function verifyAdminPassword(
  stored: string | null | undefined,
  candidate: string,
): Promise<boolean> {
  if (!stored) return false
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    return bcrypt.compare(candidate, stored)
  }
  return stored === candidate
}

export async function findAdminByEmail(email: string) {
  const db = getAdminClient()
  const trimmed = email.trim()

  const { data, error } = await db
    .from("admin_users")
    .select("*")
    .ilike("email", trimmed)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data
}
