import { requireAdminSession } from "@/lib/api-auth"
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // In a real app, save to database
    const newCategory = {
      id: Date.now(),
      name: body.name,
      description: body.description || '',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data: newCategory },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
