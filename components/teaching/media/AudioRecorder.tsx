"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Send, Trash2 } from "lucide-react"

interface AudioRecorderProps {
  onAudioRecorded: (audioFile: File) => void
  disabled?: boolean
}

export function AudioRecorder({ onAudioRecorded, disabled = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [displayTime, setDisplayTime] = useState("0:00")
  const [waveformData, setWaveformData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const updateWaveform = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const sampled = Array.from(dataArray)
      .filter((_, i) => i % 4 === 0)
      .map((v) => v / 255)
    setWaveformData(sampled)

    animationFrameRef.current = requestAnimationFrame(updateWaveform)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 256

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav"

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        setRecordedAudio(audioBlob)
        setWaveformData([])
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)
      setDisplayTime("0:00")
      setWaveformData([])

      updateWaveform()

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1
          const minutes = Math.floor(newDuration / 60)
          const seconds = newDuration % 60
          setDisplayTime(`${minutes}:${seconds.toString().padStart(2, "0")}`)
          return newDuration
        })
      }, 1000)
    } catch (error) {
      console.error("[v0] Failed to start recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }

  const sendAudio = async () => {
    if (recordedAudio) {
      const mimeType = recordedAudio.type
      let extension = "webm"
      if (mimeType.includes("wav")) extension = "wav"

      const audioFile = new File([recordedAudio], `audio-${Date.now()}.${extension}`, {
        type: mimeType,
      })
      onAudioRecorded(audioFile)
      setRecordedAudio(null)
      setDuration(0)
      setDisplayTime("0:00")
      setWaveformData([])
    }
  }

  const clearRecording = () => {
    setRecordedAudio(null)
    setDuration(0)
    setDisplayTime("0:00")
    setWaveformData([])
  }

  if (recordedAudio) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Audio recorded</span>
            <span className="text-xs text-gray-500 ml-auto">{displayTime}</span>
          </div>
        </div>
        <button
          onClick={sendAudio}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          title="Send audio"
        >
          <Send size={18} />
        </button>
        <button
          onClick={clearRecording}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          title="Delete recording"
        >
          <Trash2 size={18} />
        </button>
      </div>
    )
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Recording...</span>
            <span className="text-xs text-gray-500 ml-auto font-mono">{displayTime}</span>
          </div>
          <div className="flex items-center justify-center gap-1 h-8">
            {waveformData.length > 0 ? (
              waveformData.map((value, index) => (
                <div
                  key={index}
                  className="bg-red-500 rounded-full transition-all duration-75"
                  style={{
                    width: "3px",
                    height: `${Math.max(4, value * 24)}px`,
                  }}
                />
              ))
            ) : (
              <div className="text-xs text-gray-500">Initializing audio...</div>
            )}
          </div>
        </div>
        <button
          onClick={stopRecording}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex-shrink-0"
          title="Stop recording"
        >
          <Square size={18} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Record audio message"
    >
      <Mic size={18} />
      <span className="text-sm font-medium">Record</span>
    </button>
  )
}
