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
import { Card } from "@/components/ui/card"
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

function PublishingRulesModal({ open, onOpenChange }: PublishingRulesModalProps) {
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
        className="max-w-md md:max-w-lg gap-0 p-0 overflow-hidden border-emerald-200"
        onKeyDown={handleKeyDown}
      >
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-white text-2xl">Publishing Rules</DialogTitle>
            <DialogDescription className="text-emerald-100">
              Follow these guidelines to ensure your products are approved quickly
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Slide Content */}
        <div className="p-6">
          <div className="text-center space-y-6">
            {/* Rule Number */}
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 px-4 py-2 text-lg">
                {currentSlide + 1} of {RULES.length}
              </Badge>
            </div>

            {/* Icon and Title */}
            <div className="space-y-3">
              <div className="text-6xl">{currentRule.icon}</div>
              <h3 className="text-xl font-bold text-gray-900">{currentRule.title}</h3>
            </div>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">{currentRule.description}</p>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 pt-4">
              {RULES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-emerald-600 w-8"
                      : "bg-emerald-200 w-2 hover:bg-emerald-300"
                  }`}
                  aria-label={`Go to rule ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-xs text-gray-500 font-medium">
            Use arrow keys or buttons to navigate
          </div>

          {currentSlide === RULES.length - 1 ? (
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-white"
            >
              <CheckCircle className="h-4 w-4" />
              Got It!
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={nextSlide}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default PublishingRulesModal
