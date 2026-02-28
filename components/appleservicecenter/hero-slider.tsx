"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const slides = [
  {
    id: 1,
    title: "Premium Apple Device Repair",
    subtitle: "Fast, Reliable, and Professional Service",
    image: "/apple-device-repair-center.jpg",
    color: "from-slate-900 to-slate-700",
  },
  {
    id: 2,
    title: "Expert Technicians",
    subtitle: "Certified to Handle All Apple Devices",
    image: "/technician-repairing-iphone.jpg",
    color: "from-slate-800 to-slate-600",
  },
  {
    id: 3,
    title: "Quick Diagnosis",
    subtitle: "Free Remote Consultation Available",
    image: "/iphone-ipad-macbook-repair.jpg",
    color: "from-slate-900 to-slate-700",
  },
]

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [autoPlay])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setAutoPlay(false)
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image || "/placeholder.svg"}
            alt={`Image of ${slide.title}`} // Enhanced alt text for SEO
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 text-balance">{slide.title}</h1>
            <p className="text-lg md:text-2xl text-gray-200 mb-8 text-balance">{slide.subtitle}</p>
            <a href="#service-form" className="scroll-smooth">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Get Service Now
              </Button>
            </a>
          </div>
        </div>
      ))}

      {/* Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/40 transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/20 hover:bg-white/40 transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentSlide(idx)
              setAutoPlay(false)
            }}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentSlide ? "bg-amber-500 w-8" : "bg-white/50 hover:bg-white"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
