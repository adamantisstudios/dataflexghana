import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Fallback mock data for development
const mockProducts = [
  {
    id: 1,
    product_name: 'Classic Evening Dress',
    product_code: 'DRESS-001',
    description: 'Elegant evening dress perfect for formal occasions',
    category_id: 3,
    category_name: 'Evening Wear',
    base_price: 250,
    fabric_cost_included: true,
    completion_time: '14 days',
    express_charge: 50,
    commission_amount: 25,
    image_paths: ['/fashion-images/evening-dress-1.jpg'],
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    product_name: 'Traditional Kente Design',
    product_code: 'KENTE-001',
    description: 'Beautiful traditional kente cloth design',
    category_id: 1,
    category_name: 'Traditional Wear',
    base_price: 200,
    fabric_cost_included: false,
    completion_time: '21 days',
    express_charge: 75,
    commission_amount: 20,
    image_paths: ['/fashion-images/kente-1.jpg'],
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    product_name: 'Casual Shirt',
    product_code: 'SHIRT-001',
    description: 'Comfortable casual shirt for everyday wear',
    category_id: 2,
    category_name: 'Casual Wear',
    base_price: 80,
    fabric_cost_included: true,
    completion_time: '10 days',
    express_charge: 30,
    commission_amount: 8,
    image_paths: ['/fashion-images/casual-shirt-1.jpg'],
    status: 'active',
    created_at: new Date().toISOString(),
  },
];

const mockCategories = [
  { id: 1, name: 'Traditional Wear', description: 'Traditional and cultural fashion designs' },
  { id: 2, name: 'Casual Wear', description: 'Casual and everyday fashion designs' },
  { id: 3, name: 'Evening Wear', description: 'Formal and evening fashion designs' },
  { id: 4, name: 'Accessories', description: 'Fashion accessories and add-ons' },
  { id: 5, name: 'Custom Design', description: 'Custom designed fashion pieces' },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build Supabase query
    let query = supabase
      .from('fashion_products')
      .select(
        `
        *,
        fashion_categories(name)
      `,
        { count: 'exact' }
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // Add category filter if provided
    if (category) {
      query = query.eq('category_id', parseInt(category));
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: products, count, error } = await query;

    if (error) {
      throw error;
    }

    // Format response with field mappings
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
        product_code: p.product_code || `PROD-${p.id}`,
        description: p.description,
        category_id: p.category_id,
        category_name: p.fashion_categories?.name || 'Unknown',
        base_price: parseFloat(p.base_price),
        fabric_cost_included: p.include_fabric_cost,
        completion_time: `${timelineDays} days`,
        estimated_timeline_days: timelineDays,
        express_charge: parseFloat(p.express_sewing_charge || p.express_charge || 0),
        commission_amount: parseFloat(p.commission_amount || 0),
        image_urls: p.image_urls || [],
        status: p.status,
        created_at: p.created_at,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
