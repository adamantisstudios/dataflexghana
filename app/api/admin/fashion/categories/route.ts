import { requireAdminSession } from "@/lib/api-auth"
import { getAdminClient } from "@/lib/supabase-base"
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { data: newCategory, error } = await supabase
      .from('fashion_categories')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      const isDuplicate = error.code === '23505' || /duplicate|unique/i.test(error.message);

      return NextResponse.json(
        {
          success: false,
          error: isDuplicate
            ? 'A Fashion Avenue category with this name already exists'
            : error.message || 'Failed to create category',
        },
        { status: isDuplicate ? 409 : 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: newCategory },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
}
