 "use client"
 
 import { useEffect, useState } from "react"
 import { useParams } from "next/navigation"
 import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
 import { Button } from "@/components/ui/button"
 import { partnershipsApi } from "@/lib/api/django-client"
 import { DJANGO_API_URL } from "@/lib/config/django-api"
 import { downloadPDF } from "@/lib/downloads/file-download"
 import { generatePartnershipPDF } from "@/lib/downloads/pdf-generator"
 import { parseQRData } from "@/lib/qr/qr-utils"
 
 export default function PartnershipQRVerifyPage() {
   const params = useParams<{ code: string }>()
   const rawCode = params?.code || ""
   const [id, setId] = useState<string>("")
   const [result, setResult] = useState<any>(null)
   const [detail, setDetail] = useState<any>(null)
   const [error, setError] = useState<string | null>(null)
   const [loading, setLoading] = useState(false)
 
   useEffect(() => {
     const init = async () => {
       setError(null)
       const decoded = decodeURIComponent(String(rawCode))
       let possibleId = ""
       try {
         const parsed = parseQRData(decoded)
         possibleId =
           (parsed as any)?.licenseNumber ||
           (parsed as any)?.licenseId ||
           (parsed as any)?.partnership_id ||
           (parsed as any)?.id ||
           ""
       } catch {
         // Fallback to decoded text
         possibleId = decoded
       }
       if (!possibleId) return
       setId(String(possibleId))
       setLoading(true)
       try {
         const res = await partnershipsApi.publicVerify(String(possibleId))
         setResult(res)
         try {
           const d = await partnershipsApi.getDetail(String(possibleId))
           setDetail(d)
         } catch {}
       } catch (e: any) {
         setError(e?.error?.detail || e?.message || "Verification failed")
       } finally {
         setLoading(false)
       }
     }
     void init()
   }, [rawCode])
 
   const qrUrl = (() => {
     const path = detail?.qr_code
     if (!path) return ""
     return String(path).startsWith("http") ? path : `${DJANGO_API_URL}${path}`
   })()
 
   const handleDownloadCertificate = async () => {
     try {
       const pdf = await generatePartnershipPDF(detail || result || { id })
       const name = `Partnership-${String((detail && detail.id) || id || "certificate")}.pdf`
       downloadPDF(pdf, name)
     } catch (e: any) {
       setError(e?.message || "Failed to download certificate")
     }
   }
 
   return (
     <div className="container mx-auto px-4 py-16 max-w-3xl">
       <Card>
         <CardHeader>
           <CardTitle>Partnership Verification</CardTitle>
           <CardDescription>QR-based verification for partnerships</CardDescription>
         </CardHeader>
         <CardContent>
           {error && <p className="text-red-500 mb-4">{error}</p>}
           {loading && <p>Verifying...</p>}
           {!loading && (
             <>
               {result ? (
                 <div className="space-y-1 text-sm">
                   <p>Valid: {String(result.valid)}</p>
                   <p>ID: {result.id || id}</p>
                   <p>Main: {result.main_contractor}</p>
                   <p>Partner: {result.partner_company}</p>
                   <p>Status: {result.status}</p>
                   <p>Period: {result.start_date} → {result.end_date}</p>
                 </div>
               ) : (
                 <p className="text-sm text-muted-foreground">No result yet</p>
               )}
               {qrUrl && (
                 <div className="mt-4">
                   <img src={qrUrl} alt="QR Code" className="w-40 h-40 border rounded" />
                 </div>
               )}
               <div className="mt-6">
                 <Button onClick={handleDownloadCertificate}>Download Certificate</Button>
               </div>
             </>
           )}
         </CardContent>
       </Card>
     </div>
   )
 }
