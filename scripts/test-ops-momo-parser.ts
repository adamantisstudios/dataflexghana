/**
 * Run: npx tsx scripts/test-ops-momo-parser.ts
 */
import assert from "node:assert/strict"
import { parseMomoPaymentSms, normalizeReferenceCode, amountsEqual } from "../lib/ops/parse-momo-sms"

const SAMPLE_1 =
  "Payment received for GHS 47.50 from PHILIP AKUTSE AGBAVITOR  Current Balance: GHS 131.47 . Available Balance: GHS 131.47. Reference: 71788. Transaction ID: 84157189921. TRANSACTION FEE: 0.00"

const SAMPLE_2 =
  "Payment received for GHS 47.50 from ADZOYE  EMMANUEL ACCRA WEST Current Balance: GHS 82.25 . Available Balance: GHS 82.25. Reference: 43483. Transaction ID: 84101715279. TRANSACTION FEE: 0.00"

const p1 = parseMomoPaymentSms(SAMPLE_1)
assert.equal(p1.amount, 47.5)
assert.equal(p1.reference, "71788")
assert.equal(p1.transactionId, "84157189921")
assert.ok(p1.payerName?.includes("PHILIP"))

const p2 = parseMomoPaymentSms(SAMPLE_2)
assert.equal(p2.amount, 47.5)
assert.equal(p2.reference, "43483")
assert.equal(p2.transactionId, "84101715279")

assert.equal(normalizeReferenceCode("71788"), "71788")
assert.equal(amountsEqual(47.5, 47.51), true)
assert.equal(amountsEqual(47.5, 48), false)

console.log("OK: MoMo SMS parser tests passed")
