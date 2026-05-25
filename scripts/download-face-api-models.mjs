/**
 * Downloads face-api.js weight files into public/models/
 * Run: node scripts/download-face-api-models.mjs
 */
import { mkdir, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, "..", "public", "models")
const BASE =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/"

const FILES = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model-shard1",
  "face_landmark_68_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
]

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  for (const name of FILES) {
    const url = BASE + name
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to download ${name}: ${res.status} ${res.statusText}`)
    }
    const buf = Buffer.from(await res.arrayBuffer())
    const outPath = join(OUT_DIR, name)
    await writeFile(outPath, buf)
    console.log(`Saved ${outPath} (${buf.length} bytes)`)
  }
  console.log("Done — face-api models are in public/models/")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
