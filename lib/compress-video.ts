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

export async function compressVideoBuffer(
  inputBuffer: Buffer,
  inputExt: string,
): Promise<{ buffer: Buffer; size: number }> {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const inputPath = join(tmpdir(), `channel-video-in-${token}.${inputExt || "mp4"}`)
  const outputPath = join(tmpdir(), `channel-video-out-${token}.mp4`)

  try {
    await writeFile(inputPath, inputBuffer)
    const ffmpeg = await loadFfmpeg()

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions(["-crf", "23", "-preset", "medium", "-movflags", "+faststart", "-vf", "scale=-2:720"])
        .format("mp4")
        .on("error", (err) => reject(new Error(`Video compression failed: ${err.message}`)))
        .on("end", () => resolve())
        .save(outputPath)
    })

    const buffer = await readFile(outputPath)
    return { buffer, size: buffer.byteLength }
  } finally {
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  }
}
