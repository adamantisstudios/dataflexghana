"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
}

export function StoreFooter({ className }: Props) {
  return (
    <footer
      className={cn(
        "text-center pt-4 pb-6 border-t border-slate-200/80 mt-6 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-center gap-2 px-4">
        <Image
          src="/paystack.png"
          alt="Paystack"
          width={80}
          height={28}
          className="h-7 w-auto object-contain"
        />
      </div>
      <p className="text-xs text-muted-foreground px-4 leading-relaxed">
        Powered by Referral Powerhouse · Secure Paystack checkout
      </p>
    </footer>
  )
}
