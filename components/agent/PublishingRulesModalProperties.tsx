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

function PublishingRulesModalProperties({ open, onOpenChange }: PublishingRulesModalPropertiesProps) {
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
        className="max-w-md md:max-w-lg gap-0 p-0 overflow-hidden border-orange-200"
        onKeyDown={handleKeyDown}
      >
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-white text-2xl">Publishing Rules</DialogTitle>
            <DialogDescription className="text-orange-100">
              Follow these guidelines to ensure your properties are approved quickly
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Slide Content */}
        <div className="p-6">
          <div className="text-center space-y-6">
            {/* Rule Number */}
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-700 px-4 py-2 text-lg">
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
                      ? "bg-orange-600 w-8"
                      : "bg-orange-200 w-2 hover:bg-orange-300"
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
            className="gap-1 border-orange-200 text-orange-700 hover:bg-orange-50 bg-transparent"
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
              className="bg-orange-600 hover:bg-orange-700 gap-1 text-white"
            >
              <CheckCircle className="h-4 w-4" />
              Got It!
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={nextSlide}
              className="bg-orange-600 hover:bg-orange-700 gap-1 text-white"
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

export default PublishingRulesModalProperties
