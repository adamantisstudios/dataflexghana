"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface PropertyDescriptionProps {
  description: string
  maxLength?: number
}

export function PropertyDescription({ description, maxLength = 150 }: PropertyDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!description) return null

  const shouldTruncate = description.length > maxLength
  const displayText = shouldTruncate && !isExpanded ? description.substring(0, maxLength) + "..." : description

  return (
    <div className="bg-emerald-50 p-3 rounded-lg">
      <p className="text-sm text-emerald-700 leading-relaxed">
        <span className="font-medium">Description:</span> {displayText}
      </p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 h-auto p-0 text-emerald-600 hover:text-emerald-700 hover:bg-transparent"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Read less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Read more
            </>
          )}
        </Button>
      )}
    </div>
  )
}
