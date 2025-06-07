import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ECGTopUpForm } from "@/components/ecg-topup-form"

export const metadata = {
  title: "ECG Prepaid Top-Up - DataFlex Ghana",
  description: "Top up your ECG prepaid meter instantly. Support for NURI, Holley, CLOU meters. ₵8 service charge.",
}

export default function ECGTopUpPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">ECG Prepaid Top-Up</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Top up your ECG prepaid meter instantly. All meter types supported with just ₵8 service charge.
              </p>
            </div>
            <ECGTopUpForm />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
