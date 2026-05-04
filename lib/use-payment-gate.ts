"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * Hook to check payment verification status and handle redirects
 * Returns null while checking, true if verified, false if not
 */
export function usePaymentGate() {
  const [verified, setVerified] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkPayment = async () => {
      try {
        const res = await fetch("/api/agent/check-payment", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          const data = await res.json()
          setVerified(data.verified)
        } else {
          setVerified(false)
        }
      } catch (err) {
        console.warn("[v0] Error checking payment:", err)
        setVerified(false)
      }
    }

    checkPayment()
  }, [])

  return { verified, router }
}

/**
 * Helper function to handle protected navigation
 * Use in onClick handlers for links that need payment verification
 */
export function handleProtectedNavigation(
  href: string,
  router: any,
  requiringPayment: boolean = true,
  onPaymentRequired?: () => void
) {
  // For now, we'll check the payment status via fetch
  const checkAndNavigate = async () => {
    try {
      const res = await fetch("/api/agent/check-payment", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.verified) {
          router.push(href)
        } else {
          // User hasn't paid yet, special handling for /fashion-avenue
          if (href === "/fashion-avenue") {
            // Fashion avenue from no-registration needs payment first
            console.log("[v0] Fashion avenue access requires payment, redirecting to payment")
            router.push("/agent/registration-payment")
          } else if (href === "/agent/register") {
            // Register always requires payment
            console.log("[v0] Register requires payment, redirecting to payment")
            router.push("/agent/registration-payment")
          }

          if (onPaymentRequired) {
            onPaymentRequired()
          }
        }
      } else {
        // Default to redirecting to payment
        router.push("/agent/registration-payment")
      }
    } catch (err) {
      console.error("[v0] Error checking payment:", err)
      router.push("/agent/registration-payment")
    }
  }

  checkAndNavigate()
}
