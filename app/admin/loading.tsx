export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-emerald-700 font-medium">Loading admin dashboard...</p>
      </div>
    </div>
  )
}
