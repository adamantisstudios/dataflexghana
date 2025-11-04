"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center p-2 border-2 border-emerald-200">
              <img src="/images/logo-new.png" alt="DataFlex Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                DataFlex Ghana
              </h1>
              <p className="text-xs text-gray-600">Affordable Services</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Home
            </Link>
            <Link
              href="/no-registration"
              className="text-gray-700 hover:text-emerald-600 transition-colors font-medium"
            >
              No Registration
            </Link>
            <Link href="/agent/login" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium">
              Agent Login
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              asChild
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
            >
              <Link href="/agent/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg"
            >
              <Link href="/agent/register">Join as Agent</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="flex flex-col gap-4">
              <Link href="/" className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1">
                Home
              </Link>
              <Link
                href="/no-registration"
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
              >
                No Registration
              </Link>
              <Link
                href="/agent/login"
                className="text-gray-700 hover:text-emerald-600 transition-colors font-medium px-2 py-1"
              >
                Agent Login
              </Link>
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  asChild
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                >
                  <Link href="/agent/login">Login</Link>
                </Button>
                <Button
                  asChild
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                >
                  <Link href="/agent/register">Join as Agent</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
