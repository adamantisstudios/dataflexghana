"use client"

import Image from "next/image"
import { ScanFace } from "lucide-react"

type PhotoVerificationWelcomeProps = {
  pending?: boolean
}

/** Friendly header for the agent photo-verification gate (post-login). */
export function PhotoVerificationWelcome({ pending = false }: PhotoVerificationWelcomeProps) {
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto relative h-28 w-28">
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 shadow-inner"
          aria-hidden
        />
        <div className="relative flex h-full w-full items-center justify-center rounded-full border-2 border-white/80 bg-white/90 shadow-md overflow-hidden">
          <Image
            src="/images/profile-settings.png"
            alt=""
            width={88}
            height={88}
            className="h-[4.5rem] w-[4.5rem] object-contain"
            priority
          />
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#0E8F3D] text-white shadow-md ring-2 ring-white">
          <ScanFace className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-gray-900">
          {pending ? "We're reviewing your photo" : "One quick step before you begin"}
        </h1>
        {pending ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Thanks for submitting your verification photo. Our team is taking a look now — you'll
            get full access to the platform as soon as your account is approved. This usually
            doesn't take long.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome! To keep our community safe, we ask every agent to verify their account with a
            clear selfie. Upload a well-lit photo showing your face — once our team approves it,
            you'll be able to use your dashboard, tutorials, channels, and everything else.
          </p>
        )}
      </div>
    </div>
  )
}
