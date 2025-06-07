import Link from "next/link"
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              <span className="text-green-500">DataFlex</span>Ghana
            </h2>
            <p className="text-gray-400 mb-4">
              Ghana's Data Market Leader providing affordable data bundles and comprehensive digital services.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-green-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#networks" className="text-gray-400 hover:text-green-500 transition-colors">
                  Data Bundles
                </Link>
              </li>
              <li>
                <Link href="/ecg-topup" className="text-gray-400 hover:text-green-500 transition-colors">
                  ECG Top-Up
                </Link>
              </li>
              <li>
                <Link href="/software" className="text-gray-400 hover:text-green-500 transition-colors">
                  Software
                </Link>
              </li>
              <li>
                <Link href="/cv-writing" className="text-gray-400 hover:text-green-500 transition-colors">
                  CV Writing
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-400 hover:text-green-500 transition-colors">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2 text-gray-400">
              <li>MTN, Telecel & AirtelTigo Data</li>
              <li>ECG Prepaid Top-Up</li>
              <li>Software Installation</li>
              <li>Professional CV Writing</li>
              <li>MiFi & Router Sales</li>
              <li>Agent Registration</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-400">+233 242 799 990</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-400">+233 551 999 901</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-400">info.adamantisstudios@gmail.com</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-400">Adamantis Studios, Madina Zongo Junction</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400">&copy; 2025 DataFlex Ghana. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
