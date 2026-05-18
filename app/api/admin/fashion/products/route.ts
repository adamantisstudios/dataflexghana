import { requireAdminSession } from "@/lib/api-auth"
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

// Generate unique product code
function generateProductCode(categoryId: number, timestamp: number): string {
  const categories: { [key: number]: string } = {
    1: 'TRAD',
    2: 'CASU',
    3: 'EVEN',
    4: 'ACCE',
    5: 'CUST',
  };
  
  const prefix = categories[categoryId] || 'FASH';
  const date = new Date(timestamp);
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  
  return `${prefix}-${dateStr}-${random}`;
}

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = await request.json();
    
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

    // Generate unique product code
    const productCode = generateProductCode(categoryId, Date.now());

    // Insert product into database
    const { data: product, error } = await supabase
      .from('fashion_products')
      .insert({
        title: body.product_name.trim(),
        product_code: productCode,
        description,
        base_price: basePrice,
        include_fabric_cost: includeFabricCost,
        estimated_timeline_days: timelineDays,
        express_sewing_charge: expressSewingCharge,
        commission_amount: commissionAmount,
        category_id: categoryId,
        status,
        image_urls: imageUrls,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { data: products, error } = await supabase
      .from('fashion_products')
      .select(`
        *,
        fashion_categories(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format response with category_name and all required fields
    const formatted = products?.map((p: any) => {
      // Extract timeline days from estimated_timeline_days or parse from completion_time
      let timelineDays = p.estimated_timeline_days || 0;
      if (!timelineDays && p.completion_time) {
        const match = String(p.completion_time).match(/\d+/);
        timelineDays = match ? parseInt(match[0], 10) : 0;
      }
      
      return {
        id: p.id,
        product_name: p.title,
        product_code: p.product_code || 'UNKNOWN',
        description: p.description,
        category_id: p.category_id,
        category_name: p.fashion_categories?.name || 'Unknown',
        base_price: parseFloat(p.base_price),
        commission_amount: parseFloat(p.commission_amount || 0),
        fabric_cost_included: p.include_fabric_cost,
        completion_time: `${timelineDays} days`,
        estimated_timeline_days: timelineDays,
        express_charge: parseFloat(p.express_sewing_charge || p.express_charge || 0),
        image_urls: p.image_urls || [],
        status: p.status,
        created_at: p.created_at,
        updated_at: p.updated_at,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
