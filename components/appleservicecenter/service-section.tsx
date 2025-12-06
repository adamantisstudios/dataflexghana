"use client"

import { ArrowRight, Truck, Wrench, Clock, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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
              alt="Apple Device Repair Service"
              className="relative rounded-2xl shadow-xl object-cover w-full h-80 md:h-96"
            />
          </div>

          {/* Right: Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Quick, Professional <span className="text-amber-600">Apple Repairs</span>
              </h2>
              <p className="text-lg text-slate-600">
                No need to visit our office! We offer convenient pickup, expert repair, and safe delivery service.
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
                  <p className="text-sm text-slate-600">We collect your device from your location at no extra cost</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg flex-shrink-0">
                  <Wrench className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Expert Technicians</h3>
                  <p className="text-sm text-slate-600">
                    Certified professionals repair your device with quality parts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Fast Turnaround</h3>
                  <p className="text-sm text-slate-600">Most repairs completed within 24-48 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg flex-shrink-0">
                  <Truck className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Safe Delivery</h3>
                  <p className="text-sm text-slate-600">We deliver your repaired device back to your doorstep</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="#service-form" className="flex-1">
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  Request Service Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
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
