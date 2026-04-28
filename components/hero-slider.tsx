"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Briefcase, BookOpen } from "lucide-react"
import Link from "next/link"

interface SlideData {
  id: number
  title: string
  subtitle: string
  description: string
  image: string
  gradient: string
  icon?: React.ReactNode
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
    title: "Teach Pasco Lessons on the Teacher Channel",
    subtitle: "Share Knowledge, Earn Rewards",
    description:
      "Join our Teacher Channel and share Pasco lessons with students across Ghana. Create channels, upload content, and connect with learners. Build your teaching community and earn from your expertise.",
    image: "/images/teacher-channel-online-lessons-education.jpg",
    gradient: "from-emerald-600 via-green-600 to-teal-700",
    icon: <BookOpen className="h-8 w-8" />,
    primaryCTA: {
      text: "Join a Channel",
      href: "/agent/register",
      color: "text-emerald-700",
    },
  },
  {
    id: 2,
    title: "Register Businesses in Your Area as an Agent",
    subtitle: "Grow Your Business Network",
    description:
      "Join our agent network and register businesses in your area. Earn commissions by promoting products and services to your network. Complete your compliance requirements and start earning today.",
    image: "/images/business-agent-registration-network.jpg",
    gradient: "from-blue-600 via-indigo-600 to-purple-700",
    icon: <Briefcase className="h-8 w-8" />,
    primaryCTA: {
      text: "Sign Up as Agent",
      href: "/agent/register",
      color: "text-blue-700",
    },
  },
  {
    id: 3,
    title: "GES Approved Books & Stationery",
    subtitle: "📚 Educational Excellence",
    description:
      "Access quality educational materials approved by Ghana Education Service. From textbooks to stationery, we've got everything students need to excel.",
    image: "/images/placeholder-2nfth.jpg",
    gradient: "from-emerald-600 via-green-600 to-emerald-700",
    primaryCTA: {
      text: "Sign Up as Parent",
      href: "/parents/register",
      color: "text-emerald-700",
    },
    secondaryCTA: {
      text: "Sign Up as Agent",
      href: "/agent/register",
    },
  },
  {
    id: 4,
    title: "Shop Wholesale, Save More",
    subtitle: "🛒 Wholesale Excellence",
    description:
      "Access premium products at wholesale prices. From household items to business supplies, get the best deals for bulk purchases across Ghana.",
    image: "/images/placeholder-1zavw.jpg",
    gradient: "from-blue-600 via-indigo-600 to-purple-700",
    primaryCTA: {
      text: "Register as Parent",
      href: "/parents/register",
      color: "text-blue-700",
    },
    secondaryCTA: {
      text: "Register as Agent",
      href: "/agent/register",
    },
  },
  {
    id: 5,
    title: "Grow Your Business Network",
    subtitle: "🏢 Business Growth",
    description:
      "Register your business and promote your products or services through our network of agents across Ghana. Expand your reach and boost sales.",
    image: "/images/placeholder-0rsxt.jpg",
    gradient: "from-orange-600 via-red-600 to-pink-700",
    primaryCTA: {
      text: "Register Your Business",
      href: "/business/register",
      color: "text-orange-700",
    },
  },
  {
    id: 6,
    title: "Digital Vouchers & School Forms",
    subtitle: "💳 Digital Services",
    description:
      "Purchase digital voucher cards, access school placement forms, and handle educational paperwork seamlessly. Everything you need for academic success.",
    image: "/images/placeholder-wkt42.jpg",
    gradient: "from-purple-600 via-violet-600 to-indigo-700",
    primaryCTA: {
      text: "Register as Agent",
      href: "/agent/register",
      color: "text-purple-700",
    },
  },
]

export function HeroSlider() {
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
              src={slide.image}
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
                  {slide.secondaryCTA && (
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-6 bg-transparent transform hover:scale-105 transition-all duration-300"
                    >
                      <Link href={slide.secondaryCTA.href}>{slide.secondaryCTA.text}</Link>
                    </Button>
                  )}
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
