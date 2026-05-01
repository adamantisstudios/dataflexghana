"use client"
import { useState } from "react"
import { appleServiceCenterSchema } from "./metadata"

export default function ClientAppleServiceCenterPage() {
  const [cartItems, setCartItems] = useState([])

  const handleAddToCart = (product) => {
    setCartItems([...cartItems, product])
  }

  return (
    <>
      <Script
        id="apple-service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(appleServiceCenterSchema),
        }}
        strategy="afterInteractive"
      />

      <main className="bg-background">
        <HeroSlider />
        <ServiceSection />
        <ServiceRequestForm />
        <ProductsSection onAddToCart={handleAddToCart} cartItems={cartItems} setCartItems={setCartItems} />
        <TestimonialsSection />
        <Footer />
      </main>
    </>
  )
}
