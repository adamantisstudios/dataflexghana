import type { Metadata } from "next"
import RegisterWorkerForm from "@/components/public/domestic-workers/RegisterWorkerForm"

export const metadata: Metadata = {
  title: "Register as Domestic Worker | DataFlex Ghana",
  description:
    "Register as a domestic worker in Ghana. Complete your application to join our network of trusted housekeepers, nannies, cleaners, and home care professionals.",
  keywords: [
    "register domestic worker Ghana",
    "domestic worker application Ghana",
    "housekeeper registration Ghana",
    "nanny registration Ghana",
    "cleaner registration Ghana",
    "home care worker registration Ghana",
    "domestic worker jobs Ghana",
    "apply domestic worker Ghana",
  ].join(", "),
}

export default function RegisterWorkerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8">
      <div className="container mx-auto px-4">
        <RegisterWorkerForm />
      </div>
    </div>
  )
}
