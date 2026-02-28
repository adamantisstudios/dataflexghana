"use client"

import { useState } from "react"
import { Play, X, ArrowRight, Quote, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

interface VideoTestimonial {
  id: number
  videoUrl: string
  thumbnail: string
  agentName: string
  location: string
  title: string
}

interface TextTestimonial {
  id: number
  name: string
  location: string
  imageUrl: string
  testimonial: string
  rating: number
  earnings: string
}

export default function TestimonialsPage() {
  const [showVideo, setShowVideo] = useState(false)
  const [currentVideo, setCurrentVideo] = useState<VideoTestimonial | null>(null)

  const videoTestimonials: VideoTestimonial[] = [
    {
      id: 1,
      videoUrl: "/testimonials/agent0.mp4",
      thumbnail: "/testimonials/alhassan_issah.png",
      agentName: "Alhassan Issah",
      location: "Northern Region, Ghana",
      title: "They do alot of things, alot of services. not only data reselling ...",
    },
    {
      id: 2,
      videoUrl: "/testimonials/agent1.mp4",
      thumbnail: "/testimonials/happy-agent-with-phone-earnings.png",
      agentName: "Asare Godfred",
      location: "Central Region, Ghana",
      title: "Their Data Bundle is affordable .. you earn commissions per every order",
    },
    {
      id: 3,
      videoUrl: "/testimonials/agent2.mp4",
      thumbnail: "/testimonials/successful-female-agent-smiling.png",
      agentName: "Atta Alhassan Imoro",
      location: "Northern Region, Ghana",
      title: "I am doing cashout everyday - Join them today",
    },
    {
      id: 4,
      videoUrl: "/testimonials/agent3.mp4",
      thumbnail: "/testimonials/happy-agent.png",
      agentName: "Bachelah Kasim Mohoammed",
      location: "North East Region, Ghana",
      title: "I Registered my business on their platform. I am satisfied",
    },
  ]

  const textTestimonials: TextTestimonial[] = [
    {
      id: 1,
      name: "Ama Mensah",
      location: "Accra",
      imageUrl: "/images/user1-placeholder.jpg",
      testimonial:
        "DataFlex has transformed my business! I earn consistent income selling data bundles and the commission structure is very fair. The platform is easy to use and payments are always on time.",
      rating: 5,
      earnings: "GH₵2,500/month",
    },
    {
      id: 2,
      name: "Kwame Asante",
      location: "Kumasi",
      imageUrl: "/images/user2-placeholder.jpg",
      testimonial:
        "Being a DataFlex agent has given me financial independence. The support team is excellent and I love how I can track all my sales and commissions in real-time.",
      rating: 5,
      earnings: "GH₵3,200/month",
    },
    {
      id: 3,
      name: "John Osei",
      location: "Temale",
      imageUrl: "/images/user4-placeholder.jpg",
      testimonial:
        "I started as a part-time agent and now this is my main source of income. The referral system works great and my customers are always satisfied with the service quality.",
      rating: 5,
      earnings: "GH₵1,800/month",
    },
  ]

  const openVideoModal = (video: VideoTestimonial) => {
    setCurrentVideo(video)
    setShowVideo(true)
  }

  const closeVideoModal = () => {
    setShowVideo(false)
    setCurrentVideo(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-emerald-600">
              DataFlex Ghana
            </Link>
            <Button
              asChild
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              <Link href="/agent/register">Join Now</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* STANDALONE HERO IMAGE */}
      <section className="w-full bg-black">
        <div
          className="
          relative w-full
          aspect-[1473/842]
          h-auto
          max-h-[60vh]
          sm:max-h-[65vh]
          md:max-h-[520px]
          lg:max-h-[560px]
          xl:max-h-[600px]
          mx-auto
          overflow-hidden
        "
        >
          <Image
            src="/cover.png"
            alt="DataFlex Ghana Agents Success"
            fill
            priority
            sizes="100vw"
            className="object-contain"
          />
        </div>
      </section>

      {/* HERO TEXT (SEPARATE FROM IMAGE) */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Real Agents. Real Success Stories.
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            Watch and read how agents across Ghana are transforming their lives with DataFlex Ghana. These are real
            people earning real income.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-base sm:text-lg px-8"
            >
              <Link href="/agent/register">
                Start Your Journey Today <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-gray-500">Join 10,000+ successful agents</p>
          </div>
        </div>
      </section>

      {/* Video Testimonials Section */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Watch Agent Success Stories</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See firsthand how our agents are building successful businesses and earning life-changing income
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {videoTestimonials.map((video) => (
              <Card
                key={video.id}
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-emerald-100 hover:border-emerald-300"
                onClick={() => openVideoModal(video)}
              >
                {/* Video card with better mobile responsiveness */}
                <div className="relative aspect-[9/16] bg-gray-900 w-full">
                  <Image
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.agentName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 flex items-center justify-center">
                    <div className="bg-emerald-600 rounded-full p-3 sm:p-4 shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="h-5 w-5 sm:h-6 sm:w-6 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 sm:p-4">
                    <p className="text-white font-semibold text-xs sm:text-sm mb-1 line-clamp-1">{video.agentName}</p>
                    <p className="text-emerald-300 text-xs line-clamp-1">{video.location}</p>
                    <p className="text-gray-200 text-xs mt-1 line-clamp-2">{video.title}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-emerald-600 to-green-600 border-none text-white max-w-3xl mx-auto shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-6 sm:p-10">
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-3xl font-bold">Ready to Start Earning?</h3>

                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-white/30">
                    <p className="text-emerald-100 text-sm font-semibold mb-2">SPECIAL OFFER</p>
                    <p className="text-white text-lg sm:text-2xl font-bold mb-3">
                      Registration: 47 GHS | Automatic Wallet Credit: 5 GHS
                    </p>
                    <p className="text-emerald-50 text-sm sm:text-base leading-relaxed">
                      Once your account is approved by admin, you'll receive 5 GHS automatically credited to your
                      wallet. This means you can immediately buy data bundles and test the system at no additional cost!
                    </p>
                  </div>

                  <p className="text-emerald-50 text-base sm:text-lg leading-relaxed">
                    Join thousands of agents earning life-changing income with DataFlex Ghana. Start with multiple
                    income streams and watch your earnings grow.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 font-bold">
                      <Link href="/agent/register">Start Here - Register Now</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20 font-bold">
                      <Link href="/agent/register?step=payment">Skip to Payment</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Text Testimonials Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">What Our Agents Are Saying</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Read detailed stories from agents who have transformed their financial lives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
            {textTestimonials.map((testimonial) => (
              <Card
                key={testimonial.id}
                className="hover:shadow-xl transition-shadow duration-300 border-emerald-100 overflow-hidden flex flex-col h-full"
              >
                <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                  {/* Header with agent info */}
                  <div className="flex items-center gap-3 sm:gap-4 mb-4">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-emerald-200 flex-shrink-0">
                      <Image
                        src={testimonial.imageUrl || "/placeholder.svg"}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-1">{testimonial.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{testimonial.location}</p>
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Earnings badge */}
                  <div className="inline-flex bg-emerald-100 text-emerald-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-3 w-fit">
                    {testimonial.earnings}
                  </div>

                  {/* Testimonial text */}
                  <div className="relative flex-1 flex flex-col">
                    <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-200 mb-2" />
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">{testimonial.testimonial}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal - optimized for mobile and desktop */}
      {showVideo && currentVideo && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
          {/* Mobile-first container: full height on mobile, constrained on desktop */}
          <div className="relative w-full h-screen sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl overflow-hidden flex flex-col">
            {/* Close button - minimal, positioned for easy access */}
            <button
              onClick={closeVideoModal}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 sm:p-3 z-10 transition-colors"
              aria-label="Close video"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Video player - fills container, no extra branding */}
            <video autoPlay controls className="w-full h-full object-contain bg-black" src={currentVideo.videoUrl} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">© 2025 DataFlex Ghana. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
