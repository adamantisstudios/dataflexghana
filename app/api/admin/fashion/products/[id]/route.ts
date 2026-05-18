import { requireAdminSession } from "@/lib/api-auth"
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id } = await params;
    const { data: product, error } = await supabase
      .from('fashion_products')
      .select(`
        *,
        fashion_categories(name)
      `)
      .eq('id', parseInt(id))
      .single();

    if (error) {
      throw error;
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Extract timeline days from estimated_timeline_days or parse from completion_time
    let timelineDays = product.estimated_timeline_days || 0;
    if (!timelineDays && product.completion_time) {
      const match = String(product.completion_time).match(/\d+/);
      timelineDays = match ? parseInt(match[0], 10) : 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        product_name: product.title,
        product_code: product.product_code || 'UNKNOWN',
        description: product.description,
        category_id: product.category_id,
        category_name: product.fashion_categories?.name || 'Unknown',
        base_price: parseFloat(product.base_price),
        commission_amount: parseFloat(product.commission_amount || 0),
        fabric_cost_included: product.include_fabric_cost,
        completion_time: `${timelineDays} days`,
        estimated_timeline_days: timelineDays,
        express_charge: parseFloat(product.express_sewing_charge || product.express_charge || 0),
        image_urls: product.image_urls || [],
        status: product.status,
        created_at: product.created_at,
        updated_at: product.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// Helper function to safely convert to number
function safeParseInt(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseInt(String(value), 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Helper function to safely convert to float
function safeParseFloat(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? defaultValue : parsed;
}

// Helper function to safely convert to boolean
function safeParseBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
}

export async function PUT(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = await request.json();
    const { id } = await params;
    
    // Safely parse product ID from URL params
    const productId = safeParseInt(id);
    if (productId === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Validate required fields with descriptive messages
    if (!body.product_name || typeof body.product_name !== 'string' || !body.product_name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Product name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const categoryId = safeParseInt(body.category_id);
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Valid category_id is required' },
        { status: 400 }
      );
    }

    const basePrice = safeParseFloat(body.base_price);
    if (basePrice === 0 && body.base_price !== 0) {
      return NextResponse.json(
        { success: false, error: 'Valid base_price is required' },
        { status: 400 }
      );
    }

    // Parse timeline days from completion_time (e.g., "10-14 days" -> first digit or default to 0)
    let timelineDays = 0;
    if (body.completion_time) {
      const match = String(body.completion_time).match(/(\d+)/);
      if (match) {
        timelineDays = safeParseInt(match[0], 0);
      }
    }

    // Safely parse numeric and boolean fields
    const expressSewingCharge = safeParseFloat(body.express_charge, 0);
    const commissionAmount = safeParseFloat(body.commission_amount, 0);
    const includeFabricCost = safeParseBoolean(body.fabric_cost_included, false);
    const imageUrls = Array.isArray(body.image_urls) ? body.image_urls : [];
    const status = body.status || 'active';
    const description = body.description || '';
    const productCode = body.product_code || undefined; // Keep existing if not provided

    // Update product using parameterized query
    const { data: product, error } = await supabase
      .from('fashion_products')
      .update({
        title: body.product_name.trim(),
        description,
        base_price: basePrice,
        include_fabric_cost: includeFabricCost,
        estimated_timeline_days: timelineDays,
        express_sewing_charge: expressSewingCharge,
        commission_amount: commissionAmount,
        category_id: categoryId,
        status,
        image_urls: imageUrls,
        ...(productCode && { product_code: productCode }),
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Extract timeline days from estimated_timeline_days or parse from completion_time
    let responseTimelineDays = product.estimated_timeline_days || 0;
    if (!responseTimelineDays && product.completion_time) {
      const match = String(product.completion_time).match(/\d+/);
      responseTimelineDays = match ? parseInt(match[0], 10) : 0;
    }

    // Format response with all fields
    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        product_name: product.title,
        product_code: product.product_code,
        description: product.description,
        category_id: product.category_id,
        base_price: parseFloat(product.base_price),
        commission_amount: parseFloat(product.commission_amount || 0),
        fabric_cost_included: product.include_fabric_cost,
        completion_time: `${responseTimelineDays} days`,
        estimated_timeline_days: responseTimelineDays,
        express_charge: parseFloat(product.express_sewing_charge || product.express_charge || 0),
        image_urls: product.image_urls || [],
        status: product.status,
        created_at: product.created_at,
        updated_at: product.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { id } = await params;
    const productId = parseInt(id);

    // Delete product (cascades to images and referrals)
    const { error } = await supabase
      .from('fashion_products')
      .delete()
      .eq('id', productId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
