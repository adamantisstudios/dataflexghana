"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NoRegistrationSlider } from "@/components/no-registration/no-registration-slider"
import { DevicesSection } from "@/components/no-registration/devices-section"
import { ECGTopUpForm } from "@/components/no-registration/ecg-topup-form"
import { NetworksSection } from "@/components/no-registration/networks-section"
import { SoftwareStore } from "@/components/no-registration/software-store"
import { AFAContextSection } from "@/components/no-registration/afa-context-section"
import { AFARegistrationForm } from "@/components/no-registration/afa-registration-form"
import { MTNSimForms } from "@/components/no-registration/mtn-sim-forms"
import { BusinessRegistrationForm } from "@/components/no-registration/business-registration-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, X, FileText, Shield, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"

export default function NoRegistrationPage() {
  const [showNotification, setShowNotification] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      setShowNotification(false)
      if (typeof window !== "undefined") {
        localStorage.setItem("termsNotificationClosed", Date.now().toString())
      }
    }, 300)
  }

  useEffect(() => {
    if (typeof window === "undefined") return

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen">
      <Header />

      <NoRegistrationSlider />

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-center mb-6">Why Choose No Registration?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Instant Access</h3>
                  <p className="text-green-100">No waiting, no forms - get what you need immediately</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Hidden Fees</h3>
                  <p className="text-green-100">Transparent pricing with no registration charges</p>
                </div>
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Quality Service</h3>
                  <p className="text-green-100">Same high-quality services without the paperwork</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <NetworksSection />
      <DevicesSection />

      <MTNSimForms />

      <section id="ecg-topup" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">ECG Prepaid Top-Up</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Top up your ECG prepaid meter instantly with just ₵8 service charge
            </p>
          </div>
          <ECGTopUpForm />
        </div>
      </section>

      <section id="software" className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Software Installation & Store</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional software installation services for Windows, macOS, and more
            </p>
          </div>
          <SoftwareStore />
        </div>
      </section>

      <section id="afa-registration" className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AFA Registration</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Register for AFA membership and unlock exclusive benefits and priority support
            </p>
          </div>
          <AFARegistrationForm />
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-blue-200 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-blue-800">Educational Products & Services</h3>
                      <p className="text-blue-600">Results Checker Cards, School Forms & Subscriptions</p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-lg">
                    Get instant access to BECE, WASSCE, ABCE results checker cards, university application forms, and
                    subscription services. Delivered via email or WhatsApp!
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {["BECE Results", "WASSCE Results", "University Forms", "School Forms", "Netflix", "Spotify"].map(
                      (item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ),
                    )}
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Link href="/voucher">
                      Shop Educational Products
                      <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </Button>
                </div>
                <div className="relative h-64 rounded-xl overflow-hidden shadow-lg">
                  <Image
                    src="/educational-card.jpg"
                    alt="Educational products and services"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <AFAContextSection />

      <BusinessRegistrationForm />

      <section className="py-16 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            No registration, no hassle - just quality services at affordable prices. Contact us via WhatsApp to place
            your order today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              <a href="https://wa.me/233242799990" target="_blank" rel="noopener noreferrer">
                Order via WhatsApp
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white text-white hover:bg-white hover:text-green-600 text-lg px-8 py-6 bg-transparent"
            >
              <Link href="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />

      {/* ELEGANT DARK GREEN NOTIFICATION */}
      {showNotification && (
        <div
          className={`
          fixed bottom-0 left-0 right-0 z-50 
          transform transition-all duration-500 ease-out
          ${isVisible ? "translate-y-0" : "translate-y-full"}
          shadow-2xl
        `}
        >
          <div className="bg-gradient-to-r from-green-800 via-green-900 to-emerald-900 border-t border-green-700">
            <div className="container mx-auto px-4">
              <div className="py-5 md:py-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                {/* Left side with icon and text */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-600 rounded-xl blur-md opacity-50"></div>
                    <div className="relative bg-green-800/80 backdrop-blur-sm border border-green-600/30 rounded-xl p-3">
                      <Shield className="w-7 h-7 md:w-8 md:h-8 text-green-200" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-green-100 font-semibold text-base md:text-lg tracking-wide">
                        Important Notice
                      </span>
                    </div>
                    <p className="text-green-200/90 text-sm md:text-base leading-relaxed">
                      Please review our
                      <span className="font-semibold text-white mx-1">Terms & Conditions</span>
                      before using no-registration services to understand applicable policies.
                    </p>
                  </div>
                </div>

                {/* Right side with buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-green-900 hover:bg-green-50 font-semibold px-5 md:px-6 py-4 md:py-5 text-sm md:text-base shadow-lg hover:shadow-xl transition-all duration-200 border border-white/30 rounded-lg"
                  >
                    <Link href="/terms" className="flex items-center gap-2">
                      <FileText className="w-4 h-4 md:w-5 md:h-5" />
                      Read Terms
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>

                  <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-2.5 md:p-3 hover:bg-green-800/60 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400/30 border border-green-600/30 hover:border-green-500/50"
                    aria-label="Close notification"
                  >
                    <X className="w-5 h-5 md:w-6 md:h-6 text-green-200" />
                  </button>
                </div>
              </div>
            </div>

            {/* Subtle animated border */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent">
              <div className="h-full w-1/3 bg-green-300 animate-slide-right"></div>
            </div>
          </div>

          {/* Animation styles */}
          <style jsx>{`
            @keyframes slide-right {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
            .animate-slide-right {
              animation: slide-right 8s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}

      {/* Add bottom padding to prevent content overlap */}
      {showNotification && isVisible && <div className="pb-24 md:pb-20"></div>}
    </main>
  )
}
