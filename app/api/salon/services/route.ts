import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);



export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '100';
    const category = searchParams.get('category');

    // Try to fetch from Supabase
    let query = supabase
      .from('salon_services')
      .select(`
        *,
        salon_categories(name)
      `);
    
    if (category && category !== 'all') {
      query = query.eq('category_id', parseInt(category));
    }

    const { data, error } = await query.limit(parseInt(limit));

    if (error) throw error;

    const formatted = (data || []).map((service: any) => ({
      ...service,
      category_name: service.salon_categories?.name || service.category_name || '',
      provider_contact: service.provider_contact || service.provider_phone || '',
      provider_social:
        service.provider_social ??
        service.provider_social_media?.handles ??
        service.provider_social_media ??
        '',
    }));

    return NextResponse.json({ data: formatted });
  } catch (error) {
    console.error('Services API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[v0] Creating new service:', body.service_name);

    const { data, error } = await supabase
      .from('salon_services')
      .insert([
        {
          service_name: body.service_name,
          service_code: body.service_code,
          description: body.description,
          category_id: body.category_id,
          base_price: body.base_price,
          express_price: body.express_price || null,
          duration_minutes: body.duration_minutes,
          provider_name: body.provider_name,
          provider_contact: body.provider_contact || body.provider_phone || null,
          provider_location: body.provider_location || null,
          provider_availability: body.provider_availability || null,
          provider_social_media: body.provider_social || body.provider_social_media || null,
          image_urls: body.image_urls || [],
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error('[v0] Supabase insert error:', JSON.stringify(error));
      return NextResponse.json(
        { success: false, error: `Failed to create service: ${error.message}` },
        { status: 200 }
      );
    }

    console.log('[v0] Service created successfully:', data?.[0]?.id);
    return NextResponse.json({ success: true, data: data?.[0] }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[v0] Service Creation Error:', errorMsg);
    return NextResponse.json(
      { success: false, error: `Failed to create service: ${errorMsg}` },
      { status: 200 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      console.error('[v0] No service ID provided for update');
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 200 }
      );
    }

    console.log('[v0] Updating service:', body.id);

    const updateData: Record<string, any> = {
      service_name: body.service_name,
      service_code: body.service_code,
      description: body.description,
      category_id: body.category_id,
      base_price: body.base_price,
      express_price: body.express_price || null,
      duration_minutes: body.duration_minutes,
      provider_name: body.provider_name,
      provider_contact: body.provider_contact || body.provider_phone || null,
      provider_location: body.provider_location || null,
      provider_availability: body.provider_availability || null,
      provider_social_media: body.provider_social || body.provider_social_media || null,
      status: body.status || 'active',
      updated_at: new Date().toISOString(),
    };

    // Include image_urls if provided
    if (body.image_urls) {
      updateData.image_urls = body.image_urls;
    }

    const { data, error } = await supabase
      .from('salon_services')
      .update(updateData)
      .eq('id', body.id)
      .select();

    if (error) {
      console.error('[v0] Supabase update error:', JSON.stringify(error));
      return NextResponse.json(
        { success: false, error: `Failed to update service: ${error.message}` },
        { status: 200 }
      );
    }

    console.log('[v0] Service updated successfully:', body.id);
    return NextResponse.json({ success: true, data: data?.[0] }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[v0] Service Update Error:', errorMsg);
    return NextResponse.json(
      { success: false, error: `Failed to update service: ${errorMsg}` },
      { status: 200 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    console.log('[v0] Deleting service with ID:', id);

    if (!id) {
      console.error('[v0] No service ID provided');
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 200 }
      );
    }

    const { error } = await supabase
      .from('salon_services')
      .delete()
      .eq('id', parseInt(id));

    if (error) {
      console.error('[v0] Supabase delete error:', JSON.stringify(error));
      return NextResponse.json(
        { success: false, error: `Failed to delete service: ${error.message}` },
        { status: 200 }
      );
    }

    console.log('[v0] Service deleted successfully:', id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[v0] Service Deletion Error:', errorMsg);
    return NextResponse.json(
      { success: false, error: `Failed to delete service: ${errorMsg}` },
      { status: 200 }
    );
  }
}
