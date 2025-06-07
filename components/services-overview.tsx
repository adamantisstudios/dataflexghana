import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Smartphone, Zap, Download, FileText, Users, Wifi } from "lucide-react"

const services = [
  {
    icon: Smartphone,
    title: "Data Bundles",
    description: "Ghana's cheapest data from MTN, Telecel & AirtelTigo",
    href: "/#networks",
    color: "text-green-600",
  },
  {
    icon: Zap,
    title: "ECG Prepaid Top-Up",
    description: "Instant meter top-up for all meter types. ₵8 service charge",
    href: "/ecg-topup",
    color: "text-blue-600",
  },
  {
    icon: Download,
    title: "Software Installation",
    description: "Windows, macOS, Office, Antivirus. Home & remote service",
    href: "/software",
    color: "text-purple-600",
  },
  {
    icon: FileText,
    title: "CV Writing",
    description: "Professional CVs for local & international opportunities",
    href: "/cv-writing",
    color: "text-pink-600",
  },
  {
    icon: Users,
    title: "Registration",
    description: "Join as AFA member or Agent for exclusive benefits",
    href: "/register",
    color: "text-teal-600",
  },
  {
    icon: Wifi,
    title: "MiFi & Routers",
    description: "Quality devices for your internet connectivity needs",
    href: "/#devices",
    color: "text-orange-600",
  },
]

export function ServicesOverview() {
  return (
    <section id="services" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Digital Services</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From data bundles to professional services, we've got all your digital needs covered
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div
                  className={`mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <service.icon className={`h-8 w-8 ${service.color}`} />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription className="text-gray-600">{service.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Link href={service.href}>
                  <Button
                    variant="outline"
                    className="group-hover:bg-green-600 group-hover:text-white transition-colors"
                  >
                    Learn More
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
