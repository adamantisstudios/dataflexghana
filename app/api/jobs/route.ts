import { NextRequest, NextResponse } from "next/server";
import { jsonWithReadOnlyGetCache } from "@/lib/api-cache-headers";
import { getJobsSupabaseAdmin } from "@/lib/jobs-supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const featuredOnly = searchParams.get("featured") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : null;

    const supabase = getJobsSupabaseAdmin();
    let query = supabase.from("jobs").select("*").order("created_at", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }
    if (featuredOnly) {
      query = query.eq("is_featured", true);
    }
    if (limit != null && limit > 0) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[api/jobs] GET error:", error);
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return jsonWithReadOnlyGetCache({ jobs: data ?? [] });
  } catch (error) {
    console.error("[api/jobs] GET failed:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
