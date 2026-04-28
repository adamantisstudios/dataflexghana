"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateWhatsAppLink } from "@/utils/whatsapp"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown } from "lucide-react"

interface SupportService {
  id: string
  name: string
  description: string
  category: string
  icon: string
}

const SERVICES: SupportService[] = [
  // Personal Documents
  { id: "birth-cert", name: "Birth Certificate Registration/Replacement", description: "Register or replace birth certificates", category: "personal", icon: "📄" },
  { id: "ghana-card", name: "Ghana Card Application Support", description: "Assistance with Ghana Card application process", category: "personal", icon: "🆔" },
  { id: "passport", name: "Passport Application Assistance", description: "Help with passport application and renewal", category: "personal", icon: "🛂" },
  { id: "drivers-license", name: "Driver's License Services", description: "Support for driver's license application and renewal", category: "personal", icon: "🚗" },
  { id: "marriage-cert", name: "Marriage Certificate Services", description: "Registration and replacement of marriage certificates", category: "personal", icon: "💍" },
  { id: "death-cert", name: "Death Certificate Services", description: "Death certificate registration and processing", category: "personal", icon: "📋" },

  // Business & Corporate
  { id: "trademark", name: "Trademark Registration", description: "Register your business trademark and brand", category: "business", icon: "™️" },
  { id: "patent", name: "Patent Application", description: "Patent filing and intellectual property protection", category: "business", icon: "🔬" },
  { id: "copyright", name: "Copyright Registration", description: "Protect your creative works with copyright", category: "business", icon: "©️" },
  { id: "business-license", name: "Business License/Permit", description: "Obtain necessary business licenses and permits", category: "business", icon: "📜" },
  { id: "employment-contract", name: "Employment Contract Drafting", description: "Professional employment agreements", category: "business", icon: "📝" },
  { id: "nda", name: "NDA & Confidentiality Agreements", description: "Non-disclosure and confidentiality documents", category: "business", icon: "🔒" },

  // Tax & Finance
  { id: "tin", name: "TIN (Tax ID) Application", description: "Tax Identification Number registration", category: "tax", icon: "🏛️" },
  { id: "tax-return", name: "Tax Return Preparation", description: "Professional tax return filing assistance", category: "tax", icon: "📊" },
  { id: "tax-clearance", name: "Tax Clearance Certificate", description: "Obtain tax clearance from GRA", category: "tax", icon: "✅" },
  { id: "accounting", name: "Accounting & Bookkeeping", description: "Professional accounting and financial records", category: "tax", icon: "💼" },

  // Property & Legal
  { id: "land-title", name: "Land Title Registration", description: "Register and secure land titles", category: "property", icon: "🏠" },
  { id: "property-deed", name: "Property Deed Preparation", description: "Legal property transfer documents", category: "property", icon: "📄" },
  { id: "rental-agreement", name: "Rental/Lease Agreements", description: "Professional rental and lease contracts", category: "property", icon: "🔑" },
  { id: "will-probate", name: "Will & Probate Services", description: "Estate planning and probate assistance", category: "property", icon: "⚖️" },

  // Banking & Financial
  { id: "bank-account", name: "Bank Account Opening", description: "Assistance with bank account setup", category: "banking", icon: "🏦" },
  { id: "credit-facility", name: "Credit Facility Support", description: "Loan and credit facility assistance", category: "banking", icon: "💰" },
  { id: "insurance", name: "Insurance Products", description: "Business and personal insurance solutions", category: "banking", icon: "🛡️" },
  { id: "investment", name: "Investment Opportunities", description: "Information on investment products", category: "banking", icon: "📈" },

  // Education & Employment
  { id: "school-placement", name: "School Placement/Enrollment", description: "Assistance with school admission and enrollment", category: "education", icon: "🎓" },
  { id: "scholarship", name: "Scholarship Application", description: "Help with scholarship applications and funding", category: "education", icon: "📚" },
  { id: "employment", name: "Job Placement Services", description: "Career development and job placement support", category: "education", icon: "💼" },
  { id: "training", name: "Professional Training Programs", description: "Skills development and professional training", category: "education", icon: "🎯" },
]

// Updated CATEGORIES without icons in the header
const CATEGORIES = [
  { id: "personal", label: "Personal Documents" },
  { id: "business", label: "Business & Corporate" },
  { id: "tax", label: "Tax & Finance" },
  { id: "property", label: "Property & Legal" },
  { id: "banking", label: "Banking & Financial" },
  { id: "education", label: "Education & Employment" },
]

interface SelectedServiceState {
  service: SupportService
  customerName: string
  customerEmail: string
}

export function SupportServices() {
  const [activeCategory, setActiveCategory] = useState("personal")
  const [selectedService, setSelectedService] = useState<SelectedServiceState | null>(null)
  const [expandedService, setExpandedService] = useState<string | null>(null)

  const categoryServices = SERVICES.filter((s) => s.category === activeCategory)

  const handleSelectService = (service: SupportService) => {
    setSelectedService({
      service,
      customerName: "",
      customerEmail: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedService) return

    const { service, customerName, customerEmail } = selectedService

    const message = `📞 SERVICE INQUIRY - SUPPORT SERVICES

🔍 SERVICE: ${service.name}
📝 DESCRIPTION: ${service.description}

👤 CUSTOMER DETAILS:
Name: ${customerName}
Email: ${customerEmail}

📞 CONTACT US:
WhatsApp: +233 242 799990
Business Hours: 9:00 AM - 9:30 PM

Please provide more details about this service and how I can help.`

    const whatsappUrl = generateWhatsAppLink(message)
    window.open(whatsappUrl, "_blank")
    setSelectedService(null)
  }

  return (
    <section id="support-services" className="py-12 md:py-16 bg-gradient-to-br from-purple-50 to-purple-100">
      <div className="container mx-auto px-4">
        {/* Header - Icons removed, full text visible with proper padding */}
        <div className="text-center mb-8 md:mb-12 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 px-2 leading-tight">
            General Support Services
          </h2>
          <p className="text-lg md:text-xl text-slate-700 px-2 max-w-4xl mx-auto leading-relaxed">
            We can support anyone to secure these services faster and with convenience. Contact our admin team for more information and personalized assistance.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {!selectedService ? (
            <>
              {/* Category Tabs - Text-only tabs with full visibility */}
              <Tabs defaultValue="personal" value={activeCategory} onValueChange={setActiveCategory} className="mb-6 md:mb-8">
                <TabsList className="flex overflow-x-auto pb-2 w-full bg-white p-2 rounded-lg shadow gap-2 justify-start">
                  {CATEGORIES.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="min-w-fit px-4 py-2.5
                                data-[state=active]:bg-slate-900 data-[state=active]:text-white
                                hover:bg-slate-100
                                text-sm font-medium rounded-md
                                transition-all duration-200 whitespace-normal"
                    >
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {CATEGORIES.map((cat) => (
                  <TabsContent key={cat.id} value={cat.id}>
                    {/* Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryServices.map((service) => (
                        <Card
                          key={service.id}
                          className="hover:shadow-lg transition-all duration-300 border-0 bg-white cursor-pointer"
                          onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                        >
                          <CardContent className="p-4 md:p-6">
                            <div className="flex items-start gap-3 mb-3">
                              <span className="text-2xl md:text-3xl flex-shrink-0">{service.icon}</span>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 text-sm md:text-base break-words">
                                  {service.name}
                                </h3>
                                <p className="text-xs md:text-sm text-slate-600 mt-1 break-words">
                                  {service.description}
                                </p>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedService(expandedService === service.id ? null : service.id); }}
                                className="text-slate-400 hover:text-slate-600 transition flex-shrink-0"
                              >
                                <ChevronDown
                                  className={`w-4 h-4 md:w-5 md:h-5 transition-transform ${
                                    expandedService === service.id ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Expanded Info */}
                            {expandedService === service.id && (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                <Button
                                  onClick={(e) => { e.stopPropagation(); handleSelectService(service); }}
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-xs md:text-sm h-9 md:h-10"
                                >
                                  Inquire via WhatsApp
                                </Button>
                              </div>
                            )}

                            {/* Quick Inquiry */}
                            {expandedService !== service.id && (
                              <Button
                                onClick={(e) => { e.stopPropagation(); handleSelectService(service); }}
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs md:text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 mt-2"
                              >
                                Inquire Now →
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          ) : (
            /* Service Details Form */
            <Card className="max-w-2xl mx-auto border-0 shadow-xl">
              <CardContent className="p-6 md:p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 break-words">{selectedService.service.name}</h3>
                  <p className="text-slate-600 break-words">{selectedService.service.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Your Name</label>
                    <Input
                      required
                      value={selectedService.customerName}
                      onChange={(e) =>
                        setSelectedService({
                          ...selectedService,
                          customerName: e.target.value,
                        })
                      }
                      placeholder="Enter your name"
                      className="bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                    <Input
                      required
                      type="email"
                      value={selectedService.customerEmail}
                      onChange={(e) =>
                        setSelectedService({
                          ...selectedService,
                          customerEmail: e.target.value,
                        })
                      }
                      placeholder="your@email.com"
                      className="bg-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedService(null)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold"
                    >
                      Contact Admin via WhatsApp
                    </Button>
                  </div>
                </form>

                <p className="text-xs text-slate-600 text-center mt-4">
                  Our admin team will respond with service details and pricing information
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  )
}