import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.clientName || !body.clientPhone || !body.clientLocation || !body.serviceType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const transformedData = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === "" ? null : value]),
    )

    // Helper function to handle constraint fields
    const getConstraintValue = (value: any, allowedValues: string[]) => {
      if (!value || value === "" || value === null) return null
      return allowedValues.includes(value) ? value : null
    }

    const insertData: any = {
      // Map to admin panel expected columns
      client_name: transformedData.clientName,
      client_full_name: transformedData.clientName, // Admin panel expects this
      client_phone: transformedData.clientPhone,
      client_email: transformedData.clientEmail,
      client_location: transformedData.clientLocation,
      exact_location: transformedData.clientLocation, // Admin panel expects this
      service_type: transformedData.serviceType,
      message: transformedData.message,
      additional_info: transformedData.message, // Admin panel expects this
      budget_range: transformedData.budgetRange,
      salary_estimation: transformedData.budgetRange, // Admin panel expects this
      start_date: transformedData.startDate,
      start_date_preference: transformedData.startDate, // Admin panel expects this
      preferred_worker_id: transformedData.preferredWorkerId,
      candidate_name: transformedData.candidateName,
      number_of_people_needing_support: transformedData.numberOfPeopleNeedingSupport
        ? Number.parseInt(transformedData.numberOfPeopleNeedingSupport)
        : null,
      person_needing_support: transformedData.personNeedingSupport,
      religious_faith: transformedData.religiousFaith,
      working_hours_days: transformedData.workingHoursDays,
      status: "pending",
    }

    // Only add constraint fields if they have valid values
    const faithPreference = getConstraintValue(transformedData.faithPreference, [
      "same-faith",
      "any-faith",
      "different-faith",
    ])
    if (faithPreference) {
      insertData.faith_preference = faithPreference
    }

    const workerType = getConstraintValue(transformedData.workerType, ["live-in", "live-out"])
    if (workerType) {
      insertData.worker_type = workerType
    }

    const { data, error } = await supabase.from("domestic_workers_requests").insert([insertData]).select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data[0] }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("id")

    if (!requestId) {
      return NextResponse.json({ success: false, error: "Request ID is required" }, { status: 400 })
    }

    const { error } = await supabase.from("domestic_workers_requests").delete().eq("id", requestId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Request deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("domestic_workers_requests")
      .select(`*,
        domestic_workers_candidates (
          full_name,
          image_url_1
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
