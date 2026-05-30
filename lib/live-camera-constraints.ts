/** Live conference / channel camera — square 720×720 (matches typical front-camera output). */
export const LIVE_CAMERA_VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  facingMode: "user",
  width: { ideal: 720 },
  height: { ideal: 720 },
  aspectRatio: { ideal: 1 },
  frameRate: { ideal: 30 },
}

export const LIVE_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  video: LIVE_CAMERA_VIDEO_CONSTRAINTS,
  audio: true,
}

export async function requestLiveCameraStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia(LIVE_CAMERA_CONSTRAINTS)
}
