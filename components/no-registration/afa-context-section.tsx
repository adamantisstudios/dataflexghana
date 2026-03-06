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
} from "lucide-react";
import Link from "next/link";

export function AFAContextSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Understanding MTN AFA Bundle in Ghana
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            Learn about Ghana's most affordable telecommunications package
            designed for farmers and rural communities
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* What is AFA Bundle */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold">
                    What Is the MTN AFA Bundle?
                  </CardTitle>
                  <p className="text-green-100 text-sm mt-1">
                    Affordable Farmers Access – designed for rural communities
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <p className="text-gray-700 text-base md:text-lg mb-8 leading-relaxed">
                In Ghana, the MTN AFA Bundle is a special telecommunications
                offer provided by MTN Ghana, primarily targeting farmers and
                individuals in rural areas.{" "}
                <strong className="font-semibold text-green-700">
                  "AFA" stands for "Affordable Farmers Access"
                </strong>
                , aiming to deliver cost-effective voice and data services to
                underserved communities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FeatureCard
                  icon={<Phone className="h-8 w-8 text-green-600" />}
                  title="Free/Discounted Voice"
                  description="Affordable call rates to all networks"
                  bgColor="bg-green-50"
                />
                <FeatureCard
                  icon={<Smartphone className="h-8 w-8 text-blue-600" />}
                  title="Affordable Data"
                  description="Discounted data packages for internet access"
                  bgColor="bg-blue-50"
                />
                <FeatureCard
                  icon={<CheckCircle className="h-8 w-8 text-purple-600" />}
                  title="Extended Validity"
                  description="Longer validity periods for better value"
                  bgColor="bg-purple-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* How to Register */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold">
                    How to Register for the MTN AFA Bundle
                  </CardTitle>
                  <p className="text-blue-100 text-sm mt-1">
                    Simple steps to get started
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Steps */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                    Registration Steps
                  </h3>
                  <div className="space-y-4">
                    <Step
                      number={1}
                      title="Dial the Registration Code"
                      description={
                        <>
                          On your MTN line, dial{" "}
                          <code className="bg-gray-100 px-2 py-1 rounded text-blue-700 font-mono text-sm">
                            *1848#
                          </code>
                        </>
                      }
                    />
                    <Step
                      number={2}
                      title="Select Registration Option"
                      description="Choose option 1 to register"
                    />
                    <Step
                      number={3}
                      title="Provide Required Information"
                      description="Fill in your details as prompted"
                    />
                    <Step
                      number={4}
                      title="Complete Registration"
                      description="Follow the prompts to finalize"
                    />
                  </div>
                </div>

                {/* Required Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-green-600 rounded-full"></span>
                    Required Information
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Full name",
                      "MTN phone number",
                      "Ghana Card number",
                      "Region and location",
                      "Occupation (preferably 'farmer')",
                      "Date of birth",
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-sm md:text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost & Benefits - Two Column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cost Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">Cost of Registration</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-gray-600 text-sm mb-4">
                  The registration fee varies depending on the registerer:
                </p>
                <div className="text-center p-5 bg-orange-50 rounded-xl">
                  <span className="text-3xl md:text-4xl font-bold text-orange-600">
                    ₵3 – ₵30
                  </span>
                  <p className="text-sm text-gray-500 mt-2">
                    Depending on the registerer and location
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    DataFlex Ghana offers competitive registration rates
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">Benefits of AFA Bundle</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {[
                    "Affordable call rates to all networks",
                    "Discounted data packages",
                    "Extended validity periods",
                    "Access to agricultural information",
                    "Market price updates",
                  ].map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-r from-green-600 to-blue-600">
            <CardContent className="p-8 md:p-10 text-center text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Get Your AFA Bundle?
              </h3>
              <p className="text-lg md:text-xl mb-6 opacity-90 max-w-2xl mx-auto">
                DataFlex Ghana helps you register for AFA bundles and provides
                the cheapest data rates in Ghana!
              </p>
              <Button
                asChild
                size="lg"
                className="bg-white text-green-700 hover:bg-gray-100 px-8 py-6 rounded-xl shadow-lg"
              >
                <Link href="/agent/register">
                  Register with DataFlex Ghana
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// Helper component for feature cards (used in "What is AFA")
function FeatureCard({
  icon,
  title,
  description,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
}) {
  return (
    <div
      className={`${bgColor} p-5 rounded-xl text-center hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-center mb-3">{icon}</div>
      <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

// Helper component for registration steps
function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div>
        <p className="font-medium text-gray-800">{title}</p>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}