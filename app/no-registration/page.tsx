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

export const metadata = {
  title: "No Registration Required - Affordable Services - DataFlex Ghana",
  description:
    "Access affordable data bundles, ECG top-ups, software installation, and more without registration. Quality services at competitive prices.",
}

export default function NoRegistrationPage() {
  return (
    <main className="min-h-screen">
      <Header />

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
