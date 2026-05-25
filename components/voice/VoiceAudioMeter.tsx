"use client"

type Props = {
  level: number
  className?: string
}

/** Vertical audio level bars (0–1). */
export function VoiceAudioMeter({ level, className = "" }: Props) {
  const bars = 5
  const clamped = Math.min(1, Math.max(0, level))

  return (
    <div className={`flex items-end gap-0.5 h-5 ${className}`} aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars
        const active = clamped >= threshold - 0.15
        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${
              active ? "bg-emerald-400" : "bg-slate-600"
            }`}
            style={{ height: `${6 + i * 3}px` }}
          />
        )
      })}
    </div>
  )
}
