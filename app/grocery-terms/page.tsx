import type { Metadata } from "next"
import Link from "next/link"
import { WhatsAppFloatDialog } from "@/components/grocery/WhatsAppFloatDialog"

export const metadata: Metadata = {
  title: "Grocery Service Terms & Conditions | Dataflex Ghana",
  description:
    "Terms for DataFlex Ghana concierge grocery shopping: commitment fee, refunds, delivery, privacy, and liability.",
}

const linkClass = "text-[#0E8F3D] font-medium hover:underline break-all"

export default function GroceryTermsPage() {
  return (
    <main className="min-h-screen bg-[#F7FAF7] text-[#1F2937] overflow-x-hidden">
      <header className="bg-[#0E8F3D] text-white py-8">
        <div className="max-w-3xl mx-auto px-4">
          <Link href="/foodandGroceries" className="text-sm text-white/80 hover:text-white">
            ← Back to grocery request
          </Link>
          <h1
            className="mt-4 text-2xl sm:text-3xl font-bold"
            style={{ fontFamily: "Poppins, Inter, sans-serif" }}
          >
            Grocery Shopping — Terms & Conditions
          </h1>
          <p className="mt-2 text-white/90 text-sm">Last updated: {new Date().toLocaleDateString("en-GB")}</p>
        </div>
      </header>

      <article
        className="max-w-3xl mx-auto px-4 py-10 sm:py-14 prose prose-slate max-w-none prose-headings:text-[#0E8F3D] prose-a:text-[#0E8F3D]"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Service description</h2>
          <p className="text-slate-700 leading-relaxed">
            DataFlex Ghana provides a <strong>concierge grocery shopping service</strong>. We help customers
            source items from markets and suppliers based on a submitted shopping list. We are{" "}
            <strong>not an e-commerce store</strong> and do not maintain a fixed online product catalogue with
            instant checkout prices. Final costs depend on market availability, season, and agreed substitutions.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Phone number & fair use</h2>
          <p className="text-slate-700 leading-relaxed">
            Your phone number serves as your unique identifier. Sharing your phone number with others to bypass
            the commitment fee is strictly prohibited. We monitor for abuse and will permanently block any numbers
            found to be shared. Each household is entitled to one commitment fee waiver after their first
            successful delivery.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Commitment fee & payments</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              A <strong>commitment fee of GHS 20</strong> is required before you submit your shopping list via
              Paystack. This secures processing of your request.
            </li>
            <li>
              The commitment fee is <strong>non-refundable once shopping or sourcing work has begun</strong> on
              your list.
            </li>
            <li>
              If we cannot fulfil your request at all (e.g. service unavailable in your area or we decline the
              order before work starts), you may receive a <strong>full refund of the commitment fee</strong> at
              our discretion.
            </li>
            <li>
              Grocery costs, delivery charges, and any balance due will be communicated clearly via WhatsApp or
              phone <strong>before</strong> final purchase and delivery.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Refund policy</h2>
          <p className="text-slate-700 leading-relaxed">
            Refunds apply only as stated above for the commitment fee. Payments for actual groceries and delivery
            are handled case-by-case if items are unavailable or quality issues are reported promptly. We do not
            guarantee refunds for change of mind after purchases are made on your behalf.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Delivery process & timelines</h2>
          <p className="text-slate-700 leading-relaxed">
            Delivery times are arranged with you after pricing is confirmed. Timelines depend on list size,
            location, traffic, and vendor availability. We are not liable for delays caused by factors outside
            our reasonable control (weather, market closures, third-party transport, etc.).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">6. Data protection & privacy</h2>
          <p className="text-slate-700 leading-relaxed">
            We collect name, phone, WhatsApp, email, address, shopping list, attachments, and payment references
            solely to process your request and contact you. Data is stored securely and not sold to third parties.
            Payment processing is handled by Paystack under their own privacy terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">7. Food safety & hygiene</h2>
          <p className="text-slate-700 leading-relaxed">
            We instruct shoppers to select fresh, hygienic products and handle perishables responsibly. Customers
            should refrigerate or store items promptly upon receipt. Report quality concerns within a reasonable
            time so we can review with our team.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">8. Liability & disclaimers</h2>
          <p className="text-slate-700 leading-relaxed">
            To the fullest extent permitted by law, DataFlex Ghana is not liable for indirect losses, market price
            fluctuations, or minor variations in product size/weight. Our liability for any proven service failure
            is limited to the fees paid for that specific request. By submitting a list you confirm information
            provided is accurate.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">9. Contact</h2>
          <p className="text-slate-700 leading-relaxed">
            WhatsApp:{" "}
            <a href="https://wa.me/233242799990" className={linkClass} target="_blank" rel="noopener noreferrer">
              +233 24 279 9990
            </a>
            <br />
            Email: <a href="mailto:sales@dataflexghana.com" className={linkClass}>sales@dataflexghana.com</a>
            <br />
            Request form: <Link href="/foodandGroceries" className={linkClass}>foodandGroceries</Link>
          </p>
        </section>
      </article>

      <WhatsAppFloatDialog />
    </main>
  )
}
