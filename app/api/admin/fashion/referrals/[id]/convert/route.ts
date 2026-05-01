import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const referralId = parseInt(params.id);

    // In a real app, update status to 'converted' in database
    const updated = {
      id: referralId,
      status: 'converted',
      converted_at: new Date().toISOString(),
    };

    return NextResponse.json(
      { success: true, data: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking referral as converted:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark referral as converted' },
      { status: 500 }
    );
  }
}
