import { Suspense, lazy } from "react"
import { Card, CardContent } from "@/components/ui/card"

const AutomationDashboard = lazy(() =>
  import("@/components/admin/automation/AutomationDashboard").then((mod) => ({
    default: mod.AutomationDashboard,
  })),
)

function AutomationDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-100 border-0">
            <CardContent className="pt-6">
              <div className="h-8 w-12 bg-gray-300 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function LazyAutomationDashboard(props: any) {
  return (
    <Suspense fallback={<AutomationDashboardSkeleton />}>
      <AutomationDashboard {...props} />
    </Suspense>
  )
}
