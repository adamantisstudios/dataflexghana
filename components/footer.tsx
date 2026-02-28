"use client"

import Link from "next/link"
import { useState, useCallback } from "react"
import { Separator } from "@/components/ui/separator"
import { Shield, Mail, Phone, MapPin, Facebook, Twitter, Instagram, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function Footer() {
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const router = useRouter()

  const handleShieldClick = useCallback(() => {
    const currentTime = Date.now()
    const timeDiff = currentTime - lastClickTime

    if (timeDiff > 2000) {
      setClickCount(1)
    } else {
      setClickCount((prev) => prev + 1)
    }

    setLastClickTime(currentTime)

    if (clickCount >= 2) {
      setClickCount(0)
      router.push("/admin")
    }
  }, [clickCount, lastClickTime, router])

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-white rounded-full p-2 w-12 h-12 flex items-center justify-center border-2 border-green-500 shadow-lg">
                <img src="/images/logo-footer.png" alt="DataFlex Logo" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-xl lg:text-2xl font-bold">Dataflexghana.com</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-sm lg:text-base">
              Ghana's most reliable Multi-Service platform. Connect with clients and earn generous commissions.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/dataflexgh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors"
              >
                <Facebook className="h-5 w-5 text-white" />
              </a>
              <a
                href="https://twitter.com/dataflexgh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center hover:bg-green-500 transition-colors"
              >
                <Twitter className="h-5 w-5 text-white" />
              </a>
              <a
                href="https://instagram.com/dataflexgh"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors"
              >
                <Instagram className="h-5 w-5 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm lg:text-base">
              <li>
                <Link href="/agent/register" className="text-gray-400 hover:text-white transition-colors">
                  Become an Agent
                </Link>
              </li>
              <li>
                <Link href="/agent/login" className="text-gray-400 hover:text-white transition-colors">
                  Agent Login
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Support</h3>
            <ul className="space-y-2 text-sm lg:text-base">
              <li className="flex items-center space-x-2 text-gray-400">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>0242799990</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="break-all">sales.dataflex@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Accra, Ghana</span>
              </li>
            </ul>
          </div>

          {/* Security Section - Hidden Admin Access */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Security</h3>
            <p className="text-gray-400 text-sm">Platform security and protection</p>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleShieldClick}
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer border border-gray-600"
                title="Security"
              >
                <Shield className="h-5 w-5 text-gray-400" />
              </button>
              <span className="text-gray-500 text-sm">Secure Platform</span>
            </div>
            <p className="text-xs text-gray-500">Advanced security measures protect all user data</p>
          </div>
        </div>

        <Separator className="my-6 lg:my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">© 2026 Dataflexghana.com. All rights reserved.</div>
          <div className="flex flex-wrap justify-center gap-4 lg:gap-6 text-sm">
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Cookie Policy
            </Link>
            <Link href="/faq" className="text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <HelpCircle className="h-4 w-4" />
              FAQ & Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
