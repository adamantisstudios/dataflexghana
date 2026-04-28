"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Square, X, GripVertical } from "lucide-react"

interface FloatingAudioPlayerProps {
  onClose: () => void
  audioSrc?: string
  title?: string
  description?: string
}

export function FloatingAudioPlayer({
  onClose,
  audioSrc = "/intro_to_agents.mp3",
  title = "Platform Intro Message",
  description = "Learn how to get started",
}: FloatingAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [position, setPosition] = useState({ y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ y: 0, startY: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragStart({
      y: e.clientY,
      startY: position.y,
    })
    document.body.style.cursor = "grabbing"
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    e.stopPropagation()

    const deltaY = e.clientY - dragStart.y
    const playerHeight = 200
    const newY = Math.max(16, Math.min(window.innerHeight - playerHeight - 16, dragStart.startY + deltaY))
    setPosition({ y: newY })
  }

  const handleMouseUp = (e?: MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsDragging(false)
    document.body.style.cursor = ""
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      y: touch.clientY,
      startY: position.y,
    })
    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"
    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none"
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    e.stopPropagation()
    const touch = e.touches[0]
    const deltaY = touch.clientY - (dragStart?.y || 0)
    const newY = Math.max(0, (dragStart?.startY || 0) + deltaY)
    setPosition({ ...position, y: newY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation()
    setIsDragging(false)
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
    document.body.style.overflow = ""
    document.body.style.touchAction = ""
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd, { passive: false })

      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        document.body.style.overflow = ""
        document.body.style.touchAction = ""
      }
    }
  }, [isDragging, dragStart])

  const requestAudioPermission = async () => {
    try {
      if (audioRef.current) {
        await audioRef.current.play()
        setHasPermission(true)
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Audio permission denied or failed:", error)
      alert("Please allow audio playback to use the platform intro message.")
    }
  }

  const handlePlay = async () => {
    if (!hasPermission) {
      await requestAudioPermission()
      return
    }

    if (audioRef.current) {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error("Error playing audio:", error)
      }
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => setIsPlaying(false)
      const handlePause = () => setIsPlaying(false)
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
      const handleLoadedMetadata = () => setDuration(audio.duration)

      audio.addEventListener("ended", handleEnded)
      audio.addEventListener("pause", handlePause)
      audio.addEventListener("timeupdate", handleTimeUpdate)
      audio.addEventListener("loadedmetadata", handleLoadedMetadata)

      return () => {
        audio.removeEventListener("ended", handleEnded)
        audio.removeEventListener("pause", handlePause)
        audio.removeEventListener("timeupdate", handleTimeUpdate)
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      }
    }
  }, [])

  const remainingTime = duration - currentTime
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={playerRef}
      className="fixed z-50 w-80 sm:w-96"
      style={{
        top: `${position.y}px`,
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 border-2 border-white/30 rounded-xl shadow-2xl backdrop-blur-lg backdrop-saturate-150 relative ring-2 ring-emerald-400/50">
        <div
          className="flex items-center justify-between p-3 cursor-grab active:cursor-grabbing select-none hover:bg-emerald-600/30 transition-colors rounded-t-xl touch-none bg-gradient-to-r from-emerald-600/20 to-emerald-700/20"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ touchAction: "none" }}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
            <div>
              <h3 className="text-sm font-bold text-white drop-shadow-lg">{title}</h3>
              <p className="text-xs text-emerald-100 drop-shadow-lg font-medium">{description}</p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="text-white hover:text-emerald-100 transition-colors p-1 rounded-md hover:bg-white/20 bg-white/10 border border-white/20"
            aria-label="Close audio player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <audio ref={audioRef} preload="metadata" className="hidden">
          <source src={audioSrc} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>

        <div className="px-4 pb-4 bg-gradient-to-b from-transparent to-emerald-800/20">
          <div className="mb-3">
            <div
              className="w-full h-3 bg-emerald-900/60 rounded-full cursor-pointer overflow-hidden border border-white/20"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-gradient-to-r from-white to-emerald-100 transition-all duration-150 ease-out shadow-lg"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-xs text-white drop-shadow-lg font-medium">
              <span>{formatTime(currentTime)}</span>
              <span className="text-emerald-100">
                {isPlaying && remainingTime > 0 ? `-${formatTime(remainingTime)}` : formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={handlePlay}
              disabled={isPlaying}
              size="sm"
              className="bg-white text-emerald-700 hover:bg-emerald-50 disabled:bg-emerald-100 disabled:text-emerald-400 rounded-full h-10 w-10 p-0 shadow-lg border-2 border-emerald-200"
              aria-label="Play audio"
            >
              <Play className="h-4 w-4" />
            </Button>

            <Button
              onClick={handlePause}
              disabled={!isPlaying}
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-emerald-700 disabled:text-emerald-300 rounded-full h-8 w-8 p-0 shadow-lg border border-white/30"
              aria-label="Pause audio"
            >
              <Pause className="h-3 w-3" />
            </Button>

            <Button
              onClick={handleStop}
              size="sm"
              className="bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-emerald-700 disabled:text-emerald-300 rounded-full h-8 w-8 p-0 shadow-lg border border-white/30"
              aria-label="Stop audio"
            >
              <Square className="h-3 w-3" />
            </Button>
          </div>

          <div className="mt-3 text-center">
            <div className="flex items-center justify-center gap-2 bg-white/10 rounded-full px-3 py-1 border border-white/20">
              <div
                className={`w-2 h-2 rounded-full ${isPlaying ? "bg-white animate-pulse shadow-lg" : "bg-emerald-200"}`}
              ></div>
              <span className="text-xs text-white drop-shadow-lg font-medium">
                {isPlaying ? "Playing..." : "Ready to play"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
