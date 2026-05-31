"use client"

import { useEffect } from "react"

const META_NAME = "dating-screenshot-policy"

/** Page-level deterrent notice + document meta for dating photo views. */
export function DatingProtectionNotice() {
  useEffect(() => {
    let meta = document.querySelector(`meta[name="${META_NAME}"]`)
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", META_NAME)
      document.head.appendChild(meta)
    }
    meta.setAttribute(
      "content",
      "Screen recording and screenshots are prohibited. Your session is logged.",
    )
    return () => {
      meta?.remove()
    }
  }, [])

  return (
    <p
      className="text-[11px] text-rose-800/80 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 text-center"
      role="note"
    >
      Screen recording and screenshots are prohibited. Your session is logged.
    </p>
  )
}
