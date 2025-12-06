"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MessageCircle, ShoppingCart, X } from "lucide-react"

const products = [
  {
    id: 1,
    name: "iPhone Screen Replacement",
    price: 250,
    description: "Professional screen replacement with premium glass",
    image: "/iphone-screen.jpg",
  },
  {
    id: 2,
    name: "Battery Replacement",
    price: 120,
    description: "Original capacity battery with warranty",
    image: "/phone-battery.png",
  },
  {
    id: 3,
    name: "Charging Port Repair",
    price: 180,
    description: "Fast charging port replacement and repair",
    image: "/charging-port-repair.jpg",
  },
  {
    id: 4,
    name: "Camera Module Replacement",
    price: 350,
    description: "High-quality camera module installation",
    image: "/camera-module-repair.jpg",
  },
  {
    id: 5,
    name: "Water Damage Restoration",
    price: 500,
    description: "Complete water damage assessment and repair",
    image: "/water-damage-repair.jpg",
  },
  {
    id: 6,
    name: "Home Button Repair",
    price: 150,
    description: "Touch ID home button replacement",
    image: "/home-button-repair.jpg",
  },
  {
    id: 7,
    name: "Speaker Repair",
    price: 140,
    description: "Speaker replacement and audio fix",
    image: "/phone-speaker.jpg",
  },
  {
    id: 8,
    name: "Motherboard Repair",
    price: 800,
    description: "Complex motherboard diagnostic and repair",
    image: "/phone-motherboard.jpg",
  },
]

export default function ProductsSection({ onAddToCart, cartItems, setCartItems }) {
  const [showCart, setShowCart] = useState(false)

  const handleRemoveFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const handleSendCart = () => {
    if (cartItems.length === 0) {
      alert("Please add items to your cart")
      return
    }

    let message = "*Dataflex Service Repair Center - Service Cart*\n\n"
    message += "📋 Selected Services:\n\n"

    let total = 0
    cartItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n   GH₵ ${item.price}\n\n`
      total += item.price
    })

    message += `\n💰 Total: GH₵ ${total}\n\n`
    message += `Please confirm these services.\nTimestamp: ${new Date().toLocaleString()}`

    const whatsappURL = `https://wa.me/233242799990?text=${encodeURIComponent(message)}`
    window.open(whatsappURL, "_blank")
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0)

  return (
    <section className="py-16 md:py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Services & Pricing</h2>
          <p className="text-lg text-slate-600">Professional Apple device repair services with warranty</p>
        </div>

        {/* Cart Button */}
        <div className="mb-8 flex justify-end">
          <Button
            onClick={() => setShowCart(!showCart)}
            className="relative bg-amber-500 hover:bg-amber-600 text-black font-semibold flex items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            My Cart
            {cartItems.length > 0 && (
              <span className="ml-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {cartItems.length}
              </span>
            )}
          </Button>
        </div>

        {/* Cart Sidebar */}
        {showCart && (
          <Card className="mb-8 p-6 border-2 border-amber-400 bg-amber-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Service Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-slate-600 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-slate-600 mb-4">Your cart is empty. Add services above.</p>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <div>
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-amber-600 font-bold">GH₵ {item.price}</p>
                      </div>
                      <button onClick={() => handleRemoveFromCart(index)} className="text-red-600 hover:text-red-800">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-amber-300 pt-4 mb-4">
                  <p className="text-lg font-bold text-slate-900">Total: GH₵ {cartTotal}</p>
                </div>

                <Button
                  onClick={handleSendCart}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Send Quote via WhatsApp
                </Button>
              </>
            )}
          </Card>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-lg transition-shadow border border-slate-200"
            >
              <img src={product.image || "/placeholder.svg"} alt={product.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-slate-600 mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-amber-600">GH₵ {product.price}</p>
                  <Button
                    onClick={() => onAddToCart(product)}
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
