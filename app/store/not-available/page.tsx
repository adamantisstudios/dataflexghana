export default function StoreNotAvailablePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Store Not Available</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
          This storefront link is invalid or the store is no longer available.
        </p>
      </div>
    </div>
  )
}
