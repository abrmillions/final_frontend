 "use client"
 export const dynamic = 'force-dynamic'
 import { useEffect, useState, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
 import { Input } from "@/components/ui/input"
 import { Button } from "@/components/ui/button"
import { Copy, Printer, Share2, CheckCircle2, XCircle } from "lucide-react"
 import NextDynamic from "next/dynamic"
 const QRScanner = NextDynamic(() => import("@/components/qr-scanner"), { ssr: false })
 import { partnershipsApi } from "@/lib/api/django-client"
 import { DJANGO_API_URL } from "@/lib/config/django-api"
import { generatePartnershipPDF } from "@/lib/downloads/pdf-generator"
import { downloadPDF } from "@/lib/downloads/file-download"
import { copyToClipboard, printPage, shareLink } from "@/lib/button-actions"
import { useToast } from "@/hooks/use-toast"
 
function QueryReader({ onFound }: { onFound: (value: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const qp = (searchParams.get('id') || searchParams.get('q') || '').trim()
    if (qp) onFound(qp)
  }, [searchParams])
  return null
}

export default function PartnershipPublicVerifyPage() {
  const [id, setId] = useState("")
   const [result, setResult] = useState<any>(null)
   const [error, setError] = useState<string | null>(null)
   const [loading, setLoading] = useState(false)
   const [showScanner, setShowScanner] = useState(false)
   const [detail, setDetail] = useState<any>(null)
  const autoVerified = useRef(false)
  const { toast } = useToast()
  const [hasVerified, setHasVerified] = useState(false)
  const [lastSource, setLastSource] = useState<string>("")
  const expiryRef = useRef<number | null>(null)
  const timerRef = useRef<number | null>(null)
 
  const handleVerify = async (input?: string) => {
   const source = String(((input ?? id) || "")).trim()
   if (!source) return
    if (hasVerified && source === lastSource) return
     setLoading(true)
     setError(null)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
     try {
      const queryId = source
      const isUuid = uuidRegex.test(queryId)
      if (!isUuid) {
        setError("Invalid partnership ID. Enter a valid UUID.")
        return
      }
      const res = await partnershipsApi.publicVerify(queryId)
      setResult(res)
      setDetail(null)
      setHasVerified(true)
      setLastSource(source)
      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current as any)
          timerRef.current = null
        }
        expiryRef.current = Date.now() + 300000
        timerRef.current = window.setTimeout(() => {
          setHasVerified(false)
          setResult(null)
          setDetail(null)
          setError("Verification session expired. Please re-verify.")
          expiryRef.current = null
        }, 300000)
      } catch {}
    } catch (e: any) {
      if (e?.status === 404) {
        const wasUuid = uuidRegex.test(source)
        if (wasUuid) {
          setError("Invalid partnership ID. Enter a valid UUID.")
          setDetail(null)
          setResult(null)
        }
      } else {
        const raw = e?.error?.detail || e?.message || "Verification failed"
        const msg = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(raw))
          ? "Invalid partnership ID. Enter a valid UUID."
          : String(raw)
        setError(msg)
      }
    } finally {
       setLoading(false)
     }
   }
 
  const handleInputChange = (value: string) => {
    setId(value)
    setHasVerified(false)
    setLastSource("")
    setResult(null)
    setDetail(null)
    setError(null)
    try {
      if (timerRef.current) {
        clearTimeout(timerRef.current as any)
        timerRef.current = null
      }
      expiryRef.current = null
    } catch {}
  }

  useEffect(() => {
    return () => {
      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current as any)
          timerRef.current = null
        }
      } catch {}
    }
  }, [])

 

  useEffect(() => {
    if (id && !autoVerified.current) {
      autoVerified.current = true
      handleVerify(id)
    }
  }, [id])

   const handleQRScan = async (qrText: string) => {
     try {
       // Try JSON payload first
       let parsed: any
       try {
         parsed = JSON.parse(qrText)
       } catch {
         parsed = null
       }
      const possibleId = parsed?.partnership_id || parsed?.id || parsed?.partnershipId || ""
       if (possibleId) {
        const s = String(possibleId)
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
          setId(s)
          setShowScanner(false)
          await handleVerify()
          return
        }
       }
      // Fallback: raw text treated as partnership UUID only
       const s = String(qrText || "").trim()
       if (s) {
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
          setId(s)
          setShowScanner(false)
          await handleVerify()
          return
        }
       }
      setError("Could not extract a valid partnership ID (UUID) from the QR code.")
       setShowScanner(false)
     } catch (err: any) {
       setError(err?.message || "Failed to parse QR data")
       setShowScanner(false)
     }
   }
 
   const qrUrl = (() => {
     const path = detail?.qr_code
     if (!path) return ""
     return String(path).startsWith("http") ? path : `${DJANGO_API_URL}${path}`
   })()
 
  const handleDownloadCertificate = async () => {
    try {
      const src = detail || result || { id }
      const pdf = await generatePartnershipPDF(src)
      const name = `Partnership-${String(src.id || id)}.pdf`
      downloadPDF(pdf, name)
    } catch (e: any) {
      setError(e?.message || "Failed to download certificate")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Suspense fallback={<div>Loading...</div>}>
        <QueryReader onFound={(qp) => { setId(qp); setShowScanner(false) }} />
      </Suspense>
       <Card className="mb-6">
        <CardHeader>
          <CardTitle>Verify Partnership</CardTitle>
          <CardDescription>Enter partnership ID (UUID) or scan QR to verify</CardDescription>
        </CardHeader>
         <CardContent>
           {error && <p className="text-red-500 mb-4">{error}</p>}
           {!showScanner ? (
             <div className="space-y-4">
              <Input placeholder="Partnership ID (UUID, e.g., d2715bc1-a77f-4ef7-a26f-df6eebaa1a48)" value={id} onChange={(e) => handleInputChange(e.target.value)} />
              <p className="text-xs text-muted-foreground">Accepted: partnership UUID only</p>
               <div className="flex gap-2">
                <Button onClick={() => handleVerify()} disabled={loading || hasVerified}>{loading ? "Verifying..." : hasVerified ? "Verified" : "Verify"}</Button>
                 <Button variant="outline" onClick={() => setShowScanner(true)}>Scan QR</Button>
               </div>
             </div>
           ) : (
             <div className="flex justify-center">
               <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
             </div>
           )}
         </CardContent>
       </Card>
 
      {(result || detail) && (
       <Card>
         <CardHeader>
           {(() => {
             const d = detail || {}
             const r = result || {}
           const statusText = String(d.status || r.status || '').toLowerCase()
           const valid = Boolean(r.valid ?? (statusText === 'approved' || statusText === 'active'))
             return (
               <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2">
                   {valid ? (
                     <>
                       <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                       Partnership Verified
                     </>
                   ) : (
                     <>
                       <XCircle className="w-5 h-5 text-destructive" />
                       Partnership Not Verified
                     </>
                   )}
                 </CardTitle>
                 {valid && (
                   <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                     Active
                   </Badge>
                 )}
               </div>
             )
           })()}
           <CardDescription>Construction License Management System (CLMS)</CardDescription>
         </CardHeader>
          <CardContent>
            {(() => {
              const d = detail || {}
              const r = result || {}
              const statusText = String(d.status || r.status || '').toLowerCase()
              const valid = Boolean(r.valid ?? (statusText === 'approved' || statusText === 'active'))
              const pid = String(r.id || d.id || id || '').toUpperCase()
              const year = (() => {
                try {
                  return new Date(d.start_date || d.updated_at || Date.now()).getFullYear()
                } catch {
                  return new Date().getFullYear()
                }
              })()
              const last6 = pid.replace(/[^A-Z0-9]/g, '').slice(-6).padStart(6, '0')
              const cpId = (d.certificate_number && String(d.certificate_number)) || `CP-${year}-${last6}`
             const verificationUrl = typeof window !== 'undefined'
               ? `${window.location.origin}/partner/public/verify?cert=${encodeURIComponent(cpId)}`
               : `/partner/public/verify?cert=${encodeURIComponent(cpId)}`
              const main = d.main_contractor || {}
              const partner = d.partner_company || {}
              const mainName = String(main.name || r.main_contractor || '').trim()
              const partnerName = String(partner.name || r.partner_company || '').trim()
              const typeMap: Record<string, string> = {
                joint_venture: 'Joint Venture',
                consortium: 'Consortium Partnership',
                foreign_local: 'Foreign-Local Partnership',
                subcontract: 'Subcontract Partnership',
              }
              const typeDisplay = typeMap[String(d.partnership_type || '').trim()] || 'Construction Partnership License'
              const ownershipMain = Number(d.ownership_ratio_main ?? 0)
              const ownershipPartner = Number(d.ownership_ratio_partner ?? 0)
              const issuedDate = (d.start_date || r.start_date) ? new Date(d.start_date || r.start_date).toLocaleDateString() : '-'
              const expiryDate = (d.end_date || r.end_date) ? new Date(d.end_date || r.end_date).toLocaleDateString() : '-'
              const validUntil = expiryDate
              const mainLicenseNumber = String((main.license_number || r.main_license_number || '')).trim() || '-'
              const partnerLicenseNumber = String((partner.license_number || r.partner_license_number || '')).trim() || '-'
              const activities = [
                'Major Construction Projects',
                'Import of Machinery',
                'Project Vehicles Registration',
              ]
              return (
                <div className="space-y-6">
                  <div className="rounded-md bg-muted px-4 py-3">
                    <p className="font-semibold">Verification Details</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <p><span className="text-muted-foreground">Partnership ID:</span> <span className="font-mono">{pid}</span></p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const res = await copyToClipboard(pid, "Partnership ID")
                              toast({ title: res.success ? "Copied" : "Copy Failed", description: res.message, variant: res.success ? undefined : "destructive" })
                            } catch {
                              toast({ title: "Copy Failed", description: "Could not copy Partnership ID.", variant: "destructive" })
                            }
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <p><span className="text-muted-foreground">Certificate ID:</span> <span className="font-mono">{cpId}</span></p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const res = await copyToClipboard(cpId, "Certificate ID")
                              toast({ title: res.success ? "Copied" : "Copy Failed", description: res.message, variant: res.success ? undefined : "destructive" })
                            } catch {
                              toast({ title: "Copy Failed", description: "Could not copy Certificate ID.", variant: "destructive" })
                            }
                          }}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        {!d.certificate_number && (
                          <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-700">Preview</span>
                        )}
                      </div>
                      <p><span className="text-muted-foreground">License Type:</span> Construction Partnership License</p>
                      <p><span className="text-muted-foreground">Partnership Name:</span> <span className="font-semibold uppercase">{mainName}</span> &nbsp; <span className="font-semibold uppercase">{partnerName}</span></p>
                      <p><span className="text-muted-foreground">License Numbers:</span> {mainLicenseNumber} &amp; {partnerLicenseNumber}</p>
                      <p><span className="text-muted-foreground">Partnership Structure:</span> {typeDisplay} ({ownershipMain}% / {ownershipPartner}%)</p>
                      {!d.certificate_number && (
                        <p className="text-xs text-muted-foreground">This certificate ID is a preview derived from the partnership and will become official after issuance.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md bg-muted px-4 py-3">
                    <p className="font-semibold">Validity Information</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Issued Date:</span> {issuedDate}</p>
                      <p><span className="text-muted-foreground">Expiry Date:</span> {expiryDate}</p>
                      <p><span className="text-muted-foreground">Valid Until:</span> {validUntil}</p>
                      <p><span className="text-muted-foreground">Status:</span> {String(d.status || r.status || '').toUpperCase() || '-'}</p>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted px-4 py-3">
                    <p className="font-semibold">Authorized Activities</p>
                    <ul className="mt-3 space-y-1 text-sm list-disc ml-6">
                      {activities.map((a, idx) => (<li key={idx}>{a}</li>))}
                    </ul>
                  </div>

                  <div className="rounded-md bg-muted px-4 py-3">
                    <p className="font-semibold">Current Status</p>
                    <div className="mt-3">
                      <p className={`text-sm font-bold ${valid ? 'text-green-600' : 'text-destructive'}`}>{valid ? 'VALID & ACTIVE' : 'NOT VALID'}</p>
                      <ul className="mt-2 space-y-1 text-sm list-disc ml-6">
                        <li>Approved under CLMS Regulations</li>
                        <li>Approved by: Licensing Officer</li>
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-md bg-muted px-4 py-3">
                    <p className="font-semibold">Verification Conclusion</p>
                    <div className="mt-2 text-sm">
                      <p>Certificate ID <span className="font-semibold">{cpId}</span> is {valid ? 'verified' : 'not verified'} in the Construction License Management System (CLMS).</p>
                      <p className="text-xs text-muted-foreground mt-2">This certificate is {valid ? 'authentic and valid' : 'not valid'} {valid ? `until ${validUntil}.` : ''}</p>
                      {!d.certificate_number && (
                        <p className="text-xs text-muted-foreground mt-2">Verification will succeed once the government issues the official certificate ID.</p>
                      )}
                    </div>
                  </div>

                  {qrUrl && (
                    <div className="mt-2">
                      <img src={qrUrl} alt="QR Code" className="w-40 h-40 border rounded" />
                    </div>
                  )}
                  {/* <div className="rounded-md bg-muted px-4 py-3">
                    <p className="font-semibold">Verification URL</p>
                    <p className="text-sm break-all">{verificationUrl}</p>
                  </div> */}
                  {(() => {
                    const statusAllowed = (String(d.status || '').toLowerCase() === 'approved' || String(d.status || '').toLowerCase() === 'active')
                    if (!statusAllowed) return (
                      <div className="flex gap-2 mt-2">
                        <Button variant="outline" onClick={() => window.location.assign('/')}>Back to Home</Button>
                      </div>
                    )
                    return (
                      <div className="flex flex-wrap gap-3 mt-2 print:hidden">
                        <Button onClick={() => { printPage(); toast({ title: "Print", description: "Print dialog opened" }) }}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print Certificate
                        </Button>
                        <Button onClick={handleDownloadCertificate}>
                          Download Certificate
                        </Button>
                        <Button variant="outline" onClick={async () => {
                          const r = await shareLink(verificationUrl, "Partnership Certificate")
                          toast({ title: r.success ? "Shared" : "Share Failed", description: r.message, variant: r.success ? undefined : "destructive" })
                        }}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Verification Link
                        </Button>
                        <Button variant="outline" onClick={() => window.location.assign('/')}>
                          Back to Home
                        </Button>
                      </div>
                    )
                  })()}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
   )
 }
