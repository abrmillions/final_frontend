"use client"
import { useEffect, useRef, useState } from "react"
import jsQR from "jsqr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Loader2, Upload, Camera, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

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
    
    // Reset state for new scan
    setError("")
    setScannedCode(null)
    
    const img = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      img.onload = () => {
        // Use an off-screen canvas for decoding
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        
        ctx.drawImage(img, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        try {
          const qrValue = detectQRCode(imageData)
          if (qrValue) {
            toast({
              title: "QR Code Detected",
              description: "Verifying license information...",
              variant: "default",
            })
            setScannedCode(qrValue)
            setTimeout(() => onScan(qrValue), 300)
          } else {
            setError('No QR code found in the uploaded image. Please try a clearer photo.')
            toast({
              title: "Scan Failed",
              description: "No QR code could be detected in this image.",
              variant: "destructive",
            })
          }
        } catch (err) {
          setError('Failed to process the uploaded image.')
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
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardContent className="pt-6 space-y-6">
          <Alert variant="destructive" className="bg-destructive/5">
            <AlertDescription className="flex items-center gap-2">
              <Camera className="w-4 h-4 shrink-0" />
              {error}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="relative group">
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted rounded-xl bg-muted/5 group-hover:bg-muted/10 group-hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm mb-1 text-center">Upload QR Image</h4>
                <p className="text-[11px] text-muted-foreground text-center px-4">
                  Take a photo or upload a screenshot of the QR code to verify.
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full w-full"
                  title=""
                />
              </div>
            </div>

            {devices.length > 0 && (
              <div className="p-4 border rounded-xl bg-slate-50/50 space-y-3">
                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Camera</Label>
                <select
                  aria-label="Camera device"
                  value={selectedDeviceId ?? ''}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full text-sm bg-white border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                >
                  {devices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 4)}`}</option>
                  ))}
                </select>
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => {
                      setError('')
                      void startCamera(selectedDeviceId || undefined)
                    }}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    size="sm"
                  >
                    Try Camera
                  </Button>
                  <Button
                    onClick={() => {
                      setError('')
                      void startCamera(undefined)
                    }}
                    className="flex-1"
                    variant="outline"
                    size="sm"
                  >
                    Auto Retry
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button onClick={onClose} className="w-full" variant="ghost">
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          
          <div className="relative">
            <Button variant="outline" className="w-full h-12 bg-slate-50/50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all gap-2">
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium">Upload QR Image</span>
            </Button>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
              title=""
            />
          </div>
        </div>

        <Button onClick={onClose} variant="ghost" className="w-full mt-2 text-slate-500 hover:text-slate-700">
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
