import { TrackType } from "@livekit/protocol"
import { AccessToken, EgressClient, RoomServiceClient, type CreateOptions } from "livekit-server-sdk"
import { getAdminClient } from "@/lib/supabase-base"
import { voiceRegionsMatch } from "@/lib/voice-room-regions"

export type VoiceParticipantRole = "admin" | "moderator" | "speaker" | "listener"

/** Shown to admins when auto-egress is unavailable on the LiveKit plan. */
export const LIVEKIT_RECORDING_UNAVAILABLE_MESSAGE =
  "Recording is not available on the current plan. Upgrade to enable recording."

/** When `LIVEKIT_RECORDING_ENABLED=true`, room creation attempts auto-egress. */
export function isLiveKitRecordingEnabled(): boolean {
  return process.env.LIVEKIT_RECORDING_ENABLED === "true"
}

export type CreateVoiceRoomResult = {
  room: {
    id: string
    room_name: string
    region: string
    created_by: string | null
    is_active: boolean
    recording_url: string | null
    created_at: string
    ended_at: string | null
  }
  recordingWarning?: string
}

function getLiveKitHttpHost(): string {
  const host = process.env.LIVEKIT_HOST || ""
  if (!host) throw new Error("LIVEKIT_HOST is not configured")
  return host.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:")
}

function getApiKey(): string {
  const key = process.env.LIVEKIT_API_KEY
  if (!key) throw new Error("LIVEKIT_API_KEY is not configured")
  return key
}

function getApiSecret(): string {
  const secret = process.env.LIVEKIT_API_SECRET
  if (!secret) throw new Error("LIVEKIT_API_SECRET is not configured")
  return secret
}

let _roomService: RoomServiceClient | null = null
let _egressClient: EgressClient | null = null

export function getLiveKitRoomService(): RoomServiceClient {
  if (!_roomService) {
    _roomService = new RoomServiceClient(getLiveKitHttpHost(), getApiKey(), getApiSecret())
  }
  return _roomService
}

export function getLiveKitEgressClient(): EgressClient {
  if (!_egressClient) {
    _egressClient = new EgressClient(getLiveKitHttpHost(), getApiKey(), getApiSecret())
  }
  return _egressClient
}

/** Singleton room service (spec alias). */
export const livekitRoomService = new Proxy({} as RoomServiceClient, {
  get(_target, prop) {
    const client = getLiveKitRoomService()
    const value = client[prop as keyof RoomServiceClient]
    return typeof value === "function" ? value.bind(client) : value
  },
})

export async function generateToken(
  identity: string,
  roomName: string,
  name: string,
  canPublish = false,
  metadata?: Record<string, unknown>,
): Promise<string> {
  const at = new AccessToken(getApiKey(), getApiSecret(), {
    identity,
    name,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
  })

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  })

  return at.toJwt()
}

export async function generateAgentToken(
  roomName: string,
  agentId: string,
  agentName: string,
  region: string,
  options?: { canPublish?: boolean; role?: VoiceParticipantRole },
): Promise<string> {
  const db = getAdminClient()
  const { data: room, error } = await db
    .from("voice_rooms")
    .select("region, is_active")
    .eq("room_name", roomName)
    .maybeSingle()

  if (error || !room) {
    throw new Error("Voice room not found")
  }
  if (!room.is_active) {
    throw new Error("This voice conference has ended")
  }
  if (!voiceRegionsMatch(room.region, region)) {
    throw new Error("This room is only for agents in your region")
  }

  const role = options?.role ?? (options?.canPublish ? "speaker" : "listener")
  return generateToken(agentId, roomName, agentName, options?.canPublish ?? false, { role })
}

function buildLiveKitCreateRoomOptions(
  roomName: string,
  safeRegion: string,
  adminId: string | null,
  withRecording: boolean,
): CreateOptions {
  const options: CreateOptions = {
    name: roomName,
    emptyTimeout: 60 * 10,
    maxParticipants: 250,
    metadata: JSON.stringify({ region: safeRegion, created_by: adminId }),
  }

  if (withRecording) {
    options.egress = {
      room: {
        roomName,
        audioOnly: true,
        fileOutputs: [
          {
            filepath: `recordings/${roomName}-{time}.ogg`,
          },
        ],
      },
    }
  }

  return options
}

async function createLiveKitRoom(
  roomName: string,
  safeRegion: string,
  adminId: string | null,
  withRecording: boolean,
): Promise<void> {
  await getLiveKitRoomService().createRoom(
    buildLiveKitCreateRoomOptions(roomName, safeRegion, adminId, withRecording),
  )
}

export async function createVoiceRoom(
  region: string,
  adminId: string | null,
): Promise<CreateVoiceRoomResult> {
  const db = getAdminClient()
  const safeRegion = region.trim()
  if (!safeRegion) throw new Error("Region is required")

  const slug = safeRegion.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const roomName = `voice-${slug}-${Date.now()}`

  let recordingWarning: string | undefined

  if (isLiveKitRecordingEnabled()) {
    try {
      await createLiveKitRoom(roomName, safeRegion, adminId, true)
    } catch (err) {
      console.warn(
        "[livekit] Auto-egress failed; creating voice room without recording:",
        err instanceof Error ? err.message : err,
      )
      recordingWarning = LIVEKIT_RECORDING_UNAVAILABLE_MESSAGE
      await createLiveKitRoom(roomName, safeRegion, adminId, false)
    }
  } else {
    await createLiveKitRoom(roomName, safeRegion, adminId, false)
  }

  const { data, error } = await db
    .from("voice_rooms")
    .insert({
      room_name: roomName,
      region: safeRegion,
      created_by: adminId,
      is_active: true,
    })
    .select("*")
    .single()

  if (error || !data) {
    try {
      await getLiveKitRoomService().deleteRoom(roomName)
    } catch {
      /* ignore cleanup failure */
    }
    throw new Error(error?.message || "Failed to save voice room")
  }

  return {
    room: data,
    ...(recordingWarning ? { recordingWarning } : {}),
  }
}

export type VoiceRecordingInfo = {
  egressId: string
  status: string
  downloadUrl: string | null
  filename: string | null
}

export async function listRecordings(roomName: string): Promise<VoiceRecordingInfo[]> {
  const items = await getLiveKitEgressClient().listEgress({ roomName })
  const results: VoiceRecordingInfo[] = []

  for (const item of items) {
    const fileResults = item.fileResults ?? []
    for (const file of fileResults) {
      results.push({
        egressId: item.egressId,
        status: String(item.status),
        downloadUrl: file.downloadUrl || null,
        filename: file.filename || null,
      })
    }
    if (fileResults.length === 0 && item.file?.filename) {
      results.push({
        egressId: item.egressId,
        status: String(item.status),
        downloadUrl: item.file.downloadUrl || null,
        filename: item.file.filename || null,
      })
    }
  }

  return results
}

export async function updateParticipantRole(
  roomName: string,
  participantIdentity: string,
  role: VoiceParticipantRole,
): Promise<void> {
  await getLiveKitRoomService().updateParticipant(roomName, participantIdentity, {
    metadata: JSON.stringify({ role }),
    attributes: { role },
    permission: {
      canPublish: role === "admin" || role === "moderator" || role === "speaker",
      canSubscribe: true,
      canPublishData: true,
    },
  })
}

export async function muteParticipantAudio(
  roomName: string,
  identity: string,
  muted: boolean,
): Promise<void> {
  const participant = await getLiveKitRoomService().getParticipant(roomName, identity)
  const audioTrack = participant.tracks?.find((t) => t.type === TrackType.AUDIO)
  if (!audioTrack?.sid) {
    if (muted) return
    throw new Error("No audio track found for participant")
  }
  await getLiveKitRoomService().mutePublishedTrack(roomName, identity, audioTrack.sid, muted)
}

export async function getLiveKitParticipantCount(roomName: string): Promise<number> {
  try {
    const participants = await getLiveKitRoomService().listParticipants(roomName)
    return participants.length
  } catch {
    return 0
  }
}

export async function muteAllSpeakersInRoom(roomName: string): Promise<number> {
  const participants = await getLiveKitRoomService().listParticipants(roomName)
  let muted = 0
  for (const p of participants) {
    let role = "listener"
    try {
      const meta = p.metadata ? JSON.parse(p.metadata) : {}
      role = meta.role || p.attributes?.role || "listener"
    } catch {
      role = p.attributes?.role || "listener"
    }
    if (role === "speaker" || role === "moderator") {
      try {
        await muteParticipantAudio(roomName, p.identity, true)
        muted++
      } catch {
        /* skip if no track */
      }
    }
  }
  return muted
}

export async function startVoiceRoomRecording(roomName: string): Promise<string> {
  const egress = await getLiveKitEgressClient().startRoomCompositeEgress(roomName, {
    audioOnly: true,
    fileOutputs: [
      {
        filepath: `recordings/${roomName}-{time}.ogg`,
      },
    ],
  })
  if (!egress.egressId) throw new Error("Recording could not be started")
  return egress.egressId
}

export async function stopVoiceRoomRecording(egressId: string): Promise<void> {
  await getLiveKitEgressClient().stopEgress(egressId)
}

export function getLiveKitWsUrl(): string {
  return process.env.LIVEKIT_HOST || ""
}
