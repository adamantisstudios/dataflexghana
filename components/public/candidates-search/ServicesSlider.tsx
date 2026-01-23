"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Phone, FileText, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Service {
  id: number
  title: string
  description: string
  icon: React.ReactNode
}

const services: Service[] = [
  {
    id: 1,
    title: "Complete HR Document Drafting",
    description: "Professional HR documentation and employment contract drafting with expert legal review.",
    icon: <FileText className="w-8 h-8" />,
  },
  {
    id: 2,
    title: "Virtual & In-Person Candidate Vetting",
    description:
      "Comprehensive candidate interviews and assessments conducted remotely or in-person to ensure the perfect job fit.",
    icon: <Users className="w-8 h-8" />,
  },
  {
    id: 3,
    title: "Company Regulatory & Compliance",
    description:
      "Full company registration, tax filing, renewals, and compliance management with online signature capture.",
    icon: <FileText className="w-8 h-8" />,
  },
]

export default function ServicesSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)

  useEffect(() => {
    if (!autoPlay) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % services.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [autoPlay])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % services.length)
    setAutoPlay(false)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + services.length) % services.length)
    setAutoPlay(false)
  }

  return (
    <>
      <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4 md:p-6 sticky top-20 z-40">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">Our HR Services</h3>

        {/* Service Slider */}
        <div className="relative bg-white rounded-lg border border-blue-100 overflow-hidden">
          {/* Service Cards */}
          <div className="relative h-48 md:h-56 flex items-center justify-center">
            {services.map((service, index) => (
              <div
                key={service.id}
                className={`absolute w-full h-full p-6 transition-all duration-500 ease-in-out ${
                  index === currentSlide ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
                }`}
              >
                <div className="flex flex-col items-center text-center h-full justify-between">
                  <div className="text-blue-600">{service.icon}</div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                  </div>
                  <Button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2 h-10"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Get Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="absolute inset-0 pointer-events-none">
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-auto bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all shadow-md hover:shadow-lg"
              aria-label="Previous service"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-auto bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 transition-all shadow-md hover:shadow-lg"
              aria-label="Next service"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
            {services.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentSlide(index)
                  setAutoPlay(false)
                }}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "bg-blue-600 w-6" : "bg-gray-300 w-2"
                }`}
                aria-label={`Go to service ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-3 text-center">Click "Get Details" to contact our admin team</p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold">Service Inquiry</h3>
              <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-700 mb-6 font-medium">
                Contact our admin team for more details about our services
              </p>
              <a
                href="tel:+233546460945"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Phone className="w-5 h-5" />
                +233 546 460 945
              </a>
              <p className="text-xs text-gray-600 mt-4">Call or WhatsApp for inquiries</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
