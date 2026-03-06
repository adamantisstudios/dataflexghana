"use client"

import { ArrowRight, Truck, Wrench, Clock, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ServiceSection() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white to-slate-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl blur-2xl opacity-20"></div>
            <img
              src="/repairmantwo.jpg"
              alt="Apple device repair technician in Accra, Ghana providing professional iPhone and iPad repair services"
              className="relative rounded-2xl shadow-xl object-cover w-full h-80 md:h-96"
            />
          </div>

          {/* Right: Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Quick, Professional <span className="text-amber-600">Apple Repairs in Accra</span>
              </h2>
              <p className="text-lg text-slate-600">
                Expert Apple device repair service throughout Accra, Ghana. No need to visit our office! We offer
                convenient pickup, expert repair by certified technicians, and safe delivery service. Get your iPhone,
                iPad, or MacBook fixed in 24-48 hours.
              </p>
            </div>

            {/* Services Offered */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg flex-shrink-0">
                  <Truck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Free Pickup Service</h3>
                  <p className="text-sm text-slate-600">
                    We collect your device from anywhere in Accra at no extra cost
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg flex-shrink-0">
                  <Wrench className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Certified Technicians</h3>
                  <p className="text-sm text-slate-600">
                    Award-winning professional technicians repair your device with genuine quality parts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Fast Turnaround (24-48 hours)</h3>
                  <p className="text-sm text-slate-600">
                    Most iPhone, iPad and MacBook repairs completed within 24-48 hours in Accra
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg flex-shrink-0">
                  <Truck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Safe Delivery</h3>
                  <p className="text-sm text-slate-600">
                    We deliver your repaired device back to your location in Accra with care
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a href="#service-form" className="flex-1">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  Request Service Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <a href="https://wa.me/233242799990" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full border-amber-600 text-amber-600 hover:bg-amber-50 bg-transparent"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
