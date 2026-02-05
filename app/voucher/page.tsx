import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, ShoppingCart, MessageCircle, CheckCircle, Star, BookOpen } from "lucide-react"
import { VoucherProductsDisplay } from "@/components/voucher/VoucherProductsDisplay"
import { VoucherOrderForm } from "@/components/voucher/VoucherOrderForm"

export const metadata = {
  title: "Educational Products & Services - Results Checker Cards, School Forms & Subscriptions | DataFlex Ghana",
  description:
    "Purchase BECE, WASSCE, ABCE results checker cards, university application forms, and subscription services. Fast delivery via email or WhatsApp.",
  keywords:
    "BECE results checker, WASSCE results checker, school application forms, university forms Ghana, educational services, subscription services",
}

export default function VoucherCardsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />

      {/* Hero Section 1 - Main Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-white/30">Educational Services</Badge>
              <h1 className="text-4xl lg:text-5xl font-bold">Educational Products & Services for Students in Ghana</h1>
              <p className="text-xl text-blue-100">
                Get instant access to results checker cards, school application forms, and subscription services.
                Delivered via email or WhatsApp!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
                >
                  <a href="#voucher-products">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Browse Products
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6 bg-transparent"
                >
                  <a href="#order-form">
                    <GraduationCap className="mr-2 h-5 w-5" />
                    Order Now
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative h-96 rounded-xl overflow-hidden shadow-2xl">
              <img
                src="/happy-ghanaian-students-with-books-and-laptops-cel.jpg"
                alt="Students celebrating academic success"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Hero Section 2 - Benefits */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Why Choose Our Services?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fast, reliable, and convenient educational services for students across Ghana
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-blue-200 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Instant Delivery</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Receive your results checker cards and forms instantly via email or WhatsApp. No waiting required!
                </p>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Verified Products</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  All our results checker cards and application forms are authentic and verified. Shop with confidence!
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:shadow-xl transition-all duration-300">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Easy to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600">
                  Simple ordering process. Just fill the form, and we'll handle the rest. No registration required!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Hero Section 3 - Featured Services */}
      <section className="py-16 bg-gradient-to-br from-blue-100 to-indigo-100">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative h-96 rounded-xl overflow-hidden shadow-2xl order-2 md:order-1">
              <img
                src="/ghanaian-student-checking-exam-results-on-laptop-h.jpg"
                alt="Student checking exam results"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-6 order-1 md:order-2">
              <Badge className="bg-blue-600 text-white">Popular Services</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Everything You Need for Academic Success</h2>
              <p className="text-xl text-gray-700">
                From results checker cards to university application forms and subscription services - we've got you
                covered!
              </p>
              <div className="grid grid-cols-2 gap-4">
                {["BECE Results Checker", "WASSCE Results Checker", "University Forms", "Subscription Services"].map(
                  (feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ),
                )}
              </div>
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6"
              >
                <a href="#voucher-products">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Browse All Products
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Display */}
      <section id="voucher-products" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4">Our Products</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Available Educational Products & Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our wide selection of results checker cards, school forms, and subscription services
            </p>
          </div>
          <VoucherProductsDisplay />
        </div>
      </section>

      {/* Order Form Section */}
      <section id="order-form" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 mb-4">Quick Order</Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Place Your Order</h2>
              <p className="text-xl text-gray-600">
                Fill out the form below and we'll send your order details via WhatsApp
              </p>
            </div>
            <VoucherOrderForm />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Kwame Asante",
                comment: "Got my WASSCE results checker card instantly! Very reliable service.",
                rating: 5,
              },
              {
                name: "Ama Owusu",
                comment: "Purchased my university application form here. Fast delivery and great support!",
                rating: 5,
              },
              {
                name: "Kofi Mensah",
                comment: "Best place to get educational services in Ghana. Highly recommended!",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <Card key={i} className="border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-4">"{testimonial.comment}"</p>
                  <p className="font-semibold text-blue-600">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Order your educational products now and get instant delivery via email or WhatsApp!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
            >
              <a href="#order-form">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Order Now
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-6 bg-transparent"
            >
              <a href="https://wa.me/233242799990" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Us
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
