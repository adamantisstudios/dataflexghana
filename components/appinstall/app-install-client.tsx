"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowDownToLine,
  CheckCircle2,
  Download,
  ShieldAlert,
  Smartphone,
  Wallet,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { APP_RELEASE } from "@/lib/app-release"

const screens = [
  {
    src: "/images/app-screens/home.jpg",
    label: "Home",
    caption: "Wallet, menus & quick actions",
  },
  {
    src: "/images/app-screens/registration.jpg",
    label: "Join",
    caption: "Pay once & register as agent",
  },
  {
    src: "/images/app-screens/withdrawals.jpg",
    label: "Withdrawals",
    caption: "Cash out commissions via MoMo",
  },
  {
    src: "/images/app-screens/compliance.jpg",
    label: "Compliance",
    caption: "Forms with agent commissions",
  },
  {
    src: "/images/app-screens/domestic-workers.jpg",
    label: "Domestic Workers",
    caption: "Browse, hire & request",
  },
  {
    src: "/images/app-screens/jobs.jpg",
    label: "Jobs",
    caption: "Opportunities for your clients",
  },
  {
    src: "/images/app-screens/fashion.jpg",
    label: "Fashion Avenue",
    caption: "Catalogues & commissions",
  },
  {
    src: "/images/app-screens/channels.jpg",
    label: "Channels",
    caption: "Learning & paid channels",
  },
  {
    src: "/images/app-screens/settings.jpg",
    label: "Settings",
    caption: "Profile & account security",
  },
]

const installSteps = [
  {
    title: "Download the APK",
    body: `Tap Download Android APK. Save ${APP_RELEASE.fileName}. If Chrome warns the file may be harmful, choose Keep / Download anyway — expected outside Play Store.`,
  },
  {
    title: "Allow install from unknown apps",
    body: "Open the file. When Android asks, tap Settings and turn on Allow from this source for Chrome or Files. You can switch it off after install.",
  },
  {
    title: "Install & open",
    body: "Tap Install, then Open. Log in with your agent phone and password — same account as the website.",
  },
  {
    title: "Start earning on the go",
    body: "Sell data, open Referral Hub, request withdrawals, and manage services from your phone.",
  },
]

function PhoneFrame({
  src,
  label,
  caption,
  priority = false,
}: {
  src: string
  label: string
  caption: string
  priority?: boolean
}) {
  return (
    <figure className="w-[200px] shrink-0 snap-center sm:w-[220px]">
      <div className="rounded-[1.75rem] border border-emerald-900/15 bg-slate-950 p-2 shadow-xl shadow-emerald-950/10">
        <div className="overflow-hidden rounded-[1.35rem] bg-white">
          <Image
            src={src}
            alt={`DataFlex Agent app — ${label}`}
            width={440}
            height={900}
            className="h-auto w-full object-cover object-top"
            priority={priority}
          />
        </div>
      </div>
      <figcaption className="mt-3 text-center">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{caption}</p>
      </figcaption>
    </figure>
  )
}

export default function AppInstallClient() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4FBF6]">
      <header className="border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/app-logo.png"
              alt="DataFlex Ghana"
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
            <span className="font-semibold text-slate-900">DataFlex Ghana</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden border-emerald-200 sm:inline-flex">
              <Link href="/agent/login">Agent Login</Link>
            </Button>
            <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800">
              <a href={APP_RELEASE.downloadPath} download={APP_RELEASE.fileName}>
                <Download className="mr-1.5 h-4 w-4" />
                Download
              </a>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-emerald-900/10 bg-gradient-to-br from-slate-900 via-emerald-950 to-green-900 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-green-400 blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto grid gap-12 px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-6 md:py-20">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Android app · free sideload
            </p>
            <div className="flex items-center gap-4">
              <Image
                src="/images/app-logo.png"
                alt={`${APP_RELEASE.productName} logo`}
                width={72}
                height={72}
                className="rounded-2xl bg-white object-contain p-1.5 shadow-lg"
                priority
              />
              <div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  {APP_RELEASE.productName} for Android
                </h1>
                <p className="mt-1 text-emerald-100/90">
                  v{APP_RELEASE.versionName} · {APP_RELEASE.sizeLabel} · {APP_RELEASE.updatedLabel}
                </p>
              </div>
            </div>
            <p className="max-w-xl text-lg leading-relaxed text-emerald-50/95">
              Run your DataFlex agency from your phone — sell data, manage Referral Hub, cash out commissions,
              and access services on the go. Official APK hosted on dataflexghana.com (not on Play Store yet).
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-white px-8 text-base font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                <a href={APP_RELEASE.downloadPath} download={APP_RELEASE.fileName}>
                  <Download className="mr-2 h-5 w-5" />
                  Download Android APK
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/35 bg-transparent px-8 text-base text-white hover:bg-white/10"
              >
                <a href="#how-to-install">How to install</a>
              </Button>
            </div>
            <p className="text-sm text-emerald-200/85">
              File: <span className="font-medium text-white">{APP_RELEASE.fileName}</span> · hosted on
              dataflexghana.com · iOS coming later
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[280px]">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-emerald-400/20 blur-2xl" />
            <PhoneFrame
              src="/images/app-screens/home.jpg"
              label="Home"
              caption="Your agent dashboard"
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white py-14 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">See the app</h2>
            <p className="mt-2 text-slate-600">
              Real screens from DataFlex Agent — home, earnings, services, and more.
            </p>
          </div>
          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:justify-center md:overflow-visible md:pb-0">
            {screens.map((s, i) => (
              <PhoneFrame key={s.src} src={s.src} label={s.label} caption={s.caption} priority={i < 2} />
            ))}
          </div>
        </div>
      </section>

      <section id="how-to-install" className="scroll-mt-28 py-14 md:py-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
              <ShieldAlert className="h-4 w-4" />
              Required outside Play Store
            </div>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Install in four steps</h2>
            <p className="mt-2 text-slate-600">
              Android will ask you to allow Install unknown apps. That is normal for official APKs from our site.
            </p>
          </div>

          <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
            {installSteps.map((step, i) => (
              <li
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950">
            <p className="font-semibold">Unknown sources tip</p>
            <p className="mt-1 text-amber-900/90">
              Settings → Apps → Special access → Install unknown apps → enable for Chrome or Files. Only download
              from <strong>dataflexghana.com/appinstall</strong>. After install, you can turn the permission off
              again.
            </p>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-emerald-600 hover:bg-emerald-700">
              <a href={APP_RELEASE.downloadPath} download={APP_RELEASE.fileName}>
                <Download className="mr-2 h-5 w-5" />
                Download {APP_RELEASE.fileName}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/agent/registration-payment">Register as agent on the web</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3 md:px-6">
          {[
            {
              icon: Smartphone,
              title: "Built for DataFlex agents",
              body: "Order data, track deliveries, and open every major menu from your phone.",
            },
            {
              icon: Store,
              title: "Referral Hub on mobile",
              body: "Manage your storefront, listings, orders, and QR share link on the go.",
            },
            {
              icon: Wallet,
              title: "Wallet & withdrawals",
              body: "Check balances and request MoMo payouts without opening a laptop.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 md:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 to-green-800 px-6 py-10 text-center text-white md:px-12">
          <h2 className="text-2xl font-bold md:text-3xl">Ready to install?</h2>
          <p className="mx-auto mt-3 max-w-xl text-emerald-100">
            Download the official APK, allow unknown apps once, and run your agency from Android.
          </p>
          <ul className="mx-auto mt-5 flex max-w-lg flex-col gap-2 text-left text-sm text-emerald-50 sm:text-center">
            {[
              "Official file hosted on dataflexghana.com",
              "Allow Install unknown apps for Chrome/Files",
              "Same agent login as the website",
            ].map((line) => (
              <li key={line} className="flex items-start justify-center gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full bg-white text-emerald-900 hover:bg-emerald-50">
              <a href={APP_RELEASE.downloadPath} download={APP_RELEASE.fileName}>
                <Download className="mr-2 h-5 w-5" />
                Download Android APK
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/agent/login">
                <ArrowDownToLine className="mr-2 h-5 w-5" />
                Already registered? Log in
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p>
          © {new Date().getFullYear()} DataFlex Ghana ·{" "}
          <Link href="/" className="text-emerald-700 hover:underline">
            Home
          </Link>{" "}
          ·{" "}
          <Link href="/faq" className="text-emerald-700 hover:underline">
            FAQ
          </Link>
        </p>
      </footer>
    </div>
  )
}
