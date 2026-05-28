"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Mic, Pause, Play, Square, Upload } from "lucide-react"
import { toast } from "sonner"
import {
  compressAudioBlobToMp3,
  isRecordingSupported,
  pickRecordingMimeType,
} from "@/lib/client-compress-audio"

const BITRATE = 80

type Props = {
  disabled?: boolean
  onRecordedFile: (file: File) => void
  onUploadProgress?: (percent: number) => void
  autoUpload?: (file: File, onProgress: (p: number) => void) => Promise<void>
}

export function ChannelAudioRecorder({
  disabled = false,
  onRecordedFile,
  onUploadProgress,
  autoUpload,
}: Props) {
  const [supported] = useState(() => isRecordingSupported())
  const [state, setState] = useState<"idle" | "recording" | "paused" | "processing" | "ready">("idle")
  const [displayTime, setDisplayTime] = useState("0:00")
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [compressing, setCompressing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const secondsRef = useRef(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animRef = useRef<number | null>(null)
  const mimeRef = useRef("audio/webm")
  const pendingFileRef = useRef<File | null>(null)

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
    const s = totalSec % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = null
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    void audioContextRef.current?.close()
    audioContextRef.current = null
    analyserRef.current = null
  }, [])

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const sampled = Array.from(data)
      .filter((_, i) => i % 6 === 0)
      .slice(0, 32)
      .map((v) => v / 255)
    setWaveformData(sampled)
    animRef.current = requestAnimationFrame(updateWaveform)
  }, [])

  useEffect(() => () => stopTracks(), [stopTracks])

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      secondsRef.current += 1
      setDisplayTime(formatTime(secondsRef.current))
    }, 1000)
  }

  const startRecording = async () => {
    if (!supported) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioContextRef.current = ctx
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      ctx.createMediaStreamSource(stream).connect(analyser)

      mimeRef.current = pickRecordingMimeType()
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeRef.current,
        audioBitsPerSecond: 64000,
      })
      mediaRecorderRef.current = recorder
      chunksRef.current = []
      secondsRef.current = 0
      setDisplayTime("0:00")

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stopTracks()
        void processRecording()
      }

      recorder.start(1000)
      setState("recording")
      setWaveformData([])
      updateWaveform()
      startTimer()
    } catch {
      toast.error("Microphone access denied or unavailable.")
      stopTracks()
      setState("idle")
    }
  }

  const processRecording = async () => {
    setState("processing")
    setCompressing(true)
    try {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current })
      if (blob.size === 0) {
        toast.error("Recording was empty. Try again.")
        setState("idle")
        return
      }

      let file: File
      try {
        file = await compressAudioBlobToMp3(blob, BITRATE, `lecture-${Date.now()}.mp3`)
      } catch {
        const ext = mimeRef.current.includes("mp4") ? "m4a" : "webm"
        file = new File([blob], `lecture-${Date.now()}.${ext}`, { type: blob.type })
      }

      pendingFileRef.current = file
      onRecordedFile(file)
      setState("ready")

      if (autoUpload) {
        setUploadProgress(5)
        onUploadProgress?.(5)
        await autoUpload(file, (p) => {
          setUploadProgress(p)
          onUploadProgress?.(p)
        })
        pendingFileRef.current = null
        setState("idle")
        setUploadProgress(0)
        chunksRef.current = []
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process recording")
      setState("idle")
    } finally {
      setCompressing(false)
    }
  }

  const pauseResume = () => {
    const rec = mediaRecorderRef.current
    if (!rec) return
    if (state === "recording") {
      if (typeof rec.pause === "function") {
        rec.pause()
        setState("paused")
        if (timerRef.current) clearInterval(timerRef.current)
        if (animRef.current) cancelAnimationFrame(animRef.current)
      } else {
        toast.info("Pause is not supported in this browser.")
      }
    } else if (state === "paused") {
      rec.resume()
      setState("recording")
      startTimer()
      updateWaveform()
    }
  }

  const stopRecording = () => {
    const rec = mediaRecorderRef.current
    if (rec && (state === "recording" || state === "paused")) {
      rec.stop()
      setWaveformData([])
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
        Recording is not supported in this browser. Please upload a pre-recorded file instead.
      </p>
    )
  }

  const busy = compressing || state === "processing" || uploadProgress > 0

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-3">
      <p className="text-xs font-medium text-gray-700">Record audio</p>

      {(state === "recording" || state === "paused") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-700">
              <span
                className={`h-2.5 w-2.5 rounded-full ${state === "recording" ? "bg-red-500 animate-pulse" : "bg-amber-500"}`}
              />
              {state === "recording" ? "Recording…" : "Paused"}
            </span>
            <span className="font-mono text-gray-600 tabular-nums">{displayTime}</span>
          </div>
          <div className="flex items-end justify-center gap-0.5 h-10">
            {(waveformData.length > 0 ? waveformData : Array(24).fill(0.15)).map((v, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-emerald-500 transition-all duration-75"
                style={{ height: `${Math.max(4, v * 36)}px` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 min-w-[120px]"
              onClick={pauseResume}
              disabled={disabled}
            >
              {state === "paused" ? (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              type="button"
              className="h-12 flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white"
              onClick={stopRecording}
              disabled={disabled}
            >
              <Square className="h-5 w-5 mr-2 fill-current" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {state === "idle" && (
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          onClick={() => void startRecording()}
          disabled={disabled || busy}
        >
          <Mic className="h-5 w-5 mr-2" />
          Start recording
        </Button>
      )}

      {(state === "processing" || compressing) && (
        <p className="text-sm text-gray-600 text-center py-2">Compressing audio for upload…</p>
      )}

      {uploadProgress > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <Upload className="h-3 w-3" />
              Uploading…
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {state === "ready" && !autoUpload && pendingFileRef.current && (
        <p className="text-xs text-emerald-700 text-center">
          Recording ready — use Upload lecture to publish.
        </p>
      )}
    </div>
  )
}
