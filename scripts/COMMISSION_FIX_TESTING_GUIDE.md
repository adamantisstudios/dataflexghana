# Commission Fix Testing Guide

## Quick Test Cases

### Test 1: Basic Commission Calculation

**Scenario:** Set 0.005 (0.5%) rate on 29 cedis bundle

**Steps:**
1. Go to Admin -> Data Tab
2. Click "Edit" on any 29 cedis bundle (or create new one)
3. Set Commission Rate to: `0.005`
4. Observe Real-time Preview

**Expected Results:**
- Real-time shows: ₵0.1450 (or ₵0.15 if rounded)
- After saving, bundle card shows same: ₵0.1450 (or ₵0.15)
- Preview and saved value MATCH exactly

**Pass/Fail:** If preview matches saved value ✅ PASS

---

### Test 2: Very Small Commission Rate

**Scenario:** Set 0.0009 (0.09%) rate on 50 cedis bundle

**Steps:**
1. Edit or create bundle
2. Set Commission Rate: `0.0009`
3. Set Price: `50`
4. Check preview

**Expected Results:**
- Calculation: 50 × 0.0009 = 0.045
- Display: ₵0.0450 (exact, not rounded to 0.01 minimum)
- Note: 0.045 is above minimum (0.01) so no cap applied

**Pass/Fail:** If shows 0.0450 ✅ PASS

---

### Test 3: Minimum Cap Application

**Scenario:** Set 0.0001 (0.01%) rate on 50 cedis bundle

**Steps:**
1. Edit or create bundle
2. Set Commission Rate: `0.0001`
3. Set Price: `50`
4. Check preview

**Expected Results:**
- Calculation: 50 × 0.0001 = 0.005
- Minimum cap applies: 0.005 < 0.01
- Display: ₵0.01 (minimum cap)
- This is EXPECTED behavior - prevents tiny commissions

**Pass/Fail:** If shows 0.01 ✅ PASS

---

### Test 4: High Commission Rate

**Scenario:** Set 0.1 (10%) rate on 50 cedis bundle

**Steps:**
1. Edit or create bundle
2. Set Commission Rate: `0.1`
3. Set Price: `50`
4. Check preview

**Expected Results:**
- Calculation: 50 × 0.1 = 5.0
- Display: ₵5.00 (full amount, no artificial cap)
- Before fix: would have been capped to 0.40
- After fix: shows full 5.00

**Pass/Fail:** If shows 5.00 (NOT capped) ✅ PASS

---

### Test 5: Decimal Precision Preservation

**Scenario:** Test that 4+ decimal places are stored

**Steps:**
1. Set Commission Rate: `0.0051` (4 decimals)
2. Save bundle
3. Close dialog
4. Reopen bundle for editing
5. Check Commission Rate field

**Expected Results:**
- Field shows: `0.0051` (exact value, not rounded to 0.01)
- Not truncated to 0.01
- Not rounded to 0.00

**Pass/Fail:** If field shows 0.0051 ✅ PASS

---

### Test 6: Multiple Decimal Places

**Scenario:** Test with unusual decimal places

**Test Cases:**
- `0.005` → Should stay 0.005
- `0.0009` → Should stay 0.0009
- `0.012345` → Should stay 0.012345 (6 decimals)
- `0.00000001` → Should stay 0.00000001 (8 decimals)

**Expected Results:**
- All values preserved exactly as entered
- Preview shows calculated commission correctly

**Pass/Fail:** If all values preserved ✅ PASS

---

### Test 7: Real Order Calculation

**Scenario:** Test actual commission during order

**Setup:**
1. Set bundle commission to 0.005
2. Price 29 cedis
3. Create a test order for 5GB bundle

**Expected Results:**
- Order commission calculated: 29 × 0.005 = 0.145
- Commission amount in order: ₵0.15 (or 0.145 depending on display)
- Agent wallet receives: exact calculated commission
- Not ₵0.00 (old truncated bug)
- Not ₵0.40 (old capped bug)

**Pass/Fail:** If commission is 0.145 ✅ PASS

---

## Regression Tests

### Ensure Old Functionality Still Works

**Test A: Standard rates (0.01)**
- Set rate to 0.01
- Verify shows correctly
- Order commission calculated correctly

**Test B: Bundle display**
- All bundles still visible
- Provider filters work
- Sorting works (by size)

**Test C: Edit existing bundles**
- Can edit without errors
- Commission rates don't change unexpectedly
- Saves successfully

**Test D: Create new bundles**
- Can create wi
