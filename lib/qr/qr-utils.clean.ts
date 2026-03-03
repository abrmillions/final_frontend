import * as QRCode from 'qrcode'

/**
 * @typedef {Object} QRGenerationOptions
 * @property {'L'|'M'|'Q'|'H'} [errorCorrectionLevel]
 * @property {'image/png'|'image/jpeg'|'image/webp'} [type]
 * @property {number} [quality]
 * @property {number} [margin]
 * @property {number} [width]
 * @property {{dark:string,light:string}} [color]
 */

interface QRGenerationOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  type?: 'image/png' | 'image/jpeg' | 'image/webp'
  quality?: number
  margin?: number
  width?: number
  color?: { dark: string; light: string }
}

const DEFAULT_OPTIONS: QRGenerationOptions = {
  errorCorrectionLevel: 'H',
  type: 'image/png',
  quality: 0.95,
  margin: 1,
  width: 300,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
}

/** Generate a QR code as a data URL */
export async function generateQRDataURL(data: string, options?: Partial<QRGenerationOptions>): Promise<string> {
  const finalOptions: QRGenerationOptions = { ...DEFAULT_OPTIONS, ...(options || {}) }
  try {
    const opts: any = {
      errorCorrectionLevel: finalOptions.errorCorrectionLevel,
      margin: finalOptions.margin,
      width: finalOptions.width,
      color: finalOptions.color,
    }
    if (finalOptions.type) {
      opts.type = finalOptions.type
      if (finalOptions.type !== 'image/png' && typeof finalOptions.quality === 'number') {
        opts.quality = finalOptions.quality
      }
    }
    return await new Promise<string>((resolve, reject) => {
      ;(QRCode as any).toDataURL(data, opts, (err: any, url: string) => {
        if (err) reject(err)
        else resolve(url)
      })
    })
  } catch (err) {
    console.error('[clms] QR generation failed', err)
    throw err
  }
}

/** Generate a QR code onto a canvas element */
export async function generateQRCanvas(data: string, canvas: HTMLCanvasElement, options?: Partial<QRGenerationOptions>): Promise<void> {
  const finalOptions: QRGenerationOptions = { ...DEFAULT_OPTIONS, ...(options || {}) }
  try {
    await QRCode.toCanvas(canvas, data, {
      errorCorrectionLevel: finalOptions.errorCorrectionLevel,
      margin: finalOptions.margin,
      width: finalOptions.width,
      color: finalOptions.color,
    })
  } catch (err) {
    console.error('[clms] QR canvas generation failed', err)
    throw err
  }
}

/** Create a license QR payload */
export function createLicenseQRData(licenseId: string, licenseNumber: string, holderName: string, issueDate: string, expiryDate: string, verificationUrl: string) {
  return {
    licenseId,
    licenseNumber,
    holderName,
    issueDate,
    expiryDate,
    verificationUrl,
    generatedAt: new Date().toISOString(),
  }
}

export function createVerificationUrl(baseUrl: string = typeof window !== 'undefined' ? window.location.origin : '', licenseId: string) {
  const url = new URL('/verify', baseUrl)
  url.searchParams.set('licenseId', licenseId)
  return url.toString()
}

export function extractLicenseNumberFromUrl(urlString: string): string | null {
  try {
    const url = new URL(urlString)
    return url.searchParams.get('licenseNumber') || url.searchParams.get('token') || url.searchParams.get('licenseId')
  } catch (e) {
    return null
  }
}

export function parseQRData(qrText: string): Record<string, any> | null {
  try {
    try {
      return JSON.parse(qrText)
    } catch {
      const s = String(qrText || '')
      return { type: 'url', value: qrText, isVerificationUrl: s.includes('/verify') }
    }
  } catch (err) {
    console.error('[clms] parseQRData error', err)
    return null
  }
}

export async function downloadQRCode(data: string, filename = 'qr-code.png', options?: Partial<QRGenerationOptions>): Promise<void> {
  const dataUrl = await generateQRDataURL(data, options)
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export async function copyQRToClipboard(dataUrl: string): Promise<void> {
  try {
    const blob = await fetch(dataUrl).then((r) => r.blob())
    // @ts-ignore
    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
  } catch (err) {
    console.warn('[clms] copyQRToClipboard fallback to text', err)
    await navigator.clipboard.writeText(dataUrl)
  }
}
