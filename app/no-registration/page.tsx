import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { NoRegistrationSlider } from "@/components/no-registration/no-registration-slider"
import { DevicesSection } from "@/components/no-registration/devices-section"
import { ECGTopUpForm } from "@/components/no-registration/ecg-topup-form"
import { NetworksSection } from "@/components/no-registration/networks-section"
import { SoftwareStore } from "@/components/no-registration/software-store"
import { AFAContextSection } from "@/components/no-registration/afa-context-section"
import { AFARegistrationForm } from "@/components/no-registration/afa-registration-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export const metadata = {
  title: "No Registration Required - Affordable Services - DataFlex Ghana",
  description:
    "Access affordable data bundles, ECG top-ups, software installation, and more without registration. Quality services at competitive prices.",
}

export default function NoRegistrationPage() {
  return (
    <main className="min-h-screen">
      <Header />

      <div className="bg-amber-50 border-y border-amber-200 py-2">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-amber-800">
          <span className="font-medium">Operational Hours: 6:00 AM - 9:30 PM Daily</span>
          <span className="hidden sm:inline">•</span>
          <Link href="/terms" className="underline font-bold hover:text-amber-900 flex items-center gap-1">
            Read Terms & Conditions that apply to No-Registration Services
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Hero Slider */}
      <NoRegistrationSlider />

      {/* Benefits Section */}
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

      {/* Data Bundles Section */}
      <NetworksSection />

      {/* Devices Section */}
      <DevicesSection />

      {/* ECG Top-Up Section */}
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

      {/* Software Installation Section */}
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

      {/* AFA Registration Section */}
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

      {/* AFA Bundle Information */}
      <AFAContextSection />

      {/* Call to Action */}
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
    </main>
  )
}
