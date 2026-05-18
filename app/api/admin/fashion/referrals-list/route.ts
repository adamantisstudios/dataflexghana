import { requireAdminSession } from "@/lib/api-auth"
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const { data, error } = await supabase
      .from('fashion_referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[v0] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch referrals', data: [] },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: data || [] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Error fetching referrals:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch referrals', data: [] },
      { status: 200 }
    );
  }
}
