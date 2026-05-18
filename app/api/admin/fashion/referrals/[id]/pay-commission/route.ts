import { requireAdminSession } from "@/lib/api-auth"
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
  const adminSession = await requireAdminSession(request)
  if (!adminSession.ok) return adminSession.response

  try {
    const referralId = parseInt(params.id);

    // In a real app, update status to 'commission_paid' in database
    const updated = {
      id: referralId,
      status: 'commission_paid',
      commission_paid_at: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking commission as paid:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark commission as paid' },
      { status: 500 }
    );
  }
}
