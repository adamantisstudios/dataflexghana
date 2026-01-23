import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AgentDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-gray-100 border-0">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-gray-300 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
