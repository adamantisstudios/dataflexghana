import { type NextRequest, NextResponse } from "next/server"
import { getAdminClient } from "@/lib/supabase-base"
import { calculateWalletBalance } from "@/lib/earnings-calculator"
import { getCalculatedCommission } from "@/lib/commission-calculation"

export const dynamic = "force-dynamic"

type BulkItemInput = {
  bundle_id: string
  recipient_phone: string
}

function generatePaymentReference(): string {
  const characters = "0123456789"
  let result = ""
  for (let i = 0; i < 5; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

function cleanPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "").slice(-10)
  if (digits.length !== 10) return null
  return digits
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const agentId = String(body.agent_id || "").trim()
    const items: BulkItemInput[] = Array.isArray(body.items) ? body.items : []

    if (!agentId || items.length === 0) {
      return NextResponse.json(
        { error: "agent_id and at least one cart item are required" },
        { status: 400 },
      )
    }

    const db = getAdminClient()
    const bundleIds = [...new Set(items.map((i) => i.bundle_id).filter(Boolean))]

    const { data: bundles, error: bundlesError } = await db
      .from("data_bundles")
      .select("id, name, price, commission_rate, is_active")
      .in("id", bundleIds)

    if (bundlesError) {
      console.error("bulk-wallet bundles:", bundlesError)
      return NextResponse.json({ error: "Failed to load bundle prices" }, { status: 500 })
    }

    const bundleMap = new Map((bundles || []).map((b) => [b.id, b]))
    const orderRows: Array<{
      agent_id: string
      bundle_id: string
      recipient_phone: string
      payment_reference: string
      commission_amount: number
      payment_method: string
      status: string
    }> = []

    let totalAmount = 0

    for (const item of items) {
      const bundleId = String(item.bundle_id || "").trim()
      const phone = cleanPhone(String(item.recipient_phone || ""))
      if (!bundleId || !phone) {
        return NextResponse.json(
          { error: "Each item needs a valid bundle and 10-digit phone number" },
          { status: 400 },
        )
      }

      const bundle = bundleMap.get(bundleId)
      if (!bundle || !bundle.is_active) {
        return NextResponse.json(
          { error: "One or more selected bundles are unavailable" },
          { status: 400 },
        )
      }

      const price = Number(bundle.price)
      const commission = getCalculatedCommission(price, Number(bundle.commission_rate ?? 0))
      totalAmount += price

      orderRows.push({
        agent_id: agentId,
        bundle_id: bundleId,
        recipient_phone: phone,
        payment_reference: generatePaymentReference(),
        commission_amount: commission,
        payment_method: "wallet",
        status: "processing",
      })
    }

    const walletBalance = await calculateWalletBalance(agentId)

    if (walletBalance < totalAmount) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. You need GH₵ ${totalAmount.toFixed(2)} but have GH₵ ${walletBalance.toFixed(2)}.`,
          code: "INSUFFICIENT_BALANCE",
          required: totalAmount,
          available: walletBalance,
        },
        { status: 402 },
      )
    }

    const bulkReference = `BULK-${Date.now()}`

    const { error: walletError } = await db.from("wallet_transactions").insert({
      agent_id: agentId,
      transaction_type: "deduction",
      amount: totalAmount,
      description: `Bulk data bundle purchase (${orderRows.length} orders)`,
      reference_code: bulkReference,
      status: "approved",
      source_type: "data_order",
      source_id: null,
    })

    if (walletError) {
      console.error("bulk-wallet deduction:", walletError)
      return NextResponse.json(
        { error: "Failed to process wallet payment. Please try again." },
        { status: 500 },
      )
    }

    const { error: ordersError } = await db.from("data_orders").insert(orderRows)

    if (ordersError) {
      console.error("bulk-wallet orders insert:", ordersError)
      return NextResponse.json(
        { error: "Wallet was charged but some orders could not be created. Contact support." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      orders_placed: orderRows.length,
      total_paid: totalAmount,
      bulk_reference: bulkReference,
      remaining_balance: walletBalance - totalAmount,
    })
  } catch (error) {
    console.error("bulk-wallet route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
