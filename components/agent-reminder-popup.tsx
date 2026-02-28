"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface AgentReminderPopupProps {
  userRole?: string
}

export default function AgentReminderPopup({ userRole }: AgentReminderPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Only show for agents
    if (userRole !== "agent") return

    // Show popup after 2 seconds initially
    const initialTimer = setTimeout(() => {
      showPopup()
    }, 2000)

    return () => clearTimeout(initialTimer)
  }, [userRole])

  const showPopup = () => {
    setIsVisible(true)
    setTimeout(() => setIsAnimating(true), 50) // Small delay for smooth animation
  }

  const hidePopup = () => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsVisible(false)
      // Set 3-minute timer to show again
      setTimeout(
        () => {
          showPopup()
        },
        3 * 60 * 1000,
      ) // 3 minutes
    }, 300) // Wait for animation to complete
  }

  // Don't render if not an agent or not visible
  if (userRole !== "agent" || !isVisible) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: `translateX(-50%) translateY(${isAnimating ? "0" : "100px"})`,
        zIndex: 9999,
        maxWidth: "400px",
        width: "90%",
        backgroundColor: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        border: "1px solid #e5e7eb",
        padding: "16px 20px",
        transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
        opacity: isAnimating ? 1 : 0,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Close button */}
      <button
        onClick={hidePopup}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f3f4f6"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent"
        }}
      >
        <X size={16} />
      </button>

      {/* Content */}
      <div style={{ paddingRight: "24px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            backgroundColor: "#10b981",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
          }}
        >
          <span style={{ color: "white", fontSize: "18px", fontWeight: "bold" }}>💰</span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: "14px",
            lineHeight: "1.5",
            color: "#374151",
            fontWeight: "500",
          }}
        >
          Promote services and refer projects from companies for bigger commissions and cashout bonuses. Promote to
          friends, family, and people who need these services.
        </p>
      </div>
    </div>
  )
}
