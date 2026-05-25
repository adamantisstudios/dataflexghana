"use client"

const MODEL_URL = "/models"

let modelsReady = false
let loadPromise: Promise<void> | null = null

export function areFaceApiModelsReady(): boolean {
  return modelsReady
}

/** Load tiny face detector + 68 landmarks once per browser session. */
export async function ensureFaceApiModels(): Promise<void> {
  if (typeof window === "undefined") return
  if (modelsReady) return
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const faceapi = await import("face-api.js")
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    ])
    modelsReady = true
  })()

  return loadPromise
}
