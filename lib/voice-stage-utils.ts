import { Track, type Participant } from "livekit-client"
import {
  getParticipantRole,
  isHostParticipant,
  isSpeakerRole,
} from "@/components/voice/voice-participant-utils"

/** True when participant has an active, unmuted camera publication. */
export function participantHasCamera(participant: Participant): boolean {
  const pub = participant.getTrackPublication(Track.Source.Camera)
  return Boolean(pub?.track && !pub.isMuted)
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
