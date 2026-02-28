import { MessageCircle, MapPin, Phone, Clock, Truck, Wrench } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">Dataflex Service Repair Center</h3>
            <p className="text-slate-400 text-sm">
              Professional Apple device repair services with certified technicians and warranty coverage.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#service-form" className="hover:text-white transition">
                  Request Service
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-white transition">
                  Our Services
                </a>
              </li>
              <li>
                <a href="#testimonials" className="hover:text-white transition">
                  Testimonials
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Operating Hours
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Monday - Friday: 9:00 AM - 6:00 PM</li>
              <li>Saturday: 10:00 AM - 4:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Get In Touch</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <a href="https://wa.me/233242799990" className="hover:text-white transition">
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+233242799990" className="hover:text-white transition">
                  +233 24 279 9990
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Madina Zongo Junction, Accra
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 py-8 mb-8">
          <h4 className="font-semibold mb-6 text-center text-lg">Our Services</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <Truck className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-white mb-1">Fast Pickup</h5>
                <p className="text-sm text-slate-400">We pick up your device from your location</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-center md:text-left">
              <Wrench className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-white mb-1">Expert Repair</h5>
                <p className="text-sm text-slate-400">Professional technicians fix your device</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-center md:text-left">
              <Truck className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div>
                <h5 className="font-semibold text-white mb-1">Safe Delivery</h5>
                <p className="text-sm text-slate-400">We deliver your repaired device to you</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 mb-8">
          <h4 className="font-semibold mb-4 text-center">Visit Us at Madina Zongo Junction</h4>
          <div className="rounded-lg overflow-hidden shadow-lg h-80">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.6458287850444!2d-0.2547789!3d5.6316667!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9a1b2d3b5c5b5%3A0x5c5b5b5b5b5b5b5b!2sMadina%20Zongo%20Junction%2C%20Accra!5e0!3m2!1sen!2sgh!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Dataflex Service Repair Center - Madina Zongo Junction"
            ></iframe>
          </div>
          <p className="text-center text-slate-400 text-sm mt-4">
            📍 Located at Madina Zongo Junction, Accra - Easy to find and accessible
          </p>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <p className="text-center text-slate-400 text-sm">
            © 2026 Dataflex Service Repair Center. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
