import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Fetch real referrals from database
    const { data: referrals, error } = await supabase
      .from('fashion_referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching referrals:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch referrals from database',
          data: [], // Return empty array if table doesn't exist yet
        },
        { status: 200 } // Return 200 with empty data rather than 500
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: referrals || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[v0] Error in GET /api/admin/fashion/referrals:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch referrals',
        data: [], // Return empty array on error
      },
      { status: 200 } // Return 200 to prevent UI errors
    );
  }
}
