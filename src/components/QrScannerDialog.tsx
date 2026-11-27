import { useEffect, useRef, useState } from 'react'
import { QrCode } from 'lucide-react'
import { normalizeQrPayload } from '../lib/qr'
import { cn } from '../lib/utils'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'

type ScannerStatus = 'starting' | 'scanning' | 'error'

interface QrScannerDialogProps {
  open: boolean
  onClose: () => void
  onScan: (value: string) => void
  title?: string
}

export function QrScannerDialog({
  open,
  onClose,
  onScan,
  title = 'Scan QR code',
}: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const scannedRef = useRef(false)
  const scanCallback = useRef(onScan)
  const closeCallback = useRef(onClose)

  const [status, setStatus] = useState<ScannerStatus>('starting')
  const [message, setMessage] = useState('Requesting camera access…')

  useEffect(() => {
    scanCallback.current = onScan
  }, [onScan])

  useEffect(() => {
    closeCallback.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    scannedRef.current = false
    setStatus('starting')
    setMessage('Requesting camera access…')

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setMessage(
        'This browser cannot access a camera. Type the asset ID in the field instead.',
      )
      return
    }

    let cancelled = false

    const stop = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
    }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        const video = videoRef.current
        if (!video) {
          stop()
          return
        }
        video.srcObject = stream
        await video.play()
        if (cancelled) {
          stop()
          return
        }

        setStatus('scanning')
        setMessage('Hold the QR code inside the frame.')
        const { default: jsQR } = await import('jsqr')
        if (cancelled) {
          stop()
          return
        }

        const poll = () => {
          if (cancelled || scannedRef.current) return
          const currentVideo = videoRef.current
          const canvas = canvasRef.current
          const context = canvas?.getContext('2d', { willReadFrequently: true })
          if (currentVideo && canvas && context && currentVideo.videoWidth > 0) {
            const scale = Math.min(
              1,
              720 / Math.max(currentVideo.videoWidth, currentVideo.videoHeight),
            )
            canvas.width = Math.max(1, Math.floor(currentVideo.videoWidth * scale))
            canvas.height = Math.max(1, Math.floor(currentVideo.videoHeight * scale))
            context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height)
            const frame = context.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(frame.data, frame.width, frame.height, {
              inversionAttempts: 'dontInvert',
            })
            const value = code?.data.trim()
            if (value) {
              scannedRef.current = true
              stop()
              scanCallback.current(normalizeQrPayload(value))
              closeCallback.current()
              return
            }
          }
          timerRef.current = window.setTimeout(poll, 250)
        }
        poll()
      } catch (error) {
        if (cancelled) return
        stop()
        const name = error instanceof DOMException ? error.name : ''
        setStatus('error')
        setMessage(
          name === 'NotAllowedError'
            ? 'Camera permission was blocked. Allow camera access in the browser, or type the asset ID instead.'
            : name === 'NotFoundError'
              ? 'No camera was found on this device. Type the asset ID instead.'
              : 'The camera could not start. Close this dialog and type the asset ID instead.',
        )
      }
    }

    start()

    return () => {
      cancelled = true
      stop()
    }
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      eyebrow="Camera / webcam"
      className="max-w-xl"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="relative flex h-[280px] items-center justify-center overflow-hidden rounded-card border-2 border-[#2A2418] bg-ink">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            aria-label="Camera preview"
            className={cn(
              'h-full w-full object-cover',
              status !== 'scanning' && 'opacity-25',
            )}
          />
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
          <span className="pointer-events-none absolute left-5 top-5 h-9 w-9 rounded-tl-md border-l-[5px] border-t-[5px] border-amber" />
          <span className="pointer-events-none absolute right-5 top-5 h-9 w-9 rounded-tr-md border-r-[5px] border-t-[5px] border-amber" />
          <span className="pointer-events-none absolute bottom-5 left-5 h-9 w-9 rounded-bl-md border-b-[5px] border-l-[5px] border-amber" />
          <span className="pointer-events-none absolute bottom-5 right-5 h-9 w-9 rounded-br-md border-b-[5px] border-r-[5px] border-amber" />
          {status !== 'scanning' ? (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-10 text-center text-butter">
              <QrCode className="h-9 w-9" aria-hidden="true" />
              <span className="text-[13px]">
                {status === 'starting' ? 'Starting camera…' : 'Camera unavailable'}
              </span>
            </span>
          ) : null}
        </div>

        <p
          role={status === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={cn(
            'm-0 text-[13px] leading-relaxed',
            status === 'error' ? 'text-danger' : 'text-neutral-text',
          )}
        >
          {message}
        </p>

        <p className="m-0 text-xs leading-relaxed text-muted">
          The camera starts only when this dialog opens and stops when it closes. The video is
          decoded on this device; nothing is uploaded.
        </p>
      </div>
    </Dialog>
  )
}
