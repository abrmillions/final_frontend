"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Download, QrCode, CreditCard, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateQRDataURL, createVerificationUrl, createLicenseQRPayload } from "@/lib/qr/qr-utils"
import { generateLicensePDF } from "@/lib/downloads/pdf-generator"
import { downloadPDF } from "@/lib/downloads/file-download"
import { licensesApi } from "@/lib/api/django-client"
import { DJANGO_API_URL } from '@/lib/config/django-api'
import { getCachedLicenses, removeCachedLicense } from "@/lib/storage/licenses-cache"

export default function MyLicenses() {
  const router = useRouter()
  const { toast } = useToast()
  const [licenses, setLicenses] = useState<any[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [newLicenseBanner, setNewLicenseBanner] = useState(false)

  useEffect(() => {
    const migrateCachedAndFetchLicenses = async () => {
      try {
        setIsLoading(true)

        // 1) Push any cached (frontend-only) licenses to the backend
        const cached = getCachedLicenses()
        if (cached.length) {
          for (const c of cached) {
            try {
              const normalizeType = (t?: string) => {
                if (!t) return "contractor"
                const map: Record<string, string> = {
                  contractor: "contractor",
                  professional: "professional",
                  vehicle: "vehicle",
                }
                // if it already matches a backend choice, use as-is; otherwise default
                return map[t as keyof typeof map] ?? "contractor"
              }

              const license_type = normalizeType(c.type)
              const licenseNumber = String(c.id)

              const payload = {
                license_type,
                data: {
                  licenseNumber,
                  holderName: c.holderName || null,
                  companyName: c.companyName || null,
                  registrationNumber: licenseNumber,
                  verificationUrl: c.verificationUrl || null,
                },
                status: c.status || "active",
              }

              // If creation fails, leave it in cache to retry later
              await licensesApi.create(payload)
              removeCachedLicense(c.id)
            } catch (e) {
      console.warn("[clms] failed to migrate cached license to backend", c, e)
            }
          }
        }

        // 2) Fetch the authoritative list from backend
        const data = await licensesApi.list()
        const serverLicenses = Array.isArray(data) ? data : []

        // Normalize backend License objects into the shape expected by this UI.
        // Prefer the current user's full name for holder display where possible
        const currentUser = (() => {
          try {
            if (typeof window === 'undefined') return null
            const raw = window.localStorage.getItem('clms_user')
            return raw ? JSON.parse(raw) : null
          } catch { return null }
        })()
        const currentFullName = currentUser ? (currentUser.fullName || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()) : ''

        const normalized = serverLicenses.map((lic: any) => {
          const d = lic.data || {}

          const registrationNumber =
            d.registrationNumber ||
            d.licenseNumber ||
            lic.license_number ||
            lic.id

          const issueDate =
            lic.issued_date ||
            d.issueDate ||
            lic.created_at ||
            new Date().toISOString()

          const expiryDate =
            lic.expiry_date ||
            d.expiryDate ||
            issueDate

          const typeLabelMap: Record<string, string> = {
            contractor: "Contractor License",
            professional: "Professional License",
            vehicle: "Vehicle License",
            profile: "Contractor License",
            company_representative: "Import/Export License",
            'import-export': "Import/Export License",
          }

          const type =
            d.type ||
            typeLabelMap[lic.license_type as keyof typeof typeLabelMap] ||
            lic.license_type ||
            "License"

          const verificationUrl =
            d.verificationUrl ||
            (typeof window !== "undefined"
              ? `${window.location.origin}/verify?licenseNumber=${encodeURIComponent(
                  String(registrationNumber),
                )}`
              : `/verify?licenseNumber=${encodeURIComponent(
                  String(registrationNumber),
                )}`)

          // Determine expired status client-side to reflect immediately
          const expDateObj = new Date(expiryDate)
          const now = new Date()
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const expMidnight = new Date(expDateObj.getFullYear(), expDateObj.getMonth(), expDateObj.getDate())
          const backendStatus = (lic.status || "active").toLowerCase()
          const finalStatus = expMidnight <= todayMidnight ? "expired" : backendStatus

          return {
            // backend id for routes
            backendId: lic.id,
            // prefer system-generated license_number for display; do NOT fall back to numeric id
            licenseNumber: lic.license_number || d.licenseNumber || d.registrationNumber || "",
            id: registrationNumber,
            type,
            category: d.category || "License",
            grade: lic.grade || d.grade || d.licenseType || d.category || "",
            holderName: d.holderName || d.holder_name || lic.holder_full_name || lic.holder_name || (currentFullName || lic.owner || ""),
            companyName: lic.company_name || d.companyName || d.company_name || "",
            position: d.position || d.currentPosition || d.current_position || "",
            issueDate,
            expiryDate,
            status: finalStatus,
            verificationUrl,
            photoUrl: lic.license_photo_base64
              ? lic.license_photo_base64
              : (lic.license_photo_url
                ? (lic.license_photo_url.startsWith('http') ? lic.license_photo_url : `${DJANGO_API_URL}${lic.license_photo_url}`)
                : (lic.license_photo ? (lic.license_photo.startsWith('http') ? lic.license_photo : `${DJANGO_API_URL}${lic.license_photo}`) : undefined)),
            applicationStatus: lic.application_status || undefined,
            canDownload: typeof lic.can_download !== 'undefined' ? Boolean(lic.can_download) : undefined,
          }
        })

        setLicenses(normalized)
        // payments information removed; certificate download no longer gated by payment
      } catch (err: any) {
      console.error("[clms] Failed to fetch licenses:", err)
        const msg =
          err?.status === 401
            ? "Authentication required. Please log in to view your licenses."
            : (err?.message || "Failed to load licenses")
        setError(msg)
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    migrateCachedAndFetchLicenses()
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        const paid = url.searchParams.get('paid')
        if (paid === '1') {
          toast({ title: "succesfully  paid", description: "You can download the certificate now." })
          url.searchParams.delete('paid')
          window.history.replaceState({}, "", url.toString())
          migrateCachedAndFetchLicenses()
        }
      }
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'clms_licenses_refresh') {
        // show transient banner and refresh list
        try {
          setNewLicenseBanner(true)
          setTimeout(() => setNewLicenseBanner(false), 5000)
        } catch (e) {
          /* noop */
        }
        migrateCachedAndFetchLicenses()
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage)
    }

    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-600">Active</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "suspended":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleDownloadCertificate = async (license: any) => {
    setDownloadingId(license.backendId || license.id)
    try {
      // format license number consistently: prefer licenseNumber, else format numeric id
      const formatLicenseNo = (raw: any, issueDate?: string) => {
        if (!raw && String(raw) !== '0') return 'PENDING'
        const s = String(raw)
        if (/^LIC-\d{4}-\d{4,}$/.test(s.toUpperCase())) return s.toUpperCase()
        if (/[^0-9]/.test(s)) return s.toUpperCase()
        const year = (() => {
          try {
            const d = new Date(issueDate || Date.now())
            return d.getFullYear()
          } catch (e) { return new Date().getFullYear() }
        })()
        return `LIC-${year}-${s.padStart(6, '0')}`
      }
      // Force regeneration of verification URL and QR code to ensure consistency
      const verificationUrl = createVerificationUrl(undefined, (license.backendId ? String(license.backendId) : String(license.licenseNumber || license.registrationNumber)), license.licenseNumber || license.registrationNumber)

      const djangoApi = (await import('@/lib/api/django-client')).default
      let vRes: any = null
      try {
        vRes = await djangoApi.verifyLicense({ licenseNumber: String(license.licenseNumber || license.registrationNumber) })
      } catch {}
      const finalIssue = (vRes?.issued_date || license.issueDate || license.issued_date || license.data?.issueDate || '2026-02-15T00:00:00Z')
      const finalExpiry = (vRes?.expiry_date || license.expiryDate || license.expiry_date || license.data?.expiryDate || '2031-02-15T00:00:00Z')
      const cleanQrContent = {
        id: license.backendId || license.id,
        type: license.type || license.license_type,
        category: "License",
        grade: license.grade || "",
        holderName: license.holderName || license.data?.holderName,
        companyName: license.companyName || license.data?.companyName,
        position: license.position || license.data?.position || license.data?.currentPosition || license.data?.current_position,
        registrationNumber: license.licenseNumber || license.registrationNumber || license.data?.registrationNumber,
        issueDate: finalIssue,
        expiryDate: finalExpiry,
        status: license.status,
        verificationUrl
      }

      const qrPayload = createLicenseQRPayload({
        licenseId: String(cleanQrContent.id),
        licenseNumber: String(cleanQrContent.registrationNumber),
        holderName: String(cleanQrContent.holderName || ''),
        companyName: String(cleanQrContent.companyName || ''),
        type: String(cleanQrContent.type || 'License'),
        issueDate: String(finalIssue),
        expiryDate: String(finalExpiry),
        verificationUrl: String(verificationUrl),
      })
      const qrDataUrl = await generateQRDataURL(JSON.stringify(qrPayload))

      const pdf = await generateLicensePDF({
        ...cleanQrContent,
        qrDataUrl,
        photoUrl: license.photoUrl,
      })
      const fileNameId = license.licenseNumber || license.registrationNumber || (license.backendId ? String(license.backendId) : String(license.id))
      const safeFileName = formatLicenseNo(fileNameId, license.issueDate || license.issueDate)
      downloadPDF(pdf, `License-${safeFileName}.pdf`)
      toast({
        title: "Downloaded",
        description: "License certificate has been downloaded as PDF.",
      })
    } catch (error) {
      console.error("Error downloading certificate:", error)
      toast({
        title: "Error",
        description: "Failed to download certificate.",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base sm:text-lg font-semibold text-slate-900">My Licenses</h1>
              <p className="text-[11px] sm:text-xs text-slate-600">View and manage your licenses</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs w-full sm:w-auto">
            <Link href="/dashboard">
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 max-w-5xl">
        {newLicenseBanner && (
          <div className="mb-4 p-2.5 rounded-lg bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm">
            <strong>New license created from Applications</strong>
            <p>A new license was added from your Applications — the list has been refreshed.</p>
          </div>
        )}
        {isLoading ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="px-6 py-10 text-center">
              <Loader2 className="h-10 w-10 text-slate-300 mx-auto mb-4 animate-spin" />
              <p className="text-sm text-slate-500">Loading licenses...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="px-6 py-10 text-center">
              <p className="text-red-600 font-semibold">{error}</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : licenses.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="px-6 py-10 text-center">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500">No licenses issued yet</p>
              <Button asChild className="mt-4">
                <Link href="/dashboard">Apply for a License</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            {licenses.map((license) => (
              <Card
                key={license.backendId || license.id}
                className="hover:shadow-md transition-shadow rounded-xl border-slate-200"
              >
                <CardHeader className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {license.photoUrl ? (
                        <img src={license.photoUrl} alt="license photo" className="w-12 h-12 rounded-md object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-slate-100" />
                      )}
                      <div className="space-y-1">
                        <CardTitle className="text-sm sm:text-base font-semibold">
                          {license.type}
                        </CardTitle>
                        <CardDescription className="text-[11px] sm:text-xs">
                          {license.category}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="shrink-0">{getStatusBadge(license.status)}</div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-4 pt-0">
                  <div className="grid gap-3 md:grid-cols-2 mb-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-[11px] text-slate-500">License Number</p>
                      <p className="text-sm font-semibold text-slate-900 break-all">{license.licenseNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Issue Date</p>
                      <p className="text-sm text-slate-900">
                        {new Date(license.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Expiry Date</p>
                      <p className="text-sm text-slate-900">
                        {new Date(license.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    {(() => {
                      const status = (license.status || '').toLowerCase()
                      const showActions = (status === 'active' || status === 'approved') && (license.applicationStatus === 'approved')
                      if (!showActions) return null
                      return (
                        <div>
                          <p className="text-[11px] text-slate-500">Verification URL</p>
                          <p className="text-[11px] font-mono break-all">
                            <Link href={license.verificationUrl} className="text-blue-700 underline">
                              {license.verificationUrl}
                            </Link>
                          </p>
                        </div>
                      )
                    })()}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(() => {
                      const status = (license.status || '').toLowerCase()
                      const showActions = (status === 'active' || status === 'approved') && (license.applicationStatus === 'approved')
                      const isExpired = status === 'expired'

                      return (
                        <>
                          {showActions && (
                            <>
                              <> 
                                <Button size="sm" className="h-8 px-3 text-xs" asChild>
                                  <Link href={`/dashboard/licenses/${license.backendId || license.id}`}>
                                    <QrCode className="h-3 w-3 mr-1.5" />
                                    View QR
                                  </Link>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => handleDownloadCertificate(license)}
                                  disabled={downloadingId === (license.backendId || license.id)}
                                >
                                  <Download className="h-3 w-3 mr-1.5" />
                                  {downloadingId === (license.backendId || license.id) ? "Downloading..." : "Certificate"}
                                </Button>
                                {String(license.type || '').toLowerCase().includes('professional') && (
                                  <>
                                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs" asChild>
                                      <Link href={`/dashboard/professional-license/upgrade`}>
                                        Upgrade
                                      </Link>
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs" asChild>
                                      <Link href={`/dashboard/professional-license/upgrade-to-practicing`}>
                                        Upgrade to Practicing
                                      </Link>
                                    </Button>
                                  </>
                                )}
                              </>
                            </>
                          )}

                          {isExpired && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs"
                              asChild
                            >
                              <Link href={`/dashboard/licenses/${license.backendId || license.id}/renew`}>
                                <CreditCard className="h-3 w-3 mr-1.5" />
                                Renew
                              </Link>
                            </Button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
