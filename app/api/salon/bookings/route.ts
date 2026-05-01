import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const WHATSAPP_NUMBER = '+233242799990';

// Generate WhatsApp URL for booking
function generateWhatsAppUrl(booking: any): string {
  const message = encodeURIComponent(
    `Hello! I'd like to book *${booking.service_name}*\n\n` +
    `Client Name: ${booking.client_name}\n` +
    `Location: ${booking.location}\n` +
    `Preferred Date: ${booking.preferred_date}\n` +
    `Preferred Time: ${booking.preferred_time}\n` +
    `${booking.notes ? `Notes: ${booking.notes}\n` : ''}` +
    `WhatsApp: ${booking.client_whatsapp}`
  );
  return `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '100';
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const location = searchParams.get('location');

    let query = supabase
      .from('salon_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category_id', parseInt(category));
    }
    if (location) {
      query = query.eq('location', location);
    }

    const { data, error } = await query.limit(parseInt(limit));

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (error) {
    console.error('Bookings API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate WhatsApp URL
    const whatsappUrl = generateWhatsAppUrl(body);

    // Try to save to database
    try {
      const { data, error } = await supabase
        .from('salon_bookings')
        .insert([
          {
            service_id: body.service_id,
            service_name: body.service_name,
            client_name: body.client_name,
            client_whatsapp: body.client_whatsapp,
            location: body.location,
            preferred_date: body.preferred_date,
            preferred_time: body.preferred_time,
            notes: body.notes,
            status: 'pending',
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          data: {
            ...data[0],
            whatsappUrl,
          },
        });
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    // Return WhatsApp URL even if database save fails
    return NextResponse.json({
      success: true,
      data: {
        whatsappUrl,
        client_name: body.client_name,
        service_name: body.service_name,
      },
    });
  } catch (error) {
    console.error('Booking Creation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('salon_bookings').delete().eq('id', parseInt(id, 10));
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete booking' }, { status: 500 });
  }
}
