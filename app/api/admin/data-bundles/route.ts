import { NextRequest, NextResponse } from 'next/server'
import { supabase, validateCommissionRate, calculatePreciseCommission } from '@/lib/supabase'
import { authenticateAdmin } from '@/lib/api-auth'

// GET - Fetch all data bundles
export async function GET(request: NextRequest) {
  try {
    // CRITICAL FIX: Add proper admin authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can manage data bundles', details: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    const admin = authResult.user;
    console.log('✅ Admin authenticated for data bundles fetch:', admin.id);

    const { data: bundles, error } = await supabase
      .from('data_bundles')
      .select('*')
      .order('provider', { ascending: true })
      .order('size_gb', { ascending: true })

    if (error) {
      console.error('Error fetching data bundles:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch data bundles', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: bundles || []
    })
  } catch (error) {
    console.error('Unexpected error in GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Create new data bundle
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/admin/data-bundles - Starting request processing')

    // CRITICAL FIX: Add proper admin authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can manage data bundles', details: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    const admin = authResult.user;
    console.log('✅ Admin authenticated for data bundle creation:', admin.id);

    const body = await request.json()
    console.log('Request body received:', JSON.stringify(body, null, 2))

    const {
      name,
      provider,
      size_gb,
      price,
      validity_months,
      commission_rate,
      image_url
    } = body

    // CRITICAL FIX: Validate commission rate
    console.log('Validating commission rate:', commission_rate)
    const rateValidation = validateCommissionRate(commission_rate)
    console.log('Commission rate validation result:', rateValidation)
    
    if (!rateValidation.isValid) {
      console.error('Commission rate validation failed:', rateValidation.error)
      return NextResponse.json(
        { success: false, error: rateValidation.error || 'Invalid commission rate' },
        { status: 400 }
      )
    }

    // Validate other required fields
    if (!name || !provider || !size_gb || !price || !validity_months) {
      const missingFields = []
      if (!name) missingFields.push('name')
      if (!provider) missingFields.push('provider')
      if (!size_gb) missingFields.push('size_gb')
      if (!price) missingFields.push('price')
      if (!validity_months) missingFields.push('validity_months')
      
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`
      console.error('Validation error:', errorMsg)
      return NextResponse.json(
        { success: false, error: errorMsg },
        { status: 400 }
      )
    }

    // Validate provider
    if (!['MTN', 'AirtelTigo', 'Telecel'].includes(provider)) {
      console.error('Invalid provider:', provider)
      return NextResponse.json(
        { success: false, error: `Invalid provider: ${provider}. Must be MTN, AirtelTigo, or Telecel` },
        { status: 400 }
      )
    }

    // Validate numeric fields
    const numericSizeGb = parseInt(size_gb)
    const numericPrice = parseFloat(price)
    const numericValidityMonths = parseInt(validity_months)

    if (isNaN(numericSizeGb) || numericSizeGb <= 0) {
      console.error('Invalid size_gb:', size_gb)
      return NextResponse.json(
        { success: false, error: `Invalid size_gb value: ${size_gb}. Must be a positive integer` },
        { status: 400 }
      )
    }

    if (isNaN(numericPrice) || numericPrice <= 0) {
      console.error('Invalid price:', price)
      return NextResponse.json(
        { success: false, error: `Invalid price value: ${price}. Must be a positive number` },
        { status: 400 }
      )
    }

    if (isNaN(numericValidityMonths) || numericValidityMonths <= 0) {
      console.error('Invalid validity_months:', validity_months)
      return NextResponse.json(
        { success: false, error: `Invalid validity_months value: ${validity_months}. Must be a positive integer` },
        { status: 400 }
      )
    }

    // CRITICAL FIX: Ensure precise decimal storage
    const preciseCommissionRate = parseFloat(rateValidation.numericValue!.toFixed(6))
    console.log('Precise commission rate:', preciseCommissionRate)

    // Calculate sample commission for validation
    const commissionCalculation = calculatePreciseCommission(numericPrice, preciseCommissionRate)
    console.log('Commission calculation result:', commissionCalculation)
    
    if (!commissionCalculation.isValid) {
      console.error('Commission calculation failed:', commissionCalculation.error)
      return NextResponse.json(
        { success: false, error: commissionCalculation.error || 'Failed to calculate commission' },
        { status: 400 }
      )
    }

    const bundleData = {
      name: name.trim(),
      provider,
      size_gb: numericSizeGb,
      price: numericPrice,
      validity_months: numericValidityMonths,
      commission_rate: preciseCommissionRate,
      image_url: image_url?.trim() || null,
      is_active: true
    }

    console.log('Final bundle data to insert:', JSON.stringify(bundleData, null, 2))

    const { data: newBundle, error: insertError } = await supabase
      .from('data_bundles')
      .insert([bundleData])
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create data bundle', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('Bundle created successfully:', newBundle)
    return NextResponse.json({
      success: true,
      data: newBundle,
      message: 'Data bundle created successfully'
    })
  } catch (error) {
    console.error('Unexpected error in POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT - Update existing data bundle
export async function PUT(request: NextRequest) {
  try {
    // CRITICAL FIX: Add proper admin authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can manage data bundles', details: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    const admin = authResult.user;
    console.log('✅ Admin authenticated for data bundle update:', admin.id);

    const body = await request.json()
    const {
      id,
      name,
      provider,
      size_gb,
      price,
      validity_months,
      commission_rate,
      image_url,
      is_active
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    // Check if bundle exists
    const { data: existingBundle, error: fetchError } = await supabase
      .from('data_bundles')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingBundle) {
      return NextResponse.json(
        { success: false, error: 'Data bundle not found' },
        { status: 404 }
      )
    }

    // Build update object with only provided fields
    const updateData: any = {}

    if (name !== undefined) {
      updateData.name = name.trim()
    }

    if (provider !== undefined) {
      if (!['MTN', 'AirtelTigo', 'Telecel'].includes(provider)) {
        return NextResponse.json(
          { success: false, error: 'Invalid provider' },
          { status: 400 }
        )
      }
      updateData.provider = provider
    }

    if (size_gb !== undefined) {
      const numericSizeGb = parseInt(size_gb)
      if (isNaN(numericSizeGb) || numericSizeGb <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid size_gb value' },
          { status: 400 }
        )
      }
      updateData.size_gb = numericSizeGb
    }

    if (price !== undefined) {
      const numericPrice = parseFloat(price)
      if (isNaN(numericPrice) || numericPrice <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid price value' },
          { status: 400 }
        )
      }
      updateData.price = numericPrice
    }

    if (validity_months !== undefined) {
      const numericValidityMonths = parseInt(validity_months)
      if (isNaN(numericValidityMonths) || numericValidityMonths <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid validity_months value' },
          { status: 400 }
        )
      }
      updateData.validity_months = numericValidityMonths
    }

    // CRITICAL FIX: Handle commission rate updates with precision
    if (commission_rate !== undefined) {
      const rateValidation = validateCommissionRate(commission_rate)
      if (!rateValidation.isValid) {
        return NextResponse.json(
          { success: false, error: rateValidation.error },
          { status: 400 }
        )
      }
      
      // CRITICAL FIX: Ensure precise decimal storage
      updateData.commission_rate = parseFloat(rateValidation.numericValue!.toFixed(6))
    }

    if (image_url !== undefined) {
      updateData.image_url = image_url?.trim() || null
    }

    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active)
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    const { data: updatedBundle, error: updateError } = await supabase
      .from('data_bundles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating data bundle:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update data bundle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedBundle,
      message: 'Data bundle updated successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete data bundle
export async function DELETE(request: NextRequest) {
  try {
    // CRITICAL FIX: Add proper admin authentication
    const authResult = await authenticateAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can manage data bundles', details: authResult.error || 'Admin authentication required' },
        { status: 401 }
      );
    }

    const admin = authResult.user;
    console.log('✅ Admin authenticated for data bundle deletion:', admin.id);

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    // Check if bundle exists
    const { data: existingBundle, error: fetchError } = await supabase
      .from('data_bundles')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingBundle) {
      return NextResponse.json(
        { success: false, error: 'Data bundle not found' },
        { status: 404 }
      )
    }

    // Check if bundle is being used in any orders
    const { data: orders, error: ordersError } = await supabase
      .from('data_orders')
      .select('id')
      .eq('bundle_id', id)
      .limit(1)

    if (ordersError) {
      console.error('Error checking bundle usage:', ordersError)
      return NextResponse.json(
        { success: false, error: 'Failed to check bundle usage' },
        { status: 500 }
      )
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete bundle that has been used in orders. Consider deactivating it instead.' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('data_bundles')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting data bundle:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete data bundle' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data bundle deleted successfully'
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
