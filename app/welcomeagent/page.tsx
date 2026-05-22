import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Welcome to DataFlex Ghana | Agent Guide",
  description:
    "Start earning with DataFlex Ghana: agent data bundles, digital storefront, wallet, wholesale, and multi-service commissions.",
}

const SUPPORT_WHATSAPP = "https://wa.me/233246827049?text=Hello%20DataFlex%20support"

export default function WelcomeAgentPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <header className="mb-10 border-b border-slate-200 pb-8">
          <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-2">
            DataFlex Ghana · Agent Welcome
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
            Turn your smartphone into a real business
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            DataFlex gives you a digital storefront, wholesale agent pricing on data, and dozens of services you can
            promote to customers in your community — all from one dashboard in your browser.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Your digital storefront</h2>
          <p className="leading-relaxed mb-4">
            Every approved agent can run a branded storefront where customers order data and pay online. Share your
            link on WhatsApp, Facebook, or in person — orders and commissions are tracked for you automatically.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              Set your custom store slug in the agent dashboard under{" "}
              <strong>Referral Hub / Storefront</strong>.
            </li>
            <li>
              Your public store URL format:{" "}
              <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded">
                https://referralpowerhouse.vercel.app/store/your-slug
              </code>
            </li>
            <li>Replace <strong>your-slug</strong> with the slug you choose (e.g. your business name).</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Get started</h2>
          <ul className="space-y-2">
            <li>
              <Link href="https://dataflexghana.com/agent/register" className="text-emerald-700 font-medium hover:underline">
                Register or join as an agent
              </Link>
              {" · "}
              <Link href="https://dataflexghana.com" className="text-emerald-700 hover:underline">
                dataflexghana.com
              </Link>
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/data-order" className="text-emerald-700 font-medium hover:underline">
                Order data bundles (agent dashboard)
              </Link>
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/wallet" className="text-emerald-700 font-medium hover:underline">
                Top up your wallet
              </Link>
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/data-orders" className="text-emerald-700 font-medium hover:underline">
                Manage data orders
              </Link>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Available data bundles</h2>
          <p className="mb-4 text-slate-600">
            Agent-only prices are lower than retail. The full live price list is always in your dashboard after login.
            Example MTN agent rate:
          </p>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-4 py-3 font-semibold">Network / bundle</th>
                  <th className="px-4 py-3 font-semibold">Retail (approx.)</th>
                  <th className="px-4 py-3 font-semibold">Agent price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3">MTN 1GB</td>
                  <td className="px-4 py-3 text-slate-500 line-through">₵6.50</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">₵3.70</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 col-span-3 text-slate-600" colSpan={3}>
                    Additional sizes (2GB, 3GB, 5GB, 10GB, etc.) for MTN, Telecel, and AirtelTigo — see{" "}
                    <Link href="https://dataflexghana.com/agent/data-order" className="text-emerald-700 hover:underline">
                      Order Data Bundles
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Delivery is typically within 10 minutes to 24 hours. You do not need to message support for each order —
            the system processes wallet and manual payments automatically.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Services you can promote</h2>
          <p className="mb-4 leading-relaxed">
            Many agents earn <strong>GHS 200–800 per day</strong> by promoting more than data. Share links from your
            dashboard and earn commissions when customers complete orders.
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 list-disc pl-5 text-slate-700">
            <li>Cheap data bundles</li>
            <li>Business registration & compliance</li>
            <li>Wholesale & dropshipping</li>
            <li>Job recruitment</li>
            <li>School forms & admission</li>
            <li>GES approved books</li>
            <li>ECG & digital payments</li>
            <li>Gift cards & vouchers</li>
            <li>Apple device repairs</li>
            <li>Domestic worker recruitment</li>
            <li>Fashion & beauty services</li>
            <li>Candidate search portal</li>
            <li>Salon & beauty bookings</li>
            <li>Product promotion & commissions</li>
            <li>Free marketing training</li>
          </ul>
          <p className="mt-4">
            <Link href="https://dataflexghana.com/no-registration" className="text-emerald-700 font-medium hover:underline">
              No-registration orders
            </Link>{" "}
            — let customers buy without signing up as agents.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Wallet, savings & wholesale</h2>
          <ul className="space-y-2">
            <li>
              <Link href="https://dataflexghana.com/agent/wallet" className="text-emerald-700 font-medium hover:underline">
                Wallet top-up
              </Link>{" "}
              — fund orders quickly without repeating MoMo steps each time.
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/savings" className="text-emerald-700 font-medium hover:underline">
                Savings
              </Link>{" "}
              — grow balances toward goals inside the platform.
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/wholesale" className="text-emerald-700 font-medium hover:underline">
                Wholesale
              </Link>{" "}
              — bulk pricing for resellers.
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/withdraw" className="text-emerald-700 font-medium hover:underline">
                Withdraw earnings
              </Link>{" "}
              — move confirmed commission to Mobile Money.
            </li>
          </ul>
        </section>

        <section className="mb-10 rounded-xl bg-amber-50 border border-amber-200 p-5">
          <h2 className="text-xl font-semibold text-amber-950 mb-3">Manual data orders</h2>
          <p className="text-amber-900 text-sm leading-relaxed mb-3">
            When you choose <strong>Manual Payment</strong> on the data order page:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-amber-950">
            <li>Select bundle and recipient number; note the amount and unique reference shown.</li>
            <li>
              Pay via MoMo to <strong>0557943392</strong> — name: <strong>Adamantis Solutions (Francis Ani-Johnson .K)</strong>.
            </li>
            <li>Use the exact payment reference from the order screen.</li>
            <li>Tap <strong>Completed Payment</strong> after sending — do not skip the reference.</li>
          </ol>
          <p className="mt-3 text-sm text-amber-900">
            <strong>You do not need to alert us</strong> for each manual or wallet order; processing is automatic.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">Troubleshooting</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700">
            <li>
              <strong>Order stuck?</strong> Confirm payment reference matches, wallet has enough balance, and the
              recipient number is correct (10 digits, correct network).
            </li>
            <li>
              <strong>Payment not recognized?</strong> Wait a few minutes, refresh{" "}
              <Link href="https://dataflexghana.com/agent/data-orders" className="text-emerald-700 hover:underline">
                Manage orders
              </Link>
              , then contact support with your reference.
            </li>
            <li>
              <strong>Storefront not loading?</strong> Check your slug is saved in Referral Hub and share the full
              storefront URL including your slug.
            </li>
            <li>
              <strong>Withdrawal pending?</strong> Ensure MoMo number on your profile matches your registered wallet.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 mb-3">How to get help</h2>
          <ul className="space-y-2">
            <li>
              <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-medium hover:underline">
                WhatsApp support
              </a>
            </li>
            <li>
              Join the official DataFlex WhatsApp channel after registration for updates, price changes, and promos
              (link shared in your dashboard when available).
            </li>
            <li>
              <Link href="https://dataflexghana.com/terms" className="text-emerald-700 font-medium hover:underline">
                Terms & conditions
              </Link>
            </li>
          </ul>
        </section>

        <footer className="pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
          <p>Welcome to the DataFlex agent community. Work smart, serve your customers well, and grow with us.</p>
          <p className="mt-2">
            <Link href="https://dataflexghana.com/agent/register" className="text-emerald-700 font-semibold hover:underline">
              Start earning today →
            </Link>
          </p>
        </footer>
      </article>
    </main>
  )
}
