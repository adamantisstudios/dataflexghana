import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  amount: number
  variant?: "green" | "amber"
  className?: string
}

export function EarningsBadge({ amount, variant = "green", className }: Props) {
  const formatted =
    Number.isInteger(amount) || Math.abs(amount - Math.round(amount)) < 0.001
      ? amount.toFixed(0)
      : amount.toFixed(2)

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold text-xs shrink-0",
        variant === "green"
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-amber-50 text-amber-800 border-amber-200",
        className,
      )}
    >
      You earn: GH₵ {formatted}
    </Badge>
  )
}
