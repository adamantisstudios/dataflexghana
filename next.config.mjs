/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["fluent-ffmpeg", "@ffmpeg-installer/ffmpeg"],
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
    staleTimes: {
      dynamic: 30,
      static: 30,
    },
  },
  turbopack: {},
  async headers() {
    return [
      {
        source:
          "/((?!_next/static|_next/image|favicon.ico|images/|assets/|fonts/|api/maintenance|maintenance).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ]
  },
}

export default nextConfig
