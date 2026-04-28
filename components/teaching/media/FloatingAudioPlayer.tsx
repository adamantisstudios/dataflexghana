"use client"

import { useEffect } from "react"

const FloatingAudioPlayer = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown, { passive: false })
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { passive: false })
    }
  }, [onClose])

  return <div>{/* Player UI */}</div>
}

export default FloatingAudioPlayer
