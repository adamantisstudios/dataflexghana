import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is teacher of the video's channel
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select("channel_id, created_by")
      .eq("id", params.videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { success: false, error: "Video not found" },
        { status: 404 }
      );
    }

    if (video.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own videos" },
        { status: 403 }
      );
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from("videos")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", params.videoId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (error: any) {
    console.error("[v0] Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete video" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { permanent } = await request.json();

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: video } = await supabase
      .from("videos")
      .select("created_by")
      .eq("id", params.videoId)
      .single();

    if (!video || video.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to delete this video" },
        { status: 403 }
      );
    }

    if (permanent) {
      // Permanently delete
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", params.videoId);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: "Video permanently deleted" });
    }

    // Soft delete
    const { error } = await supabase
      .from("videos")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", params.videoId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Video deleted successfully" });
  } catch (error: any) {
    console.error("[v0] Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
