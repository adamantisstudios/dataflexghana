"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react"

interface PublishingRulesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RULES = [
  {
    title: "Use a Precise Title",
    description: "Make the title clear and specific for the item you're selling.",
    icon: "📝",
  },
  {
    title: "Write a Clear, Honest Description",
    description: "The description must be brief, correct, and should not contain false or misleading information.",
    icon: "✍️",
  },
  {
    title: "Upload Unique Images",
    description: "Photos must be real, clear, and show the actual product. Do not include watermarks, screenshots, or contact details.",
    icon: "📸",
  },
  {
    title: "Choose the Correct Category",
    description: "Selecting the wrong category can lead to rejection. Make sure your product is in the right section.",
    icon: "📂",
  },
  {
    title: "One Item Per Advert",
    description: "Rule: 1 ad = 1 item. Do not bundle multiple unrelated products in one listing.",
    icon: "🎯",
  },
  {
    title: "Avoid Duplicate Adverts",
    description: "If you post the same item in multiple identical ads, the admin may reject or remove them.",
    icon: "⚠️",
  },
  {
    title: "Set a Realistic Price",
    description: "The price must reflect the real market value of the product you're selling.",
    icon: "💰",
  },
  {
    title: "Items Must Be Legal",
    description: "You cannot post items that are illegal or disallowed by law.",
    icon: "⚖️",
  },
  {
    title: "No Company Info on Images",
    description: "Avoid uploading company logo, contact info or business location. All sales are managed entirely by Dataflex Ghana.",
    icon: "🚫",
  },
  {
    title: "Set Commission for Each Item",
    description: "Set the commission value so other agents will be motivated to purchase or promote your products.",
    icon: "💸",
  },
  {
    title: "Products Must Be Local",
    description: "All posted products/services must be located in the country where you're posting (e.g., Ghana).",
    icon: "🗺️",
  },
]

export default function PublishingRulesModal({ open, onOpenChange }: PublishingRulesModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % RULES.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + RULES.length) % RULES.length)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") nextSlide()
    if (e.key === "ArrowLeft") prevSlide()
  }

  const currentRule = RULES[currentSlide]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[90vw] sm:max-w-md p-0 overflow-hidden border-emerald-200 [&>button]:text-white [&>button]:right-6"
        onKeyDown={handleKeyDown}
      >
        {/* Header with extra right padding to avoid overlap with close button */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3 pr-12">
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="text-white text-base sm:text-lg">Publishing Rules</DialogTitle>
            <DialogDescription className="text-emerald-100 text-xs">
              Follow these guidelines to get products approved
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Slide content – compact */}
        <div className="p-4">
          <div className="text-center space-y-3">
            {/* Rule number badge */}
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 px-3 py-1 text-xs">
                {currentSlide + 1} of {RULES.length}
              </Badge>
            </div>

            {/* Icon and title */}
            <div className="space-y-1">
              <div className="text-4xl">{currentRule.icon}</div>
              <h3 className="text-sm font-bold text-gray-900">{currentRule.title}</h3>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-xs leading-relaxed">{currentRule.description}</p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pt-2">
              {RULES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-emerald-600 w-6"
                      : "bg-emerald-200 w-1.5 hover:bg-emerald-300"
                  }`}
                  aria-label={`Go to rule ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Navigation – compact */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent h-8 px-2 text-xs"
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </Button>

          <span className="text-xs text-gray-500 font-medium">Use arrow keys</span>

          {currentSlide === RULES.length - 1 ? (
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-white h-8 px-3 text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Done
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={nextSlide}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-white h-8 px-3 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}