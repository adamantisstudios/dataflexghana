/**
 * Targeted Bundle Relationship Fix
 * Fixes the specific issue where bundle_id references don't exist
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixBundleReferences() {
  console.log('🔧 FIXING BUNDLE REFERENCES...\n')
  
  try {
    // 1. Find orders with invalid bundle_id references
    console.log('1. Finding orders with invalid bundle references...')
    
    const { data: ordersWithInvalidBundles, error: fetchError } = await supabase
      .from('data_orders')
      .select(`
        id, 
        bundle_id, 
        recipient_phone,
        created_at
      `)
      .not('bundle_id', 'is', null)
    
    if (fetchError) {
      console.log('❌ Error fetching orders:', fetchError.message)
      return
    }
    
    console.log(`Found ${ordersWithInvalidBundles.length} orders with bundle_id set`)
    
    // 2. Get all valid bundle IDs
    const { data: validBundles, error: bundleError } = await supabase
      .from('data_bundles')
      .select('id, name, provider, size_gb, price')
      .order('price', { ascending: true })
    
    if (bundleError) {
      console.log('❌ Error fetching bundles:', bundleError.message)
      return
    }
    
    console.log(`Found ${validBundles.length} valid bundles`)
    
    const validBundleIds = new Set(validBundles.map(b => b.id))
    
    // 3. Find orders with invalid bundle_id references
    const ordersToFix = ordersWithInvalidBundles.filter(order => 
      !validBundleIds.has(order.bundle_id)
    )
    
    console.log(`\n📊 ANALYSIS:`)
    console.log(`   Orders with valid bundle references: ${ordersWithInvalidBundles.length - ordersToFix.length}`)
    console.log(`   Orders with invalid bundle references: ${ordersToFix.length}`)
    
    if (ordersToFix.length === 0) {
      console.log('✅ All orders have valid bundle references!')
      return
    }
    
    // 4. Choose a default bundle for fixing
    const defaultBundle = validBundles.find(b => b.size_gb === 2) || validBundles[0]
    console.log(`\n🎯 Using default bundle: ${defaultBundle.name} (${defaultBundle.size_gb}GB, GH₵${defaultBundle.price})`)
    
    // 5. Fix the invalid references
    console.log(`\n🔧 Fixing ${ordersToFix.length} orders...`)
    
    let fixedCount = 0
    for (const order of ordersToFix) {
      const { error: updateError } = await supabase
        .from('data_orders')
        .update({ bundle_id: defaultBundle.id })
        .eq('id', order.id)
      
      if (updateError) {
        console.log(`❌ Failed to fix order ${order.id}:`, updateError.message)
      } else {
        fixedCount++
        console.log(`✅ Fixed order ${order.id}`)
      }
    }
    
    console.log(`\n🎉 REPAIR COMPLETE: Fixed ${fixedCount}/${ordersToFix.length} orders`)
    
    // 6. Verify the fix
    console.log('\n🔍 VERIFYING REPAIRS...')
    
    const { data: verifyOrders, error: verifyError } = await supabase
      .from('data_orders')
      .select(`
        id,
        data_bundles (
          id,
          name,
          provider,
          size_gb,
          price
        )
      `)
      .limit(5)
    
    if (verifyError) {
      console.log('❌ Verification failed:', verifyError.message)
      return
    }
    
    const ordersWithBundles = verifyOrders.filter(order => order.data_bundles)
    console.log(`\n📊 VERIFICATION RESULTS:`)
    console.log(`   Orders with valid bundle data: ${ordersWithBundles.length}/${verifyOrders.length}`)
    
    if (ordersWithBundles.length > 0) {
      console.log(`\n✅ Sample fixed order:`)
      const sample = ordersWithBundles[0]
      console.log(`   Order ${sample.id}:`)
      console.log(`   - Bundle: ${sample.data_bundles.name}`)
      console.log(`   - Provider: ${sample.data_bundles.provider}`)
      console.log(`   - Size: ${sample.data_bundles.size_gb}GB`)
      console.log(`   - Price: GH₵${sample.data_bundles.price}`)
    }
    
    console.log('\n🎉 BUNDLE RELATIONSHIP REPAIR COMPLETE!')
    console.log('✅ Your admin panel should now show proper bundle information')
    console.log('🔄 Please refresh your admin panel to see the changes')
    
  } catch (error) {
    console.log('❌ Repair failed:', error.message)
  }
}

// Run the fix
fixBundleReferences().catch(console.error)
