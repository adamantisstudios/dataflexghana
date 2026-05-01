# Code Quality & Build Checking Scripts

This directory contains scripts to help identify and fix common TypeScript/JavaScript issues before they cause build failures.

## Quick Start

**Recommended command:**
```bash
npm run check:real-unused
```

This is the smart scanner that filters out Next.js framework exports and only shows real issues.

## Available Scripts

### 1. `check-real-unused-code.js` - Smart Unused Code Scanner ⭐ (RECOMMENDED)

**File:** `check-real-unused-code.js`

The best choice for most projects. It scans for unused code while intelligently filtering out Next.js special exports that appear unused but are actually managed by the framework.

**What it checks:**
- Unused imports (always a real issue)
- Unused functions/variables (excluding Next.js conventions)
- Unused interfaces/types (excluding Next.js conventions)

**What it correctly ignores:**
- Page components (`Page`, `*Page`, `*Dashboard`)
- Loading components (`Loading`)
- Metadata functions (`generateMetadata`, `generateStaticParams`)
- Layout components (`Layout`, `RootLayout`)
- Error boundaries (`Error`)

**Usage:**
```bash
npm run check:real-unused
```

**Output Example:**
```
🔍 Scanning for real unused code...

📄 app/agent/payment-success/page.tsx
  📦 Line 5: [unused-import] "Link" is declared but never used
     import Link from "next/link"

Found 1 real unused code issue(s)

💡 Tip: Next.js page components, loading components, and generateMetadata are not reported...
```

**Benefits:**
- ✅ Fast (no build required)
- ✅ Filters false positives from Next.js conventions
- ✅ Much fewer false positives than basic scanners
- ✅ Shows exactly where the issue is

### 2. `check-unused-code.js` - Basic Scanner

**File:** `check-unused-code.js`

Simple regex-based scanner. May have false positives for Next.js special exports.

**Usage:**
```bash
npm run check:unused
```

**When to use:**
- Only if you need to see ALL declarations (including framework-managed ones)
- Generally not recommended due to many false positives

### 3. `check-build-errors.sh` - Full Build Check

**File:** `check-build-errors.sh`

Runs Next.js build and reports TypeScript errors. Most accurate but slower.

**Usage:**
```bash
npm run check:build
```

**When to use:**
- Before deploying to production
- When you want to catch ALL type errors
- As part of CI/CD pipeline

**Output Example:**
```
🔍 Running Next.js build to check for TypeScript errors...

📋 Type Errors Found:
====================
  ⚠️  ./app/page.tsx: Type 'undefined' is not assignable to type 'string'
```

### 4. `check:all` - Comprehensive Check

**Usage:**
```bash
npm run check:all
```

Runs both `check:real-unused` and `check:build` for a complete code quality check.

**When to use:**
- Before committing to version control
- As a pre-deployment check
- In CI/CD pipelines

## Common Issues & Fixes

### Issue 1: Unused Imports

**Problem:**
```typescript
import { Card } from "@/components/ui/card"  // Never used
import Link from "next/link"                  // Never used

export default function Page() {
  return <div>Hello</div>
}
```

**Solution - Remove the unused imports:**
```typescript
export default function Page() {
  return <div>Hello</div>
}
```

This is ALWAYS a real issue and should be fixed immediately.

---

### Issue 2: Unused Functions/Variables

**Problem:**
```typescript
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

function unused() {
  console.log("Never called")
}

export default function Page() {
  return <div>Hello</div>
}
```

**Solution - Remove or use them:**
```typescript
// Option 1: Remove if truly unused
export default function Page() {
  return <div>Hello</div>
}

// Option 2: Use them if needed
export default function Page() {
  const items = [{ price: 10 }, { price: 20 }]
  const total = calculateTotal(items)
  return <div>Total: ${total}</div>
}
```

---

### Issue 3: Unused Interfaces/Types

**Problem:**
```typescript
interface User {
  id: string
  name: string
}

interface UnusedInterface {
  value: string
}

export default function Page() {
  const user: User = { id: "1", name: "John" }
  return <div>{user.name}</div>
}
```

**Solution - Remove the unused interface:**
```typescript
interface User {
  id: string
  name: string
}

export default function Page() {
  const user: User = { id: "1", name: "John" }
  return <div>{user.name}</div>
}
```

---

### ✅ Not Actually Unused - Next.js Framework Exports

These will NOT be flagged by `check:real-unused` because they're framework-managed:

**1. Page Components**
```typescript
// This is automatically routed by Next.js
export default function Page() {
  return <div>Homepage</div>
}
```

**2. Loading Components**
```typescript
// Used by React Suspense boundaries automatically
export default function Loading() {
  return <div>Loading...</div>
}
```

**3. Metadata Functions**
```typescript
// Automatically called by Next.js for SEO
export async function generateMetadata() {
  return { title: "My Page" }
}
```

**4. Layout Components**
```typescript
// Automatically used by Next.js routing
export default function RootLayout({ children }) {
  return <html><body>{children}</body></html>
}
```

## Understanding the Output

```
🔍 Scanning for real unused code...

📄 components/admin/tabs/OrdersTab.tsx
  📦 Line 12: [unused-import] "moment" is declared but never used
     import moment from "moment"

Found 1 real unused code issue(s)
```

**Breaking it down:**
- `🔍` = Scan in progress
- `📄` = File path
- `📦` = Import issue (most important to fix)
- `⚠️` = Function/variable issue
- Line number = Where to find it
- Quoted text = What to remove
- Gray text = The problematic line

## Recommended Workflow

### During Development
```bash
# Quick check for real issues only
npm run check:real-unused
```

### Before Committing
```bash
# Comprehensive check
npm run check:all
```

### Before Deploying
```bash
# Full build check to catch everything
npm run check:build
```

### In CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
- name: Check code quality
  run: npm run check:all
```

## Best Practices

1. **Run `check:real-unused` regularly** during development
2. **Fix import issues immediately** - these are always real problems
3. **Review function warnings** - some might be helper functions
4. **Use pre-commit hooks** to automate checks
5. **Don't ignore errors** - clean code catches bugs early

## Troubleshooting

**Script not running:**
```bash
# Make the shell script executable
chmod +x scripts/check-build-errors.sh
```

**False positive for my Next.js code:**
If `check:real-unused` is flagging a page component or loading component:
- Make sure your file is in the right Next.js directory
- Check the filename: `page.tsx`, `loading.tsx`, `layout.tsx`
- File must be in a route directory (app/something/)

**Too many errors reported:**
```bash
# Use the smart scanner instead
npm run check:real-unused  # Instead of check:unused
```

**Build errors but no unused code issues:**
```bash
# Check the full build output
npm run check:build
```

## Notes

- Scripts automatically ignore `node_modules`, `.next`, and hidden directories
- Always manually verify code removal is safe before committing
- Some complex patterns may not be detected by the regex-based scanner
