import { type NextRequest, NextResponse } from "next/server"
import { authenticateAgent, createAuthErrorResponse } from "@/lib/api-auth"
import { getAuthAgentId } from "@/lib/agent-auth-utils"
import {
  formatCountdown,
  msUntilReset,
  touchDatingStreak,
} from "@/lib/dating/dating-server"
import { COINS_PACK, DATING_PLANS } from "@/lib/dating/constants"
import { getDatingSettings } from "@/lib/dating/dating-settings"
import { createDefaultSubscription } from "@/lib/dating/dating-server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request)
  if (!auth.success) return createAuthErrorResponse(auth.error || "Agent authentication required")
  const agentId = getAuthAgentId(auth)
  if (!agentId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let sub
  try {
    sub = await touchDatingStreak(agentId)
  } catch (e) {
    console.error("[dating/subscription GET]", e)
    sub = createDefaultSubscription(agentId)
  }

  const settings = await getDatingSettings()

  return NextResponse.json({
    success: true,
    subscription: sub,
    plans: {
      ...DATING_PLANS,
      silver: { ...DATING_PLANS.silver, price: settings.silver_price },
      gold: { ...DATING_PLANS.gold, price: settings.gold_price },
    },
    coins_pack: { ...COINS_PACK, price: settings.coin_pack_price },
    counselling_session_price: settings.counselling_session_price,
    limits: {
      swipes_remaining: sub.swipes_remaining,
      matches_remaining: sub.matches_remaining,
      streak_count: sub.streak_count,
      resets_in: formatCountdown(msUntilReset(sub.swipes_reset_at)),
    },
  })
}
