"use client"

import type React from "react"

interface MobileResponsiveMathWrapperProps {
  children: React.ReactNode
  className?: string
}

export function MobileResponsiveMathWrapper({ children, className = "" }: MobileResponsiveMathWrapperProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <div className="min-w-max md:min-w-0 px-2 md:px-0">{children}</div>
    </div>
  )
}
