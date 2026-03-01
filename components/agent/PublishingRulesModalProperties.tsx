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

interface PublishingRulesModalPropertiesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RULES = [
  {
    title: "Use a Precise Title",
    description: "Make the title clear and specific for the property you're selling or renting. Include key details like property type and location.",
    icon: "📝",
  },
  {
    title: "Write a Clear, Honest Description",
    description: "The description must be brief, correct, and should not contain false or misleading information about the property.",
    icon: "✍️",
  },
  {
    title: "Upload Unique Images",
    description: "Photos must be real, clear, and show the actual property. Do not include watermarks, screenshots, or contact details on images.",
    icon: "📸",
  },
  {
    title: "Choose the Correct Category",
    description: "Selecting the wrong category can lead to rejection. Make sure your property is in the right section (e.g., Houses for Sale vs. Rent).",
    icon: "📂",
  },
  {
    title: "Accurate Property Details",
    description: "Provide accurate information about bedrooms, bathrooms, square footage, and other property features.",
    icon: "🎯",
  },
  {
    title: "Avoid Duplicate Listings",
    description: "If you post the same property in multiple identical ads, the admin may reject or remove them.",
    icon: "⚠️",
  },
  {
    title: "Set a Realistic Price",
    description: "The price must reflect the real market value of the property based on location, size, and condition.",
    icon: "💰",
  },
  {
    title: "Properties Must Be Legal",
    description: "You cannot post properties that are illegally obtained or disallowed by law.",
    icon: "⚖️",
  },
  {
    title: "No Company Info on Images",
    description: "Avoid uploading company logo, contact info, or business location on images. All sales are managed entirely by Dataflex Ghana.",
    icon: "🚫",
  },
  {
    title: "Provide Clear Location Info",
    description: "Include the specific location (city, area, landmark) so buyers can easily understand where the property is situated.",
    icon: "📍",
  },
  {
    title: "Properties Must Be Real",
    description: "All posted properties must be real, existing properties. Virtual or fictional properties will be rejected.",
    icon: "🏠",
  },
  {
    title: "Ownership Requirements",
    description: "You should own or have the right to sell/rent the property. Unauthorized listings may be removed and accounts penalized.",
    icon: "✅",
  },
]

export default function PublishingRulesModalProperties({ open, onOpenChange }: PublishingRulesModalPropertiesProps) {
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
        className="max-w-[90vw] sm:max-w-md p-0 overflow-hidden border-orange-200 [&>button]:text-white [&>button]:right-6"
        onKeyDown={handleKeyDown}
      >
        {/* Header with extra right padding to avoid overlap with close button */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-3 pr-12">
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="text-white text-base sm:text-lg">Publishing Rules</DialogTitle>
            <DialogDescription className="text-orange-100 text-xs">
              Follow these guidelines to get properties approved
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Slide content */}
        <div className="p-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 px-3 py-1 text-xs">
                {currentSlide + 1} of {RULES.length}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="text-4xl">{currentRule.icon}</div>
              <h3 className="text-sm font-bold text-gray-900">{currentRule.title}</h3>
            </div>

            <p className="text-gray-600 text-xs leading-relaxed">{currentRule.description}</p>

            <div className="flex justify-center gap-1.5 pt-2">
              {RULES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide
                      ? "bg-orange-600 w-6"
                      : "bg-orange-200 w-1.5 hover:bg-orange-300"
                  }`}
                  aria-label={`Go to rule ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            className="gap-1 border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent h-8 px-2 text-xs"
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
              className="bg-orange-600 hover:bg-orange-700 gap-1 text-white h-8 px-3 text-xs"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Done
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={nextSlide}
              className="bg-orange-600 hover:bg-orange-700 gap-1 text-white h-8 px-3 text-xs"
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