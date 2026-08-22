import { createHash } from "crypto"
import { getAdminClient } from "@/lib/supabase-base"
import { amountsEqual, normalizeReferenceCode } from "@/lib/ops/parse-momo-sms"
import { setEntityProcessing, type ProcessingEntityType } from "@/lib/ops/set-order-processing"
import { notifyAdminOps } from "@/lib/ops/notify-admin-ops"

const MATCH_WINDOW_MS = 48 * 60 * 60 * 1000 // 48 hours

export type MomoConfirmInput = {
  amount: number
  reference: string | null
  transactionId: string
  payerName?: string | null
  rawSms?: string | null
  receivedAt?: string | null
  deviceId?: string | null
}

export type MatchCandidate = {
  entityType:
    | ProcessingEntityType
    | "wallet_topups"
    | "registration_payment_intents"
    | "data_orders_log"
  entityId: string
  amount: number
  reference: string
  createdAt: string
  action: "set_processing" | "wallet_alert" | "registration_matched" | "guest_log_alert"
}

export type MomoConfirmResult = {
  success: boolean
  matchStatus: string
  message: string
  candidates?: MatchCandidate[]
  applied?: MatchCandidate | null
  inboxId?: string | null
  duplicate?: boolean
}

function windowStartIso(): string {
  return new Date(Date.now() - MATCH_WINDOW_MS).toISOString()
}

function hashRawSms(raw: string | null | undefined): string | null {
  if (!raw) return null
  return createHash("sha256").update(raw).digest("hex")
}

async function collectCandidates(
  reference: string,
  amount: number,
  transactionId: string,
): Promise<MatchCandidate[]> {
  const db = getAdminClient()
  const since = windowStartIso()
  const out: MatchCandidate[] = []

  // 1) data_orders — primary Orders-tab path
  {
    const { data } = await db
      .from("data_orders")
      .select("id, amount, payment_reference, status, created_at, payment_method")
      .eq("status", "pending")
      .eq("payment_reference", reference)
      .gte("created_at", since)
      .limit(20)

    for (const row of data ?? []) {
      const rowAmount = Number(row.amount)
      if (!amountsEqual(rowAmount, amount)) continue
      out.push({
        entityType: "data_orders",
        entityId: row.id,
        amount: rowAmount,
        reference: String(row.payment_reference),
        createdAt: row.created_at,
        action: "set_processing",
      })
    }
  }

  // 2) wholesale_orders
  {
    const { data } = await db
      .from("wholesale_orders")
      .select("id, total_amount, payment_reference, status, created_at")
      .eq("status", "pending")
      .eq("payment_reference", reference)
      .gte("created_at", since)
      .limit(20)

    for (const row of data ?? []) {
      const rowAmount = Number(row.total_amount ?? 0)
      if (!amountsEqual(rowAmount, amount)) continue
      out.push({
        entityType: "wholesale_orders",
        entityId: row.id,
        amount: rowAmount,
        reference: String(row.payment_reference),
        createdAt: row.created_at,
        action: "set_processing",
      })
    }
  }

  // 3) bulk_orders via payment_pin (amount often not stored on parent row)
  {
    const { data } = await db
      .from("bulk_orders")
      .select("id, payment_pin, status, created_at")
      .in("status", ["pending", "pending_admin_review"])
      .eq("payment_pin", reference)
      .gte("created_at", since)
      .limit(20)

    for (const row of data ?? []) {
      out.push({
        entityType: "bulk_orders",
        entityId: row.id,
        amount,
        reference: String(row.payment_pin),
        createdAt: row.created_at,
        action: "set_processing",
      })
    }
  }

  // 4) mtnafa_registrations via payment_pin
  {
    const { data } = await db
      .from("mtnafa_registrations")
      .select("id, payment_pin, status, created_at")
      .in("status", ["pending", "pending_admin_review"])
      .eq("payment_pin", reference)
      .gte("created_at", since)
      .limit(20)

    for (const row of data ?? []) {
      out.push({
        entityType: "mtnafa_registrations",
        entityId: row.id,
        amount,
        reference: String(row.payment_pin),
        createdAt: row.created_at,
        action: "set_processing",
      })
    }
  }

  // 5) guest data_orders_log — alert only
  {
    const { data } = await db
      .from("data_orders_log")
      .select("id, amount, reference_code, created_at")
      .eq("reference_code", reference)
      .gte("created_at", since)
      .limit(20)

    for (const row of data ?? []) {
      const rowAmount = Number(row.amount ?? 0)
      if (!amountsEqual(rowAmount, amount)) continue
      out.push({
        entityType: "data_orders_log",
        entityId: row.id,
        amount: rowAmount,
        reference: String(row.reference_code),
        createdAt: row.created_at,
        action: "guest_log_alert",
      })
    }
  }

  // 6) wallet_topups — alert only (prefer MoMo TXN ID match; also amount+time with ref if stored)
  {
    const { data: byTxn } = await db
      .from("wallet_topups")
      .select("id, amount, payment_reference, status, created_at")
      .eq("status", "pending")
      .eq("payment_reference", transactionId)
      .gte("created_at", since)
      .limit(10)

    for (const row of byTxn ?? []) {
      const rowAmount = Number(row.amount ?? 0)
      if (!amountsEqual(rowAmount, amount)) continue
      out.push({
        entityType: "wallet_topups",
        entityId: row.id,
        amount: rowAmount,
        reference: String(row.payment_reference ?? transactionId),
        createdAt: row.created_at,
        action: "wallet_alert",
      })
    }

    // Fallback: same amount pending top-ups in window (no silent credit — alert for review)
    if (!(byTxn && byTxn.length > 0)) {
      const { data: byAmount } = await db
        .from("wallet_topups")
        .select("id, amount, payment_reference, status, created_at")
        .eq("status", "pending")
        .gte("created_at", since)
        .limit(30)

      const amountMatches = (byAmount ?? []).filter((row) =>
        amountsEqual(Number(row.amount ?? 0), amount),
      )
      // Only use amount heuristic if exactly one pending top-up with this amount
      if (amountMatches.length === 1) {
        const row = amountMatches[0]
        out.push({
          entityType: "wallet_topups",
          entityId: row.id,
          amount: Number(row.amount),
          reference: String(row.payment_reference ?? ""),
          createdAt: row.created_at,
          action: "wallet_alert",
        })
      }
    }
  }

  // 7) registration_payment_intents
  {
    const { data } = await db
      .from("registration_payment_intents")
      .select("id, amount, reference_code, status, created_at")
      .eq("status", "pending")
      .eq("reference_code", reference)
      .gte("created_at", since)
      .limit(10)

    for (const row of data ?? []) {
      const rowAmount = Number(row.amount ?? 0)
      if (!amountsEqual(rowAmount, amount)) continue
      out.push({
        entityType: "registration_payment_intents",
        entityId: row.id,
        amount: rowAmount,
        reference: String(row.reference_code),
        createdAt: row.created_at,
        action: "registration_matched",
      })
    }
  }

  return out
}

async function recordSmsEvent(params: {
  input: MomoConfirmInput
  matchStatus: string
  matchEntityType?: string | null
  matchEntityId?: string | null
  matchDetail?: Record<string, unknown> | null
}): Promise<"inserted" | "duplicate" | "error"> {
  const db = getAdminClient()
  const deviceId =
    params.input.deviceId &&
    params.input.deviceId !== "00000000-0000-0000-0000-000000000001"
      ? params.input.deviceId
      : null

  const { error } = await db.from("ops_momo_sms_events").insert({
    transaction_id: params.input.transactionId,
    amount: params.input.amount,
    reference_code: params.input.reference,
    payer_name: params.input.payerName ?? null,
    raw_sms: params.input.rawSms ?? null,
    raw_sms_hash: hashRawSms(params.input.rawSms),
    match_status: params.matchStatus,
    match_entity_type: params.matchEntityType ?? null,
    match_entity_id: params.matchEntityId ?? null,
    match_detail: params.matchDetail ?? null,
    device_id: deviceId,
    received_at: params.input.receivedAt ?? new Date().toISOString(),
  })

  if (error) {
    if (error.code === "23505" || error.message?.toLowerCase().includes("duplicate")) {
      return "duplicate"
    }
    console.error("[momo-confirm] sms event insert failed:", error.message)
    return "error"
  }
  return "inserted"
}

export async function confirmMomoPayment(input: MomoConfirmInput): Promise<MomoConfirmResult> {
  const transactionId = String(input.transactionId ?? "").trim()
  if (!transactionId) {
    return { success: false, matchStatus: "error", message: "transaction_id is required" }
  }

  const amount = Number(input.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, matchStatus: "error", message: "Valid amount is required" }
  }

  const reference = normalizeReferenceCode(input.reference)

  const db = getAdminClient()
  const { data: existing } = await db
    .from("ops_momo_sms_events")
    .select("id, match_status, match_entity_type, match_entity_id")
    .eq("transaction_id", transactionId)
    .maybeSingle()

  if (existing) {
    return {
      success: true,
      duplicate: true,
      matchStatus: existing.match_status ?? "duplicate",
      message: "SMS already processed (idempotent)",
      applied: existing.match_entity_id
        ? {
            entityType: existing.match_entity_type as MatchCandidate["entityType"],
            entityId: existing.match_entity_id,
            amount,
            reference: reference ?? "",
            createdAt: "",
            action: "set_processing",
          }
        : null,
    }
  }

  if (!reference) {
    const inboxId = await notifyAdminOps({
      category: "momo_sms",
      severity: "critical",
      title: "MoMo SMS with no reference",
      body: `GHS ${amount.toFixed(2)} from ${input.payerName ?? "unknown"} — TXN ${transactionId}. Manual review required.`,
      deeplinkTab: "orders",
      entityType: "momo_sms",
      entityId: transactionId,
      requiresAck: true,
      source: "momo_sms",
      payload: { amount, transaction_id: transactionId, payer_name: input.payerName },
    })
    await recordSmsEvent({
      input: { ...input, reference: null, amount, transactionId },
      matchStatus: "unmatched",
      matchDetail: { reason: "missing_reference" },
    })
    return {
      success: true,
      matchStatus: "unmatched",
      message: "No reference in SMS — sticky alert created",
      inboxId,
    }
  }

  const candidates = await collectCandidates(reference, amount, transactionId)

  // Prefer actionable order matches over alerts when multiple types collide
  const processingCandidates = candidates.filter((c) => c.action === "set_processing")
  const walletCandidates = candidates.filter((c) => c.action === "wallet_alert")
  const registrationCandidates = candidates.filter((c) => c.action === "registration_matched")
  const guestCandidates = candidates.filter((c) => c.action === "guest_log_alert")

  if (processingCandidates.length > 1) {
    const inboxId = await notifyAdminOps({
      category: "momo_sms",
      severity: "critical",
      title: "Ambiguous MoMo match — manual review",
      body: `Ref ${reference} GHS ${amount.toFixed(2)} matched ${processingCandidates.length} pending orders. No auto status change.`,
      deeplinkTab: "orders",
      entityType: "momo_sms",
      entityId: transactionId,
      requiresAck: true,
      source: "momo_sms",
      payload: { candidates: processingCandidates, transaction_id: transactionId },
    })
    await recordSmsEvent({
      input: { ...input, reference, amount, transactionId },
      matchStatus: "ambiguous",
      matchDetail: { candidates: processingCandidates },
    })
    return {
      success: true,
      matchStatus: "ambiguous",
      message: "Multiple pending orders matched — no auto change",
      candidates: processingCandidates,
      inboxId,
    }
  }

  if (processingCandidates.length === 1) {
    const chosen = processingCandidates[0]
    const result = await setEntityProcessing({
      entityType: chosen.entityType as ProcessingEntityType,
      entityId: chosen.entityId,
      momoTransactionId: transactionId,
      referenceCode: reference,
      amount,
      reason: "momo_sms_match",
    })

    if (!result.ok && !result.skipped) {
      await recordSmsEvent({
        input: { ...input, reference, amount, transactionId },
        matchStatus: "error",
        matchEntityType: chosen.entityType,
        matchEntityId: chosen.entityId,
        matchDetail: { error: result.error },
      })
      return {
        success: false,
        matchStatus: "error",
        message: result.error,
        applied: chosen,
      }
    }

    await recordSmsEvent({
      input: { ...input, reference, amount, transactionId },
      matchStatus: "matched",
      matchEntityType: chosen.entityType,
      matchEntityId: chosen.entityId,
      matchDetail: { previous_status: result.ok ? result.previousStatus : null },
    })

    return {
      success: true,
      matchStatus: "matched",
      message: `Moved ${chosen.entityType} to processing`,
      applied: chosen,
      candidates,
    }
  }

  if (registrationCandidates.length === 1) {
    const chosen = registrationCandidates[0]
    await db
      .from("registration_payment_intents")
      .update({
        status: "matched",
        matched_transaction_id: transactionId,
        matched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", chosen.entityId)
      .eq("status", "pending")

    const inboxId = await notifyAdminOps({
      category: "agents",
      severity: "critical",
      title: "Registration payment received (manual MoMo)",
      body: `Ref ${reference} GHS ${amount.toFixed(2)} from ${input.payerName ?? "payer"}. Approve agent in Agents tab. Do not auto-approve.`,
      deeplinkTab: "agents",
      entityType: "registration_payment_intents",
      entityId: chosen.entityId,
      requiresAck: true,
      source: "registration",
      payload: { transaction_id: transactionId, reference, amount, payer_name: input.payerName },
    })

    await recordSmsEvent({
      input: { ...input, reference, amount, transactionId },
      matchStatus: "registration_matched",
      matchEntityType: chosen.entityType,
      matchEntityId: chosen.entityId,
    })

    return {
      success: true,
      matchStatus: "registration_matched",
      message: "Registration payment matched — sticky alert (approve agent manually)",
      applied: chosen,
      inboxId,
    }
  }

  if (walletCandidates.length >= 1) {
    const chosen = walletCandidates[0]
    const inboxId = await notifyAdminOps({
      category: "wallets",
      severity: "critical",
      title: "URGENT: Wallet top-up MoMo received — approve on Wallets tab",
      body: `GHS ${amount.toFixed(2)} TXN ${transactionId} from ${input.payerName ?? "payer"}. Matched pending top-up ${chosen.entityId.slice(0, 8)}…. Approve on web — app will not auto-credit.`,
      deeplinkTab: "wallets",
      entityType: "wallet_topups",
      entityId: chosen.entityId,
      requiresAck: true,
      source: "momo_sms",
      payload: {
        transaction_id: transactionId,
        reference,
        amount,
        payer_name: input.payerName,
        payment_reference: chosen.reference,
      },
    })

    await recordSmsEvent({
      input: { ...input, reference, amount, transactionId },
      matchStatus: "wallet_alert",
      matchEntityType: chosen.entityType,
      matchEntityId: chosen.entityId,
    })

    return {
      success: true,
      matchStatus: "wallet_alert",
      message: "Wallet top-up matched — sticky alert only (no auto credit)",
      applied: chosen,
      inboxId,
      candidates: walletCandidates,
    }
  }

  if (guestCandidates.length >= 1) {
    const chosen = guestCandidates[0]
    const inboxId = await notifyAdminOps({
      category: "orders",
      severity: "warning",
      title: "Guest / no-reg MoMo payment matched",
      body: `Ref ${reference} GHS ${amount.toFixed(2)} — data_orders_log ${chosen.entityId.slice(0, 8)}…. Process in Data Bundle Orders Log.`,
      deeplinkTab: "data-orders-log",
      entityType: "data_orders_log",
      entityId: chosen.entityId,
      requiresAck: true,
      source: "momo_sms",
      payload: { transaction_id: transactionId, reference, amount },
    })

    await recordSmsEvent({
      input: { ...input, reference, amount, transactionId },
      matchStatus: "matched",
      matchEntityType: chosen.entityType,
      matchEntityId: chosen.entityId,
    })

    return {
      success: true,
      matchStatus: "matched",
      message: "Guest order log matched — sticky alert",
      applied: chosen,
      inboxId,
    }
  }

  const inboxId = await notifyAdminOps({
    category: "momo_sms",
    severity: "critical",
    title: "Unmatched MoMo payment SMS",
    body: `Ref ${reference} GHS ${amount.toFixed(2)} from ${input.payerName ?? "payer"} TXN ${transactionId}. No pending row found.`,
    deeplinkTab: "orders",
    entityType: "momo_sms",
    entityId: transactionId,
    requiresAck: true,
    source: "momo_sms",
    payload: { transaction_id: transactionId, reference, amount, payer_name: input.payerName },
  })

  await recordSmsEvent({
    input: { ...input, reference, amount, transactionId },
    matchStatus: "unmatched",
    matchDetail: { reason: "no_candidates" },
  })

  return {
    success: true,
    matchStatus: "unmatched",
    message: "No pending payment matched — sticky alert created",
    inboxId,
  }
}
