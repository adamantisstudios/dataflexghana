import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { TermsAndConditions } from "@/components/terms-and-conditions"

export const metadata = {
  title: "Terms and Conditions - DataFlex Ghana",
  description:
    "Read our terms and conditions before accessing DataFlex Ghana services. Important guidelines for data bundles, ECG top-up, and other services.",
}

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <TermsAndConditions />
      </div>
      <Footer />
    </main>
  )
}
