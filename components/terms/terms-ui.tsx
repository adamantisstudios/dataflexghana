import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function TermsBadge({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon
  label: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 to-blue-100 px-4 py-2 dark:from-emerald-900/30 dark:to-blue-900/30 mb-4",
        className
      )}
    >
      <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{label}</span>
    </div>
  )
}

export function TermsSection({
  id,
  badge,
  title,
  description,
  children,
}: {
  id: string
  badge: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-8">
        {badge}
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function AlertBanner({
  variant = "amber",
  title,
  children,
}: {
  variant?: "red" | "amber" | "emerald" | "blue"
  title: string
  children: React.ReactNode
}) {
  const styles = {
    red: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400",
  }
  const titleStyles = {
    red: "text-red-900 dark:text-red-300",
    amber: "text-amber-900 dark:text-amber-300",
    emerald: "text-emerald-900 dark:text-emerald-300",
    blue: "text-blue-900 dark:text-blue-300",
  }
  return (
    <div className={cn("rounded-lg border p-6", styles[variant])}>
      <h3 className={cn("font-bold text-lg mb-2", titleStyles[variant])}>{title}</h3>
      <div className="text-sm sm:text-base">{children}</div>
    </div>
  )
}

export function BulletList({
  items,
  icon: Icon,
  iconClass = "text-emerald-600",
}: {
  items: readonly string[] | string[]
  icon: LucideIcon
  iconClass?: string
}) {
  return (
    <ul className="space-y-2 sm:space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2 sm:gap-3">
          <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5", iconClass)} />
          <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function PolicyCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </CardContent>
    </Card>
  )
}
