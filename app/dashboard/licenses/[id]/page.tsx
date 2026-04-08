 "use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Share2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateLicensePDF } from "@/lib/downloads/pdf-generator"
import { downloadPDF } from "@/lib/downloads/file-download"
import { generateQRDataURL, createVerificationUrl, downloadQRCode, createLicenseQRPayload } from "@/lib/qr/qr-utils"
import { shareLink, copyToClipboard } from "@/lib/button-actions"
import { DJANGO_API_URL } from "@/lib/config/django-api"

export default function LicenseDetail() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { toast } = useToast()
  const [license, setLicense] = useState<any>(null)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const loadLicense = async () => {
      try {
        setIsLoading(true)
        // Fetch from backend
          const client = await import("@/lib/api/django-client")
          let lic: any = null
          try {
            const data = await client.licensesApi.getLicense(id as string)
            lic = data
          } catch (e: any) {
            let triedVerify = false
            if (e?.status === 401 || e?.status === 404) {
              try {
                const djangoApi = (await import('@/lib/api/django-client')).default
                const res: any = await djangoApi.verifyLicense({ licenseNumber: String(id) })
                if (res && (res.license_number || res.id)) {
                  lic = {
                    id: res.id,
                    license_number: res.license_number || String(id),
                    issued_date: res.issued_date,
                    expiry_date: res.expiry_date,
                    status: res.status || (res.valid ? 'active' : 'pending'),
                    license_type: res.license_type,
                    data: {
                      holderName: res.holder_name || '',
                      companyName: res.company_name || '',
                      licenseNumber: res.license_number || String(id),
                      issueDate: res.issued_date,
                      expiryDate: res.expiry_date,
                    },
                    license_photo_url: res.license_photo_url,
                  }
                  triedVerify = true
                }
              } catch (_) {
                triedVerify = true
              }
            }
            if (!lic && !triedVerify) {
              try {
                const list = await client.licensesApi.list()
                const arr = Array.isArray(list) ? list : []
                const found = arr.find((s: any) => {
                  const d = s.data || {}
                  return (
                    String(s.license_number) === String(id) ||
                    String(s.id) === String(id) ||
                    String(d.licenseNumber) === String(id) ||
                    String(d.registrationNumber) === String(id)
                  )
                })
                if (found) lic = found
              } catch {}
            }
          }
          if (!lic) throw new Error('No License matches the given query.')

        // Normalize fields similar to list page shape
        const d = lic.data || {}
        // Prefer backend `license_number` for display; do not use numeric id as license number
        const registrationNumber = lic.license_number || d.registrationNumber || d.licenseNumber || ""
        const issueDate = lic.issued_date || d.issueDate || lic.created_at || new Date().toISOString()
        const expiryDate = lic.expiry_date || d.expiryDate || issueDate
        const typeLabelMap: Record<string, string> = {
          contractor: "Contractor License",
          professional: "Professional License",
          vehicle: "Vehicle License",
          profile: "Contractor License",
          company_representative: "Import/Export License",
          'import-export': "Import/Export License",
        }
        const type = d.type || typeLabelMap[lic.license_type as keyof typeof typeLabelMap] || lic.license_type || "License"
        const verificationUrl = d.verificationUrl || (typeof window !== "undefined" ? `${window.location.origin}/verify?licenseNumber=${encodeURIComponent(String(registrationNumber))}` : `/verify?licenseNumber=${encodeURIComponent(String(registrationNumber))}`)

        const normalized = {
          // backend id still used for routes
          backendId: lic.id,
          id: registrationNumber,
          type,
          category: d.category || "License",
          grade: lic.grade || d.grade || d.licenseType || d.category || "",
          holderName: d.holderName || d.holder_name || lic.holder_full_name || lic.holder_name || lic.owner || "",
          companyName: lic.company_name || d.companyName || d.company_name || "",
          position: d.position || d.currentPosition || d.current_position || "",
          registrationNumber,
          issueDate,
          expiryDate,
          status: lic.status || 'pending',
            canDownload: typeof lic.can_download !== 'undefined' ? Boolean(lic.can_download) : undefined,
            applicationStatus: lic.application_status ?? (lic.data && lic.data.application_id ? 'approved' : undefined),
          verificationUrl,
          qrCode: lic.qr_code_data || lic.qr_code || d.qrCode || verificationUrl,
          photoUrl: (() => {
            const isProfessional =
              String(lic.license_type || '').toLowerCase().includes('professional') ||
              String(type || '').toLowerCase().includes('professional')
            const alt = d.professional_photo || d.professionalPhoto || ''
            if (isProfessional && alt) {
              const s = String(alt)
              return s.startsWith('http') ? s : `${DJANGO_API_URL}${s}`
            }
            if (lic.license_photo_base64) return lic.license_photo_base64
            if (lic.license_photo_url) {
              return lic.license_photo_url.startsWith('http')
                ? lic.license_photo_url
                : `${DJANGO_API_URL}${lic.license_photo_url}`
            }
            if (lic.license_photo) {
              return lic.license_photo.startsWith('http')
                ? lic.license_photo
                : `${DJANGO_API_URL}${lic.license_photo}`
            }
            if (alt) {
              const s = String(alt)
              return s.startsWith('http') ? s : `${DJANGO_API_URL}${s}`
            }
            return undefined
          })(),
        }

        setLicense(normalized)

        // Generate QR image from full JSON payload (includes verificationUrl)
        const qrPayload = createLicenseQRPayload({
          licenseId: String(normalized.backendId || normalized.id),
          licenseNumber: normalized.registrationNumber,
          holderName: normalized.holderName,
          companyName: normalized.companyName,
          type: normalized.type,
          issueDate: normalized.issueDate,
          expiryDate: normalized.expiryDate,
          verificationUrl: normalized.verificationUrl,
        })
        const qrUrl = await generateQRDataURL(JSON.stringify(qrPayload), { width: 300 })
        setQrDataUrl(qrUrl)
      } catch (error) {
        console.error("[clms] License load error:", error)
        toast({
          title: "Error",
          description: "Failed to load license details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadLicense()
  }, [id, toast])

  const handleDownloadPDF = async () => {
    if (!license) return
    setIsDownloading(true)
    try {
      // Force regeneration of verification URL and QR code to ensure consistency
      const backendIdForUrl = license.backendId ? String(license.backendId) : undefined
      const displayNumber = license.id || license.registrationNumber || ""
      const verificationUrl = typeof window !== "undefined"
        ? createVerificationUrl(window.location.origin, backendIdForUrl ?? displayNumber, displayNumber)
        : (license.verificationUrl || createVerificationUrl(undefined, backendIdForUrl ?? displayNumber, displayNumber))

      const finalPayload = createLicenseQRPayload({
        licenseId: String(backendIdForUrl ?? displayNumber),
        licenseNumber: displayNumber,
        holderName: license.holderName,
        companyName: license.companyName,
        type: license.type,
        issueDate: license.issueDate,
        expiryDate: license.expiryDate,
        verificationUrl,
      })
      const finalQrDataUrl = await generateQRDataURL(JSON.stringify(finalPayload), { width: 300 })

      const pdf = await generateLicensePDF({
        ...license,
        verificationUrl,
        qrDataUrl: finalQrDataUrl,
      })
      const fileBase = license.id || license.registrationNumber || (license.backendId ? String(license.backendId) : 'license')
      downloadPDF(pdf, `License-${fileBase}.pdf`)
      toast({
        title: "Downloaded",
        description: "License certificate has been downloaded as PDF.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download certificate.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(license.verificationUrl)
    toast({
      title: "Link Copied",
      description: "Verification link has been copied to clipboard.",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-600">Loading license details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!license) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <p className="text-red-600 font-semibold mb-4">License not found</p>
            <Button variant="outlineBlueHover" asChild>
              <Link href="/dashboard/licenses">Back to Licenses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white print:hidden sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 line-clamp-1">License Certificate</h1>
                <p className="text-xs sm:text-sm text-slate-600">{(function(){
                  try {
                    const raw = license.licenseNumber || license.id || ''
                    if (!raw) return 'PENDING'
                    if (/^LIC-\d{4}-\d{4,}$/.test(String(raw).toUpperCase())) return String(raw).toUpperCase()
                    if (/[^0-9]/.test(String(raw))) return String(raw).toUpperCase()
                    const year = (license.issueDate ? new Date(license.issueDate).getFullYear() : new Date().getFullYear())
                    return `LIC-${year}-${String(raw).padStart(6,'0')}`
                  } catch (e) { return String(license.id) }
                })()}</p>
              </div>
            </div>
            <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/dashboard/licenses">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Licenses
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="print:hidden">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage this license</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {String(license.type || '').toLowerCase().includes('contractor') && (
                <>
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/licenses/${id}/renew`}>Renew Registration</Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent w-full">
                    <Link href={`/dashboard/licenses/${id}/change-grade`}>Change Grade</Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent w-full">
                    <Link href={`/dashboard/licenses/${id}/name-change`}>Name Change</Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent w-full">
                    <Link href={`/dashboard/licenses/${id}/replacement`}>Replacement (Lost)</Link>
                  </Button>
                </>
              )}
              {String(license.type || '').toLowerCase().includes('professional') && (
                <>
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/licenses/${id}/renew`}>Renew License</Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent w-full">
                    <Link href={`/dashboard/professional-license/upgrade`}>Upgrade</Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent w-full">
                    <Link href={`/dashboard/professional-license/upgrade-to-practicing`}>Upgrade to Practicing</Link>
                  </Button>
                  <Button asChild variant="outline" className="bg-transparent w-full">
                    <Link href={`/dashboard/licenses/${id}/replacement`}>Replacement (Lost)</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="shadow-2xl print:shadow-none border-2 border-[#D4AF37] bg-white relative overflow-hidden">
            {/* Watermark Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>

            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-none"></div>
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-none"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-none"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-[#D4AF37] rounded-br-none"></div>

            <CardHeader className="text-center pt-8 sm:pt-12 pb-2 relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4 sm:mb-6">
                 {/* Gold Building Logo */}
                 <div className="relative">
                   <div className="absolute inset-0 bg-[#D4AF37] blur-sm opacity-20 rounded-full"></div>
                   <Building2 className="h-12 w-12 sm:h-16 sm:w-16 text-[#D4AF37]" />
                 </div>
              </div>
              <CardTitle className="text-2xl sm:text-4xl mb-4 font-serif font-bold text-[#D4AF37] tracking-wider uppercase">
                {license.type.endsWith('License') ? license.type : `${license.type} LICENSE`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-8 relative z-10">
              {/* Photo Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="p-1 border-2 border-[#D4AF37] shadow-lg mb-4 sm:mb-6 bg-white">
                  {license.photoUrl ? (
                    <img src={license.photoUrl} alt="License photo" className="w-24 h-32 sm:w-32 sm:h-40 object-cover" />
                  ) : (
                    <div className="w-24 h-32 sm:w-32 sm:h-40 bg-slate-100 flex items-center justify-center">
                      <span className="text-slate-300 text-3xl sm:text-4xl">?</span>
                    </div>
                  )}
                </div>
                
                {/* License Number - Single Line */}
                <div className="text-center border-b border-[#D4AF37]/30 pb-4 w-full max-w-lg mx-auto mb-4">
                  <p className="text-base sm:text-lg font-serif font-bold text-slate-900 uppercase tracking-wide">
                    LICENSE NO.: {(function(){
                      try {
                        const raw = license.licenseNumber || license.registrationNumber || license.id || ''
                        if (!raw) return 'PENDING'
                        if (/^LIC-\d{4}-\d{4,}$/.test(String(raw).toUpperCase())) return String(raw).toUpperCase()
                        if (/[^0-9]/.test(String(raw))) return String(raw).toUpperCase()
                    const year = (license.issueDate ? new Date(license.issueDate).getFullYear() : new Date().getFullYear())
                    return `LIC-${year}-${String(raw).padStart(6,'0')}`
                  } catch (e) { return String(license.id || '') }
                    })()}
                  </p>
                </div>

                <h2 className="text-2xl sm:text-4xl font-serif font-bold text-slate-900 text-center uppercase tracking-tight mb-2">
                  {license.holderName}
                </h2>
              </div>

              <div className="grid gap-6 sm:gap-8 md:grid-cols-1">
                <div className="space-y-6 text-center">
                  {/* License Info - Centered Multi-row */}
                  <div className="flex flex-col items-center gap-3 text-sm md:text-base border-t border-b border-[#D4AF37]/30 py-4 sm:py-6 max-w-2xl mx-auto w-full">
                    {/* Row 1: Type and Company */}
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2 sm:gap-4 md:gap-8 text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-[#D4AF37] hidden sm:inline">•</span>
                          <span className="font-semibold text-slate-700">License Type:</span>
                          <span className="font-serif uppercase text-xs sm:text-sm md:text-base">
                            {license.type.endsWith('License') ? license.type : `${license.type} LICENSE`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#D4AF37] hidden sm:inline">•</span>
                          <span className="font-semibold text-slate-700">Company:</span>
                          <span className="font-serif uppercase text-xs sm:text-sm md:text-base">{license.companyName}</span>
                        </div>
                    </div>

                    {/* Row 2: Category */}
                    <div className="flex items-center gap-2 text-slate-800">
                      <span className="text-[#D4AF37] hidden sm:inline">•</span>
                      <span className="font-semibold text-slate-700">Category:</span>
                      <span className="font-serif uppercase text-xs sm:text-sm md:text-base">{license.category}</span>
                    </div>

                    {/* Row 3: Status Badge */}
                    <div className="mt-1 sm:mt-2">
                       {(license.status === 'active' || license.status === 'approved') ? (
                           <Badge className="bg-emerald-600 hover:bg-emerald-700 px-6 sm:px-8 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full shadow-sm border-0">
                             Active
                           </Badge>
                       ) : (
                           <Badge variant="outline" className="px-4 sm:px-6 py-1 text-[10px] sm:text-xs uppercase tracking-wide border-slate-400 text-slate-600">
                             {license.status}
                           </Badge>
                       )}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex flex-row justify-between items-center max-w-lg mx-auto w-full px-4 sm:px-8 gap-4">
                    <div className="text-left flex-1">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">Issued Date</p>
                      <p className="text-sm sm:text-base font-serif text-slate-900">
                        {new Date(license.issueDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-1">
                      <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wide">Expiry Date</p>
                      <p className="text-sm sm:text-base font-serif text-slate-900">
                        {new Date(license.expiryDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Section: QR, Signature, Seal */}
                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between mt-8 sm:mt-12 pt-6 sm:pt-8 gap-8 sm:gap-4">
                  {/* QR Code */}
                  <div className="flex flex-col items-center sm:items-start order-3 sm:order-1">
                    <div className="bg-white p-2 border border-slate-200 shadow-sm">
                       <img src={qrDataUrl || "/placeholder.svg"} alt="QR" className="w-20 h-20 sm:w-24 sm:h-24" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-25 text-center sm:text-left leading-tight">
                      Scan to verify authenticity
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="flex flex-col items-center justify-center flex-1 w-full order-2">
                    <div className="w-32 sm:w-48 border-b border-slate-900 mb-2"></div>
                    <p className="font-serif italic text-slate-900 text-sm sm:text-base">Authorized Signature</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider mt-1">Registrar of Licenses</p>
                  </div>

                  {/* Seal */}
                  <div className="flex flex-col items-center order-1 sm:order-3">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                      {/* Gold Seal CSS simulation */}
                      <div className="absolute inset-0 bg-[#D4AF37] rounded-full shadow-lg flex items-center justify-center border-4 border-[#B8860B] border-dashed">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 border border-[#B8860B] rounded-full flex items-center justify-center">
                           <div className="text-white font-bold text-[8px] sm:text-[10px] transform -rotate-12 text-center leading-tight">
                             OFFICIAL<br/>APPROVED<br/>SEAL
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">Verification URL</h4>
                  <p className="text-sm text-slate-600 break-all">{license.verificationUrl}</p>
                </div>
              </div>

              {(() => {
                const statusAllowed = (license.status === 'approved' || license.status === 'active')
                if (!statusAllowed) return null
                return (
                  <div className="mt-8 flex flex-wrap gap-3 print:hidden">
                    <Button variant="outline" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Verification Link
                    </Button>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
