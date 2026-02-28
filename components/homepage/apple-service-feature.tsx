"use client"

import { ArrowRight, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AppleServiceFeature() {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left: Image */}
          <div className="relative order-2 md:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl blur-2xl opacity-30"></div>
            <img
              src="/repairman.jpg"
              alt="Apple Device Repair"
              className="relative rounded-2xl shadow-2xl object-cover w-full h-80 md:h-96 border-4 border-amber-400/20"
            />
          </div>

          {/* Right: Content */}
          <div className="space-y-6 order-1 md:order-2">
            <div>
              <div className="inline-block px-4 py-2 bg-amber-500/20 rounded-full mb-4">
                <p className="text-amber-400 text-sm font-semibold">🔧 Professional Apple Repair</p>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Need Your Apple Device Fixed?</h2>
              <p className="text-lg text-slate-300">
                Visit our professional repair center for quick diagnostics, expert repairs, and competitive pricing.
                Free pickup and delivery included!
              </p>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-200">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Free pickup and delivery service</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Certified technicians with years of experience</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Fast turnaround time - 24-48 hours</span>
              </div>
              <div className="flex items-center gap-3 text-slate-200">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span>Competitive pricing with warranty coverage</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex gap-4 pt-4">
              <Link href="/appleservicecenter" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg h-12 text-base">
                  <Smartphone className="w-5 h-5 mr-2" />
                  Get Repair Service
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
