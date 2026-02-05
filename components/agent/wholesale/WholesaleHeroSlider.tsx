"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TrendingUp, Shield, Zap } from "lucide-react"

interface Slide {
  id: number
  title: string
  subtitle: string
  description: string
  cta: string
  icon: React.ReactNode
  image: string
  gradient: string
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Maximize Your Savings",
    subtitle: "with Bulk Purchasing",
    description:
      "Get the best prices on quality products when you buy in bulk. Save up to 40% compared to retail prices.",
    cta: "Explore Wholesale Offers",
    icon: <TrendingUp className="h-8 w-8" />,
    image: "/modern-warehouse-with-bulk-products-stacked-neatly.jpg",
    gradient: "from-emerald-600/80 to-green-600/80",
  },
  {
    id: 2,
    title: "Ensure Quality",
    subtitle: "with Every Order",
    description: "All our wholesale products are sourced from trusted suppliers and undergo rigorous quality checks.",
    cta: "Discover Trusted Suppliers",
    icon: <Shield className="h-8 w-8" />,
    image: "/quality-control-inspector-checking-products-in-mod.jpg",
    gradient: "from-teal-600/80 to-emerald-600/80",
  },
  {
    id: 3,
    title: "Streamlined Ordering",
    subtitle: "for Your Business",
    description:
      "Simple, fast ordering process designed for businesses. Track orders, manage inventory, and reorder with ease.",
    cta: "Start Your Bulk Order",
    icon: <Zap className="h-8 w-8" />,
    image: "/modern-tablet-showing-ecommerce-ordering-interface.jpg",
    gradient: "from-green-600/80 to-teal-600/80",
  },
]

export default function WholesaleHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  return (
    <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] overflow-hidden rounded-xl shadow-lg">
      {/* Slides */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentSlide
                ? "opacity-100 translate-x-0"
                : index < currentSlide
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
            }`}
          >
            <div className="absolute inset-0">
              <img src={slide.image || "/placeholder.svg"} alt={slide.title} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
            </div>

            <div className="relative z-10 h-full flex items-center">
              <div className="container-mobile max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Text Content - Takes up less space to show image */}
                  <div className="lg:col-span-7 text-white space-y-4 md:space-y-6 bg-black/20 backdrop-blur-sm rounded-2xl p-6 md:p-8">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full">
                      {slide.icon}
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-balance leading-tight">
                        {slide.title}
                      </h2>
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-emerald-100">
                        {slide.subtitle}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm md:text-base lg:text-lg text-emerald-50 max-w-md text-pretty">
                      {slide.description}
                    </p>

                    {/* CTA Button */}
                    <Button
                      size="lg"
                      className="bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-semibold px-6 py-3 md:px-8 md:py-4 text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {slide.cta}
                    </Button>
                  </div>

                  <div className="hidden lg:block lg:col-span-5">
                    {/* This space allows the background image to show through */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-300 ease-linear"
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
