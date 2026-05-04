"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { handleProtectedNavigation } from "@/lib/use-payment-gate"

interface ProtectedLinkProps {
  href: string
  children: ReactNode
  className?: string
  requiresPayment?: boolean
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  asChild?: boolean
  [key: string]: any
}

/**
 * A link component that checks payment verification before allowing navigation
 * to /agent/register or /fashion-avenue (from /no-registration)
 *
 * Usage:
 * <ProtectedLink href="/agent/register">Register Now</ProtectedLink>
 * <ProtectedLink href="/fashion-avenue">Fashion Avenue</ProtectedLink>
 */
export function ProtectedLink({
  href,
  children,
  className,
  requiresPayment = false,
  onClick,
  ...props
}: ProtectedLinkProps) {
  const router = useRouter()

  // Links that always require payment check
  const alwaysProtected = href === "/agent/register"

  // Links that might require payment check (like fashion-avenue from no-registration)
  const shouldProtect = alwaysProtected || requiresPayment

  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Allow custom onClick to run first
    if (onClick) {
      onClick(e)
    }

    // If this link requires payment protection, check before navigating
    if (shouldProtect) {
      e.preventDefault()

      try {
        const res = await fetch("/api/agent/check-payment", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })

        if (res.ok) {
          const data = await res.json()
          if (data.verified) {
            // User has paid, allow navigation
            router.push(href)
          } else {
            // User hasn't paid yet
            console.log("[v0] Payment required before accessing:", href)
            router.push("/agent/registration-payment")
          }
        } else {
          // Cannot check payment status, redirect to payment to be safe
          router.push("/agent/registration-payment")
        }
      } catch (err) {
        console.error("[v0] Error checking payment for link:", err)
        router.push("/agent/registration-payment")
      }
    }
  }

  return (
    <Link
      href={href}
      className={className}
      onClick={shouldProtect ? handleClick : onClick}
      {...props}
    >
      {children}
    </Link>
  )
}
