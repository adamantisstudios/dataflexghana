import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Akosua Boateng",
    image: "/user1-placeholder.jpg?height=80&width=80",
    rating: 5,
    comment: "Speed and honesty! I got my data in minutes. Highly recommended.",
  },
  {
    name: "Kwabena Mensah",
    image: "/user2-placeholder.jpg?height=80&width=80",
    rating: 4,
    comment: "Reliable every single time. No disappointment so far!",
  },
  {
    name: "Sarah Nartey",
    image: "/user3-placeholder.jpg?height=80&width=80",
    rating: 5,
    comment: "They give out amazing promos. I'm now a loyal customer!",
  },
  {
    name: "Yaw Owusu",
    image: "/user4-placeholder.jpg?height=80&width=80",
    rating: 4,
    comment: "Great support and communication. Trustworthy business.",
  },
  {
    name: "Nana Ama",
    image: "/user5-placeholder.jpg?height=80&width=80",
    rating: 5,
    comment: "Super reliable and honest. I even got a birthday gift!",
  },
  {
    name: "Josephine Adu",
    image: "/user6-placeholder.jpg?height=80&width=80",
    rating: 5,
    comment: "Fast delivery and transparent pricing. They really care.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.comment}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
