"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function MenuScrollHandler() {
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      const excludedPaths = ["/agent/dashboard", "/admin"]
      const isExcludedPath = excludedPaths.some((path) => pathname?.startsWith(path))

      if (isExcludedPath) {
        return
      }

      const isMobile = window.innerWidth < 768

      if (!isMobile) return

      // Wait for page/section to fully load
      setTimeout(() => {
        const viewportHeight = window.innerHeight
        const scrollDistance = viewportHeight / 2

        // Smooth scroll up
        window.scrollBy({
          top: -scrollDistance,
          behavior: "smooth",
        })
      }, 500)
    }

    handleScroll()
  }, [pathname])

  return null
}
