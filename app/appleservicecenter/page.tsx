"use client"

import { useState } from "react"
import HeroSlider from "@/components/appleservicecenter/hero-slider"
import ServiceRequestForm from "@/components/appleservicecenter/service-request-form"
import ProductsSection from "@/components/appleservicecenter/products-section"
import TestimonialsSection from "@/components/appleservicecenter/testimonials-section"
import ServiceSection from "@/components/appleservicecenter/service-section"
import Footer from "@/components/appleservicecenter/footer"

export default function AppleServiceCenterPage() {
  const [cartItems, setCartItems] = useState([])

  const handleAddToCart = (product) => {
    setCartItems([...cartItems, product])
  }

  return (
    <main className="bg-background">
      <HeroSlider />
      <ServiceSection />
      <ServiceRequestForm />
      <ProductsSection onAddToCart={handleAddToCart} cartItems={cartItems} setCartItems={setCartItems} />
      <TestimonialsSection />
      <Footer />
    </main>
  )
}
