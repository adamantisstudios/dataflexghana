"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, X } from "lucide-react"

type Props = {
  isVisible: boolean
  onClose: () => void
}

export function VerificationReminderPopup({ isVisible, onClose }: Props) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-t-2 border-[#0E8F3D]/30 shadow-2xl">
        <div className="container mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="h-5 w-5 text-[#0E8F3D] shrink-0" />
                <h3 className="text-lg font-bold text-emerald-900">Get verified on Dataflex</h3>
              </div>
              <p className="text-sm text-emerald-800 mb-3 ml-7">
                Unlock priority support, 24/7 assistance, and more opportunities. Complete your profile now.
              </p>
              <div className="ml-7">
                <Button
                  asChild
                  className="bg-[#0E8F3D] hover:bg-[#35B24A] text-white font-semibold"
                  onClick={onClose}
                >
                  <Link href="/agent/settings">Verify Now</Link>
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 mt-1"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
