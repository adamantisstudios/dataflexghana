"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface SlideData {
  id: number
  title: string
  subtitle: string
  description: string
  image: string
  gradient: string
  primaryCTA: {
    text: string
    href: string
    color: string
  }
  secondaryCTA?: {
    text: string
    href: string
  }
}

const slides: SlideData[] = [
  {
    id: 1,
    title: "ECG Prepaid Top-Up",
    subtitle: "⚡ Instant Service",
    description:
      "Top up your ECG prepaid meter instantly with just ₵8 service charge. All meter types supported with secure payment processing.",
    image: "/images/ecg-meter.jpg",
    gradient: "from-blue-600 via-indigo-600 to-blue-700",
    primaryCTA: {
      text: "Top Up ECG",
      href: "#ecg-topup",
      color: "text-blue-700",
    },
  },
  {
    id: 2,
    title: "MiFi & Router Devices",
    subtitle: "📡 Quality Devices",
    description:
      "Premium internet devices at competitive prices. From pocket MiFi to powerful routers, get connected with reliable hardware.",
    image: "/assets/router-s20.jpg",
    gradient: "from-orange-600 via-red-600 to-orange-700",
    primaryCTA: {
      text: "Browse Devices",
      href: "#devices",
      color: "text-orange-700",
    },
  },
  {
    id: 3,
    title: "Software Installation",
    subtitle: "💻 Professional Service",
    description:
      "Professional software installation services for Windows, macOS, and more. Home visits and remote installation available.",
    image: "/office2019.jpg",
    gradient: "from-purple-600 via-violet-600 to-purple-700",
    primaryCTA: {
      text: "Install Software",
      href: "#software",
      color: "text-purple-700",
    },
  },
  {
    id: 4,
    title: "Business Registration Services",
    subtitle: "🏢 Legal & Compliance",
    description:
      "Professional business registration, renewals, amendments, and document replacements. All services delivered nationwide with expert support.",
    image: "/business-office-ghana.jpg",
    gradient: "from-slate-700 via-slate-600 to-slate-800",
    primaryCTA: {
      text: "Register Your Business",
      href: "#business-registration",
      color: "text-slate-700",
    },
  },
  {
    id: 5,
    title: "Affordable Data Bundles",
    subtitle: "📱 No Registration Required",
    description:
      "Get the cheapest data bundles in Ghana from all networks. MTN, AirtelTigo, and Telecel at unbeatable prices with instant delivery.",
    image: "/images/mtn-new.jpg",
    gradient: "from-green-600 via-emerald-600 to-green-700",
    primaryCTA: {
      text: "Order Data Now",
      href: "#networks",
      color: "text-green-700",
    },
  },
]

export function NoRegistrationSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <section className="relative overflow-hidden">
      <div
        className="relative h-[600px] md:h-[700px]"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-1000 ease-in-out ${
              index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
            }`}
          >
            <div className="absolute inset-0 bg-black/60"></div>
            <img
              src={slide.image || "/placeholder.svg"}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20"></div>
            <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
              <div className="max-w-2xl text-white">
                <div className="mb-6 animate-in slide-in-from-left-8 duration-1000">
                  <span className="inline-block bg-white/40 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium mb-4 shadow-lg border border-white/20">
                    {slide.subtitle}
                  </span>
                  <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance drop-shadow-2xl text-shadow-lg">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl mb-8 text-white/95 leading-relaxed drop-shadow-xl text-shadow">
                    {slide.description}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-left-8 duration-1000 delay-300">
                  <Button
                    size="lg"
                    asChild
                    className={`bg-white ${slide.primaryCTA.color} hover:bg-gray-100 text-lg px-8 py-6 shadow-xl transform hover:scale-105 transition-all duration-300`}
                  >
                    <Link href={slide.primaryCTA.href}>
                      {slide.primaryCTA.text}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-6 bg-transparent transform hover:scale-105 transition-all duration-300"
                  >
                    <Link href="/">Back to Homepage</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex space-x-3">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-3 transition-all duration-300 hover:scale-110 hidden md:block"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full p-3 transition-all duration-300 hover:scale-110 hidden md:block"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      </div>
    </section>
  )
}
