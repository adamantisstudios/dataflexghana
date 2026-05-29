import { NextResponse } from "next/server"
import { getDatingSettings } from "@/lib/dating/dating-settings"
import { DATING_PLANS, COINS_PACK } from "@/lib/dating/constants"

export const dynamic = "force-dynamic"

/** Public pricing for agent dating UI (no auth required). */
export async function GET() {
  const settings = await getDatingSettings()
  return NextResponse.json({
    success: true,
    settings,
    plans: {
      free: { price: 0, label: DATING_PLANS.free.label, swipesPerDay: DATING_PLANS.free.swipesPerDay, matchesPerDay: DATING_PLANS.free.matchesPerDay },
      silver: { price: settings.silver_price, label: DATING_PLANS.silver.label, swipesPerDay: DATING_PLANS.silver.swipesPerDay, matchesPerDay: DATING_PLANS.silver.matchesPerDay },
      gold: { price: settings.gold_price, label: DATING_PLANS.gold.label, swipesPerDay: DATING_PLANS.gold.swipesPerDay, matchesPerDay: DATING_PLANS.gold.matchesPerDay },
      coins: { price: settings.coin_pack_price, label: COINS_PACK.label, swipes: COINS_PACK.swipes, matches: COINS_PACK.matches },
    },
    counselling_session_price: settings.counselling_session_price,
  })
}
