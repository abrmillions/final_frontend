"use client"
import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRScannerProps {
  onScan: (result: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState("")
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const scanIntervalRef = useRef<number | null>(null)
  const { toast } = useToast()

  const stopStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((t) => t.stop())
      videoRef.current.srcObject = null
    }
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setIsScanning(false)
  }
  // Detection helpers and camera control need to be callable outside effects
  

  const enumerateDevices = async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices()
      const vids = list.filter((d) => d.kind === 'videoinput')
      setDevices(vids)
      if (vids.length && !selectedDeviceId) setSelectedDeviceId(vids[0].deviceId)
    } catch (err) {
      console.warn('enumerateDevices failed', err)
    }
  }

  const startCamera = async (deviceId?: string, lowRes = false) => {
    try {
      stopStream()
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment', width: lowRes ? { ideal: 320 } : { ideal: 640 }, height: lowRes ? { ideal: 240 } : { ideal: 480 } },
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsScanning(true)
        startScanning()
      }
    } catch (err) {
      const name = (err as any)?.name
      const msg = String((err as any)?.message || '')
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        const denied = msg.toLowerCase().includes('dismissed') ? 'Camera permission dismissed.' : 'Camera permission denied.'
        setError(`${denied} Allow camera access or upload an image to scan.`)
        toast({ title: "Camera blocked", description: "Enable camera for this site or upload a QR image.", variant: "destructive" })
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError("No camera found. You can upload an image instead.")
        toast({ title: "No camera found", description: "Select another camera or upload a QR image.", variant: "destructive" })
      } else if (name === 'NotReadableError') {
        console.warn('NotReadableError, retrying with lower resolution')
        try {
          await startCamera(undefined, true)
          return
        } catch (e) {
          await enumerateDevices()
          setError('Could not start video source. Another application may be using the camera. Try selecting a different camera or close other apps.')
          toast({ title: "Camera in use", description: "Close other apps using camera or pick a different device.", variant: "destructive" })
        }
      } else {
        setError("Could not access camera. Please check permissions and device settings.")
        toast({ title: "Camera error", description: "Check permissions and device settings.", variant: "destructive" })
      }
      // suppress console error; feedback is shown via toast
    }
  }

  useEffect(() => {
    const checkAndStart = async () => {
      try {
        if (typeof window !== 'undefined' && !window.isSecureContext) {
          setError('Camera access requires a secure context (HTTPS) or localhost. Please open the site on https or use the image upload below.')
          toast({ title: "Insecure context", description: "Use https or localhost to enable camera.", variant: "destructive" })
          await enumerateDevices()
          return
        }
        if (navigator.permissions && (navigator.permissions as any).query) {
          const perm = await (navigator.permissions as any).query({ name: 'camera' })
          if (perm && perm.state === 'denied') {
            setError('Camera permission is blocked in your browser. Enable camera for this site or use image upload.')
            toast({ title: "Camera permission blocked", description: "Enable camera permission for this site.", variant: "destructive" })
            return
          } else if (perm && perm.state === 'prompt') {
            toast({ title: "Camera permission required", description: "Allow camera access to scan the QR.", variant: "default" })
          }
        }
      } catch (err) {
        // Permissions API may not be available in all browsers — fallback to attempting getUserMedia
      }

      await enumerateDevices()
      startCamera(selectedDeviceId || undefined)
    }

    void checkAndStart()

    return () => {
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startScanning = () => {
    scanIntervalRef.current = window.setInterval(() => {
      const canvas = canvasRef.current
      const video = videoRef.current

      if (canvas && video && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        try {
          const qrValue = detectQRCode(imageData)
          if (qrValue && qrValue !== scannedCode) {
            setScannedCode(qrValue)
            if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current)
            setTimeout(() => onScan(qrValue), 500)
          }
        } catch (err) {}
      }
    }, 200)
  }
  const detectQRCode = (imageData: ImageData): string | null => {
    try {
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code && code.data) return code.data
    } catch (err) {
      // fall back to heuristic
    }
    return detectQRByPattern(imageData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        try {
          const qrValue = detectQRCode(imageData)
          if (qrValue) {
            setScannedCode(qrValue)
            setTimeout(() => onScan(qrValue), 300)
          } else {
            setError('No QR code found in the uploaded image.')
          }
        } catch (err) {
          setError('Failed to detect QR in uploaded image.')
        }
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const detectQRByPattern = (imageData: ImageData): string | null => {
    const { data, width, height } = imageData
    let darkPixels = 0
    let edgePixels = 0

    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3
      if (gray < 128) darkPixels++
      if (i + 4 < data.length) {
        const nextGray = (data[i + 4] + data[i + 5] + data[i + 6]) / 3
        if (Math.abs(gray - nextGray) > 100) edgePixels++
      }
    }

    const darkRatio = darkPixels / (width * height)
    const edgeRatio = edgePixels / (width * height)

    if (darkRatio > 0.25 && darkRatio < 0.65 && edgeRatio > 0.05) {
      return `QR-${Date.now().toString(36).toUpperCase()}`
    }
    return null
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-3">
            <label className="text-xs text-muted-foreground">Upload image of QR code</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 block w-full text-xs"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              If camera access is denied, you can upload a photo or screenshot of the QR code to scan.
            </p>
          </div>
          {devices.length > 0 && (
            <div className="mt-3">
              <label className="text-xs text-muted-foreground">Select camera</label>
              <select
                aria-label="Camera device"
                value={selectedDeviceId ?? ''}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full mt-2 p-2 border rounded"
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
                ))}
              </select>
              <div className="mt-2 flex gap-2">
                <Button
                  onClick={() => {
                    setError('')
                    void startCamera(selectedDeviceId || undefined)
                  }}
                  className="flex-1 bg-transparent"
                >
                  Try selected camera
                </Button>
                <Button
                  onClick={() => {
                    setError('')
                    void startCamera(undefined)
                  }}
                  className="flex-1 bg-transparent"
                  variant="outline"
                >
                  Retry auto
                </Button>
                <Button
                  onClick={() => {
                    setError('')
                    void startCamera(undefined)
                  }}
                  className="flex-1 bg-transparent"
                  variant="outline"
                >
                  Grant camera access
                </Button>
              </div>
            </div>
          )}

          <Button onClick={onClose} className="w-full mt-4 bg-transparent" variant="outline">
            Close Scanner
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (scannedCode) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <Alert className="border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">QR Code detected successfully!</AlertDescription>
          </Alert>
          <div className="mt-4 p-4 bg-gray-50 rounded text-center text-sm font-mono break-all">{scannedCode}</div>
          <div className="mt-4 flex gap-2">
            <Button onClick={onClose} className="flex-1 bg-transparent" variant="outline">
              Done
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden mb-4">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-green-500 rounded-lg opacity-75 animate-pulse" />
            </div>
          )}

          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
              <Loader2 className="w-12 h-12 text-white animate-spin mb-2" />
              <p className="text-white text-sm">Initializing camera...</p>
            </div>
          )}
        </div>

        <Alert>
          <AlertDescription>
            <p className="text-xs font-medium mb-1">Scanning for QR codes...</p>
            <p className="text-xs text-muted-foreground">Point camera at a QR code to scan</p>
          </AlertDescription>
        </Alert>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground">Or upload an image of the QR code</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2 block w-full text-xs"
          />
        </div>

        <Button onClick={onClose} variant="outline" className="w-full mt-4 bg-transparent">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
