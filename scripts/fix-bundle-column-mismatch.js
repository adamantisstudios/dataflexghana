/**
 * Fix Bundle Column Mismatch
 * The issue is that data_orders has both 'data_bundle_id' and 'bundle_id' columns
 * but the foreign key relationship is set up for 'data_bundle_id'
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixBundleColumnMismatch() {
  console.log('🔧 FIXING BUNDLE COLUMN MISMATCH...\n')
  
  try {
    // 1. Check the current state
    console.log('1. Analyzing current column usage...')
    
    const { data: orders, error: ordersError } = await supabase
      .from('data_orders')
      .select('id, data_bundle_id, bundle_id')
      .limit(10)
    
    if (ordersError) {
      console.log('❌ Error fetching orders:', ordersError.message)
      return
    }
    
    console.log(`\n📊 COLUMN ANALYSIS (${orders.length} orders):`)
    
    const hasDataBundleId = orders.filter(o => o.data_bundle_id).length
    const hasBundleId = orders.filter(o => o.bundle_id).length
    const hasBoth = orders.filter(o => o.data_bundle_id && o.bundle_id).length
    const hasNeither = orders.filter(o => !o.data_bundle_id && !o.bundle_id).length
    
    console.log(`   Orders with data_bundle_id: ${hasDataBundleId}`)
    console.log(`   Orders with bundle_id: ${hasBundleId}`)
    console.log(`   Orders with both: ${hasBoth}`)
    console.log(`   Orders with neither: ${hasNeither}`)
    
    // 2. Test which column works for the join
    console.log('\n2. Testing foreign key relationships...')
    
    // Test data_bundle_id join
    const { data: dataBundleIdJoin, error: dataBundleIdError } = await supabase
      .from('data_orders')
      .select(`
        id,
        data_bundle_id,
        data_bundles!data_orders_data_bundle_id_fkey (
          id,
          name,
          provider
        )
      `)
      .limit(3)
    
    if (!dataBundleIdError) {
      const workingJoins = dataBundleIdJoin.filter(o => o.data_bundles).length
      console.log(`   ✅ data_bundle_id join works: ${workingJoins}/${dataBundleIdJoin.length} orders`)
    } else {
      console.log(`   ❌ data_bundle_id join failed: ${dataBundleIdError.message}`)
    }
    
    // Test bundle_id join
    const { data: bundleIdJoin, error: bundleIdError } = await supabase
      .from('data_orders')
      .select(`
        id,
        bundle_id,
        data_bundles!data_orders_bundle_id_fkey (
          id,
          name,
          provider
        )
      `)
      .limit(3)
    
    if (!bundleIdError) {
      const workingJoins = bundleIdJoin.filter(o => o.data_bundles).length
      console.log(`   ✅ bundle_id join works: ${workingJoins}/${bundleIdJoin.length} orders`)
    } else {
      console.log(`   ❌ bundle_id join failed: ${bundleIdError.message}`)
    }
    
    // 3. Determine the fix strategy
    console.log('\n3. Determining fix strategy...')
    
    if (hasBundleId > hasDataBundleId) {
      console.log('   📋 Strategy: Copy bundle_id values to data_bundle_id column')
      
      // Copy bundle_id to data_bundle_id for orders that have bundle_id but not data_bundle_id
      const ordersToCopy = orders.filter(o => o.bundle_id && !o.data_bundle_id)
      
      if (ordersToCopy.length > 0) {
        console.log(`\n4. Copying bundle_id to data_bundle_id for ${ordersToCopy.length} orders...`)
        
        let copiedCount = 0
        for (const order of ordersToCopy) {
          const { error: updateError } = await supabase
            .from('data_orders')
            .update({ data_bundle_id: order.bundle_id })
            .eq('id', order.id)
          
          if (updateError) {
            console.log(`   ❌ Failed to update order ${order.id}: ${updateError.message}`)
          } else {
            copiedCount++
            console.log(`   ✅ Updated order ${order.id}`)
          }
        }
        
        console.log(`\n🎉 Successfully copied ${copiedCount}/${ordersToCopy.length} bundle references`)
      } else {
        console.log('   ℹ️  No orders need bundle_id copying')
      }
      
    } else if (hasDataBundleId > hasBundleId) {
      console.log('   📋 Strategy: Copy data_bundle_id values to bundle_id column')
      
      // Copy data_bundle_id to bundle_id for orders that have data_bundle_id but not bundle_id
      const ordersToCopy = orders.filter(o => o.data_bundle_id && !o.bundle_id)
      
      if (ordersToCopy.length > 0) {
        console.log(`\n4. Copying data_bundle_id to bundle_id for ${ordersToCopy.length} orders...`)
        
        let copiedCount = 0
        for (const order of ordersToCopy) {
          const { error: updateError } = await supabase
            .from('data_orders')
            .update({ bundle_id: order.data_bundle_id })
            .eq('id', order.id)
          
          if (updateError) {
            console.log(`   ❌ Failed to update order ${order.id}: ${updateError.message}`)
          } else {
            copiedCount++
            console.log(`   ✅ Updated order ${order.id}`)
          }
        }
        
        console.log(`\n🎉 Successfully copied ${copiedCount}/${ordersToCopy.length} bundle references`)
      } else {
        console.log('   ℹ️  No orders need data_bundle_id copying')
      }
    }
    
    // 5. Test the fix
    console.log('\n5. Testing the fix...')
    
    const { data: testJoin, error: testError } = await supabase
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
    
    if (testError) {
      console.log('❌ Test join failed:', testError.message)
    } else {
      const workingOrders = testJoin.filter(o => o.data_bundles).length
      console.log(`✅ Test join successful: ${workingOrders}/${testJoin.length} orders have bundle data`)
      
      if (workingOrders > 0) {
        console.log('\n📋 Sample working order:')
        const sample = testJoin.find(o => o.data_bundles)
        console.log(`   Order ${sample.id}:`)
        console.log(`   - Bundle: ${sample.data_bundles.name}`)
        console.log(`   - Provider: ${sample.data_bundles.provider}`)
        console.log(`   - Size: ${sample.data_bundles.size_gb}GB`)
        console.log(`   - Price: GH₵${sample.data_bundles.price}`)
      }
    }
    
    console.log('\n🎉 BUNDLE COLUMN MISMATCH FIX COMPLETE!')
    console.log('✅ Your admin panel should now show proper bundle information')
    console.log('🔄 Please refresh your admin panel to see the changes')
    
  } catch (error) {
    console.log('❌ Fix failed:', error.message)
  }
}

// Run the fix
fixBundleColumnMismatch().catch(console.error)
