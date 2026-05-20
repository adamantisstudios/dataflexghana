"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

const DISMISS_KEY_PREFIX = "dataflex_pwa_install_dismissed"

export type PwaInstallVariant = "dataflex" | "storefront"

const VARIANT_CONFIG: Record<
  PwaInstallVariant,
  {
    iconSrc: string
    iconAlt: string
    title: string
    subtitleInstall: string
    subtitleIos: string
  }
> = {
  dataflex: {
    iconSrc: "/dataflex_logo.png",
    iconAlt: "DataFlex Ghana",
    title: "Install DataFlex App",
    subtitleInstall: "Add a shortcut to your home screen for faster agent access.",
    subtitleIos: "Tap Share in Safari, then “Add to Home Screen” for quick access.",
  },
  storefront: {
    iconSrc: "/images/data-bundles.png",
    iconAlt: "Store",
    title: "Install App",
    subtitleInstall: "Add this store to your home screen for quick access to data bundles.",
    subtitleIos: "Tap Share in Safari, then “Add to Home Screen” to open this store faster.",
  },
}

export interface PwaInstallPromptProps {
  variant?: PwaInstallVariant
  /** Store name for storefront installs (replaces generic "Install App" copy). */
  storeName?: string
}

export function PwaInstallPrompt({ variant = "dataflex", storeName }: PwaInstallPromptProps) {
  const baseConfig = VARIANT_CONFIG[variant]
  const config =
    variant === "storefront" && storeName?.trim()
      ? {
          ...baseConfig,
          iconAlt: storeName.trim(),
          title: `Install ${storeName.trim()}`,
        }
      : baseConfig
  const dismissKey = `${DISMISS_KEY_PREFIX}_${variant}`

  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (sessionStorage.getItem(dismissKey) === "1") return

    const ua = window.navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
    setIsIos(ios)

    const onBip = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }

    window.addEventListener("beforeinstallprompt", onBip)

    if (ios && !(window.navigator as Navigator & { standalone?: boolean }).standalone) {
      setShow(true)
    }

    return () => window.removeEventListener("beforeinstallprompt", onBip)
  }, [dismissKey])

  const dismiss = () => {
    sessionStorage.setItem(dismissKey, "1")
    setShow(false)
    setDeferred(null)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    dismiss()
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md sm:left-auto sm:right-4 sm:mx-0">
      <div className="rounded-xl border border-emerald-200 bg-white shadow-xl p-4 flex gap-3 items-start">
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-1.5 shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden">
          <Image
            src={config.iconSrc}
            alt={config.iconAlt}
            width={40}
            height={40}
            className="object-contain w-10 h-10"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{config.title}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {isIos && !deferred ? config.subtitleIos : config.subtitleInstall}
          </p>
          <div className="flex gap-2 mt-3">
            {deferred && (
              <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={install}>
                Install
              </Button>
            )}
            <Button type="button" size="sm" variant="outline" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-slate-400 hover:text-slate-600 shrink-0"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
