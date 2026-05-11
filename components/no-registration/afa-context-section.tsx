import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Users,
  MapPin,
  DollarSign,
  CheckCircle,
  Phone,
  ArrowRight,
  Clock,
  Wifi,
} from "lucide-react";
import Link from "next/link";

export function AFAContextSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header – full width */}
        <div className="w-full text-center mb-10">
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">
            MTN AFA Bundle – what you should know
          </h2>
          <p className="text-gray-600">
            It’s a cheap phone and data plan for farmers and rural communities. 
            Here’s how it works and how you can get it.
          </p>
        </div>

        <div className="w-full space-y-8">
          {/* What is AFA – unchanged */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <Smartphone className="h-7 w-7" />
                <div>
                  <h3 className="text-xl font-bold">What’s the MTN AFA Bundle?</h3>
                  <p className="text-green-100 text-sm">Affordable Farmers Access</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-gray-700 leading-relaxed">
                <strong className="text-green-700">AFA stands for Affordable Farmers Access</strong> – 
                a special MTN Ghana plan for farmers and people in rural areas. 
                It gives you cheaper calls and data with longer validity.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Phone className="h-7 w-7 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-800">Cheaper calls</h4>
                  <p className="text-sm text-gray-600">To any network</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Wifi className="h-7 w-7 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-800">Discounted data</h4>
                  <p className="text-sm text-gray-600">Pay less for internet</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <Clock className="h-7 w-7 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-800">Longer validity</h4>
                  <p className="text-sm text-gray-600">Your bundles last longer</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to register – unchanged */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <Users className="h-7 w-7" />
                <div>
                  <h3 className="text-xl font-bold">How to register</h3>
                  <p className="text-blue-100 text-sm">Do it yourself or let us help</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">The steps (if you do it yourself)</h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">1</div>
                    <div>
                      <p className="font-medium text-gray-800">Dial <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">*1848#</code> on your MTN line</p>
                      <p className="text-sm text-gray-600">Follow the menu that pops up</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">2</div>
                    <div>
                      <p className="font-medium text-gray-800">Choose registration option (usually 1)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">3</div>
                    <div>
                      <p className="font-medium text-gray-800">Enter your details</p>
                      <p className="text-sm text-gray-600">Full name, Ghana Card, location, occupation (prefer “farmer”)</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-7 h-7 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">4</div>
                    <div>
                      <p className="font-medium text-gray-800">Confirm and you’re done</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  What you’ll need
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                  <span>• Full name</span>
                  <span>• MTN phone number</span>
                  <span>• Ghana Card number</span>
                  <span>• Region / location</span>
                  <span>• Occupation (farmer recommended)</span>
                  <span>• Date of birth</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cost & benefits – unchanged */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-5 py-3 text-white">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <h3 className="font-bold text-lg">Registration cost</h3>
                </div>
              </div>
              <div className="p-5 text-center">
                <p className="text-gray-600 text-sm mb-3">Depends who registers you:</p>
                <div className="inline-block bg-orange-50 px-6 py-3 rounded-xl">
                  <span className="text-4xl font-bold text-orange-600">₵3 – ₵30</span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  DataFlex Ghana offers some of the lowest registration fees.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-5 py-3 text-white">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <h3 className="font-bold text-lg">What you get</h3>
                </div>
              </div>
              <div className="p-5">
                <ul className="space-y-2">
                  {[
                    "Cheaper calls to all networks",
                    "Discounted data bundles",
                    "Longer validity for your credit",
                    "Agricultural info via SMS",
                    "Market price updates",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* CTA – unchanged */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Want help registering?</h3>
            <p className="w-full text-white/90 mb-5">
              DataFlex Ghana can register you for the AFA bundle and also provides the cheapest data rates in the country.
            </p>
            <Button
              asChild
              className="bg-white text-green-700 hover:bg-gray-100 px-6 py-2 rounded-lg"
            >
              <Link href="/agent/register" className="flex items-center gap-2">
                Register with us <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}