import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Validate WhatsApp number
function validateWhatsAppNumber(number: string): boolean {
  const cleaned = number.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

// Format phone number to international format
function formatPhoneNumber(number: string): string {
  let cleaned = number.replace(/\D/g, '');
  // Add country code if not present (Ghana: 233)
  if (!cleaned.startsWith('233') && cleaned.length === 10) {
    cleaned = '233' + cleaned.substring(1);
  }
  return cleaned;
}

// Create professional WhatsApp message
function createProjectRequestMessage(
  clientName: string,
  productCode: string,
  productName: string,
  location: string,
  timeline: string,
  measurements: string,
  notes: string,
  productLink: string
): string {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `*✨ NEW FASHION PROJECT REQUEST ✨*

*Client Details:*
Name: ${clientName}
Location: ${location}
Date: ${date}

*Product Information:*
Product: ${productName}
Code: ${productCode}
Link: ${productLink}

*Project Requirements:*
Timeline: ${timeline}

${measurements ? `*Measurements:*\n${measurements}\n` : ''}${notes ? `*Additional Notes:*\n${notes}\n` : ''}*---*
Please review this request and contact the client at your earliest convenience.

Submitted via Fashion Avenue | Premium Custom Designs`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      product_code,
      product_name,
      client_name,
      client_location,
      client_whatsapp,
      timeline_preference,
      measurements,
      additional_notes,
    } = body;

    // Validate required fields
    if (!client_name || !client_whatsapp || !product_code || !product_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: client_name, client_whatsapp, product_code, product_id' },
        { status: 400 }
      );
    }

    // Validate WhatsApp number
    if (!validateWhatsAppNumber(client_whatsapp)) {
      return NextResponse.json(
        { success: false, error: 'Invalid WhatsApp number format. Please provide a valid phone number.' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedWhatsApp = formatPhoneNumber(client_whatsapp);

    // Save to database
    const { data: savedRequest, error: dbError } = await supabase
      .from('fashion_project_requests')
      .insert({
        product_id: parseInt(product_id),
        product_code,
        client_name: client_name.trim(),
        client_whatsapp: formattedWhatsApp,
        client_location: client_location || 'Not specified',
        timeline_preference: timeline_preference || 'Not specified',
        measurements: measurements || null,
        additional_notes: additional_notes || null,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('[v0] Database error saving project request:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save project request', details: dbError.message },
        { status: 500 }
      );
    }

    // Create product link
    const productLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'}/fashion-avenue#product-${product_id}`;

    // Create professional message
    const messageText = createProjectRequestMessage(
      client_name,
      product_code,
      product_name || 'Custom Project',
      client_location || 'Not specified',
      timeline_preference || 'Not specified',
      measurements || '',
      additional_notes || '',
      productLink
    );

    // Create WhatsApp URL
    const designerNumber = '233246827049';
    const whatsappUrl = `https://wa.me/${designerNumber}?text=${encodeURIComponent(messageText)}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: savedRequest.id,
          whatsappUrl,
          message: messageText,
          client_name,
          product_code,
          created_at: savedRequest.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Error creating project request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create project request' },
      { status: 500 }
    );
  }
}
