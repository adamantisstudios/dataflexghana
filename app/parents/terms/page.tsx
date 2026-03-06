"use client"

import {
  ArrowLeft,
  Shield,
  FileText,
  Users,
  CreditCard,
  Truck,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ParentTermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/parents/register"
              className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Registration
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-blue-600">Terms & Conditions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Parent Registration for GES-Approved Educational Materials
          </p>
          <p className="text-sm text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Key Benefits Card */}
        <Card className="mb-8 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-green-800">Parent Benefits</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-green-700">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>FREE Registration:</strong> No platform fees or hidden charges
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>GES-Approved:</strong> All textbooks meet Ghana Education Service standards
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Wholesale Prices:</strong> Direct access to manufacturer pricing
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Home Delivery:</strong> Books delivered to your preferred location
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="space-y-6">
          {/* Registration Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                1. Registration and Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>1.1 Eligibility:</strong> This platform is exclusively for parents and guardians of school-age
                children in Ghana seeking GES-approved educational materials.
              </p>
              <p>
                <strong>1.2 Registration Requirements:</strong> You must provide accurate information including your
                full name, email, phone number, child's details, and school information.
              </p>
              <p>
                <strong>1.3 Account Verification:</strong> All parent accounts require verification through WhatsApp
                communication with our team within 24-48 hours of registration.
              </p>
              <p>
                <strong>1.4 Free Access:</strong> Parent registration is completely FREE with no platform fees,
                membership charges, or hidden costs.
              </p>
            </CardContent>
          </Card>

          {/* Product Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                2. Products and Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>2.1 GES-Approved Materials:</strong> All textbooks and educational materials meet Ghana
                Education Service curriculum standards and requirements.
              </p>
              <p>
                <strong>2.2 Product Categories:</strong> Available items include textbooks, workbooks, stationery,
                school uniforms, and approved educational accessories.
              </p>
              <p>
                <strong>2.3 Grade Coverage:</strong> Materials available for Nursery through Senior High School (SHS 3)
                levels.
              </p>
              <p>
                <strong>2.4 Quality Assurance:</strong> All products are sourced from authorized publishers and
                suppliers to ensure authenticity and quality.
              </p>
            </CardContent>
          </Card>

          {/* Pricing and Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                3. Pricing and Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>3.1 Wholesale Pricing:</strong> Parents receive direct wholesale prices without markup,
                providing significant savings compared to retail prices.
              </p>
              <p>
                <strong>3.2 Payment Methods:</strong> Accepted payment methods include Mobile Money (MTN, Vodafone,
                AirtelTigo), bank transfers, and cash on delivery where available.
              </p>
              <p>
                <strong>3.3 Price Transparency:</strong> All prices are clearly displayed with no hidden fees or
                additional charges beyond the stated product cost.
              </p>
              <p>
                <strong>3.4 Payment Security:</strong> All transactions are processed through secure, encrypted channels
                to protect your financial information.
              </p>
            </CardContent>
          </Card>

          {/* Delivery Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                4. Delivery and Fulfillment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>4.1 Delivery Areas:</strong> We deliver to all 16 regions of Ghana, with specific delivery
                schedules for each area.
              </p>
              <p>
                <strong>4.2 Delivery Timeline:</strong> Standard delivery takes 3-7 business days depending on location.
                Express delivery available for Accra and Kumasi.
              </p>
              <p>
                <strong>4.3 Delivery Costs:</strong> Delivery fees are calculated based on location and order size, with
                free delivery available for orders above specified thresholds.
              </p>
              <p>
                <strong>4.4 Order Tracking:</strong> You will receive SMS and WhatsApp updates on your order status from
                confirmation to delivery.
              </p>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                5. Privacy and Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>5.1 Data Collection:</strong> We collect only necessary information for order processing,
                delivery, and customer service purposes.
              </p>
              <p>
                <strong>5.2 WhatsApp Communication:</strong> Registration details are sent via WhatsApp for
                verification. Your phone number will be used for order updates and customer service.
              </p>
              <p>
                <strong>5.3 Data Security:</strong> All personal information is encrypted and stored securely. We do not
                share your data with third parties without consent.
              </p>
              <p>
                <strong>5.4 Communication Preferences:</strong> You can opt out of promotional messages while
                maintaining essential order and delivery notifications.
              </p>
            </CardContent>
          </Card>

          {/* Returns and Refunds */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                6. Returns and Refunds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>6.1 Return Policy:</strong> Defective or damaged items can be returned within 7 days of delivery
                for full refund or replacement.
              </p>
              <p>
                <strong>6.2 Return Conditions:</strong> Items must be in original condition with all packaging.
                Textbooks cannot be returned if written in or damaged by use.
              </p>
              <p>
                <strong>6.3 Refund Process:</strong> Approved refunds are processed within 5-10 business days to the
                original payment method.
              </p>
              <p>
                <strong>6.4 Wrong Orders:</strong> If we deliver incorrect items, we will arrange immediate replacement
                at no additional cost to you.
              </p>
            </CardContent>
          </Card>

          {/* Platform Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                7. Platform Usage and Conduct
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                <strong>7.1 Appropriate Use:</strong> This platform is for legitimate educational material purchases
                only. Commercial reselling is prohibited.
              </p>
              <p>
                <strong>7.2 Account Responsibility:</strong> You are responsible for maintaining the confidentiality of
                your account information and all activities under your account.
              </p>
              <p>
                <strong>7.3 Prohibited Activities:</strong> Fraudulent orders, false information, or attempts to
                manipulate pricing are strictly prohibited and may result in account suspension.
              </p>
              <p>
                <strong>7.4 Customer Service:</strong> Our support team is available via WhatsApp and phone during
                business hours for assistance with orders and inquiries.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-blue-700">
              <p>
                <strong>WhatsApp Support:</strong> 0242799990
              </p>
              <p>
                <strong>Email:</strong> support@dataflexges.com
              </p>
              <p>
                <strong>Business Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM
              </p>
              <p>
                <strong>Emergency Support:</strong> Available for urgent delivery issues
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Link Card */}
        <Card className="mb-8 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <HelpCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 mb-2">Have Questions?</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Check out our comprehensive FAQ section for answers to common questions about registration, pricing,
                  delivery, and more.
                </p>
                <Link href="/faq">
                  <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Visit FAQ & Help Center
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/parents/register">
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-3">
              I Agree - Continue Registration
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="px-8 py-3 bg-transparent">
              Back to Homepage
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            By registering, you acknowledge that you have read, understood, and agree to these terms and conditions.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Powered by <span className="font-medium text-blue-600">DataFlex GES Books Platform</span>
          </p>
        </div>
      </div>
    </div>
  )
}
