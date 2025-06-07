import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, Ban, CheckCircle, XCircle, MessageCircle } from "lucide-react"

export function TermsAndConditions() {
  const generalTerms = [
    {
      title: "No Refunds",
      description:
        "Double-check all details before making payment. All sales are final with no refunds under any circumstances.",
      color: "red",
    },
    {
      title: "Order Processing Time",
      description:
        "Between 1 minute and 3 hours. Processing times may vary during peak periods or network maintenance.",
      color: "blue",
    },
    {
      title: "Bonus Services",
      description:
        "Enjoy discounts on 54+ IT & branding services including software installation, CV writing, and web development.",
      color: "purple",
    },
    {
      title: "Data Validity",
      description:
        "Data lasts 3 months and rolls over with your next purchase. No data wastage with our rollover system.",
      color: "green",
    },
    {
      title: "Weekend Service",
      description: "We operate on Saturdays and Sundays. Full service availability 7 days a week for your convenience.",
      color: "orange",
    },
  ]

  const usageRules = [
    "Join our official WhatsApp channel to receive updates, promotions, and important service announcements.",
    "Do not advertise our products on social media. Share privately with friends or family only. Violation results in service denial.",
    "Do not pay for a plan and then contact the telecom provider for a reversal. You will be denied service permanently.",
    "Never use our brand name to promote groups, schemes, or personal programs. Legal action may be taken.",
    "Always notify us once your data has been received. This helps us track delivery and improve service quality.",
    "Orders are final—no cancellations, no corrections, and no refunds after processing begins. Double-check before ordering.",
    "When referring friends, use only our official website or Linktree URL. This ensures authentic service delivery.",
    "Data delivery is not instant. It may take up to 1 hour or more during high traffic periods. Please be patient.",
    "Avoid buying data for SIMs with borrowed airtime or data—they may forfeit the bundle automatically without recovery.",
  ]

  const unsupportedSims = [
    "Agent SIM",
    "Merchant SIM",
    "EVD SIM",
    "TurboNet SIMs",
    "Broadband SIMs",
    "Blacklisted SIMs",
    "Roaming SIMs",
    "Company/Group SIMs",
    "Different Network SIMs",
    "Wrong or Invalid Numbers",
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Please read and agree to these terms and conditions before accessing our services. By using DataFlex Ghana
            services, you automatically accept these terms.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-8">
          {/* General Terms */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-green-700 text-2xl">
                <Shield className="h-7 w-7" />
                General Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generalTerms.map((term, index) => (
                  <div key={index} className={`p-4 bg-${term.color}-50 rounded-lg border border-${term.color}-200`}>
                    <h4 className={`font-semibold text-${term.color}-800 mb-2`}>
                      {index + 1}. {term.title}
                    </h4>
                    <p className={`text-${term.color}-700 text-sm`}>{term.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Usage Rules */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-700 text-2xl">
                <AlertTriangle className="h-7 w-7" />
                Important Usage Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {usageRules.map((rule, index) => (
                  <div key={index} className="border-l-4 border-l-blue-400 pl-4 py-2">
                    <p className="text-gray-700 text-sm">
                      {index + 6}. {rule}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Unsupported SIM Types */}
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-700 text-2xl">
                <Ban className="h-7 w-7" />
                Unsupported SIM Types (No Refunds Issued)
              </CardTitle>
              <p className="text-red-600 font-medium">
                We do not provide services for the following SIM card types. No refunds will be issued:
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unsupportedSims.map((simType, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 text-sm font-medium">{simType}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Violation Consequences */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-orange-700 text-2xl">
                <AlertTriangle className="h-7 w-7" />
                Violation Consequences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <p className="text-orange-700 text-lg font-medium mb-4">
                  We reserve the right to withdraw services from any user who violates these terms.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-orange-800">Immediate Actions:</h4>
                    <ul className="space-y-1 text-orange-700 text-sm">
                      <li>• Account suspension</li>
                      <li>• Service termination</li>
                      <li>• Permanent blacklisting</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-orange-800">Legal Actions:</h4>
                    <ul className="space-y-1 text-orange-700 text-sm">
                      <li>• Brand name misuse prosecution</li>
                      <li>• Fraud case reporting</li>
                      <li>• Damages recovery</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thank You Message */}
          <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white border-0">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Thank You for Choosing DataFlex Ghana</h3>
              <p className="text-lg mb-4">Ghana's Data Market Leader!</p>
              <p className="text-base opacity-90 mb-6">
                By using our services, you agree to these terms and conditions. We're committed to providing reliable,
                affordable, and quality digital services to all our customers.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm opacity-75">
                <CheckCircle className="h-4 w-4" />
                <span>Last updated: January 2025</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold text-blue-800 mb-2">Questions About These Terms?</h3>
              <p className="text-blue-700 mb-4">
                Contact our customer support team for clarification on any of these terms and conditions.
              </p>
              <a
                href="https://wa.me/233242799990?text=I need clarification about your terms and conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                Contact Support
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
