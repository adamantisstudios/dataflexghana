"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CreditCard, Phone, Truck } from "lucide-react"

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
    title: "You Place Order",
    subtitle: "Pay Manually Or From Wallet",
    description:
      "Choose your preferred payment method - use your wallet balance for instant processing or select manual payment for bank transfers.",
    cta: "Start Your Order",
    icon: <CreditCard className="h-8 w-8" />,
    image: "/modern-payment-interface-with-wallet-and-manual-pa.jpg",
    gradient: "from-emerald-600/90 to-green-600/90",
  },
  {
    id: 2,
    title: "We Approve Order",
    subtitle: "We Will Call and Verify",
    description:
      "Our team will contact you within 24 hours to verify your order details and confirm availability before processing.",
    cta: "Learn More",
    icon: <Phone className="h-8 w-8" />,
    image: "/professional-customer-service-representative-on-ph.jpg",
    gradient: "from-teal-600/90 to-emerald-600/90",
  },
  {
    id: 3,
    title: "We Arrange Delivery",
    subtitle: "We Deliver Nationwide",
    description:
      "Fast and reliable delivery across Ghana. Track your order from our warehouse to your doorstep with real-time updates.",
    cta: "Track Orders",
    icon: <Truck className="h-8 w-8" />,
    image: "/delivery-truck-with-ghana-map-showing-nationwide-c.jpg",
    gradient: "from-green-600/90 to-teal-600/90",
  },
]

export default function OrderProcessHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 8 seconds
    setTimeout(() => setIsAutoPlaying(true), 8000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 8000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 8000)
  }

  return (
    <div className="relative w-full h-[250px] md:h-[300px] lg:h-[350px] overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg mb-6">
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
            {/* Background Image */}
            <div className="absolute inset-0">
              <img src={slide.image || "/placeholder.svg"} alt={slide.title} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex items-center">
              <div className="container-mobile max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                  {/* Text Content */}
                  <div className="text-white space-y-3 md:space-y-4">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-sm rounded-full">
                      {slide.icon}
                    </div>

                    {/* Title */}
                    <div className="space-y-1 md:space-y-2">
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-balance leading-tight">
                        {slide.title}
                      </h2>
                      <h3 className="text-lg md:text-xl lg:text-2xl font-semibold text-emerald-100">
                        {slide.subtitle}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-sm md:text-base text-emerald-50 max-w-md text-pretty">{slide.description}</p>

                    {/* CTA Button */}
                    <Button
                      size="sm"
                      className="bg-white text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 font-semibold px-4 py-2 md:px-6 md:py-3 text-xs md:text-sm transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      {slide.cta}
                    </Button>
                  </div>

                  {/* Visual Element - Hidden on mobile for better text readability */}
                  <div className="hidden lg:flex items-center justify-center">
                    <div className="w-48 h-48 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <div className="text-white text-4xl">{slide.icon}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-1.5 md:p-2 rounded-full transition-all duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex space-x-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300 ${
              index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/20">
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
