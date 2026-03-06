"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up")

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = document.documentElement.scrollTop
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercentage = scrolled / maxScroll

      // Show button when scrolled more than 20% of the page
      setIsVisible(scrolled > 300)

      // Change direction based on scroll position
      // If in top 50% of page, show down arrow (scroll to bottom)
      // If in bottom 50% of page, show up arrow (scroll to top)
      setScrollDirection(scrollPercentage < 0.5 ? "down" : "up")
    }

    window.addEventListener("scroll", toggleVisibility)
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTarget = () => {
    if (scrollDirection === "up") {
      // Scroll to top
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    } else {
      // Scroll to bottom
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      })
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <Button
      className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg transition-all duration-300 hover:scale-110 
      sm:bottom-4 sm:right-4 
      max-sm:bottom-20 max-sm:right-4 max-sm:h-10 max-sm:w-10
      safe-area-inset-bottom"
      onClick={scrollToTarget}
      size="icon"
      aria-label={scrollDirection === "up" ? "Scroll to top" : "Scroll to bottom"}
    >
      {scrollDirection === "up" ? (
        <ArrowUp className="h-5 w-5 text-white max-sm:h-4 max-sm:w-4" />
      ) : (
        <ArrowDown className="h-5 w-5 text-white max-sm:h-4 max-sm:w-4" />
      )}
    </Button>
  )
}
