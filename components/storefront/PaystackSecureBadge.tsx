"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

export function PaystackSecureBadge({ className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-center sm:text-left",
        className,
      )}
    >
      <Image src="/paystack.png" alt="Paystack" width={80} height={28} className="h-7 w-auto object-contain" />
      <span className="text-[11px] sm:text-xs text-slate-600 leading-tight">
        Powered by Referral Powerhouse · Secure Paystack checkout
      </span>
    </div>
  )
}
