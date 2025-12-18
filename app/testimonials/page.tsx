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
      "id": 1,
      "videoUrl": "/testimonials/agent1.mp4",
      "thumbnail": "/testimonials/happy-agent-with-phone-earnings.png",
      "agentName": "Asare Godfred",
      "location": "Central Region, Ghana",
      "title": "Their Data Bundles Are Affordable. They are not Scammers"
    },
    {
      id: 2,
      videoUrl: "/testimonials/agent2.mp4",
      thumbnail: "/testimonials/successful-female-agent-smiling.png",
      agentName: "Atta Alhassan Imoro",
      location: "Northern Region, Ghana",
      title: "I am doing cashout everyday - Join them today",
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

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 text-balance">
            Real Agents. Real Success Stories.
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8 text-pretty leading-relaxed">
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

          {/* Video Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {videoTestimonials.map((video) => (
              <Card
                key={video.id}
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-emerald-100 hover:border-emerald-300"
                onClick={() => openVideoModal(video)}
              >
                <div className="relative aspect-[9/16] bg-gray-900">
                  <Image
                    src={video.thumbnail || "/placeholder.svg"}
                    alt={video.agentName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="bg-emerald-600 group-hover:bg-emerald-500 rounded-full p-4 sm:p-5 shadow-2xl transform group-hover:scale-110 transition-transform">
                      <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white fill-white" />
                    </div>
                  </div>
                  {/* Bottom Info Gradient */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 sm:p-4">
                    <p className="text-white font-semibold text-xs sm:text-sm mb-1">{video.agentName}</p>
                    <p className="text-emerald-300 text-xs">{video.title}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA After Videos */}
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-emerald-600 to-green-600 border-none text-white max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-3">Ready to Share Your Own Success Story?</h3>
                <p className="text-emerald-50 mb-6">
                  Join thousands of agents earning life-changing income with DataFlex Ghana
                </p>
                <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                  <Link href="/agent/register">Register Now - Only 40 GHS</Link>
                </Button>
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

          {/* Text Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {textTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-xl transition-shadow duration-300 border-emerald-100">
                <CardContent className="p-6">
                  {/* Header with Image */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-200 flex-shrink-0">
                      <Image
                        src={testimonial.imageUrl || "/placeholder.svg"}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{testimonial.name}</h3>
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Earnings Badge */}
                  <div className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                    {testimonial.earnings}
                  </div>

                  {/* Testimonial Text */}
                  <div className="relative">
                    <Quote className="h-8 w-8 text-emerald-200 absolute -top-2 -left-2" />
                    <p className="text-gray-700 text-sm leading-relaxed pl-6">{testimonial.testimonial}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Final CTA */}
          <div className="mt-16 text-center">
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-none text-white max-w-4xl mx-auto overflow-hidden">
              <CardContent className="p-8 sm:p-12">
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">Your Success Story Starts Here</h3>
                <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto text-pretty">
                  Join the DataFlex Ghana community and start earning real income. Pay a one-time 40 GHS fee and unlock
                  access to 50+ services, unlimited earning potential, and a supportive community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-lg px-10"
                  >
                    <Link href="/agent/register">
                      Register as Agent <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <p className="text-sm text-gray-400">No monthly fees. Start earning immediately.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Video Modal - TikTok Style Vertical */}
      {showVideo && currentVideo && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-[360px] sm:max-w-[420px] h-screen sm:h-auto sm:max-h-[95vh] mx-auto">
            <div className="bg-gray-900 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl h-full sm:h-auto flex flex-col">
              {/* Close Button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={closeVideoModal}
                  className="bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-colors backdrop-blur-sm"
                  aria-label="Close video"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Video Container */}
              <div className="relative bg-black h-full sm:h-[680px] overflow-hidden flex-1">
                <video autoPlay controls className="w-full h-full object-cover" src={currentVideo.videoUrl}>
                  Your browser does not support the video tag.
                </video>
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
              </div>

              {/* Footer Info */}
              <div className="bg-gradient-to-t from-gray-900 to-gray-800 px-6 py-5 border-t border-gray-700 space-y-4">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{currentVideo.agentName}</h3>
                  <p className="text-gray-400 text-sm mb-1">{currentVideo.location}</p>
                  <p className="text-emerald-400 text-sm font-medium">{currentVideo.title}</p>
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium text-base py-3"
                >
                  <Link href="/agent/register">Start Your Journey Too</Link>
                </Button>

                {/* Close Button */}
                <Button
                  onClick={closeVideoModal}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent text-base py-3"
                >
                  Close
                </Button>
              </div>
            </div>
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
