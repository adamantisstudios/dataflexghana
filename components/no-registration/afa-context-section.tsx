import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Users, MapPin, DollarSign, CheckCircle, Phone } from "lucide-react"
import Link from "next/link"

export function AFAContextSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Understanding MTN AFA Bundle in Ghana</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn about Ghana's most affordable telecommunications package designed for farmers and rural communities
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* What is AFA Bundle */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-green-600 text-white">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Smartphone className="h-8 w-8" />📱 What Is the MTN AFA Bundle?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-lg text-gray-700 mb-6">
                In Ghana, the MTN AFA Bundle is a special telecommunications offer provided by MTN Ghana, primarily
                targeting farmers and individuals in rural areas. "AFA" stands for{" "}
                <strong>"Affordable Farmers Access,"</strong> aiming to deliver cost-effective voice and data services
                to underserved communities.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Phone className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-green-800">Free/Discounted Voice</h3>
                  <p className="text-sm text-gray-600">Affordable call rates to all networks</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Smartphone className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-blue-800">Affordable Data</h3>
                  <p className="text-sm text-gray-600">Discounted data packages for internet access</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-purple-800">Extended Validity</h3>
                  <p className="text-sm text-gray-600">Longer validity periods for better value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How to Register */}
          <Card>
            <CardHeader className="bg-blue-600 text-white">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <Users className="h-8 w-8" />📝 How to Register for the MTN AFA Bundle
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-blue-800">Registration Steps:</h3>
                  <ol className="space-y-3">
                    <li className="flex gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        1
                      </span>
                      <div>
                        <strong>Dial the Registration Code:</strong> On your MTN line, dial{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded">*1848#</code>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        2
                      </span>
                      <div>
                        <strong>Select Registration Option:</strong> Choose option 1 to register
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        3
                      </span>
                      <div>
                        <strong>Provide Required Information</strong> (see details on the right)
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                        4
                      </span>
                      <div>
                        <strong>Complete Registration:</strong> Follow the prompts to finalize
                      </div>
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4 text-green-800">Required Information:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Full name</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>MTN phone number</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Ghana Card number</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Region and specific location</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Occupation (preferably "farmer")</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Date of birth</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost and Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="bg-orange-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6" />💰 Cost of Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-700 mb-4">
                  The registration process involves a fee that varies depending on the registerer:
                </p>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <span className="text-3xl font-bold text-orange-600">₵3 - ₵30</span>
                  <p className="text-sm text-gray-600 mt-2">Depending on the registerer and location</p>
                  <p className="text-xs text-gray-500 mt-1">DataFlex Ghana offers competitive registration rates</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-purple-600 text-white">
                <CardTitle className="flex items-center gap-3">
                  <MapPin className="h-6 w-6" />📦 Benefits of AFA Bundle
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Affordable call rates to all networks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Discounted data packages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Extended validity periods</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Access to agricultural information</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span>Market price updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white text-center">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Your AFA Bundle?</h3>
              <p className="text-lg mb-6">
                DataFlex Ghana helps you register for AFA bundles and provides the cheapest data rates in Ghana!
              </p>
              <Link href="/agent/register">
                <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                  Register with DataFlex Ghana
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
