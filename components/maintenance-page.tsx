import type { MaintenanceMode } from "@/lib/maintenance-mode"
import MaintenanceCountdown from "@/components/maintenance-countdown"

interface MaintenancePageProps {
  maintenanceData: MaintenanceMode
}

function getFutureDateLabel(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    return null
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
  })
}

export default function MaintenancePage({ maintenanceData }: MaintenancePageProps) {
  const estimatedCompletion =
    !maintenanceData.countdownEnabled &&
    (getFutureDateLabel(maintenanceData.estimatedCompletion) ||
      getFutureDateLabel(maintenanceData.countdownEndTime))

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/40 bg-amber-300/10">
          <span className="text-4xl" aria-hidden="true">
            !
          </span>
        </div>

        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-amber-300">
          DataFlex Ghana Platform
        </p>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          {maintenanceData.title || "Site Under Maintenance"}
        </h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
          {maintenanceData.message ||
            "We are currently performing scheduled maintenance. Please check back later."}
        </p>

        <MaintenanceCountdown maintenanceData={maintenanceData} />

        {estimatedCompletion && (
          <div className="mt-8 rounded-lg border border-white/10 bg-white/10 px-5 py-4">
            <p className="text-sm uppercase tracking-wider text-slate-300">
              Estimated completion
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {estimatedCompletion}
            </p>
          </div>
        )}

        <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
            <h2 className="font-semibold text-white">Orders are safe</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Pending orders and transactions remain secured while service is paused.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
            <h2 className="font-semibold text-white">All users affected</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Public, agent, and customer access is unavailable until maintenance ends.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
            <h2 className="font-semibold text-white">Support available</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              For urgent help, contact support@dataflexghana.com.
            </p>
          </div>
        </div>

        <p className="mt-10 text-sm text-slate-400">
          This page will refresh automatically when maintenance is complete.
        </p>
      </section>
    </main>
  )
}
