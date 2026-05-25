import sharp from "sharp"

const MAX_WIDTH = 800
const MAX_BYTES = 8 * 1024 * 1024

export async function compressListingProductImage(file: File): Promise<{ buffer: Buffer; contentType: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image")
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 8MB or smaller")
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer())
  const compressed = await sharp(inputBuffer)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer()

  return { buffer: compressed, contentType: "image/webp" }
}
