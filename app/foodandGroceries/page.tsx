import type { Metadata } from "next"
import FoodAndGroceriesLanding from "@/components/grocery/FoodAndGroceriesLanding"

export const metadata: Metadata = {
  title: "Grocery Delivery Accra – Submit Your Shopping List | Dataflex Ghana",
  description:
    "Request concierge grocery shopping in Ghana. Pay a small commitment fee, send your market list, and DataFlex coordinates fresh groceries and delivery to your door.",
  openGraph: {
    title: "Grocery Shopping Assistance | Dataflex Ghana",
    description:
      "Skip the market stress. Submit your grocery list and let DataFlex shop and deliver for you in Accra and beyond.",
    type: "website",
  },
}

export default function FoodAndGroceriesPage() {
  return <FoodAndGroceriesLanding />
}
