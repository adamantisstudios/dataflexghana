import Link from "next/link"
import { CheckCircle2, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WhatsAppFloat } from "@/components/ui/WhatsAppFloat"

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-[#F7FAF7] text-[#1F2937] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center rounded-2xl bg-white shadow-lg border border-[#0E8F3D]/10 p-8 sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#35B24A]/15">
            <CheckCircle2 className="h-10 w-10 text-[#0E8F3D]" />
          </div>
          <h1 className="text-2xl font-bold text-[#0E8F3D] mb-3">Request received</h1>
          <p className="text-slate-600 leading-relaxed mb-8">
            Your grocery request has been received! Our team will review it and contact you shortly via
            WhatsApp or phone.
          </p>
          <Button asChild className="w-full h-12 rounded-xl bg-[#0E8F3D] hover:bg-[#35B24A]">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
      <WhatsAppFloat />
    </main>
  )
}
