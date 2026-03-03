 "use client"
 
 import { useEffect, useMemo, useState } from "react"
 import { useParams, useRouter } from "next/navigation"
 import { Button } from "@/components/ui/button"
 import { Card, CardContent } from "@/components/ui/card"
 import { generateQRDataURL } from "@/lib/qr/qr-utils"
 import { vehiclesApi } from "@/lib/api/django-client"
 import { generateVehicleCertificatePDF } from "@/lib/downloads/pdf-generator"
 
 export default function VehicleCertificatePage() {
   const { id } = useParams() as { id: string }
   const router = useRouter()
   const [vehicle, setVehicle] = useState<any | null>(null)
   const [qr, setQr] = useState<string | null>(null)
   const [loading, setLoading] = useState(true)
 
   useEffect(() => {
     let mounted = true
     const fetchData = async () => {
       try {
         const v = await vehiclesApi.getDetail(String(id))
         if (!mounted) return
         setVehicle(v)
         const payload = `CERT:${String(v?.id)}|REG:${String(v?.data?.registrationNumber || "")}|PLATE:${String(v?.data?.plateNumber || "")}`
         try {
           const dataUrl = await generateQRDataURL(payload, { width: 256, margin: 1 })
           if (mounted) setQr(dataUrl)
         } catch {
           if (mounted) setQr(null)
         }
       } finally {
         if (mounted) setLoading(false)
       }
     }
     fetchData()
     return () => {
       mounted = false
     }
   }, [id])
 
   const certNo = useMemo(() => {
     const year = new Date().getFullYear()
     const seq = String(vehicle?.id || "1").padStart(5, "0")
     return `CLMS-VEH-${year}-${seq}`
   }, [vehicle])
 
   const serialNo = useMemo(() => {
     const base = vehicle?.data?.chassisNumber || vehicle?.data?.registrationNumber || vehicle?.id
     return `SN-${String(base || "000000")}`
   }, [vehicle])
 
   const statusBadge = useMemo(() => {
     const status = String(vehicle?.status || "").toLowerCase()
     const active = status === "active"
     return (
       <span className={active ? "inline-flex items-center rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white" : "inline-flex items-center rounded-md bg-gray-600 px-3 py-1 text-xs font-semibold text-white"}>
         {active ? "ACTIVE" : "INACTIVE"}
       </span>
     )
   }, [vehicle])
 
   const issueDate = useMemo(() => {
     const raw = vehicle?.data?.issueDate || vehicle?.registeredAt || vehicle?.created_at
     const d = raw ? new Date(raw) : new Date()
     return d.toLocaleDateString()
   }, [vehicle])
 
   const expiryDate = useMemo(() => {
     const raw = vehicle?.data?.expiryDate || vehicle?.data?.insuranceExpiry
     return raw ? new Date(raw).toLocaleDateString() : "N/A"
   }, [vehicle])
 
   const format = (v: any) => {
     if (v === null || v === undefined) return "N/A"
     const s = String(v).trim()
     return s.length ? s : "N/A"
   }
 
   const handleDownloadPdf = async () => {
     if (!vehicle) return
     const pdf = await generateVehicleCertificatePDF(vehicle)
     pdf.save(`Vehicle-Certificate-${vehicle.id}.pdf`)
   }
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
       </div>
     )
   }
 
   if (!vehicle) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="space-y-4 text-center">
           <p className="text-lg font-medium">Vehicle not found</p>
           <Button variant="outline" onClick={() => router.push("/dashboard/vehicles")}>Back to Vehicles</Button>
         </div>
       </div>
     )
   }
 
   return (
     <div className="min-h-screen bg-muted/30 py-8 px-4">
       <div className="mx-auto" style={{ width: "210mm" }}>
         <Card className="shadow-lg">
           <CardContent className="p-0">
             <div className="relative overflow-hidden" style={{ minHeight: "297mm" }}>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-5xl font-bold tracking-widest text-muted-foreground/10">CLMS OFFICIAL DOCUMENT</span>
               </div>
               <div className="border-[6px] border-yellow-600 m-4 rounded-lg">
                 <div className="border-[3px] border-yellow-500 m-2 rounded-md">
                   <div className="px-10 pt-10">
                     <div className="flex items-center justify-center">
                       <div className="w-12 h-12 rounded bg-yellow-600 mr-4"></div>
                       <div className="text-center">
                         <div className="text-xl font-semibold text-foreground">Oromia Construction Authority</div>
                         <div className="text-sm text-muted-foreground">Construction License Management System (CLMS)</div>
                       </div>
                     </div>
                     <div className="mt-6 text-center">
                       <div className="text-2xl font-bold">Vehicle Registration Certificate</div>
                       <div className="text-sm text-muted-foreground mt-1">Certificate No: {certNo}</div>
                     </div>
                     <div className="mt-6 border-t border-muted" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 px-2">
                       <div>
                         <div className="font-semibold mb-3">1. Vehicle Information</div>
                         <div className="grid grid-cols-2 gap-y-2 text-sm">
                           <div className="text-muted-foreground">Registration ID:</div><div className="font-medium">{vehicle.id}</div>
                           <div className="text-muted-foreground">Plate Number:</div><div className="font-medium">{format(vehicle.data?.plateNumber)}</div>
                           <div className="text-muted-foreground">Chassis Number:</div><div className="font-medium">{format(vehicle.data?.chassisNumber)}</div>
                           <div className="text-muted-foreground">Engine Number:</div><div className="font-medium">{format(vehicle.data?.engineNumber)}</div>
                           <div className="text-muted-foreground">Vehicle Type:</div><div className="font-medium">{format(vehicle.data?.vehicleType)}</div>
                           <div className="text-muted-foreground">Manufacturer:</div><div className="font-medium">{format(vehicle.data?.manufacturer)}</div>
                           <div className="text-muted-foreground">Model:</div><div className="font-medium">{format(vehicle.data?.model)}</div>
                           <div className="text-muted-foreground">Year of Manufacture:</div><div className="font-medium">{format(vehicle.data?.year)}</div>
                         </div>
                       </div>
                       <div>
                         <div className="font-semibold mb-3">2. Contractor / Owner Information</div>
                         <div className="grid grid-cols-2 gap-y-2 text-sm">
                           <div className="text-muted-foreground">Contractor Name:</div><div className="font-medium">{format(vehicle.data?.ownerName)}</div>
                           <div className="text-muted-foreground">Contractor License No:</div><div className="font-medium">{format(vehicle.data?.ownerLicense)}</div>
                           <div className="text-muted-foreground">TIN Number:</div><div className="font-medium">{format(vehicle.data?.tinNumber)}</div>
                           <div className="text-muted-foreground">Address:</div><div className="font-medium">{format(vehicle.data?.address)}</div>
                         </div>
                       </div>
                     </div>
                     <div className="mt-6 border-t border-muted" />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6 px-2">
                       <div className="font-semibold">3. Registration Validity</div>
                       <div className="space-y-1 text-sm">
                         <div>Issue Date: <span className="font-medium">{issueDate}</span></div>
                         <div>Expiry Date: <span className="font-medium">{expiryDate}</span></div>
                       </div>
                       <div className="flex items-center">{statusBadge}</div>
                     </div>
                     <div className="mt-6 border-t border-muted" />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6 px-2">
                       <div className="font-semibold">4. Security & Verification</div>
                       <div className="flex items-center">
                         <div className="w-28 h-28 border rounded-md overflow-hidden bg-white flex items-center justify-center">
                           {qr ? <img src={qr} alt="QR" className="w-full h-full object-cover" /> : <div className="text-xs text-muted-foreground">QR</div>}
                         </div>
                       </div>
                       <div className="space-y-2 text-sm">
                         <div>Certificate Serial Number: <span className="font-medium">{serialNo}</span></div>
                         <div className="pt-6">
                           <div className="h-8 border-b border-muted"></div>
                           <div className="text-xs text-muted-foreground">Authorized Signature</div>
                         </div>
                       </div>
                     </div>
                     <div className="mt-10 flex items-center justify-center gap-4 pb-10 print:hidden">
                       <Button variant="outline" onClick={() => window.print()}>Print</Button>
                       <Button onClick={handleDownloadPdf}>Download PDF</Button>
                       <Button variant="ghost" onClick={() => router.push("/dashboard/vehicles")}>Back</Button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   )
 }
