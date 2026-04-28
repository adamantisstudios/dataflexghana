import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow builds even if TypeScript has errors (unchanged behavior)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Keep current image behavior
  images: {
    unoptimized: true,
  },

  // REQUIRED in Next 16+ when a webpack config exists
  // Must be an OBJECT, not boolean
  turbopack: {},

  // Keep your custom webpack alias
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    }
    return config
  },
}

export default nextConfig
