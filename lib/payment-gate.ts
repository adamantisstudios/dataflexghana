"use server"

import { cookies } from "next/headers"

/**
 * Payment Gate Utility - Manages access to /agent/register
 * Uses secure HTTP-only cookies to track payment verification
 * No database required - session/cookie based only
 * 
 * NOTE: This file uses "use server" and should ONLY be imported by:
 * - Route handlers (/app/api/*)
 * - Server components (not client components)
 * 
 * Client components should call API endpoints instead (e.g. /api/agent/check-payment)
 */

const PAYMENT_COOKIE_NAME = "payment_verified"
const PAYMENT_EXPIRY_HOURS = 24 // Payment flag valid for 24 hours

/**
 * Mark payment as verified after successful transaction
 * Called by both Paystack verify endpoint and manual payment handler
 */
export async function setPaymentVerified(agentId: string) {
  try {
    const cookieStore = await cookies()
    // Set secure HTTP-only cookie
    // maxAge in seconds: 24 hours
    cookieStore.set(PAYMENT_COOKIE_NAME, agentId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PAYMENT_EXPIRY_HOURS * 60 * 60,
      path: "/",
    })
    return true
  } catch (error) {
    console.error("[v0] Error setting payment cookie:", error)
    return false
  }
}

/**
 * Check if payment was verified for the current user
 * Returns agent ID if payment verified, null otherwise
 */
export async function verifyPaymentGate(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const agentId = cookieStore.get(PAYMENT_COOKIE_NAME)?.value
    
    if (agentId) {
      return agentId
    }
    
    return null
  } catch (error) {
    console.error("[v0] Error verifying payment gate:", error)
    return null
  }
}

/**
 * Clear payment flag after successful registration
 * Called after user completes registration form submission
 */
export async function clearPaymentGate() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(PAYMENT_COOKIE_NAME)
    return true
  } catch (error) {
    console.error("[v0] Error clearing payment gate:", error)
    return false
  }
}

/**
 * Check if payment flag is about to expire (less than 1 hour left)
 * Optional: can be used to warn users before expiry
 */
export async function isPaymentExpiring(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const paymentCookie = cookieStore.get(PAYMENT_COOKIE_NAME)
    
    // If cookie exists, we consider it valid (Next.js handles expiry)
    // This is a simplified check - a more robust version would
    // store and check a timestamp in the cookie
    return !paymentCookie
  } catch (error) {
    console.error("[v0] Error checking payment expiry:", error)
    return true
  }
}
