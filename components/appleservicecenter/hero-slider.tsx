"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const slides = [
  {
    id: 1,
    title: "Expert Apple Repair Service",
    subtitle: "Professional technicians. Guaranteed quality. 24-48 hour turnaround.",
    image: "/apple-device-repair-center.jpg",
  },
  {
    id: 2,
    title: "Certified Technicians",
    subtitle: "Award-winning professionals handling all Apple devices with care",
    image: "/technician-repairing-iphone.jpg",
  },
  {
    id: 3,
    title: "Fast & Reliable",
    subtitle: "Free pickup and delivery. Zero hassle, maximum convenience.",
    image: "/iphone-ipad-macbook-repair.jpg",
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
    <div className="relative w-full h-screen overflow-hidden bg-slate-900">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ${
            idx === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <img
            src={slide.image || "/placeholder.svg"}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlays for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-12 lg:px-20 max-w-4xl">
            <div className={`space-y-4 md:space-y-6 transition-all duration-1000 ${
              idx === currentSlide ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}>
              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight text-balance">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-100 font-light leading-relaxed text-balance max-w-2xl">
                {slide.subtitle}
              </p>
              <div className="flex gap-4 pt-4">
                <a href="#service-form" className="scroll-smooth">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-3 text-base rounded-lg transition-all duration-200">
                    Request Service
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setCurrentSlide(idx)
              setAutoPlay(false)
            }}
            className={`rounded-full transition-all duration-300 backdrop-blur-sm ${
              idx === currentSlide ? "bg-white w-8 h-2" : "bg-white/40 w-2 h-2 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
