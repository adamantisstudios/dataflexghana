"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Filter, X } from "lucide-react"

// Agent Status Filter Component
interface AgentFilterProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  counts?: {
    all: number
    pending: number
    approved: number
    banned: number
  }
}

export function AgentStatusFilter({ currentFilter, onFilterChange, counts }: AgentFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">Filter by Status:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Agents", count: counts?.all },
          { value: "pending", label: "Pending", count: counts?.pending },
          { value: "approved", label: "Approved", count: counts?.approved },
          { value: "banned", label: "Banned", count: counts?.banned },
        ].map((option) => (
          <Button
            key={option.value}
            variant={currentFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(option.value)}
            className={
              currentFilter === option.value
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            }
          >
            {option.label}
            {option.count !== undefined && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-current">
                {option.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Service Commission Range Filter
interface ServiceFilterProps {
  currentRange: string
  onRangeChange: (range: string) => void
  counts?: {
    all: number
    low: number
    medium: number
    high: number
  }
}

export function ServiceCommissionFilter({ currentRange, onRangeChange, counts }: ServiceFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">Filter by Commission:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Services", count: counts?.all },
          { value: "0-1000", label: "GH₵0-1000", count: counts?.low },
          { value: "1001-5000", label: "GH₵1001-5000", count: counts?.medium },
          { value: "5001+", label: "GH₵5001+", count: counts?.high },
        ].map((option) => (
          <Button
            key={option.value}
            variant={currentRange === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onRangeChange(option.value)}
            className={
              currentRange === option.value
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            }
          >
            {option.label}
            {option.count !== undefined && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-current">
                {option.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Order Status Filter
interface OrderFilterProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  counts?: {
    all: number
    pending: number
    processing: number
    completed: number
    canceled: number
  }
}

export function OrderStatusFilter({ currentFilter, onFilterChange, counts }: OrderFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">Filter by Status:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Orders", count: counts?.all },
          { value: "pending", label: "Pending", count: counts?.pending },
          { value: "processing", label: "Processing", count: counts?.processing },
          { value: "completed", label: "Completed", count: counts?.completed },
          { value: "canceled", label: "Canceled", count: counts?.canceled },
        ].map((option) => (
          <Button
            key={option.value}
            variant={currentFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(option.value)}
            className={
              currentFilter === option.value
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            }
          >
            {option.label}
            {option.count !== undefined && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-current">
                {option.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Referral Status Filter
interface ReferralFilterProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  counts?: {
    all: number
    pending: number
    confirmed: number
    in_progress: number
    completed: number
    rejected: number
  }
}

export function ReferralStatusFilter({ currentFilter, onFilterChange, counts }: ReferralFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">Filter by Status:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Referrals", count: counts?.all },
          { value: "pending", label: "Pending", count: counts?.pending },
          { value: "confirmed", label: "Confirmed", count: counts?.confirmed },
          { value: "in_progress", label: "In Progress", count: counts?.in_progress },
          { value: "completed", label: "Completed", count: counts?.completed },
          { value: "rejected", label: "Rejected", count: counts?.rejected },
        ].map((option) => (
          <Button
            key={option.value}
            variant={currentFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(option.value)}
            className={
              currentFilter === option.value
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            }
          >
            {option.label}
            {option.count !== undefined && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-current">
                {option.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Withdrawal Status Filter
interface WithdrawalFilterProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  counts?: {
    all: number
    requested: number
    processing: number
    paid: number
    rejected: number
  }
}

export function WithdrawalStatusFilter({ currentFilter, onFilterChange, counts }: WithdrawalFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">Filter by Status:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Withdrawals", count: counts?.all },
          { value: "requested", label: "Requested", count: counts?.requested },
          { value: "processing", label: "Processing", count: counts?.processing },
          { value: "paid", label: "Paid", count: counts?.paid },
          { value: "rejected", label: "Rejected", count: counts?.rejected },
        ].map((option) => (
          <Button
            key={option.value}
            variant={currentFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(option.value)}
            className={
              currentFilter === option.value
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            }
          >
            {option.label}
            {option.count !== undefined && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-current">
                {option.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Network Provider Filter for Data Bundles
interface NetworkFilterProps {
  currentFilter: string
  onFilterChange: (filter: string) => void
  counts?: {
    all: number
    mtn: number
    airteltigo: number
    telecel: number
  }
}

export function NetworkProviderFilter({ currentFilter, onFilterChange, counts }: NetworkFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">Filter by Network:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "All Networks", count: counts?.all },
          { value: "MTN", label: "MTN", count: counts?.mtn },
          { value: "AirtelTigo", label: "AirtelTigo", count: counts?.airteltigo },
          { value: "Telecel", label: "Telecel", count: counts?.telecel },
        ].map((option) => (
          <Button
            key={option.value}
            variant={currentFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(option.value)}
            className={
              currentFilter === option.value
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            }
          >
            {option.value !== "all" && (
              <img
                src={
                  option.value === "MTN"
                    ? "/images/mtn.jpg"
                    : option.value === "AirtelTigo"
                      ? "/images/airteltigo.jpg"
                      : "/images/telecel.jpg"
                }
                alt={`${option.value} logo`}
                className="w-4 h-4 rounded mr-2"
              />
            )}
            {option.label}
            {option.count !== undefined && (
              <Badge variant="secondary" className="ml-2 bg-white/20 text-current">
                {option.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Active Filters Display
interface ActiveFiltersProps {
  filters: Array<{
    key: string
    label: string
    value: string
  }>
  onRemoveFilter: (key: string) => void
  onClearAll: () => void
}

export function ActiveFilters({ filters, onRemoveFilter, onClearAll }: ActiveFiltersProps) {
  const activeFilters = filters.filter((f) => f.value !== "all" && f.value !== "")

  if (activeFilters.length === 0) return null

  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-emerald-700">Active Filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1"
            >
              {filter.label}: {filter.value}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-emerald-200"
                onClick={() => onRemoveFilter(filter.key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
          >
            Clear All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
