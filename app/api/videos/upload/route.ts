export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { tmpdir } from "os";
import path from "path";
import fs from "fs";

async function readFileBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get("x-agent-id") || request.headers.get("authorization")?.split(" ")[1] || "guest";
    const agentPhone = request.headers.get("x-agent-phone") || "unknown";

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const channelId = formData.get("channelId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const duration = Number(formData.get("duration") || 0);
    const width = Number(formData.get("width") || 0);
    const height = Number(formData.get("height") || 0);
    const thumbnailFile = formData.get("thumbnail") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Video file is required" },
        { status: 400 }
      );
    }

    if (!channelId || !title) {
      return NextResponse.json(
        { success: false, error: "Channel ID and title are required" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { success: false, error: "File must be a video type" },
        { status: 400 }
      );
    }

    // Previously checked: if (height > 0 && width > 0 && height <= width)

    const buffer = await readFileBuffer(file);
    const sizeMB = buffer.byteLength / 1024 / 1024;

    if (sizeMB > 500) {
      return NextResponse.json(
        { success: false, error: `File too large (${sizeMB.toFixed(2)}MB). Maximum 500MB allowed.` },
        { status: 400 }
      );
    }

    const filePath = `${channelId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.mp4`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("videos")
      .upload(filePath, buffer, { 
        contentType: "video/mp4",
        upsert: false,
        duplex: "half"
      });

    if (uploadError) {
      console.error("[v0] Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: `Storage error: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage.from("videos").getPublicUrl(uploadData.path);
    const videoUrl = urlData.publicUrl;

    let thumbnailUrl = "";
    try {
      if (thumbnailFile) {
        const thumbName = `thumbnails/${channelId}-${Date.now()}.jpg`;
        const thumbnailBuffer = await readFileBuffer(thumbnailFile);

        const { error: thumbError } = await supabaseAdmin.storage
          .from("videos")
          .upload(thumbName, thumbnailBuffer, { 
            contentType: "image/jpeg",
            upsert: false,
            duplex: "half"
          });

        if (!thumbError) {
          const { data: thumbUrlData } = supabaseAdmin.storage.from("videos").getPublicUrl(thumbName);
          thumbnailUrl = thumbUrlData.publicUrl;
        } else {
          console.warn("[v0] Thumbnail upload error:", thumbError);
        }
      } else {
        console.warn("[v0] No thumbnail provided, skipping thumbnail upload");
      }
    } catch (err) {
      console.warn("[v0] Thumbnail processing skipped:", err);
    }

    const { data: videoData, error: dbError } = await supabaseAdmin
      .from("videos")
      .insert({
        channel_id: channelId,
        created_by: authToken,
        title,
        description: description || "",
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration,
        file_size: buffer.byteLength,
        width,
        height,
        status: "published",
        is_published: true,
        is_deleted: false,
        view_count: 0,
        comment_count: 0,
        save_count: 0,
        share_count: 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[v0] Database error:", dbError);
      return NextResponse.json(
        { success: false, error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      videoId: videoData.id,
      videoUrl,
      thumbnailUrl,
      message: "Video uploaded successfully",
    });
  } catch (err: any) {
    console.error("[v0] Upload route error:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: err.message || "Upload failed. Please try again." 
      },
      { status: 500 }
    );
  }
}
