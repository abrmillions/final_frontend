"use client"

import { useState, useEffect, useRef } from "react"
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
  const processedPaidIdRef = useRef<string | null>(null)

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
            partnership: "Partnership/JV License",
            jv: "Partnership/JV License",
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
            permitDetails: lic.subtype || d.permitDetails || d.permit_details || d.subtype || "",
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

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const url = new URL(window.location.href)
      const paid = url.searchParams.get('paid')
      const id = url.searchParams.get('id')
      
      if (paid === '1' && id && licenses.length > 0) {
        // Prevent double download
        if (processedPaidIdRef.current === id) return
        
        const target = licenses.find((l) => String(l.backendId) === String(id) || String(l.id) === String(id) || String(l.licenseNumber) === String(id))
        if (target) {
          processedPaidIdRef.current = id
          handleDownloadCertificate(target)
          url.searchParams.delete('paid')
          url.searchParams.delete('id')
          window.history.replaceState({}, "", url.toString())
        }
      }
    } catch {}
  }, [licenses])

  const resolveSection = (lic: any) => {
    const t = String(lic.type || lic.license_type || "").toLowerCase()
    const p = String(lic.position || "").toLowerCase()
    
    if (t.includes("professional") || t.includes("consultant") || p.length > 0) return "professional"
    if (t.includes("import") || t.includes("export") || t.includes("trade")) return "importExport"
    if (t.includes("partnership") || t.includes("jv")) return "partnership"
    if (t.includes("vehicle") || t.includes("machinery")) return "vehicle"
    if (t.includes("contractor")) return "contractor"
    
    return "contractor"
  }

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

  const resolveCategory = (lic: any) => {
    const section = resolveSection(lic)
    const t = String(lic.type || lic.license_type || "").toLowerCase()
    const g = String(lic.grade || "").toLowerCase().trim().replace(/\s+/g, '-')
    const p = String(lic.position || "").toLowerCase()
    const d = String(lic.permitDetails || "").toLowerCase()
    
    if (section === "professional") {
      if (t.includes("engineer") || g.includes("engineer") || p.includes("engineer")) return "engineer"
      if (t.includes("architect") || g.includes("architect") || p.includes("architect")) return "architect"
      if (t.includes("surveyor") || g.includes("surveyor") || p.includes("surveyor")) return "surveyor"
      if (t.includes("consultant") || g.includes("consultant") || p.includes("consultant")) return "consultant"
      return "engineer"
    }
    
    if (section === "importExport") {
      const isSpecial = t.includes("special") || g.includes("special") || d.includes("special")
      if (t.includes("importer") || g.includes("importer") || d.includes("importer")) {
        return isSpecial ? "special-importer" : "general-importer"
      }
      if (t.includes("exporter") || g.includes("exporter") || d.includes("exporter")) {
        return isSpecial ? "special-exporter" : "general-exporter"
      }
      return "general-importer"
    }
    
    if (section === "partnership") {
      return t.includes("foreign") || g.includes("foreign") ? "partnership-foreign" : "partnership-standard"
    }
    
    if (section === "vehicle") {
      return t.includes("machinery") || g.includes("machinery") ? "heavy-machinery" : "commercial-vehicle"
    }

    // Contractor (Default)
    if (g.includes("1")) return "grade-1"
    if (g.includes("2")) return "grade-2"
    if (g.includes("3")) return "grade-3"
    if (g.includes("4")) return "grade-4"
    if (g.includes("5")) return "grade-5"
    if (g.includes("6")) return "grade-6"
    if (g.includes("7")) return "grade-7"
    if (g.includes("b")) return "grade-b"
    
    return "grade-1"
  }

  const handleDownloadCertificate = async (license: any) => {
    // If the license is already active and the system marks it as downloadable, download directly
    if (license.status === "active" && license.canDownload !== false) {
      try {
        const { generateLicensePDF } = await import("@/lib/downloads/pdf-generator")
        const pdf = await generateLicensePDF(license)
        if (pdf) {
          pdf.save(`${license.type || "License"}-${license.licenseNumber || license.id}.pdf`)
          toast({
            title: "Success",
            description: "Your certificate has been generated and downloaded.",
          })
          return
        }
      } catch (err) {
        console.error("PDF generation failed:", err)
      }
    }

    // Otherwise, redirect to payment page
    router.push(`/dashboard/payments/certificate/${license.backendId || license.id}?section=${resolveSection(license)}&category=${resolveCategory(license)}`)
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
          <Button variant="outlineBlueHover" size="sm" asChild className="h-8 px-3 text-xs w-full sm:w-auto">
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
              <Button variant="outlineBlueHover" asChild className="mt-4">
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
          <div className="space-y-4 max-w-3xl mx-auto">
            {licenses.map((license) => (
              <Card
                key={license.backendId || license.id}
                className="hover:shadow-md transition-shadow rounded-xl border-slate-200 overflow-hidden"
              >
                <CardHeader className="px-4 sm:px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {license.photoUrl ? (
                        <img src={license.photoUrl} alt="license photo" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          {license.type}
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs font-medium text-slate-500 truncate">
                          {license.category}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="shrink-0 scale-90 sm:scale-100 origin-right">{getStatusBadge(license.status)}</div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-5 pb-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 mb-4 p-3 bg-slate-50/50 rounded-lg border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">License Number</p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 break-all">{license.licenseNumber || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Issued</p>
                        <p className="text-xs sm:text-sm font-medium text-slate-900">
                          {new Date(license.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expiry</p>
                        <p className="text-xs sm:text-sm font-medium text-slate-900">
                          {new Date(license.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {(() => {
                      const status = (license.status || '').toLowerCase()
                      const showActions = (status === 'active' || status === 'approved') && (license.applicationStatus === 'approved')
                      if (!showActions) return null
                      return (
                        <div className="sm:col-span-2 min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Verification URL</p>
                          <p className="text-[10px] font-mono break-all leading-relaxed">
                            <Link href={license.verificationUrl} className="text-blue-700 underline hover:text-blue-800 transition-colors">
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
                              <Button size="sm" className="h-8 px-3 text-[11px] sm:text-xs font-bold shadow-sm" asChild>
                                <Link href={`/dashboard/licenses/${license.backendId || license.id}`}>
                                  <QrCode className="h-3.5 w-3.5 mr-1.5" />
                                  View QR
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-[11px] sm:text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                                asChild
                              >
                                <Link href={`/dashboard/payments/certificate/${license.backendId || license.id}?section=${resolveSection(license)}&category=${resolveCategory(license)}`}>
                                  <Download className="h-3.5 w-3.5 mr-1.5" />
                                  Certificate
                                </Link>
                              </Button>
                              {String(license.type || '').toLowerCase().includes('professional') && (
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                                  <Button size="sm" variant="outline" className="h-8 px-3 text-[11px] sm:text-xs font-bold flex-1 sm:flex-none" asChild>
                                    <Link href={`/dashboard/professional-license/upgrade`}>
                                      Upgrade
                                    </Link>
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-8 px-3 text-[11px] sm:text-xs font-bold flex-1 sm:flex-none" asChild>
                                    <Link href={`/dashboard/professional-license/upgrade-to-practicing`}>
                                      Upgrade to Practicing
                                    </Link>
                                  </Button>
                                </div>
                              )}
                            </>
                          )}

                          {isExpired && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-[11px] sm:text-xs font-bold w-full sm:w-auto border-red-200 text-red-600 hover:bg-red-50"
                              asChild
                            >
                              <Link href={`/dashboard/licenses/${license.backendId || license.id}/renew`}>
                                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                                Renew License
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
