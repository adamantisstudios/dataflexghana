#!/usr/bin/env node

/**
 * Voucher Products Seeding Script
 * 
 * This script seeds the database with starter voucher card products.
 * Run this script to populate the e_products table with initial data.
 * 
 * Usage: node scripts/seed-voucher-products.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Starter voucher products data
const starterProducts = [
  {
    title: 'MTN Mobile Money Transfer - GH₵10',
    description: 'Instant mobile money transfer service for MTN users. Send money to any MTN mobile money account instantly with secure transaction processing.',
    image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
    price: 10.00,
    quantity: 100,
    status: 'published'
  },
  {
    title: 'Vodafone Cash Top-Up - GH₵20',
    description: 'Quick and easy Vodafone Cash top-up service. Add credit to your Vodafone Cash wallet for seamless mobile transactions and payments.',
    image_url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
    price: 20.00,
    quantity: 75,
    status: 'published'
  },
  {
    title: 'AirtelTigo Money Service - GH₵15',
    description: 'Reliable AirtelTigo Money transfer and top-up service. Perfect for bill payments, money transfers, and mobile wallet management.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    price: 15.00,
    quantity: 50,
    status: 'published'
  },
  {
    title: 'Universal Mobile Credit - GH₵25',
    description: 'Multi-network mobile credit voucher that works across all major networks in Ghana. Compatible with MTN, Vodafone, and AirtelTigo.',
    image_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop',
    price: 25.00,
    quantity: 60,
    status: 'published'
  },
  {
    title: 'Digital Payment Voucher - GH₵50',
    description: 'Premium digital payment voucher for online transactions, e-commerce purchases, and digital service payments. Secure and instant activation.',
    image_url: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=300&fit=crop',
    price: 50.00,
    quantity: 30,
    status: 'published'
  },
  {
    title: 'Student Data Bundle - GH₵5',
    description: 'Special discounted data bundle for students. Perfect for online learning, research, and educational activities. Valid for 30 days.',
    image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
    price: 5.00,
    quantity: 200,
    status: 'published'
  },
  {
    title: 'Business Communication Package - GH₵100',
    description: 'Comprehensive communication package for small businesses. Includes voice credits, SMS bundles, and data allowance for business operations.',
    image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    price: 100.00,
    quantity: 20,
    status: 'published'
  },
  {
    title: 'Emergency Top-Up - GH₵3',
    description: 'Quick emergency top-up for urgent communication needs. Instant activation with basic voice and SMS credits included.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    price: 3.00,
    quantity: 150,
    status: 'published'
  }
]

async function seedVoucherProducts() {
  try {
    console.log('🌱 Starting voucher products seeding...')
    
    // Check if products already exist
    const { data: existingProducts, error: checkError } = await supabase
      .from('e_products')
      .select('id, title')
      .limit(1)
    
    if (checkError) {
      throw new Error(`Error checking existing products: ${checkError.message}`)
    }
    
    if (existingProducts && existingProducts.length > 0) {
      console.log('⚠️  Products already exist in the database.')
      console.log('   If you want to add more products, they will be added alongside existing ones.')
      console.log('   If you want to replace all products, please clear the table first.')
    }
    
    // Insert starter products
    console.log(`📦 Inserting ${starterProducts.length} starter voucher products...`)
    
    const { data: insertedProducts, error: insertError } = await supabase
      .from('e_products')
      .insert(starterProducts)
      .select()
    
    if (insertError) {
      throw new Error(`Error inserting products: ${insertError.message}`)
    }
    
    console.log(`✅ Successfully inserted ${insertedProducts.length} voucher products!`)
    
    // Display summary
    const { data: summary, error: summaryError } = await supabase
      .from('e_products')
      .select('status, price, quantity')
    
    if (!summaryError && summary) {
      const stats = summary.reduce((acc, product) => {
        acc.total++
        acc.totalValue += product.price * product.quantity
        acc.totalQuantity += product.quantity
        if (product.status === 'published') acc.published++
        return acc
      }, { total: 0, published: 0, totalValue: 0, totalQuantity: 0 })
      
      console.log('\n📊 Database Summary:')
      console.log(`   Total Products: ${stats.total}`)
      console.log(`   Published Products: ${stats.published}`)
      console.log(`   Total Inventory Quantity: ${stats.totalQuantity}`)
      console.log(`   Total Inventory Value: GH₵${stats.totalValue.toFixed(2)}`)
    }
    
    console.log('\n🎉 Voucher products seeding completed successfully!')
    console.log('   You can now access the admin panel to manage these products.')
    
  } catch (error) {
    console.error('❌ Error seeding voucher products:', error.message)
    process.exit(1)
  }
}

// Run the seeding function
if (require.main === module) {
  seedVoucherProducts()
}

module.exports = { seedVoucherProducts, starterProducts }
