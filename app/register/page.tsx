import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { RegistrationForms } from "@/components/registration-forms"

export const metadata = {
  title: "Register - AFA & Agent Registration - DataFlex Ghana",
  description: "Register as AFA member (₵15) for full access or Agent (₵35) for reseller discounts on data bundles.",
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <section className="py-16 bg-gradient-to-br from-green-50 to-teal-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Registration</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join DataFlex Ghana as an AFA member or Agent to unlock exclusive benefits and discounts.
              </p>
            </div>
            <RegistrationForms />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
