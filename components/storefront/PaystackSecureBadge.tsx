"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

/** Paystack wordmark is 1024×283 — show large enough to read card/network icons on storefront checkout */
const PAYSTACK_LOGO_CLASS =
  "h-14 sm:h-16 md:h-[4.75rem] w-auto max-w-full min-w-[200px] sm:min-w-[240px] object-contain"

export function PaystackSecureBadge({ className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-4 sm:px-5 sm:py-5 text-center w-full",
        className,
      )}
    >
      <Image
        src="/paystack.png"
        alt="Paystack — secure card and mobile money payments"
        width={320}
        height={88}
        className={PAYSTACK_LOGO_CLASS}
      />
      <span className="text-xs sm:text-sm text-slate-600 leading-snug max-w-md">
        Powered by Referral Powerhouse · Secure Paystack checkout
      </span>
    </div>
  )
}
