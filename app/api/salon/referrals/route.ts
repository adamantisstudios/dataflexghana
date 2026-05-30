import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// GET - Fetch all referrals
export async function GET(request: NextRequest) {
  try {
    
    const { data: referrals, error } = await supabase
      .from('salon_referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[v0] Supabase error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch referrals from database',
          referrals: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        referrals: referrals || [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[v0] Error fetching referrals:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch referrals',
        referrals: [],
      },
      { status: 200 }
    );
  }
}

// POST - Create new referral
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const referralData = {
      referrer_name: body.referrer_name,
      referrer_whatsapp: body.referrer_whatsapp,
      referrer_email: body.referrer_email || null,
      referred_name: body.referred_name,
      referred_whatsapp: body.referred_whatsapp,
      service_name: body.service_name,
      location: body.location,
      status: 'pending',
      notes: body.notes || '',
    };

    const { data, error } = await supabase
      .from('salon_referrals')
      .insert([referralData])
      .select();

    if (error) {
      console.error('[v0] Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create referral' },
        { status: 200 }
      );
    }

    // Send WhatsApp notification
    const message = `
New Salon Referral!
Referrer: ${referralData.referrer_name}
Referrer Phone: ${referralData.referrer_whatsapp}
Referred Person: ${referralData.referred_name}
Referred Phone: ${referralData.referred_whatsapp}
Service: ${referralData.service_name}
Location: ${referralData.location}
Notes: ${referralData.notes || 'None'}
Date: ${new Date().toLocaleString('en-GB')}
    `.trim();

    try {
      const whatsappUrl = `https://wa.me/233246827049?text=${encodeURIComponent(message)}`;
    } catch (waErr) {
      console.error('[v0] WhatsApp error:', waErr);
    }

    return NextResponse.json({ success: true, referral: data?.[0] }, { status: 200 });
  } catch (err) {
    console.error('[v0] Error creating referral:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create referral' },
      { status: 200 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Referral ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('salon_referrals').delete().eq('id', parseInt(id, 10));
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to delete referral' }, { status: 500 });
  }
}
