import qrcode from 'qrcode-generator'

const cache = new Map<string, { path: string; count: number }>()

/** SDD 5.3: QR payload is the item URL, not a status value. */
export const qrPayload = (assetId: string) => `/items/${assetId}`

/**
 * Generate a real, standards-compliant QR code (error correction M) and return
 * an SVG path plus the module count. The 4-module quiet zone is applied by the
 * renderer.
 */
export function qrCode(value: string) {
  const cached = cache.get(value)
  if (cached) return cached

  const qr = qrcode(0, 'M')
  qr.addData(value)
  qr.make()

  const count = qr.getModuleCount()
  let path = ''
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) path += `M${col} ${row}h1v1h-1z`
    }
  }

  const result = { path, count }
  cache.set(value, result)
  return result
}

/**
 * Accept either a raw asset ID or the SDD item URL. The screen always receives
 * the canonical asset ID.
 */
export function normalizeQrPayload(raw: string) {
  const value = raw.trim()
  const match = value.match(/\/items\/([^/?#\s]+)/i)
  const assetId = match?.[1] ?? value
  try {
    return decodeURIComponent(assetId).toUpperCase()
  } catch {
    return assetId.toUpperCase()
  }
}
