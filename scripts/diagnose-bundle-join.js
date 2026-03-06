/**
 * Diagnose Bundle Join Issues
 * Checks why the bundle join isn't working in queries
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnoseBundleJoin() {
  console.log('🔍 DIAGNOSING BUNDLE JOIN ISSUES...\n')
  
  try {
    // 1. Check a specific order and its bundle
    console.log('1. Checking specific order details...')
    
    const { data: orders, error: ordersError } = await supabase
      .from('data_orders')
      .select('id, bundle_id, recipient_phone, created_at')
      .limit(3)
    
    if (ordersError) {
      console.log('❌ Error fetching orders:', ordersError.message)
      return
    }
    
    console.log(`Found ${orders.length} orders:`)
    orders.forEach(order => {
      console.log(`   - Order ${order.id}: bundle_id=${order.bundle_id}`)
    })
    
    // 2. Check if those bundle IDs exist
    console.log('\n2. Checking if bundle IDs exist...')
    
    for (const order of orders) {
      const { data: bundle, error: bundleError } = await supabase
        .from('data_bundles')
        .select('id, name, provider, size_gb, price')
        .eq('id', order.bundle_id)
        .single()
      
      if (bundleError) {
        console.log(`   ❌ Bundle ${order.bundle_id} NOT FOUND: ${bundleError.message}`)
      } else {
        console.log(`   ✅ Bundle ${order.bundle_id} EXISTS: ${bundle.name}`)
      }
    }
    
    // 3. Try the join query that's failing
    console.log('\n3. Testing the problematic join query...')
    
    const { data: joinResult, error: joinError } = await supabase
      .from('data_orders')
      .select(`
        id, 
        bundle_id, 
        created_at,
        data_bundles (
          id, 
          name, 
          provider, 
          size_gb, 
          price
        )
      `)
      .limit(3)
    
    if (joinError) {
      console.log('❌ Join query failed:', joinError.message)
      return
    }
    
    console.log(`Join query returned ${joinResult.length} orders:`)
    joinResult.forEach(order => {
      console.log(`   - Order ${order.id}:`)
      console.log(`     bundle_id: ${order.bundle_id}`)
      console.log(`     bundle_data: ${order.data_bundles ? 'EXISTS' : 'NULL'}`)
      if (order.data_bundles) {
        console.log(`     bundle_name: ${order.data_bundles.name}`)
      }
    })
    
    // 4. Check foreign key relationship
    console.log('\n4. Checking foreign key relationship...')
    
    // Try a different approach - manual join
    const { data: manualJoin, error: manualError } = await supabase
      .rpc('get_orders_with_bundles', {})
      .limit(3)
    
    if (manualError && !manualError.message.includes('function')) {
      console.log('❌ Manual join failed:', manualError.message)
    } else if (manualError) {
      console.log('ℹ️  Custom function not available, trying alternative...')
      
      // Alternative: Get orders and bundles separately
      const orderIds = orders.map(o => o.id)
      const bundleIds = orders.map(o => o.bundle_id)
      
      const { data: bundles, error: bundlesError } = await supabase
        .from('data_bundles')
        .select('id, name, provider, size_gb, price')
        .in('id', bundleIds)
      
      if (bundlesError) {
        console.log('❌ Error fetching bundles:', bundlesError.message)
      } else {
        console.log(`\n📊 MANUAL JOIN RESULTS:`)
        console.log(`   Found ${bundles.length} bundles for ${orders.length} orders`)
        
        const bundleMap = new Map(bundles.map(b => [b.id, b]))
        
        orders.forEach(order => {
          const bundle = bundleMap.get(order.bundle_id)
          console.log(`   - Order ${order.id}:`)
          console.log(`     bundle_id: ${order.bundle_id}`)
          console.log(`     bundle_found: ${bundle ? 'YES' : 'NO'}`)
          if (bundle) {
            console.log(`     bundle_name: ${bundle.name}`)
          }
        })
      }
    }
    
    // 5. Check table schema
    console.log('\n5. Checking table relationships...')
    
    // This is a simplified check - in a real scenario you'd check the actual schema
    const { data: sampleOrder } = await supabase
      .from('data_orders')
      .select('*')
      .limit(1)
      .single()
    
    const { data: sampleBundle } = await supabase
      .from('data_bundles')
      .select('*')
      .limit(1)
      .single()
    
    console.log('\n📋 TABLE STRUCTURE:')
    console.log('   data_orders columns:', Object.keys(sampleOrder || {}))
    console.log('   data_bundles columns:', Object.keys(sampleBundle || {}))
    
    // 6. Suggest solutions
    console.log('\n💡 SUGGESTED SOLUTIONS:')
    
    if (joinResult.every(order => !order.data_bundles)) {
      console.log('   🔧 Issue: Foreign key relationship not working')
      console.log('   📝 Solution 1: Check if foreign key constraint exists')
      console.log('   📝 Solution 2: Use manual joins in the application')
      console.log('   📝 Solution 3: Create a database view for orders with bundles')
    }
    
    console.log('\n🎯 RECOMMENDED ACTION:')
    console.log('   Use the manual join approach in your OrdersTab component')
    console.log('   Fetch orders and bundles separately, then combine them in JavaScript')
    
  } catch (error) {
    console.log('❌ Diagnosis failed:', error.message)
  }
}

// Run the diagnosis
diagnoseBundleJoin().catch(console.error)
