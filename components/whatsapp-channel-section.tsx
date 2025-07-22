import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

export function WhatsAppChannelSection() {
  return (
    <section className="py-16 bg-green-600 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">JOIN WHATSAPP CHANNEL</h2>
          <p className="text-xl max-w-2xl mx-auto">
            Get amazing discounted rates and stay updated with our latest offers
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="relative h-80 rounded-lg overflow-hidden shadow-xl">
              <Image src="/assets/whatsapp-channel.jpg" alt="WhatsApp Channel" fill className="object-cover" />
            </div>

            <div className="text-center lg:text-left">
              <div className="mb-6">
                <MessageCircle className="h-16 w-16 mx-auto lg:mx-0 mb-4" />
                <h3 className="text-2xl font-bold mb-4">Stay Connected with DataFlex Ghana</h3>
                <p className="text-lg mb-6">
                  Join our WhatsApp channel for exclusive deals, updates, and faster support! Be the first to know about
                  new services and special promotions.
                </p>
              </div>

              <a href="http://bit.ly/4m03srM" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-3">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Join Channel
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
