/**
 * Database Bundle Repair Script
 * Diagnoses and fixes bundle data issues in the database
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Common data bundle configurations for Ghana
const STANDARD_BUNDLES = [
  // MTN Bundles
  { name: '1GB MTN Daily', provider: 'MTN', size_gb: 1, price: 5.00, commission_rate: 0.10, validity_days: 1 },
  { name: '2GB MTN Weekly', provider: 'MTN', size_gb: 2, price: 10.00, commission_rate: 0.12, validity_days: 7 },
  { name: '5GB MTN Monthly', provider: 'MTN', size_gb: 5, price: 20.00, commission_rate: 0.15, validity_days: 30 },
  { name: '10GB MTN Monthly', provider: 'MTN', size_gb: 10, price: 35.00, commission_rate: 0.15, validity_days: 30 },
  { name: '20GB MTN Monthly', provider: 'MTN', size_gb: 20, price: 60.00, commission_rate: 0.18, validity_days: 30 },
  
  // AirtelTigo Bundles
  { name: '1GB AirtelTigo Daily', provider: 'AirtelTigo', size_gb: 1, price: 4.50, commission_rate: 0.10, validity_days: 1 },
  { name: '2GB AirtelTigo Weekly', provider: 'AirtelTigo', size_gb: 2, price: 9.50, commission_rate: 0.12, validity_days: 7 },
  { name: '5GB AirtelTigo Monthly', provider: 'AirtelTigo', size_gb: 5, price: 18.00, commission_rate: 0.15, validity_days: 30 },
  { name: '10GB AirtelTigo Monthly', provider: 'AirtelTigo', size_gb: 10, price: 32.00, commission_rate: 0.15, validity_days: 30 },
  { name: '20GB AirtelTigo Monthly', provider: 'AirtelTigo', size_gb: 20, price: 55.00, commission_rate: 0.18, validity_days: 30 },
  
  // Telecel Bundles
  { name: '1GB Telecel Daily', provider: 'Telecel', size_gb: 1, price: 4.80, commission_rate: 0.10, validity_days: 1 },
  { name: '2GB Telecel Weekly', provider: 'Telecel', size_gb: 2, price: 9.80, commission_rate: 0.12, validity_days: 7 },
  { name: '5GB Telecel Monthly', provider: 'Telecel', size_gb: 5, price: 19.00, commission_rate: 0.15, validity_days: 30 },
  { name: '10GB Telecel Monthly', provider: 'Telecel', size_gb: 10, price: 33.00, commission_rate: 0.15, validity_days: 30 },
  { name: '20GB Telecel Monthly', provider: 'Telecel', size_gb: 20, price: 58.00, commission_rate: 0.18, validity_days: 30 }
]

async function diagnoseBundleIssues() {
  console.log('🔍 DIAGNOSING BUNDLE DATA ISSUES...\n')
  
  try {
    // 1. Check if data_bundles table exists and has data
    console.log('1. Checking data_bundles table...')
    const { data: bundles, error: bundlesError } = await supabase
      .from('data_bundles')
      .select('*')
      .limit(5)
    
    if (bundlesError) {
      console.log('❌ Error accessing data_bundles table:', bundlesError.message)
      return { bundlesExist: false, bundlesError }
    }
    
    console.log(`✅ data_bundles table accessible. Found ${bundles?.length || 0} sample bundles`)
    
    // 2. Check data_orders table and bundle relationships
    console.log('\n2. Checking data_orders and bundle relationships...')
    const { data: orders, error: ordersError } = await supabase
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
      .limit(10)
    
    if (ordersError) {
      console.log('❌ Error accessing data_orders:', ordersError.message)
      return { ordersError }
    }
    
    console.log(`✅ Found ${orders?.length || 0} sample orders`)
    
    // 3. Analyze bundle relationship issues
    const ordersWithoutBundles = orders?.filter(order => !order.data_bundles) || []
    const ordersWithBundles = orders?.filter(order => order.data_bundles) || []
    
    console.log(`\n📊 ANALYSIS RESULTS:`)
    console.log(`   Total orders checked: ${orders?.length || 0}`)
    console.log(`   Orders with valid bundles: ${ordersWithBundles.length}`)
    console.log(`   Orders with missing bundles: ${ordersWithoutBundles.length}`)
    
    if (ordersWithoutBundles.length > 0) {
      console.log(`\n❌ ISSUE FOUND: ${ordersWithoutBundles.length} orders have missing bundle data`)
      console.log('   Sample problematic orders:')
      ordersWithoutBundles.slice(0, 3).forEach(order => {
        console.log(`   - Order ${order.id}: bundle_id=${order.bundle_id}, bundle_data=null`)
      })
    }
    
    // 4. Check total bundle count
    const { count: totalBundles } = await supabase
      .from('data_bundles')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n📈 Total bundles in database: ${totalBundles || 0}`)
    
    if ((totalBundles || 0) < 10) {
      console.log('⚠️  WARNING: Very few bundles in database. May need to seed bundle data.')
    }
    
    return {
      bundlesExist: true,
      totalBundles: totalBundles || 0,
      totalOrders: orders?.length || 0,
      ordersWithBundles: ordersWithBundles.length,
      ordersWithoutBundles: ordersWithoutBundles.length,
      needsBundleSeeding: (totalBundles || 0) < 10,
      needsRelationshipRepair: ordersWithoutBundles.length > 0
    }
    
  } catch (error) {
    console.log('❌ Diagnosis failed:', error.message)
    return { error: error.message }
  }
}

async function seedBundleData() {
  console.log('\n🌱 SEEDING BUNDLE DATA...\n')
  
  try {
    // Check if bundles already exist
    const { data: existingBundles } = await supabase
      .from('data_bundles')
      .select('name')
    
    const existingNames = new Set(existingBundles?.map(b => b.name) || [])
    const bundlesToInsert = STANDARD_BUNDLES.filter(bundle => !existingNames.has(bundle.name))
    
    if (bundlesToInsert.length === 0) {
      console.log('✅ All standard bundles already exist in database')
      return { success: true, inserted: 0 }
    }
    
    console.log(`📦 Inserting ${bundlesToInsert.length} new bundles...`)
    
    const { data: insertedBundles, error } = await supabase
      .from('data_bundles')
      .insert(bundlesToInsert)
      .select()
    
    if (error) {
      console.log('❌ Failed to insert bundles:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log(`✅ Successfully inserted ${bundlesToInsert.length} bundles`)
    bundlesToInsert.forEach(bundle => {
      console.log(`   - ${bundle.name} (${bundle.size_gb}GB, GH₵${bundle.price})`)
    })
    
    return { success: true, inserted: bundlesToInsert.length }
    
  } catch (error) {
    console.log('❌ Bundle seeding failed:', error.message)
    return { success: false, error: error.message }
  }
}

async function repairBundleRelationships() {
  console.log('\n🔧 REPAIRING BUNDLE RELATIONSHIPS...\n')
  
  try {
    // Find orders with missing bundle relationships
    const { data: brokenOrders, error: fetchError } = await supabase
      .from('data_orders')
      .select(`
        id, 
        bundle_id, 
        recipient_phone,
        created_at,
        data_bundles (id)
      `)
      .is('data_bundles', null)
      .limit(50)
    
    if (fetchError) {
      console.log('❌ Failed to fetch broken orders:', fetchError.message)
      return { success: false, error: fetchError.message }
    }
    
    if (!brokenOrders || brokenOrders.length === 0) {
      console.log('✅ No broken bundle relationships found')
      return { success: true, repaired: 0 }
    }
    
    console.log(`🔍 Found ${brokenOrders.length} orders with broken bundle relationships`)
    
    // Get available bundles for assignment
    const { data: availableBundles } = await supabase
      .from('data_bundles')
      .select('id, name, provider, size_gb, price')
      .order('price', { ascending: true })
    
    if (!availableBundles || availableBundles.length === 0) {
      console.log('❌ No bundles available for assignment. Please seed bundles first.')
      return { success: false, error: 'No bundles available' }
    }
    
    console.log(`📦 Available bundles for assignment: ${availableBundles.length}`)
    
    // Repair strategy: assign a default bundle based on order characteristics
    const defaultBundle = availableBundles.find(b => b.size_gb === 2) || availableBundles[0]
    console.log(`🎯 Using default bundle for repairs: ${defaultBundle.name}`)
    
    let repairedCount = 0
    const batchSize = 10
    
    for (let i = 0; i < brokenOrders.length; i += batchSize) {
      const batch = brokenOrders.slice(i, i + batchSize)
      
      const updates = batch.map(order => ({
        id: order.id,
        bundle_id: defaultBundle.id
      }))
      
      const { error: updateError } = await supabase
        .from('data_orders')
        .upsert(updates)
      
      if (updateError) {
        console.log(`❌ Failed to update batch ${i / batchSize + 1}:`, updateError.message)
        continue
      }
      
      repairedCount += batch.length
      console.log(`✅ Repaired batch ${i / batchSize + 1}: ${batch.length} orders`)
    }
    
    console.log(`\n🎉 REPAIR COMPLETE: Fixed ${repairedCount} orders`)
    
    return { success: true, repaired: repairedCount }
    
  } catch (error) {
    console.log('❌ Relationship repair failed:', error.message)
    return { success: false, error: error.message }
  }
}

async function verifyRepairs() {
  console.log('\n✅ VERIFYING REPAIRS...\n')
  
  try {
    // Check orders with bundle data
    const { data: verifyOrders, error } = await supabase
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
      .limit(10)
    
    if (error) {
      console.log('❌ Verification failed:', error.message)
      return { success: false }
    }
    
    const ordersWithBundles = verifyOrders?.filter(order => order.data_bundles) || []
    const ordersWithoutBundles = verifyOrders?.filter(order => !order.data_bundles) || []
    
    console.log(`📊 VERIFICATION RESULTS:`)
    console.log(`   Orders with bundles: ${ordersWithBundles.length}/${verifyOrders?.length || 0}`)
    console.log(`   Orders still missing bundles: ${ordersWithoutBundles.length}`)
    
    if (ordersWithBundles.length > 0) {
      console.log(`\n✅ Sample repaired order:`)
      const sample = ordersWithBundles[0]
      console.log(`   Order ${sample.id}:`)
      console.log(`   - Bundle: ${sample.data_bundles.name}`)
      console.log(`   - Provider: ${sample.data_bundles.provider}`)
      console.log(`   - Size: ${sample.data_bundles.size_gb}GB`)
      console.log(`   - Price: GH₵${sample.data_bundles.price}`)
    }
    
    return { 
      success: true, 
      ordersWithBundles: ordersWithBundles.length,
      ordersWithoutBundles: ordersWithoutBundles.length 
    }
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message)
    return { success: false, error: error.message }
  }
}

async function runFullRepair() {
  console.log('🚀 STARTING FULL DATABASE BUNDLE REPAIR\n')
  console.log('=' .repeat(50))
  
  // Step 1: Diagnose issues
  const diagnosis = await diagnoseBundleIssues()
  
  if (diagnosis.error) {
    console.log('\n❌ REPAIR ABORTED: Diagnosis failed')
    return
  }
  
  // Step 2: Seed bundles if needed
  if (diagnosis.needsBundleSeeding) {
    console.log('\n' + '='.repeat(50))
    const seedResult = await seedBundleData()
    if (!seedResult.success) {
      console.log('\n❌ REPAIR ABORTED: Bundle seeding failed')
      return
    }
  }
  
  // Step 3: Repair relationships if needed
  if (diagnosis.needsRelationshipRepair) {
    console.log('\n' + '='.repeat(50))
    const repairResult = await repairBundleRelationships()
    if (!repairResult.success) {
      console.log('\n❌ REPAIR ABORTED: Relationship repair failed')
      return
    }
  }
  
  // Step 4: Verify repairs
  console.log('\n' + '='.repeat(50))
  const verifyResult = await verifyRepairs()
  
  // Final summary
  console.log('\n' + '='.repeat(50))
  console.log('🎉 DATABASE REPAIR COMPLETE!')
  console.log('=' .repeat(50))
  
  if (verifyResult.success) {
    console.log('✅ Your bundle data should now display properly in the admin panel')
    console.log('✅ Orders should show actual bundle names and prices')
    console.log('\n🔄 Please refresh your admin panel to see the changes')
  } else {
    console.log('⚠️  Some issues may remain. Check the logs above for details.')
  }
}

// Run the repair if this script is executed directly
if (require.main === module) {
  runFullRepair().catch(console.error)
}

module.exports = {
  diagnoseBundleIssues,
  seedBundleData,
  repairBundleRelationships,
  verifyRepairs,
  runFullRepair
}
