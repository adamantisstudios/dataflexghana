"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
  size?: "sm" | "default" | "lg"
}

export function CopyButton({ value, label, className = "", size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <Button type="button" variant="outline" size={size} onClick={handleCopy} className={`gap-2 ${className}`}>
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>{label || "Copy"}</span>
        </>
      )}
    </Button>
  )
}
