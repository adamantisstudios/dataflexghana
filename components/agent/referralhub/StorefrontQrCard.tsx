"use client"

import { useRef } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Download } from "lucide-react"
import { toast } from "sonner"
import { buildStorefrontUrl } from "@/lib/storefront-utils"
import { StoreSocialShareButtons } from "@/components/shared/StoreSocialShareButtons"

interface Props {
  agentId: string
  storeSlug?: string | null
  storeName?: string
}

export function StorefrontQrCard({ agentId, storeSlug, storeName }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const storeUrl = buildStorefrontUrl(agentId, storeSlug)

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl)
    toast.success("Store link copied")
  }

  const downloadQr = () => {
    const canvas = canvasRef.current?.querySelector("canvas")
    if (!canvas) return
    const png = canvas.toDataURL("image/png")
    const a = document.createElement("a")
    a.href = png
    a.download = `storefront-qr-${(storeSlug || agentId).slice(0, 12)}.png`
    a.click()
    toast.success("QR code downloaded")
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 max-w-lg mx-auto w-full">
      <CardHeader className="text-center sm:text-left">
        <CardTitle className="text-lg">Your storefront QR code</CardTitle>
        <p className="text-sm text-muted-foreground">
          Customers scan to open {storeName ? `"${storeName}"` : "your store"} on Referral Powerhouse.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 px-4 sm:px-6">
        <div ref={canvasRef} className="bg-white p-3 sm:p-4 rounded-xl shadow-md border">
          <QRCodeCanvas value={storeUrl} size={180} level="M" includeMargin />
        </div>
        <div className="w-full max-w-full space-y-3">
          <p className="text-xs font-mono break-all text-slate-600 bg-white/80 p-2 rounded border text-center sm:text-left">
            {storeUrl}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4 mr-1" />
              Copy link
            </Button>
            <Button type="button" size="sm" onClick={downloadQr}>
              <Download className="h-4 w-4 mr-1" />
              Download QR
            </Button>
          </div>
          <StoreSocialShareButtons
            agentId={agentId}
            storeSlug={storeSlug}
            storeName={storeName || "My store"}
            layout="bar"
            className="justify-center sm:justify-start"
          />
        </div>
      </CardContent>
    </Card>
  )
}
