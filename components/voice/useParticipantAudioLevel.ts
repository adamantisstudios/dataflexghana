"use client"

import { useEffect, useState } from "react"
import type { Participant } from "livekit-client"

/** LiveKit participant audio level (0–1), updated on audioLevelChanged. */
export function useParticipantAudioLevel(participant: Participant | undefined): number {
  const [level, setLevel] = useState(0)

  useEffect(() => {
    if (!participant) {
      setLevel(0)
      return
    }
    const sync = () => setLevel(participant.audioLevel ?? 0)
    sync()
    participant.on("audioLevelChanged", sync)
    return () => {
      participant.off("audioLevelChanged", sync)
    }
  }, [participant])

  return level
}
