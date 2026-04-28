import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const referralId = parseInt(id);

    if (!referralId) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral ID' },
        { status: 400 }
      );
    }

    const { data: updatedReferral, error } = await supabase
      .from('fashion_referrals')
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', referralId)
      .select()
      .single();

    if (error) {
      console.error('[v0] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update referral' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedReferral },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Error updating referral:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update referral' },
      { status: 500 }
    );
  }
}
