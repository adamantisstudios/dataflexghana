import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);



export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('salon_categories')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ categories: data || [] });
  } catch (error) {
    console.error('Categories API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('salon_categories')
      .insert([{ name: body.name, description: body.description }])
      .select();

    if (error) throw error;

    return NextResponse.json({ data: data[0] });
  } catch (error) {
    console.error('Category Creation Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 400 }
    );
  }
}
