"use client"

import { useCallback, useEffect, useRef } from "react"

type UseRingtoneResult = {
  /** Call from a user gesture (e.g., widget click) to unlock audio. */
  activateAudio: () => Promise<void>
}

const BEEP_FREQUENCY = 800
const BEEP_GAIN = 0.3
const BEEP_MS = 200
const SILENCE_MS = 400
const CYCLE_MS = BEEP_MS + SILENCE_MS

/** Incoming-call ringtone using Web Audio API (no external files). */
export function useRingtone(isRinging: boolean): UseRingtoneResult {
  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<number | null>(null)
  const activeOscillatorsRef = useRef<Set<OscillatorNode>>(new Set())

  const stopActiveOscillators = useCallback(() => {
    for (const osc of activeOscillatorsRef.current) {
      try {
        osc.stop()
      } catch {
        // oscillator may already be stopped
      }
      try {
        osc.disconnect()
      } catch {
        // noop
      }
    }
    activeOscillatorsRef.current.clear()
  }, [])

  const stopRingtone = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    stopActiveOscillators()
  }, [stopActiveOscillators])

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === "undefined") return null
    if (!audioContextRef.current) {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return null
      audioContextRef.current = new Ctx()
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume()
    }
    return audioContextRef.current
  }, [])

  const playSingleBeep = useCallback(async () => {
    const ctx = await ensureAudioContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(BEEP_FREQUENCY, ctx.currentTime)

    gain.gain.setValueAtTime(BEEP_GAIN, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + BEEP_MS / 1000)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + BEEP_MS / 1000)
    activeOscillatorsRef.current.add(osc)

    osc.onended = () => {
      activeOscillatorsRef.current.delete(osc)
      try {
        osc.disconnect()
        gain.disconnect()
      } catch {
        // noop
      }
    }
  }, [ensureAudioContext])

  useEffect(() => {
    if (!isRinging) {
      stopRingtone()
      return
    }

    // If audio hasn't been unlocked by user interaction yet,
    // keep waiting silently until activateAudio() resumes context.
    if (!audioContextRef.current || audioContextRef.current.state !== "running") {
      return
    }

    void playSingleBeep()
    intervalRef.current = window.setInterval(() => {
      void playSingleBeep()
    }, CYCLE_MS)

    return () => {
      stopRingtone()
    }
  }, [isRinging, playSingleBeep, stopRingtone])

  useEffect(() => {
    return () => {
      stopRingtone()
      if (audioContextRef.current) {
        void audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [stopRingtone])

  const activateAudio = useCallback(async () => {
    await ensureAudioContext()
  }, [ensureAudioContext])

  return { activateAudio }
}
