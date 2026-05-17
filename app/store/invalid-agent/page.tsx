export default function InvalidAgentStorePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Store not found</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          This storefront link is invalid or the agent store is unavailable.
        </p>
      </div>
    </div>
  )
}
