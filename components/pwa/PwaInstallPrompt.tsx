"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
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

const DISMISS_KEY = "dataflex_pwa_install_dismissed"

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return

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
  }, [])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1")
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
        <div className="rounded-lg bg-emerald-100 p-2 shrink-0">
          <Download className="h-5 w-5 text-emerald-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">Install DataFlex App</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {isIos && !deferred
              ? "Tap Share in Safari, then “Add to Home Screen” for quick access."
              : "Add a shortcut to your home screen for faster agent access."}
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
