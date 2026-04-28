import { supabase } from "@/lib/supabase"

export interface StorageQuota {
  userId: string
  channelId: string
  maxStorageBytes: number
  retentionDays: number
  autoCleanupEnabled: boolean
}

export async function initializeStorageQuota(
  userId: string,
  channelId: string,
  maxStorageBytes = 536870912, // 500 MB default
  retentionDays = 90,
): Promise<StorageQuota> {
  try {
    const { data, error } = await supabase.from("storage_quotas").upsert(
      {
        user_id: userId,
        channel_id: channelId,
        max_storage_bytes: maxStorageBytes,
        retention_days: retentionDays,
        auto_cleanup_enabled: true,
      },
      {
        onConflict: "user_id,channel_id",
      },
    )

    if (error) {
      throw error
    }

    return {
      userId,
      channelId,
      maxStorageBytes,
      retentionDays,
      autoCleanupEnabled: true,
    }
  } catch (error) {
    console.error("[v0] Error initializing storage quota:", error)
    throw error
  }
}

export async function getStorageQuota(userId: string, channelId: string): Promise<StorageQuota | null> {
  try {
    const { data, error } = await supabase
      .from("storage_quotas")
      .select("*")
      .eq("user_id", userId)
      .eq("channel_id", channelId)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    if (!data) {
      return null
    }

    return {
      userId: data.user_id,
      channelId: data.channel_id,
      maxStorageBytes: data.max_storage_bytes,
      retentionDays: data.retention_days,
      autoCleanupEnabled: data.auto_cleanup_enabled,
    }
  } catch (error) {
    console.error("[v0] Error getting storage quota:", error)
    throw error
  }
}

export async function updateStorageQuota(
  userId: string,
  channelId: string,
  updates: Partial<StorageQuota>,
): Promise<StorageQuota> {
  try {
    const { data, error } = await supabase
      .from("storage_quotas")
      .update({
        max_storage_bytes: updates.maxStorageBytes,
        retention_days: updates.retentionDays,
        auto_cleanup_enabled: updates.autoCleanupEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("channel_id", channelId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return {
      userId: data.user_id,
      channelId: data.channel_id,
      maxStorageBytes: data.max_storage_bytes,
      retentionDays: data.retention_days,
      autoCleanupEnabled: data.auto_cleanup_enabled,
    }
  } catch (error) {
    console.error("[v0] Error updating storage quota:", error)
    throw error
  }
}

export async function trackAudioFile(
  userId: string,
  channelId: string,
  storagePath: string,
  fileSizeBytes: number,
  durationSeconds?: number,
): Promise<void> {
  try {
    const { error } = await supabase.from("audio_files_metadata").insert({
      user_id: userId,
      channel_id: channelId,
      storage_path: storagePath,
      file_size_bytes: fileSizeBytes,
      duration_seconds: durationSeconds || 0,
    })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error("[v0] Error tracking audio file:", error)
    // Don't throw - tracking failure shouldn't block uploads
  }
}

export async function getStorageUsage(userId: string, channelId: string) {
  try {
    const { data, error } = await supabase
      .from("audio_storage_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("channel_id", channelId)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return {
      totalSizeBytes: data?.total_size_bytes || 0,
      audioCount: data?.audio_count || 0,
      lastUpdated: data?.last_updated || null,
    }
  } catch (error) {
    console.error("[v0] Error getting storage usage:", error)
    return {
      totalSizeBytes: 0,
      audioCount: 0,
      lastUpdated: null,
    }
  }
}

export async function cleanupOldAudioFiles(): Promise<{ deletedCount: number; freedBytes: number }> {
  try {
    const { data, error } = await supabase.rpc("cleanup_old_audio_files")

    if (error) {
      throw error
    }

    return {
      deletedCount: data?.[0]?.deleted_count || 0,
      freedBytes: data?.[0]?.freed_bytes || 0,
    }
  } catch (error) {
    console.error("[v0] Error cleaning up audio files:", error)
    return {
      deletedCount: 0,
      freedBytes: 0,
    }
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

export function calculateStoragePercentage(used: number, max: number): number {
  if (max === 0) return 0
  return Math.round((used / max) * 100 * 100) / 100
}
