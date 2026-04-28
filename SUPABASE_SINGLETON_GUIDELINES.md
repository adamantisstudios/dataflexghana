# Supabase Singleton Pattern - Developer Guidelines

## ⚠️ CRITICAL: Only ONE Browser Client Instance

The application now enforces a strict singleton pattern for the browser Supabase client to prevent the "Multiple GoTrueClient instances detected" warning.

## ✅ DO THIS - Correct Imports

### For Client/Browser Code
```typescript
// ✅ CORRECT - Import singleton
import { supabase } from '@/lib/supabase'

// Use it
const { data } = await supabase.from('agents').select('*')
```

### For Server-Side Code
```typescript
// ✅ CORRECT - Import admin client function
import { getAdminClient } from '@/lib/supabase-base'

// Create per request
const supabase = getAdminClient()
const { data } = await supabase.from('agents').select('*')
```

## ❌ DON'T DO THIS - Incorrect Patterns

### ❌ Creating new client in browser code
```typescript
// ❌ WRONG - Creates duplicate GoTrueClient
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)  // Creates NEW instance!
```

### ❌ Storing admin client in global
```typescript
// ❌ WRONG - Admin must be created per-request
import { createClient } from '@supabase/supabase-js'

const globalAdmin = createClient(url, adminKey)  // Not allowed
```

### ❌ Creating context clients incorrectly
```typescript
// ❌ WRONG
export const createSupabaseWithContext = () => {
  return createClient(url, key)  // Creates new instance
}

// ✅ CORRECT
import { supabase } from '@/lib/supabase'
export const createSupabaseWithContext = () => {
  return supabase  // Returns singleton
}
```

## 📋 Import Guide by Use Case

### Use Case 1: Client Component (React)
```typescript
import { supabase } from '@/lib/supabase'

export default function MyComponent() {
  const handleClick = async () => {
    const { data } = await supabase.from('table').select('*')
  }
  return <button onClick={handleClick}>Load</button>
}
```

### Use Case 2: Server Component
```typescript
import { getAdminClient } from '@/lib/supabase-base'

export default async function MyServerComponent() {
  const supabase = getAdminClient()
  const { data } = await supabase.from('table').select('*')
  return <div>{data?.length}</div>
}
```

### Use Case 3: API Route
```typescript
import { getAdminClient } from '@/lib/supabase-base'

export async function GET() {
  const supabase = getAdminClient()
  const { data } = await supabase.from('table').select('*')
  return Response.json(data)
}
```

### Use Case 4: Middleware
```typescript
import { supabase } from '@/lib/supabase'  // Uses browser client singleton

export async function middleware(req: NextRequest) {
  const { data: { user } } = await supabase.auth.getUser()
  return user ? NextResponse.next() : NextResponse.redirect('/')
}
```

### Use Case 5: Auth Operations
```typescript
import { supabase } from '@/lib/supabase'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}
```

### Use Case 6: Realtime Subscriptions
```typescript
import { supabase } from '@/lib/supabase'

export function subscribeToTable(table: string, callback: Function) {
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', 
      { event: '*', schema: 'public', table },
      (payload) => callback(payload)
    )
    .subscribe()
}
```

## 🔍 File Mapping - Which Import to Use

| Situation | Import | Reason |
|-----------|--------|--------|
| React Component | `import { supabase } from '@/lib/supabase'` | Browser client |
| Server Component | `import { getAdminClient } from '@/lib/supabase-base'` | Server-side admin |
| API Route | `import { getAdminClient } from '@/lib/supabase-base'` | Per-request admin |
| Hook | `import { supabase } from '@/lib/supabase'` | Browser singleton |
| Utility Function | `import { supabase } from '@/lib/supabase'` | Browser singleton |
| Auth Flow | `import { supabase } from '@/lib/supabase'` | Uses auth session |
| Realtime | `import { supabase } from '@/lib/supabase'` | Uses channels |
| Middleware | `import { supabase } from '@/lib/supabase'` | Browser singleton |

## 🚨 Common Mistakes & Fixes

### Mistake 1: Multiple imports creating multiple clients
```typescript
// ❌ WRONG - Multiple files doing this
// file1.ts
const client1 = createClient(url, key)

// file2.ts
const client2 = createClient(url, key)

// Results in 2 GoTrueClient instances! ❌

// ✅ CORRECT
// All files import same singleton
import { supabase } from '@/lib/supabase'
```

### Mistake 2: Storing client in state
```typescript
// ❌ WRONG
const [supabaseClient, setSupabaseClient] = useState(null)

// ✅ CORRECT
import { supabase } from '@/lib/supabase'
// Just use it directly
```

### Mistake 3: Creating admin in browser
```typescript
// ❌ WRONG - This will throw error!
import { getAdminClient } from '@/lib/supabase-base'

// In a React component (browser code)
const admin = getAdminClient()  // Error: "Admin client can only be used on server-side"

// ✅ CORRECT - Use in API route or server component only
```

### Mistake 4: Forgetting to create new admin per request
```typescript
// ❌ WRONG - Storing admin in global
let adminClient = null

export function getAdmin() {
  if (!adminClient) {
    adminClient = createClient(url, key)  // Don't cache!
  }
  return adminClient
}

// ✅ CORRECT - Create per request
export function getAdmin() {
  return getAdminClient()  // Fresh instance each time
}
```

## ✅ Verification Checklist

When adding new Supabase code, verify:

- [ ] Importing from `@/lib/supabase` (browser) or `@/lib/supabase-base` (server)?
- [ ] Not calling `createClient()` directly anywhere?
- [ ] Server code using `getAdminClient()` per request?
- [ ] No client code using admin client?
- [ ] No GoTrueClient warnings in console?
- [ ] Auth still working?
- [ ] Realtime still working?

## 🆘 Troubleshooting

### Problem: "Multiple GoTrueClient instances detected"
**Solution:** Search codebase for `createClient(`. Remove all direct calls. Use imports instead.

### Problem: "Admin client can only be used on server-side"
**Solution:** Don't call `getAdminClient()` in React components. Use `@/lib/supabase` instead.

### Problem: Auth not working
**Solution:** Verify you're using `import { supabase } from '@/lib/supabase'`. Auth state is managed via this singleton.

### Problem: Realtime not updating
**Solution:** Verify using singleton client: `import { supabase } from '@/lib/supabase'`. Use `.channel().on().subscribe()` pattern.

## 📚 Related Files

- **Browser Singleton:** `/lib/supabase-base.ts` - Main singleton definition
- **Re-exports:** `/lib/supabase.ts` - For convenience
- **Enhanced Wrapper:** `/lib/supabase-enhanced.ts` - With session management
- **Auth Functions:** `/lib/supabase-hybrid-auth.ts` - Auth helper functions
- **Admin Utilities:** `/lib/supabase-admin.ts` - Legacy compatibility

## 🎯 Key Takeaway

```
✅ ONE SINGLETON for browser code
✅ MULTIPLE INSTANCES (per request) for server code
✅ NEVER STORE SERVER CLIENT GLOBALLY
```
