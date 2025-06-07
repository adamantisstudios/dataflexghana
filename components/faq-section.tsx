"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react"

const faqs = [
  {
    question: "Do you work on Sundays?",
    answer:
      "Yes, we provide services 7 days a week including Sundays. However, delivery times may be slightly longer on weekends.",
  },
  {
    question: "How long must I wait for data to be allocated?",
    answer:
      "Data delivery typically takes 10 minutes to 1 hour. In rare cases, it may take longer due to network issues. We'll keep you updated throughout the process.",
  },
  {
    question: "What type of sim cards are not supported?",
    answer:
      "We don't serve Agent SIM, Merchant SIM, EVD SIM, TurboNet SIMS, Broadband SIMS, Blacklisted SIM, Roaming SIM, Company/Group Sim, different network sims, or wrong/invalid numbers.",
  },
  {
    question: "Can I cancel my order after placing it?",
    answer:
      "No, orders cannot be cancelled once placed. There are also no refunds for mistakes or errors, and no corrections can be made after the first stage of the order.",
  },
  {
    question: "Do you offer discounts for bulk purchases?",
    answer:
      "Yes! We offer special bulk discounts for large orders. Contact us via WhatsApp for custom pricing on bulk data purchases.",
  },
  {
    question: "How do I register for AFA bundles?",
    answer:
      "Dial *1848# on your MTN line, select option 1 to register, and provide your personal details. There's a registration fee of ₵10-15.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept Mobile Money (MTN, Vodafone, AirtelTigo), bank transfers, and cash payments. All payments are processed securely.",
  },
  {
    question: "How fast is ECG prepaid top-up?",
    answer:
      "ECG top-ups are processed within 5-30 minutes after payment confirmation. You'll receive an SMS confirmation once completed.",
  },
  {
    question: "Do you provide software installation support?",
    answer:
      "Yes, we offer both home visit and remote installation services. Our technicians are certified and experienced with all major software.",
  },
  {
    question: "What's included in CV writing packages?",
    answer:
      "Local package (₵65) includes PDF/text versions, 3 free updates, and 1GB data. Foreign package (₵270) includes all local features plus international formatting, LinkedIn optimization, and placement assistance.",
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="h-8 w-8 text-green-600" />
            <h2 className="text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Find answers to common questions about our services</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardContent className="p-0">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {openIndex === index && (
                  <div className="px-6 pb-6 pt-0">
                    <div className="border-t pt-4">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact for More Questions */}
        <Card className="mt-12 bg-green-50 border-green-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-green-800 mb-2">Still Have Questions?</h3>
            <p className="text-green-700 mb-4">Can't find what you're looking for? Our support team is here to help!</p>
            <a
              href="https://wa.me/233242799990?text=I have a question about your services"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              Contact Support
            </a>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
