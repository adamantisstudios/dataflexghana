# Deployment Fix Guide

This guide explains the fixes applied to resolve deployment and runtime issues.

## Issues Fixed

### 1. React Version Mismatch ✅
**Problem:** React 19.1.0 vs React-DOM 18.2.0 causing peer dependency warnings
**Solution:** Downgraded both to React 18.2.0 for compatibility

### 2. Missing Supabase Dependency ✅
**Problem:** `@supabase/supabase-js` was not in package.json
**Solution:** Added `@supabase/supabase-js` version 2.39.0

### 3. API 404 Errors ✅
**Problem:** All `/api/*` routes returning 404 on Netlify
**Solution:** 
- Updated `netlify.toml` redirects configuration
- Added `output: 'standalone'` to `next.config.mjs`
- Ensured Next.js API routes are properly built as serverless functions

### 4. Invalid Supabase URL ✅
**Problem:** Using placeholder URL `https://jjjaaipqiobbenqihttt.supabase.co`
**Solution:** 
- Created `.env.example` with proper structure
- You MUST update environment variables in Netlify with real credentials

### 5. pnpm Dependency Issue ✅
**Problem:** Next.js trying to use pnpm when only npm is installed
**Solution:** 
- Removed `pnpm-lock.yaml` file
- Updated Next.js config to prevent pnpm detection
- Use npm exclusively

## Required Actions

### Step 1: Clean Installation (Local Development)

\`\`\`bash
# Remove all lock files and node_modules
rm -rf node_modules package-lock.json pnpm-lock.yaml

# Clear npm cache
npm cache clean --force

# Install dependencies with legacy peer deps flag
npm install --legacy-peer-deps

# Run development server
npm run dev
\`\`\`

### Step 2: Configure Environment Variables

#### For Local Development:
1. Copy `.env.example` to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Update `.env.local` with your real Supabase credentials:
   - Get `NEXT_PUBLIC_SUPABASE_URL` from Supabase Dashboard > Settings > API
   - Get `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Dashboard > Settings > API
   - Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard > Settings > API (service_role key)

#### For Netlify Deployment:
1. Go to Netlify Dashboard > Site Settings > Environment Variables
2. Add the following variables:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=https://your-real-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-real-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-real-service-role-key
   NODE_ENV=production
   \`\`\`

### Step 3: Deploy to Netlify

\`\`\`bash
# Build locally to test
npm run build

# If build succeeds, commit and push
git add .
git commit -m "Fix: Resolve deployment issues - React versions, API routes, Supabase config"
git push origin main
\`\`\`

### Step 4: Clear Netlify Build Cache

1. Go to Netlify Dashboard > Deploys
2. Click "Trigger deploy" > "Clear cache and deploy site"

## Verification Checklist

After deployment, verify:

- [ ] No React version mismatch warnings during build
- [ ] API routes respond (test `/api/admin/automation/stats`)
- [ ] No Supabase 404 errors in browser console
- [ ] Dashboard loads without errors
- [ ] Agent dashboard displays data correctly
- [ ] No "pnpm not found" errors

## Common Issues

### Issue: API routes still return 404
**Solution:** Ensure `@netlify/plugin-nextjs` is properly installed and Netlify build cache is cleared

### Issue: Supabase errors persist
**Solution:** Double-check environment variables are set correctly in Netlify dashboard (not just in code)

### Issue: Build fails with dependency errors
**Solution:** Run `npm install --legacy-peer-deps --force` and commit the updated `package-lock.json`

## Support

If issues persist after following this guide:
1. Check Netlify build logs for specific errors
2. Verify all environment variables are set in Netlify dashboard
3. Ensure your Supabase project is active and accessible
4. Check that your database tables exist and have proper RLS policies

## Next Steps

1. **Set up proper Supabase project** - The current placeholder credentials won't work
2. **Configure database tables** - Ensure all required tables exist
3. **Set up RLS policies** - Configure Row Level Security for data protection
4. **Test all API endpoints** - Verify each route works correctly
5. **Monitor error logs** - Check Netlify and browser console for any remaining issues
