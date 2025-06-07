import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { SoftwareStore } from "@/components/software-store"

export const metadata = {
  title: "Software Installation & Store - DataFlex Ghana",
  description:
    "Professional software installation services. Windows, macOS, MS Office, Antivirus, and more. Home and remote installation available.",
}

export default function SoftwarePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Software Installation & Store</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Professional software installation services for Windows, macOS, and more. Home visits and remote
                installation available.
              </p>
            </div>
            <SoftwareStore />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
