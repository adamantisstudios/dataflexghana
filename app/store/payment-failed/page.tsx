export default function StorePaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div>
        <h1 className="text-xl font-bold text-red-700">Payment not completed</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Your payment was not verified. Please try again or contact the store agent.
        </p>
      </div>
    </div>
  )
}
