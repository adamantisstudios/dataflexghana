import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Welcome to DataFlex Ghana | Agent Guide",
  description:
    "Start earning with DataFlex Ghana: agent data bundles, digital storefront, wallet, wholesale, and multi-service commissions.",
}

const SUPPORT_WHATSAPP = "https://wa.me/233246827049?text=Hello%20DataFlex%20support"

const linkClass =
  "text-emerald-700 font-medium hover:underline break-all inline-block max-w-full"

export default function WelcomeAgentPage() {
  return (
    <main className="min-h-screen bg-white text-slate-800 overflow-x-hidden">
      <article className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 min-w-0">
        <header className="mb-10 border-b border-slate-200 pb-8 min-w-0">
          <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-2">
            DataFlex Ghana · Agent Welcome
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight break-words">
            Turn your smartphone into a real business
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed break-words">
            DataFlex gives you a digital storefront, wholesale agent pricing on data, and dozens of services you can
            promote to customers in your community — all from one dashboard in your browser.
          </p>
        </header>

        <section className="mb-10 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">Your digital storefront</h2>
          <p className="leading-relaxed mb-4 break-words">
            Every approved agent can run a branded storefront where customers order data and pay online. Share your
            link on WhatsApp, Facebook, or in person — orders and commissions are tracked for you automatically.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 break-words">
            <li>
              Set your custom store slug in the agent dashboard under{" "}
              <strong>Referral Hub / Storefront</strong>.
            </li>
            <li>
              Your public store URL format:
              <code className="mt-1 block text-xs sm:text-sm bg-slate-100 px-2 py-2 rounded break-all overflow-x-auto">
                https://referralpowerhouse.vercel.app/store/your-slug
              </code>
            </li>
            <li>Replace <strong>your-slug</strong> with the slug you choose (e.g. your business name).</li>
          </ul>
        </section>

        <section className="mb-10 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">Get started</h2>
          <ul className="space-y-3 break-words">
            <li className="min-w-0">
              <Link href="https://dataflexghana.com/agent/register" className={linkClass}>
                Register or join as an agent
              </Link>
              <span className="text-slate-500"> · </span>
              <Link href="https://dataflexghana.com" className={linkClass}>
                dataflexghana.com
              </Link>
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/data-order" className={linkClass}>
                Order data bundles (agent dashboard)
              </Link>
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/wallet" className={linkClass}>
                Top up your wallet
              </Link>
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/data-orders" className={linkClass}>
                Manage data orders
              </Link>
            </li>
          </ul>
        </section>

        <section className="mb-10 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">Available data bundles</h2>
          <p className="mb-4 text-slate-600 break-words">
            Agent-only prices are lower than retail. The full live price list is always in your dashboard after login.
            Example MTN agent rate:
          </p>
          <div className="w-full overflow-x-auto -mx-0 rounded-lg border border-slate-200">
            <table className="w-full min-w-[280px] text-sm text-left">
              <thead className="bg-slate-50 text-slate-900">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Network / bundle</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Retail (approx.)</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold whitespace-nowrap">Agent price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-3 sm:px-4 py-3">MTN 1GB</td>
                  <td className="px-3 sm:px-4 py-3 text-slate-500 line-through">₵6.50</td>
                  <td className="px-3 sm:px-4 py-3 font-semibold text-emerald-700">₵3.70</td>
                </tr>
                <tr>
                  <td className="px-3 sm:px-4 py-3 text-slate-600 break-words" colSpan={3}>
                    Additional sizes (2GB, 3GB, 5GB, 10GB, etc.) for MTN, Telecel, and AirtelTigo — see{" "}
                    <Link href="https://dataflexghana.com/agent/data-order" className={linkClass}>
                      Order Data Bundles
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-600 break-words">
            Delivery is typically within 10 minutes to 24 hours. You do not need to message support for each order —
            the system processes wallet and manual payments automatically.
          </p>
        </section>

        <section className="mb-10 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">Services you can promote</h2>
          <p className="mb-4 leading-relaxed break-words">
            Many agents earn <strong>GHS 200–800 per day</strong> by promoting more than data. Share links from your
            dashboard and earn commissions when customers complete orders.
          </p>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 list-disc pl-5 text-slate-700 break-words">
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
          <p className="mt-4 break-words">
            <Link href="https://dataflexghana.com/no-registration" className={linkClass}>
              No-registration orders
            </Link>{" "}
            — let customers buy without signing up as agents.
          </p>
        </section>

        <section className="mb-10 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">Wallet, savings & wholesale</h2>
          <ul className="space-y-3 break-words">
            <li>
              <Link href="https://dataflexghana.com/agent/wallet" className={linkClass}>
                Wallet top-up
              </Link>{" "}
              — fund orders quickly without repeating MoMo steps each time.
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/savings" className={linkClass}>
                Savings
              </Link>{" "}
              — grow balances toward goals inside the platform.
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/wholesale" className={linkClass}>
                Wholesale
              </Link>{" "}
              — bulk pricing for resellers.
            </li>
            <li>
              <Link href="https://dataflexghana.com/agent/withdraw" className={linkClass}>
                Withdraw earnings
              </Link>{" "}
              — move confirmed commission to Mobile Money.
            </li>
          </ul>
        </section>

        <section className="mb-10 rounded-xl bg-amber-50 border border-amber-200 p-4 sm:p-5 min-w-0 break-words">
          <h2 className="text-lg sm:text-xl font-semibold text-amber-950 mb-3">Manual data orders</h2>
          <p className="text-amber-900 text-sm leading-relaxed mb-3">
            When you choose <strong>Manual Payment</strong> on the data order page:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-amber-950">
            <li>Select bundle and recipient number; note the amount and unique reference shown.</li>
            <li>
Pay via MoMo to <strong>0557943392</strong> — name: <strong>Adamantis Solutions (Francis Ani-Johnson .K)</strong>.
Alternative Payment Name: <strong>Francis Ani-Johnson</strong>.
            </li>
            <li>Use the exact payment reference from the order screen.</li>
            <li>Tap <strong>Completed Payment</strong> after sending — do not skip the reference.</li>
          </ol>
          <p className="mt-3 text-sm text-amber-900">
            <strong>You do not need to alert us</strong> for each manual or wallet order; processing is automatic.
          </p>
        </section>

        <section className="mb-10 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">Troubleshooting</h2>
          <ul className="list-disc pl-5 space-y-2 text-slate-700 break-words">
            <li>
              <strong>Order stuck?</strong> Confirm payment reference matches, wallet has enough balance, and the
              recipient number is correct (10 digits, correct network).
            </li>
            <li>
              <strong>Payment not recognized?</strong> Wait a few minutes, refresh{" "}
              <Link href="https://dataflexghana.com/agent/data-orders" className={linkClass}>
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

        <section className="mb-10 min-w-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-3">How to get help</h2>
          <ul className="space-y-3 break-words">
            <li>
              <a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer" className={linkClass}>
                WhatsApp support
              </a>
            </li>
            <li>
              Join the official DataFlex WhatsApp channel after registration for updates, price changes, and promos
              (link shared in your dashboard when available).
            </li>
            <li>
              <Link href="https://dataflexghana.com/terms" className={linkClass}>
                Terms & conditions
              </Link>
            </li>
          </ul>
        </section>

        <footer className="pt-6 border-t border-slate-200 text-center text-sm text-slate-500 min-w-0 break-words">
          <p>Welcome to the DataFlex agent community. Work smart, serve your customers well, and grow with us.</p>
          <p className="mt-2">
            <Link href="https://dataflexghana.com/agent/register" className={linkClass}>
              Start earning today →
            </Link>
          </p>
        </footer>
      </article>
    </main>
  )
}
