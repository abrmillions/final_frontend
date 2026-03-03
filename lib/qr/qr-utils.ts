// Single, clean TypeScript QR utilities module
import * as QRCode from 'qrcode'

export interface QRGenerationOptions {
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
  color: { dark: '#000000', light: '#FFFFFF' },
}

export interface LicenseQRData {
  licenseId: string
  licenseNumber: string
  holderName: string
  companyName?: string
  type?: string
  issueDate: string
  expiryDate: string
  verificationUrl: string
  generatedAt: string
}

export async function generateQRDataURL(data: string, options?: Partial<QRGenerationOptions>): Promise<string> {
  try {
    const finalOptions = { ...DEFAULT_OPTIONS, ...(options || {}) }
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
      // Use callback signature to avoid type resolution issues
      ;(QRCode as any).toDataURL(data, opts, (err: any, url: string) => {
        if (err) reject(err)
        else resolve(url)
      })
    })
  } catch (err) {
    console.error('[qr-utils] generateQRDataURL failed', err)
    throw err
  }
}

export async function generateQRCanvas(data: string, canvas: HTMLCanvasElement, options?: Partial<QRGenerationOptions>): Promise<void> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...(options || {}) }
  try {
    await QRCode.toCanvas(canvas, data, {
      errorCorrectionLevel: finalOptions.errorCorrectionLevel,
      margin: finalOptions.margin,
      width: finalOptions.width,
      color: finalOptions.color,
    })
  } catch (err) {
    console.error('[qr-utils] generateQRCanvas failed', err)
    throw err
  }
}

export function createLicenseQRData(licenseId: string, licenseNumber: string, holderName: string, issueDate: string, expiryDate: string, verificationUrl: string): LicenseQRData {
  return { licenseId, licenseNumber, holderName, issueDate, expiryDate, verificationUrl, generatedAt: new Date().toISOString() }
}

export function createLicenseQRPayload(params: {
  licenseId: string
  licenseNumber: string
  holderName?: string
  companyName?: string
  type?: string
  issueDate: string
  expiryDate: string
  verificationUrl: string
}): LicenseQRData {
  return {
    licenseId: String(params.licenseId),
    licenseNumber: String(params.licenseNumber),
    holderName: params.holderName || '',
    companyName: params.companyName || '',
    type: params.type,
    issueDate: params.issueDate,
    expiryDate: params.expiryDate,
    verificationUrl: params.verificationUrl,
    generatedAt: new Date().toISOString(),
  }
}

export function createVerificationUrl(
  baseUrl: string = typeof window !== 'undefined' ? window.location.origin : '',
  licenseIdOrNumber: string,
  licenseNumber?: string
): string {
  const url = new URL('/verify', baseUrl)

  // Public verification is done by license number, so always include it.
  // If an explicit licenseNumber is provided, prefer that; otherwise
  // fall back to the identifier passed in.
  const numberForQuery = licenseNumber || licenseIdOrNumber
  url.searchParams.set('licenseNumber', numberForQuery)

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
    // Try JSON first (encodes full license object)
    try {
      const parsed = JSON.parse(qrText)
      if (parsed && (parsed.licenseNumber || parsed.licenseId)) return parsed
      return parsed
    } catch {
      // Not JSON — check for verification URL containing licenseNumber
      const s = String(qrText || '')
      if (s.includes('/verify')) {
        const licenseNumber = extractLicenseNumberFromUrl(s)
        return { type: 'url', value: s, isVerificationUrl: true, licenseNumber }
      }
      return { type: 'text', value: s }
    }
  } catch (err) {
    console.error('[qr-utils] parseQRData error', err)
    return null
  }
}

export async function downloadQRCode(data: string, filename = 'qr-code.png', options?: Partial<QRGenerationOptions>): Promise<void> {
  let dataUrl = data
  // If data is already a data URL, use it directly; otherwise generate QR code
  if (!data.startsWith('data:image/')) {
    dataUrl = await generateQRDataURL(data, options)
  }
  
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
    console.warn('[qr-utils] copyQRToClipboard fallback to text', err)
    await navigator.clipboard.writeText(dataUrl)
  }
}
