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
        "flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2",
        className,
      )}
    >
      <Image src="/paystack.png" alt="Paystack" width={72} height={24} className="h-6 w-auto object-contain" />
      <span className="text-[11px] sm:text-xs text-slate-600 leading-tight">
        Secure payment powered by Paystack
      </span>
    </div>
  )
}
