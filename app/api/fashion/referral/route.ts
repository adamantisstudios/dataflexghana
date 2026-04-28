import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Generate unique referral token (64 chars)
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Validate WhatsApp number format
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

// Create professional referral WhatsApp message for friend
function createReferralMessage(
  referrerName: string,
  productName: string,
  productCode: string,
  productLink: string
): string {
  return `*👔 Fashion Recommendation from ${referrerName} 👗*

*${productName}*
Code: ${productCode}

Check it out: ${productLink}

*Interested?*
✓ View full details on Fashion Avenue
✓ Chat with our designers: +233 242 799 990
✓ Request a custom variation
✓ Refer & earn commission!

*Premium Custom Fashion Design*
Visit: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://fashion-avenue.example.com'}`;
}

// Create admin notification message
function createAdminNotificationMessage(
  referrerName: string,
  referrerWhatsApp: string,
  friendWhatsApp: string,
  productName: string,
  productCode: string
): string {
  return `*📢 New Referral Alert!*

*From:* ${referrerName}
*Contact:* ${referrerWhatsApp}
*Referred:* ${friendWhatsApp}

*Product Details:*
${productName}
Code: ${productCode}

Status: Pending follow-up`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      referrer_name,
      referrer_whatsapp,
      friend_whatsapp, 
      product_id, 
      product_name,
      product_code 
    } = body;

    console.log('[v0] Referral API received:', { referrer_name, referrer_whatsapp, friend_whatsapp, product_id, product_name, product_code });

    // Validate required fields
    if (!referrer_name || !referrer_whatsapp || !friend_whatsapp || !product_id || !product_name) {
      console.error('[v0] Missing required fields:', { referrer_name, referrer_whatsapp, friend_whatsapp, product_id, product_name });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: referrer_name, referrer_whatsapp, friend_whatsapp, product_id, product_name' },
        { status: 400 }
      );
    }

    // Validate WhatsApp numbers
    if (!validateWhatsAppNumber(friend_whatsapp)) {
      return NextResponse.json(
        { success: false, error: 'Invalid friend WhatsApp number format' },
        { status: 400 }
      );
    }

    // Generate unique referral token
    const token = generateToken();
    
    // Create referral link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/fashion-avenue?ref=${token}&product_id=${product_id}`;

    // Format WhatsApp numbers
    const formattedFriendWhatsApp = formatPhoneNumber(friend_whatsapp);
    const formattedReferrerWhatsApp = referrer_whatsapp ? formatPhoneNumber(referrer_whatsapp) : null;

    // Save to database
    const { data: savedReferral, error: dbError } = await supabase
      .from('fashion_referrals')
      .insert({
        referrer_name: referrer_name.trim(),
        referrer_whatsapp_number: formattedReferrerWhatsApp,
        referred_contact_whatsapp: formattedFriendWhatsApp,
        product_id: parseInt(product_id),
        product_code: product_code || 'UNKNOWN',
        product_name: product_name.trim(),
        status: 'pending',
        whatsapp_message_sent: false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[v0] Database error saving referral:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save referral', details: dbError.message },
        { status: 500 }
      );
    }

    // Create professional message for friend
    const messageText = createReferralMessage(
      referrer_name,
      product_name,
      product_code || 'CUSTOM',
      referralLink
    );

    // Create admin notification message
    const adminNotification = createAdminNotificationMessage(
      referrer_name,
      formattedReferrerWhatsApp || 'Not provided',
      formattedFriendWhatsApp,
      product_name,
      product_code || 'CUSTOM'
    );

    // Create WhatsApp URLs
    const whatsappUrl = `https://wa.me/${formattedFriendWhatsApp}?text=${encodeURIComponent(messageText)}`;
    const adminNotificationUrl = `https://wa.me/233242799990?text=${encodeURIComponent(adminNotification)}`;

    console.log('[v0] Referral created:', {
      referralId: savedReferral.id,
      referrerName: referrer_name,
      friendWhatsApp: formattedFriendWhatsApp,
      adminNotificationUrl
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: savedReferral.id,
          token,
          referralLink,
          whatsappUrl,
          adminNotificationUrl,
          message: messageText,
          referrer_name,
          product_code,
          created_at: savedReferral.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[v0] Error creating referral:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create referral' },
      { status: 500 }
    );
  }
}
