// Audio compression utility - converts WebM to OGG format
export async function compressAudio(
  audioFile: File,
  targetBitrate = 64, // kbps
): Promise<File> {
  // For now, return the original file
  // In production, you would use ffmpeg.wasm or a backend service
  // to convert WebM to OGG and compress

  // This is a placeholder - actual compression would require:
  // 1. ffmpeg.wasm library (client-side)
  // 2. Or a backend API that handles audio conversion

  return audioFile
}

// Get audio duration
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    const url = URL.createObjectURL(file)

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Math.round(audio.duration * 1000)) // Return in milliseconds
    }

    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load audio"))
    }

    audio.src = url
  })
}
