"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

const heroSlides = [
  {
    title: "Find Your Next Employee",
    image: "/candidates-slider-1.jpg",
    imageAlt: "Professional candidates in modern office",
  },
  {
    title: "Discover Top Talent",
    image: "/candidates-slider-2.jpg",
    imageAlt: "Diverse qualified professionals",
  },
  {
    title: "Streamlined Recruitment",
    image: "/candidates-slider-3.jpg",
    imageAlt: "Efficient business recruitment process",
  },
]

export default function CandidatesHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)

  return (
    <div className="relative w-full h-[220px] sm:h-[280px] md:h-[350px] lg:h-[450px] overflow-hidden rounded-xl shadow-lg">
      {/* Slides */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100 z-20 scale-100" : "opacity-0 z-0 scale-105"
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.imageAlt}
            fill
            className="object-cover object-center rounded-xl"
            priority={index === 0}
            sizes="100vw"
          />

          {/* Soft dark overlay */}
          <div className="absolute inset-0 bg-black/40 rounded-xl" />

          {/* Slide Text */}
          <div className="absolute inset-0 flex items-center justify-center text-center px-4 sm:px-6 md:px-12">
            <h2
              className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-xl animate-slideFade`}
            >
              {slide.title}
            </h2>
          </div>
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/50 transition-all rounded-full p-2 sm:p-3 z-30 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/50 transition-all rounded-full p-2 sm:p-3 z-30 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-2 sm:h-2.5 rounded-full transition-all duration-500 ${
              i === currentSlide ? "bg-white w-6 sm:w-8" : "bg-white/50 w-2 sm:w-3"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Elegant Slide Text Animation */}
      <style jsx>{`
        .animate-slideFade {
          opacity: 0;
          transform: translateY(20px);
          animation: slideFadeIn 1s forwards;
        }

        @keyframes slideFadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
