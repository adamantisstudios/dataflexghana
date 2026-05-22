import { normalizeGhanaPhoneNumber } from "@/lib/phone-utils"
import type { SupabaseClient } from "@supabase/supabase-js"

/** Canonical E.164-style key for grocery abuse checks (+233…). */
export function normalizeGroceryPhone(raw: string): string {
  const trimmed = String(raw ?? "").trim()
  const gh = normalizeGhanaPhoneNumber(trimmed)
  if (gh) return gh

  const digits = trimmed.replace(/\D/g, "")
  if (!digits) return trimmed

  if (digits.startsWith("233")) return `+${digits}`
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`
  return `+233${digits}`
}

/** Variants stored in legacy rows (0xx, 233xx, +233xx). */
export function groceryPhoneLookupVariants(normalized: string): string[] {
  const variants = new Set<string>()
  const trimmed = normalized.trim()
  if (!trimmed) return []

  variants.add(trimmed)

  const digits = trimmed.replace(/\D/g, "")
  if (digits.startsWith("233") && digits.length >= 12) {
    variants.add(`0${digits.slice(3)}`)
    variants.add(digits)
    variants.add(`+${digits}`)
  } else if (digits.length >= 9) {
    const local = digits.length === 10 && digits.startsWith("0") ? digits : `0${digits.slice(-9)}`
    variants.add(local)
    variants.add(`233${digits.replace(/^0/, "")}`)
    variants.add(`+233${digits.replace(/^0/, "")}`)
  }

  return [...variants]
}

export function groceryPhoneOrFilter(normalized: string): string {
  return groceryPhoneLookupVariants(normalized)
    .map((p) => `phone.eq.${p}`)
    .join(",")
}

export async function isGroceryPhoneBlocked(
  db: SupabaseClient,
  phone: string,
): Promise<boolean> {
  const normalized = normalizeGroceryPhone(phone)
  const variants = groceryPhoneLookupVariants(normalized)

  for (const variant of variants) {
    const { data, error } = await db
      .from("blocked_phones")
      .select("phone")
      .eq("phone", variant)
      .maybeSingle()

    if (error) {
      if (error.message?.includes("blocked_phones") || error.code === "42P01") {
        console.warn("[grocery-abuse] blocked_phones table missing — run scripts/053_blocked_phones.sql")
        return false
      }
      throw error
    }
    if (data) return true
  }

  return false
}

export async function hasGroceryRequestInLast24Hours(
  db: SupabaseClient,
  phone: string,
): Promise<boolean> {
  const normalized = normalizeGroceryPhone(phone)
  const orFilter = groceryPhoneOrFilter(normalized)
  if (!orFilter) return false

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await db
    .from("grocery_requests")
    .select("id")
    .gte("created_at", since)
    .or(orFilter)
    .limit(1)

  if (error) {
    console.error("[grocery-abuse] rate limit check:", error)
    throw error
  }

  return (data?.length ?? 0) > 0
}
