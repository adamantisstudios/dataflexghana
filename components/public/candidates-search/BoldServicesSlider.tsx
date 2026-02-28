"use client"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Service {
  id: number
  title: string
  description: string
  image: string
  color: string
  icon: string
  link: string // Added custom link for each service
}

export default function BoldServicesSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  const services: Service[] = [
    {
      id: 1,
      title: "HR Document Drafting",
      description: "Professional HR documents and contracts tailored to your business needs.",
      image: "/images/hr_documents.jpg",
      color: "from-blue-600 to-blue-700",
      icon: "📋",
      link: "https://cvwriterpros.netlify.app/", // Custom link for HR Document Drafting
    },
    {
      id: 2,
      title: "Candidate Vetting",
      description: "Thorough background and skills verification for your candidates.",
      image: "/images/candidate_vetting.jpg",
      color: "from-purple-600 to-purple-700",
      icon: "✓",
      link: "https://registrypoint.netlify.app/", // Custom link for Candidate Vetting
    },
    {
      id: 3,
      title: "Compliance Services",
      description: "Legal and regulatory compliance support for your organization.",
      image: "/images/compliance_now.jpg",
      color: "from-emerald-600 to-emerald-700",
      icon: "⚖️",
      link: "https://bizcomplianceforms.netlify.app/", // Custom link for Compliance Services
    },
  ]

  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % services.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [autoPlay, services.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % services.length)
    setAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + services.length) % services.length)
    setAutoPlay(false)
  }

  const service = services[currentSlide]

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Services Slider */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white dark:bg-gray-900">
        {/* Card Layout: Image on Left, Text on Right */}
        <div className="flex flex-col md:flex-row h-auto md:h-96">
          {/* Image Section: Vertical Image */}
          <div className="w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
            <img
              src={service.image || "/placeholder.svg"}
              alt={service.title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Text Section */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
            <div className="text-5xl mb-4">{service.icon}</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              {service.title}
            </h3>
            <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 mb-6 max-w-md">
              {service.description}
            </p>
            <Button
              asChild
              className="w-fit bg-blue-600 text-white hover:bg-blue-700 font-bold py-2 px-4 rounded-lg"
            >
              <Link href={service.link} target="_blank" rel="noopener noreferrer">
                Get Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full transition-all opacity-50 hover:opacity-100"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gray-900 p-2 rounded-full transition-all opacity-50 hover:opacity-100"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {services.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentSlide(idx)
                setAutoPlay(false)
              }}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? "bg-blue-600 w-8" : "bg-blue-300 w-2"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
      {/* Slide Counter */}
      <div className="mt-4 text-center text-gray-600 dark:text-gray-400 text-sm">
        <span className="text-blue-600 dark:text-blue-400 font-semibold">{currentSlide + 1}</span> / {services.length}
      </div>
    </div>
  )
}
