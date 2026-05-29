/** Single source of truth for live conference / channel camera capture (portrait 9:16). */
export const LIVE_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: "user",
    width: { ideal: 720 },
    height: { ideal: 1280 },
    aspectRatio: 9 / 16,
    frameRate: { ideal: 30 },
  },
  audio: true,
}

export async function requestLiveCameraStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(LIVE_CAMERA_CONSTRAINTS)
}
