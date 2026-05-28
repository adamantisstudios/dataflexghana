import { writeFile, readFile, unlink } from "fs/promises"
import { join } from "path"
import { tmpdir } from "os"

async function loadFfmpeg() {
  const ffmpegModule = await import("fluent-ffmpeg")
  const installerModule = await import("@ffmpeg-installer/ffmpeg")
  const ffmpeg = ffmpegModule.default
  ffmpeg.setFfmpegPath(installerModule.path)
  return ffmpeg
}

/** Compress audio to MP3 128kbps mono; returns duration in seconds. */
export async function compressAudioBuffer(
  inputBuffer: Buffer,
  inputExt: string,
): Promise<{ buffer: Buffer; duration: number; contentType: string }> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const ext = (inputExt || "mp3").replace(/^\./, "")
  const inputPath = join(tmpdir(), `channel-audio-in-${token}.${ext}`)
  const outputPath = join(tmpdir(), `channel-audio-out-${token}.mp3`)

  try {
    await writeFile(inputPath, inputBuffer)
    const ffmpeg = await loadFfmpeg()

    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err)
          return
        }
        resolve(Math.round(metadata.format.duration || 0))
      })
    })

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec("libmp3lame")
        .audioBitrate("128k")
        .audioChannels(1)
        .format("mp3")
        .on("error", (err) => reject(new Error(`Audio compression failed: ${err.message}`)))
        .on("end", () => resolve())
        .save(outputPath)
    })

    const buffer = await readFile(outputPath)
    return { buffer, duration, contentType: "audio/mpeg" }
  } catch (compressError) {
    console.warn("[compress-audio] FFmpeg failed, using original file:", compressError)
    return {
      buffer: inputBuffer,
      duration: 0,
      contentType: guessAudioMime(ext),
    }
  } finally {
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  }
}

function guessAudioMime(ext: string): string {
  switch (ext.toLowerCase()) {
    case "wav":
      return "audio/wav"
    case "m4a":
    case "mp4":
      return "audio/mp4"
    case "ogg":
      return "audio/ogg"
    default:
      return "audio/mpeg"
  }
}
