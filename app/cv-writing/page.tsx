import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CVWritingServices } from "@/components/cv-writing-services"

export const metadata = {
  title: "Professional CV Writing Services - DataFlex Ghana",
  description:
    "Professional CV writing services. Local CV package (₵65) and Foreign CV package (₵270) with international placement assistance.",
}

export default function CVWritingPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Professional CV Writing Services</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Get professionally written CVs for local and international opportunities. Includes free updates and data
                bonuses.
              </p>
            </div>
            <CVWritingServices />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
