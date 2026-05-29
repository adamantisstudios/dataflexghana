import { Track, type Participant } from "livekit-client"
import {
  getParticipantRole,
  isHostParticipant,
  isSpeakerRole,
} from "@/components/voice/voice-participant-utils"

/** True when participant has camera on stage (track live or camera enabled while publishing). */
export function participantHasCamera(participant: Participant): boolean {
  const pub = participant.getTrackPublication(Track.Source.Camera)
  if (pub && !pub.isMuted && (pub.track || participant.isCameraEnabled)) return true
  if (participant.isCameraEnabled) return true
  return false
}

export type PickMainStageOptions = {
  localParticipant: Participant
  participants: Participant[]
  /** Host/admin: fill main stage with local camera when no remote video exists. */
  allowLocalFallback?: boolean
}

/**
 * Video-first main stage selection (Meet-style).
 * Prefers active speaker with camera, then remote host/speaker video, then local fallback.
 */
export function pickMainStageParticipant({
  localParticipant,
  participants,
  allowLocalFallback = false,
}: PickMainStageOptions): Participant | null {
  const remotes = participants.filter((p) => !p.isLocal)
  const withCamera = participants.filter(participantHasCamera)
  const remoteWithCamera = remotes.filter(participantHasCamera)

  const speakingWithCamera = withCamera.find((p) => p.isSpeaking)
  if (speakingWithCamera) return speakingWithCamera

  if (remoteWithCamera.length > 0) {
    const hostVideo = remoteWithCamera.find((p) =>
      isHostParticipant(p.identity, getParticipantRole(p)),
    )
    if (hostVideo) return hostVideo

    const speakerVideo = remoteWithCamera.find((p) =>
      isSpeakerRole(getParticipantRole(p)),
    )
    if (speakerVideo) return speakerVideo

    return remoteWithCamera[0]
  }

  if (allowLocalFallback && participantHasCamera(localParticipant)) {
    return localParticipant
  }

  const hostParticipant = participants.find((p) =>
    isHostParticipant(p.identity, getParticipantRole(p)),
  )
  if (hostParticipant) return hostParticipant

  const speakingRemote = remotes.find((p) => p.isSpeaking)
  if (speakingRemote) return speakingRemote

  const speakerRemote = remotes.find((p) => isSpeakerRole(getParticipantRole(p)))
  if (speakerRemote) return speakerRemote

  if (remotes.length > 0) return remotes[0]

  if (allowLocalFallback) return localParticipant

  return null
}

/** Other participants with camera for bottom/side filmstrip tiles. */
export function pickFilmstripParticipants(
  mainStage: Participant | null,
  participants: Participant[],
): Participant[] {
  return participants.filter(
    (p) => p.identity !== mainStage?.identity && participantHasCamera(p),
  )
}
