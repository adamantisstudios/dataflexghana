/**
 * Client-side voice compression: decode recorded blob → mono MP3 via lamejs (~64–96 kbps).
 */

const CHUNK_SIZE = 1152

function mixToMono(buffer: AudioBuffer): Float32Array {
  const length = buffer.length
  const mono = new Float32Array(length)
  const channels = buffer.numberOfChannels
  for (let c = 0; c < channels; c++) {
    const channel = buffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      mono[i] += channel[i] / channels
    }
  }
  return mono
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return output
}

export async function compressAudioBlobToMp3(
  blob: Blob,
  kbps = 80,
  fileName?: string,
): Promise<File> {
  const arrayBuffer = await blob.arrayBuffer()
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext
  const audioContext = new AudioContextCtor()
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
    const samples =
      audioBuffer.numberOfChannels > 1 ? mixToMono(audioBuffer) : audioBuffer.getChannelData(0)
    const pcm = floatTo16BitPCM(samples)

    const lamejs = await import("lamejs")
    const Mp3Encoder =
      lamejs.Mp3Encoder ??
      (lamejs as unknown as { default: { Mp3Encoder: typeof lamejs.Mp3Encoder } }).default?.Mp3Encoder
    if (!Mp3Encoder) throw new Error("MP3 encoder unavailable")

    const encoder = new Mp3Encoder(1, audioBuffer.sampleRate, kbps)
    const mp3Chunks: Int8Array[] = []

    for (let i = 0; i < pcm.length; i += CHUNK_SIZE) {
      const slice = pcm.subarray(i, i + CHUNK_SIZE)
      const mp3buf = encoder.encodeBuffer(slice)
      if (mp3buf.length > 0) mp3Chunks.push(mp3buf)
    }

    const end = encoder.flush()
    if (end.length > 0) mp3Chunks.push(end)

    const totalLength = mp3Chunks.reduce((sum, c) => sum + c.length, 0)
    const mp3Data = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of mp3Chunks) {
      mp3Data.set(chunk, offset)
      offset += chunk.length
    }

    const name = fileName || `lecture-${Date.now()}.mp3`
    return new File([mp3Data], name, { type: "audio/mpeg" })
  } finally {
    await audioContext.close()
  }
}

export function pickRecordingMimeType(): string {
  const candidates = [
    "audio/mp4;codecs=mp4a.40.2",
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ]
  for (const mime of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)) {
      return mime
    }
  }
  return "audio/webm"
}

export function isRecordingSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  )
}
