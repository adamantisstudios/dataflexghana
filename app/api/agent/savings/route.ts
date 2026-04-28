import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { withUnifiedAuth } from "@/lib/auth-middleware"
import { calculateWalletBalance } from "@/lib/earnings-calculator"

// GET - Fetch agent's savings accounts
export const GET = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get("agentId")

    // Verify agent can only access their own data (unless admin)
    if (user.role === "agent" && agentId && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Use authenticated user's ID if no agentId provided, or allow admin to specify
    const targetAgentId = agentId || user.id

    // Fetch agent's savings accounts with plan details
    const { data: savings, error } = await supabase
      .from("agent_savings")
      .select(`
        *,
        savings_plans (
          name,
          description,
          interest_rate,
          duration_months
        )
      `)
      .eq("agent_id", targetAgentId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching savings:", error)
      return NextResponse.json({ error: "Failed to fetch savings" }, { status: 500 })
    }

    // Calculate progress for each savings account
    const savingsWithProgress =
      savings?.map((saving) => {
        const startDate = new Date(saving.start_date)
        const maturityDate = new Date(saving.maturity_date)
        const currentDate = new Date()

        const totalDuration = maturityDate.getTime() - startDate.getTime()
        const elapsed = currentDate.getTime() - startDate.getTime()
        const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100)

        const daysRemaining = Math.max(
          0,
          Math.ceil((maturityDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
        )

        return {
          ...saving,
          progress: Math.round(progress),
          daysRemaining,
          isMatured: saving.status === "matured" || currentDate >= maturityDate,
        }
      }) || []

    return NextResponse.json({ savings: savingsWithProgress })
  } catch (error) {
    console.error("Error in GET /api/agent/savings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})

// POST - Create new savings account
export const POST = withUnifiedAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json()
    const { agentId, savingsPlanId, amount } = body

    // Verify agent can only create savings for themselves (unless admin)
    if (user.role === "agent" && agentId && agentId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Use authenticated user's ID if no agentId provided, or allow admin to specify
    const targetAgentId = agentId || user.id

    if (!targetAgentId || !savingsPlanId || !amount) {
      return NextResponse.json(
        {
          error: "Savings plan ID and amount are required",
        },
        { status: 400 },
      )
    }

    const currentWalletBalance = await calculateWalletBalance(targetAgentId)

    if (currentWalletBalance < amount) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. Available: ₵${currentWalletBalance.toFixed(2)}, Required: ₵${amount.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // Fetch savings plan details
    const { data: plan, error: planError } = await supabase
      .from("savings_plans")
      .select("*")
      .eq("id", savingsPlanId)
      .eq("is_active", true)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Invalid savings plan" }, { status: 400 })
    }

    // Validate amount
    if (amount < plan.minimum_amount || (plan.maximum_amount && amount > plan.maximum_amount)) {
      return NextResponse.json(
        {
          error: `Amount must be between ₵${plan.minimum_amount} and ₵${plan.maximum_amount || "unlimited"}`,
        },
        { status: 400 },
      )
    }

    // Calculate maturity date
    const startDate = new Date()
    const maturityDate = new Date()
    maturityDate.setMonth(maturityDate.getMonth() + plan.duration_months)

    const { data: newSaving, error: savingError } = await supabase
      .from("agent_savings")
      .insert({
        agent_id: targetAgentId,
        savings_plan_id: savingsPlanId,
        principal_amount: amount,
        current_balance: amount,
        start_date: startDate.toISOString(),
        maturity_date: maturityDate.toISOString(),
        status: "active",
      })
      .select()
      .single()

    if (savingError) {
      console.error("Error creating savings:", savingError)
      return NextResponse.json({ error: "Failed to create savings account" }, { status: 500 })
    }

    const { error: walletTransactionError } = await supabase.from("wallet_transactions").insert({
      agent_id: targetAgentId,
      transaction_type: "deduction",
      amount: amount,
      description: `Savings commitment to ${plan.name}`,
      reference_code: `SAV-${Date.now()}-${newSaving.id.slice(0, 8)}`,
      status: "approved",
      source_type: "savings",
      source_id: newSaving.id,
    })

    if (walletTransactionError) {
      console.error("Error creating wallet transaction:", walletTransactionError)
      // Rollback savings creation
      await supabase.from("agent_savings").delete().eq("id", newSaving.id)
      return NextResponse.json({ error: "Failed to process wallet transaction" }, { status: 500 })
    }

    const newWalletBalance = await calculateWalletBalance(targetAgentId)
    const { error: balanceUpdateError } = await supabase
      .from("agents")
      .update({
        wallet_balance: newWalletBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetAgentId)

    if (balanceUpdateError) {
      console.error("Error updating wallet balance:", balanceUpdateError)
      // Note: We don't rollback here as the transaction was recorded
    }

    // Create initial transaction record
    const { error: transactionError } = await supabase.from("savings_transactions").insert({
      agent_savings_id: newSaving.id,
      transaction_type: "deposit",
      amount: amount,
      balance_after: amount,
      description: `Initial deposit for ${plan.name}`,
      reference_number: `DEP-${Date.now()}-${newSaving.id.slice(0, 8)}`,
    })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      // Note: We don't return error here as the savings account was created successfully
    }

    console.log("✅ Savings commitment processed:", {
      agentId: targetAgentId,
      amount,
      planName: plan.name,
      walletBalanceBeforeDeduction: currentWalletBalance,
      walletBalanceAfterDeduction: newWalletBalance,
      savingsId: newSaving.id,
    })

    return NextResponse.json({
      message: "Savings account created successfully",
      saving: newSaving,
      walletBalance: newWalletBalance,
    })
  } catch (error) {
    console.error("Error in POST /api/agent/savings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
})
