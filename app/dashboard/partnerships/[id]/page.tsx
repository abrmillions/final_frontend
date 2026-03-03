 "use client"
 
 import { useEffect, useState } from "react"
 import { useParams, useRouter } from "next/navigation"
 import Link from "next/link"
 import { Button } from "@/components/ui/button"
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
 import { Badge } from "@/components/ui/badge"
 import { Building2, ArrowLeft, Download, Copy, Loader2 } from "lucide-react"
 import { useToast } from "@/hooks/use-toast"
 import { partnershipsApi } from "@/lib/api/django-client"
 import { generatePartnershipPDF } from "@/lib/downloads/pdf-generator"
 import { downloadPDF } from "@/lib/downloads/file-download"
 import { copyToClipboard } from "@/lib/button-actions"
 import { DJANGO_API_URL } from "@/lib/config/django-api"
 import type { Partnership } from "@/lib/types/partnership"
 
 export default function PartnershipDetailPage() {
   const { id } = useParams<{ id: string }>()
   const router = useRouter()
   const { toast } = useToast()
   const [partnership, setPartnership] = useState<Partnership | null>(null)
   const [loading, setLoading] = useState<boolean>(true)
   const [downloading, setDownloading] = useState<boolean>(false)
   const [copying, setCopying] = useState<boolean>(false)
 
   useEffect(() => {
     const load = async () => {
       if (!id) return
       setLoading(true)
       try {
         const data = await partnershipsApi.getDetail(String(id))
         setPartnership(data)
       } catch (e: any) {
         toast({
           title: "Error",
           description: e?.message || "Failed to load partnership details.",
           variant: "destructive",
         })
         router.push("/dashboard/partnerships")
       } finally {
         setLoading(false)
       }
     }
     load()
   }, [id, router, toast])
 
   const getStatusBadge = (status?: string | null) => {
     const s = String(status || "").toLowerCase()
     switch (s) {
       case "active":
         return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Active</Badge>
       case "pending":
         return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending Verification</Badge>
       case "expired":
         return <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">Expired</Badge>
       case "approved":
         return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Approved</Badge>
       default:
         return <Badge variant="secondary">{status}</Badge>
     }
   }
 
   const handleDownload = async () => {
     if (!partnership) return
     if (String(partnership.status).toLowerCase() !== "active") {
       toast({
         title: "Not Available",
         description: "Certificates are only available for active partnerships.",
         variant: "destructive",
       })
       return
     }
     setDownloading(true)
     try {
       const pdf = await generatePartnershipPDF(partnership)
       const fileName = `Partnership-${String(partnership.id)}.pdf`
       downloadPDF(pdf, fileName)
       toast({ title: "Downloaded", description: "Partnership certificate has been downloaded." })
     } catch (e) {
       toast({ title: "Error", description: "Failed to download certificate.", variant: "destructive" })
     } finally {
       setDownloading(false)
     }
   }
 
   const handleCopyCertificate = async () => {
     if (!partnership?.certificate_number) {
       toast({ title: "No Certificate", description: "Certificate ID is not available yet.", variant: "destructive" })
       return
     }
     setCopying(true)
     try {
       const res = await copyToClipboard(partnership.certificate_number, "Certificate ID")
       toast({
         title: res.success ? "Copied" : "Copy Failed",
         description: res.message,
         variant: res.success ? undefined : "destructive",
       })
     } catch {
       toast({ title: "Copy Failed", description: "Could not copy Certificate ID.", variant: "destructive" })
     } finally {
       setCopying(false)
     }
   }
 
   const qrUrl = (() => {
     const path = partnership?.qr_code
     if (!path) return ""
     return String(path).startsWith("http") ? path : `${DJANGO_API_URL}${path}`
   })()
 
   if (loading) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Card className="w-full max-w-md">
           <CardContent className="p-12 text-center">
             <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
             <p className="text-muted-foreground">Loading partnership details...</p>
           </CardContent>
         </Card>
       </div>
     )
   }
 
   if (!partnership) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
         <Card className="w-full max-w-md">
           <CardContent className="p-12 text-center">
             <p className="text-red-600 font-semibold mb-4">Partnership not found</p>
             <Button asChild>
               <Link href="/dashboard/partnerships">Back to Partnerships</Link>
             </Button>
           </CardContent>
         </Card>
       </div>
     )
   }
 
   return (
     <div className="min-h-screen bg-background">
       <header className="border-b border-border bg-card">
         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
               <Building2 className="w-6 h-6 text-primary-foreground" />
             </div>
             <div>
               <h1 className="text-lg font-semibold text-foreground">Partnership Details</h1>
               <p className="text-xs text-muted-foreground">ID: {String(partnership.id)}</p>
             </div>
           </div>
           <div className="flex items-center gap-2">
             <Button variant="outline" asChild>
               <Link href="/dashboard/partnerships">
                 <ArrowLeft className="w-4 h-4 mr-2" />
                 Back
               </Link>
             </Button>
           </div>
         </div>
       </header>
 
       <div className="container mx-auto px-4 py-8 max-w-5xl">
         <Card>
           <CardHeader>
             <div className="flex items-start justify-between">
               <div className="flex-1">
                 <CardTitle className="text-lg">
                   {partnership?.main_contractor?.name || "Main"} + {partnership?.partner_company?.name || "Partner"}
                 </CardTitle>
                 <CardDescription>
                   Partnership type: {String(partnership.partnership_type || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                 </CardDescription>
               </div>
               {getStatusBadge(partnership.status)}
             </div>
           </CardHeader>
           <CardContent>
             <div className="grid md:grid-cols-3 gap-4 text-sm mb-6">
               <div>
                 <span className="text-muted-foreground">Main Contractor</span>
                 <p className="font-medium text-foreground">{partnership?.main_contractor?.name || "N/A"}</p>
               </div>
               <div>
                 <span className="text-muted-foreground">Partner Company</span>
                 <p className="font-medium text-foreground">{partnership?.partner_company?.name || "N/A"}</p>
               </div>
               <div>
                 <span className="text-muted-foreground">Ownership (Partner)</span>
                 <p className="font-medium text-foreground">{partnership?.ownership_ratio_partner ?? "N/A"}%</p>
               </div>
               <div>
                 <span className="text-muted-foreground">Start Date</span>
                 <p className="font-medium text-foreground">{partnership?.start_date || "N/A"}</p>
               </div>
               <div>
                 <span className="text-muted-foreground">End Date</span>
                 <p className="font-medium text-foreground">{partnership?.end_date || "N/A"}</p>
               </div>
               <div>
                 <span className="text-muted-foreground">Registered</span>
                 <p className="font-medium text-foreground">{new Date(partnership.created_at).toLocaleDateString()}</p>
               </div>
             </div>
 
             <div className="rounded-md border p-4 mb-4">
               <div className="flex items-center justify-between">
                 <div className="text-sm">
                   <p className="text-muted-foreground">Certificate ID</p>
                   <p className="font-mono text-foreground">{partnership.certificate_number || "Not generated yet"}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" onClick={handleCopyCertificate} disabled={copying || !partnership.certificate_number}>
                     <Copy className="w-4 h-4 mr-2" />
                     {copying ? "Copying..." : "Copy"}
                   </Button>
                   <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
                     <Download className="w-4 h-4 mr-2" />
                     {downloading ? "Downloading..." : "Download Certificate"}
                   </Button>
                 </div>
               </div>
             </div>
 
             {qrUrl && (
               <div className="mt-2">
                 <img src={qrUrl} alt="QR Code" className="w-40 h-40 border rounded" />
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </div>
   )
 }
