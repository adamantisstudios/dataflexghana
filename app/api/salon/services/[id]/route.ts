import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const serviceId = parseInt(params.id);

    const { error } = await supabase
      .from('salon_services')
      .delete()
      .eq('id', serviceId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Service Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete service' },
      { status: 400 }
    );
  }
}
