import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      recipient_phone,
      message_type,
      message_content,
      formatted_message,
      recipient_type,
      recipient_id,
      delivery_status = "pending",
    } = body

    // Validate required fields
    if (!recipient_phone || !message_type || !formatted_message || !recipient_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Insert WhatsApp message log
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .insert([
        {
          recipient_phone,
          message_type,
          message_content,
          formatted_message,
          recipient_type,
          recipient_id,
          delivery_status,
        },
      ])
      .select()

    if (error) {
      console.error("Error logging WhatsApp message:", error)
      return NextResponse.json({ error: "Failed to log WhatsApp message" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message_id: data[0]?.id,
      message: "WhatsApp message logged successfully",
    })
  } catch (error) {
    console.error("WhatsApp log API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { message_id, delivery_status, whatsapp_response } = body

    if (!message_id || !delivery_status) {
      return NextResponse.json({ error: "Missing message_id or delivery_status" }, { status: 400 })
    }

    // Update WhatsApp message status
    const { data, error } = await supabase
      .from("whatsapp_messages")
      .update({
        delivery_status,
        whatsapp_response,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message_id)
      .select()

    if (error) {
      console.error("Error updating WhatsApp message status:", error)
      return NextResponse.json({ error: "Failed to update WhatsApp message status" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "WhatsApp message status updated successfully",
    })
  } catch (error) {
    console.error("WhatsApp status update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
