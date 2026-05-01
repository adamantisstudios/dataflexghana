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
    const requestId = parseInt(id);

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    
    if (body.status) {
      updateData.status = body.status;
      updateData.updated_at = new Date().toISOString();
    }
    
    if (body.admin_notes !== undefined) {
      updateData.admin_notes = body.admin_notes;
      updateData.updated_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data: updatedRequest, error } = await supabase
      .from('fashion_project_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      console.error('[v0] Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: updatedRequest },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[v0] Error updating project request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update request' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = parseInt(id, 10);

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Invalid request ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('fashion_project_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to delete request' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete request' },
      { status: 500 }
    );
  }
}
