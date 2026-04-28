import { NextRequest, NextResponse } from 'next/server';

// Mock categories - replace with actual database queries
const mockCategories = [
  { id: 1, name: 'Traditional Wear', description: 'Traditional and cultural fashion designs' },
  { id: 2, name: 'Casual Wear', description: 'Casual and everyday fashion designs' },
  { id: 3, name: 'Evening Wear', description: 'Formal and evening fashion designs' },
  { id: 4, name: 'Accessories', description: 'Fashion accessories and add-ons' },
  { id: 5, name: 'Custom Design', description: 'Custom designed fashion pieces' },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: mockCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
