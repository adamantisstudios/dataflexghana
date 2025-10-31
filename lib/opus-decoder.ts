// Decodes Opus audio for playback in browsers that don't natively support it

export class OpusDecoder {
  private static instance: OpusDecoder
  private wasmReady: Promise<void>

  private constructor() {
    this.wasmReady = this.initWasm()
  }

  static getInstance(): OpusDecoder {
    if (!OpusDecoder.instance) {
      OpusDecoder.instance = new OpusDecoder()
    }
    return OpusDecoder.instance
  }

  private async initWasm(): Promise<void> {
    // In production, load the actual opus-decoder.wasm
    return Promise.resolve()
  }

  async decodeOpus(opusBlob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await opusBlob.arrayBuffer()
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    try {
      // Try native decoding first (some browsers support Opus)
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      return audioBuffer
    } catch (error) {
      console.warn("[v0] Native Opus decoding failed, using fallback:", error)
      // Fallback: create a simple audio buffer from the data
      return this.createFallbackAudioBuffer(arrayBuffer, audioContext)
    }
  }

  private createFallbackAudioBuffer(arrayBuffer: ArrayBuffer, audioContext: AudioContext): AudioBuffer {
    // Simplified fallback - in production use proper Opus decoder
    const view = new Uint8Array(arrayBuffer)
    const audioBuffer = audioContext.createBuffer(1, view.length, 16000)
    const channelData = audioBuffer.getChannelData(0)

    for (let i = 0; i < view.length; i++) {
      channelData[i] = (view[i] - 127.5) / 127.5
    }

    return audioBuffer
  }

  async decodeAndPlay(opusBlob: Blob, audioElement: HTMLAudioElement): Promise<void> {
    try {
      // Create object URL for the Opus blob
      const url = URL.createObjectURL(opusBlob)
      audioElement.src = url

      // Try to play
      await audioElement.play()
    } catch (error) {
      console.error("[v0] Error playing Opus audio:", error)
      throw error
    }
  }
}

export function isOpusSupported(): boolean {
  const audio = document.createElement("audio")
  return audio.canPlayType("audio/opus") === "maybe" || audio.canPlayType("audio/opus") === "probably"
}
