"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const slides = [
  {
    image: "/assets/slider1.jpg",
    title: "Ghana's Cheapest Data Bundles",
    subtitle: "Undercutting all competitors while maintaining quality service",
    cta: "Explore Plans",
    href: "/#networks",
  },
  {
    image: "/assets/slider2.jpg",
    title: "Complete Digital Services",
    subtitle: "Data bundles, ECG top-up, software installation, and CV writing",
    cta: "View Services",
    href: "/#services",
  },
  {
    image: "/assets/slider3.jpg",
    title: "Fast & Reliable Service",
    subtitle: "Receive your services within an hour via SMS/USSD",
    cta: "Register Now",
    href: "/register",
  },
]

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <section className="relative h-[80vh] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${slide.image})` }} />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full flex items-center justify-center text-center text-white">
            <div className="max-w-4xl px-4">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">{slide.title}</h1>
              <p className="text-xl md:text-2xl mb-8">{slide.subtitle}</p>
              <Link href={slide.href}>
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-3">
                  {slide.cta}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
        onClick={nextSlide}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </section>
  )
}
