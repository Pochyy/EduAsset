import { useMemo } from 'react'
import { cn } from '../lib/utils'
import { qrCode, qrPayload } from '../lib/qr'

interface QrLabelProps {
  assetId: string
  className?: string
}

export function QrLabel({ assetId, className }: QrLabelProps) {
  const qr = useMemo(() => qrCode(qrPayload(assetId)), [assetId])

  return (
    <svg
      viewBox={`-4 -4 ${qr.count + 8} ${qr.count + 8}`}
      role="img"
      aria-label={`QR code for ${assetId}`}
      shapeRendering="crispEdges"
      className={cn('shrink-0 bg-white', className)}
    >
      <rect
        x={-4}
        y={-4}
        width={qr.count + 8}
        height={qr.count + 8}
        fill="#ffffff"
      />
      <path d={qr.path} fill="#171717" />
    </svg>
  )
}
