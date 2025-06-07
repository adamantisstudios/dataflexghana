import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Scissors, Briefcase, Gift } from "lucide-react"

const promotionalOffers = [
  {
    id: "fashionably-hired",
    title: "Fashionably Hired",
    icon: Scissors,
    color: "text-pink-600",
    bgColor: "bg-pink-100",
    description: "👗✨ Tired of Unreliable Tailors?",
    subtitle: "🎯 Stitch with style, precision, and punctuality.",
    cta: "Order your sewing projects and enjoy discounts!",
    link: "https://forms.gle/Saywvgasum6XEPs46",
    image: "/ad1-placeholder.jpg?height=200&width=300",
  },
  {
    id: "dataflex-perks",
    title: "DataFlex Ghana Perks",
    icon: Gift,
    color: "text-green-600",
    bgColor: "bg-green-100",
    description: "🚀 Exclusive Benefits:",
    subtitle: "🔹 Birthday Treats & Gift Bundles\n🔹 Bulk Data Deals",
    cta: "👉 Sign up and enjoy it all!",
    link: "https://forms.gle/KWPtjZ8MT65ALUt3A",
    image: "/ad2-placeholder.jpg?height=200&width=300",
  },
  {
    id: "fast-hired",
    title: "Fast-Hired And Travels",
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    description: "📌 Zero Registration or Salary Deductions",
    subtitle: "We help you find jobs for FREE.",
    cta: "Register now to get started.",
    link: "https://forms.gle/nC5CCagRdxG6tFGy9",
    image: "/ad3-placeholder.jpg?height=200&width=300",
  },
]

export function PromotionalAds() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Special Offers & Partners</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover exclusive services and opportunities from our trusted partners
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promotionalOffers.map((offer) => (
            <Card
              key={offer.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
            >
              <CardHeader className="text-center pb-4">
                <div
                  className={`mx-auto w-16 h-16 ${offer.bgColor} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <offer.icon className={`h-8 w-8 ${offer.color}`} />
                </div>
                <CardTitle className="text-xl">{offer.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={offer.image || "/placeholder.svg"}
                    alt={offer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <p className="font-semibold text-gray-800">{offer.description}</p>
                  <p className="text-gray-600 whitespace-pre-line">{offer.subtitle}</p>
                  <p className="text-sm text-gray-700">{offer.cta}</p>
                </div>

                <a href={offer.link} target="_blank" rel="noopener noreferrer">
                  <Button
                    className={`w-full ${offer.id === "fashionably-hired" ? "bg-pink-600 hover:bg-pink-700" : offer.id === "dataflex-perks" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Sign Up
                  </Button>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-purple-800 mb-2">Why Partner with DataFlex Ghana?</h3>
            <p className="text-purple-700">
              We collaborate with trusted businesses to bring you exclusive offers and opportunities. All our partners
              are vetted for quality and reliability.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
