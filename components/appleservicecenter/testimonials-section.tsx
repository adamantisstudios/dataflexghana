import { Card } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Ama Mensah",
    role: "iPhone User",
    content:
      "Excellent service! My iPhone screen was repaired within 2 hours. The technician was professional and the price was very fair. Highly recommended!",
    rating: 5,
    image: "/woman-portrait.jpg",
  },
  {
    name: "Kwame Boateng",
    role: "MacBook Owner",
    content:
      "My MacBook had water damage and I thought it was gone forever. Dataflex fixed it perfectly! Great customer service and warranty coverage.",
    rating: 5,
    image: "/thoughtful-man-portrait.png",
  },
  {
    name: "Abena Osei",
    role: "iPad User",
    content:
      "Quick diagnosis and fast repair. The remote consultation was super helpful before I brought my device in. Will definitely come back!",
    rating: 5,
    image: "/diverse-woman-smiling.jpg",
  },
  {
    name: "Kofi Ansah",
    role: "Apple Fan",
    content:
      "Best tech repair service in Accra! Professional, reliable, and they actually know what they're doing. My AirPods were fixed like new.",
    rating: 5,
    image: "/man-happy.png",
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 px-4 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Customers Say</h2>
          <p className="text-lg text-slate-600">Real reviews from satisfied Apple device owners</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 border border-slate-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={testimonial.image || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-sm text-slate-600">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-slate-700 text-sm leading-relaxed">"{testimonial.content}"</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
