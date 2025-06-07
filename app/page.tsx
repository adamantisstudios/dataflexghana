import { Header } from "@/components/header"
import { HeroSlider } from "@/components/hero-slider"
import { ServicesOverview } from "@/components/services-overview"
import { AFAContextSection } from "@/components/afa-context-section"
import { PromotionalAds } from "@/components/promotional-ads"
import { NetworksSection } from "@/components/networks-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { DevicesSection } from "@/components/devices-section"
import { FAQSection } from "@/components/faq-section"
import { WhatsAppChannelSection } from "@/components/whatsapp-channel-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSlider />
      <ServicesOverview />
      <AFAContextSection />
      <PromotionalAds />
      <NetworksSection />
      <TestimonialsSection />
      <DevicesSection />
      <FAQSection />
      <WhatsAppChannelSection />
      <Footer />
    </main>
  )
}
