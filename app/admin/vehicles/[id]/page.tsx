"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { vehiclesApi, documentsApi } from "@/lib/api/django-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
 
 export default function AdminVehicleDetailPage() {
   const { id } = useParams() as { id: string }
   const [vehicle, setVehicle] = useState<any | null>(null)
   const [loading, setLoading] = useState(true)
   const [downloading, setDownloading] = useState<string | null>(null)
  const [updating, setUpdating] = useState<"approve" | "reject" | null>(null)
  const [duplicates, setDuplicates] = useState<any[]>([])
  const { toast } = useToast()
 
   useEffect(() => {
     const run = async () => {
       try {
        const v = await vehiclesApi.getDetail(String(id))
        setVehicle(v)
        try {
          const list = await vehiclesApi.list()
          const plate = String(v?.data?.plateNumber || "").trim().toLowerCase()
          const chassis = String(v?.data?.chassisNumber || "").trim().toLowerCase()
          const dups = (list || []).filter((item: any) => {
            if (String(item?.id) === String(id)) return false
            const p2 = String(item?.data?.plateNumber || "").trim().toLowerCase()
            const c2 = String(item?.data?.chassisNumber || "").trim().toLowerCase()
            return (plate && plate === p2) || (chassis && chassis === c2)
          })
          setDuplicates(dups)
        } catch {}
       } finally {
         setLoading(false)
       }
     }
     run()
   }, [id])
 
   const docs = vehicle?.data?.documents || {}
   const entries: Array<{ key: string; value: string }> = Object.keys(docs || {}).map((k) => ({ key: k, value: docs[k] }))
 
   const downloadDoc = async (urlOrId: string) => {
     setDownloading(urlOrId)
     try {
       let blob: Blob
       if (String(urlOrId).startsWith("http") || String(urlOrId).startsWith("/")) {
         blob = await documentsApi.downloadByUrl(String(urlOrId))
       } else {
         blob = await documentsApi.download(String(urlOrId))
       }
       const link = document.createElement("a")
       const url = URL.createObjectURL(blob)
       link.href = url
       link.download = `vehicle-${id}-${urlOrId}`
       document.body.appendChild(link)
       link.click()
       document.body.removeChild(link)
     } finally {
       setDownloading(null)
     }
   }
 
   if (loading) {
     return (
       <div className="container mx-auto px-4 py-8">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
       </div>
     )
   }
 
   if (!vehicle) {
     return <div className="container mx-auto px-4 py-8">Vehicle not found</div>
   }
 
   return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
       <Card>
         <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vehicle Details</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2">
                {String(vehicle.status || "").toUpperCase()}
              </Badge>
              <Button
                size="sm"
                onClick={async () => {
                  setUpdating("approve")
                  try {
                    const updated = await vehiclesApi.update(String(id), { status: "active" })
                    setVehicle(updated)
                    toast({ title: "Approved", description: "Vehicle marked as active." })
                  } catch {
                    toast({ title: "Error", description: "Failed to approve vehicle.", variant: "destructive" })
                  } finally {
                    setUpdating(null)
                  }
                }}
                disabled={updating !== null}
              >
                {updating === "approve" ? "Approving..." : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  setUpdating("reject")
                  try {
                    const updated = await vehiclesApi.update(String(id), { status: "rejected" })
                    setVehicle(updated)
                    toast({ title: "Rejected", description: "Vehicle has been rejected." })
                  } catch {
                    toast({ title: "Error", description: "Failed to reject vehicle.", variant: "destructive" })
                  } finally {
                    setUpdating(null)
                  }
                }}
                disabled={updating !== null}
              >
                {updating === "reject" ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
         </CardHeader>
         <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
           <div className="text-muted-foreground">Registration ID</div><div className="font-medium">{vehicle.id}</div>
           <div className="text-muted-foreground">Plate Number</div><div className="font-medium">{vehicle.data?.plateNumber}</div>
           <div className="text-muted-foreground">Registration Number</div><div className="font-medium">{vehicle.data?.registrationNumber}</div>
           <div className="text-muted-foreground">Chassis Number</div><div className="font-medium">{vehicle.data?.chassisNumber}</div>
           <div className="text-muted-foreground">Engine Number</div><div className="font-medium">{vehicle.data?.engineNumber}</div>
           <div className="text-muted-foreground">Vehicle Type</div><div className="font-medium">{vehicle.data?.vehicleType}</div>
           <div className="text-muted-foreground">Manufacturer</div><div className="font-medium">{vehicle.data?.manufacturer}</div>
           <div className="text-muted-foreground">Model</div><div className="font-medium">{vehicle.data?.model}</div>
           <div className="text-muted-foreground">Year</div><div className="font-medium">{vehicle.data?.year}</div>
           <div className="text-muted-foreground">Owner</div><div className="font-medium">{vehicle.data?.ownerName}</div>
           <div className="text-muted-foreground">Owner License</div><div className="font-medium">{vehicle.data?.ownerLicense}</div>
           <div className="text-muted-foreground">Insurance Policy</div><div className="font-medium">{vehicle.data?.insuranceNumber}</div>
           <div className="text-muted-foreground">Insurance Expiry</div><div className="font-medium">{vehicle.data?.insuranceExpiry}</div>
           <div className="text-muted-foreground">Address</div><div className="font-medium">{vehicle.data?.address || "N/A"}</div>
           <div className="text-muted-foreground">TIN</div><div className="font-medium">{vehicle.data?.tinNumber || "N/A"}</div>
         </CardContent>
       </Card>
 
      <Card>
        <CardHeader>
          <CardTitle>Potential Duplicates</CardTitle>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <div className="text-sm text-muted-foreground">No duplicates found by plate/chassis.</div>
          ) : (
            <div className="space-y-2">
              {duplicates.map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">#{d.id} · {d.data?.plateNumber} · {d.data?.chassisNumber}</div>
                    <div className="text-muted-foreground">{d.data?.manufacturer} {d.data?.model}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.location.assign(`/admin/vehicles/${d.id}`)}>Open</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

       <Card>
         <CardHeader>
           <CardTitle>Uploaded Documents</CardTitle>
         </CardHeader>
         <CardContent className="space-y-3">
           {entries.length === 0 ? (
             <div className="text-sm text-muted-foreground">No documents uploaded</div>
           ) : (
             entries.map((d) => (
               <div key={d.key} className="flex items-center justify-between">
                 <div className="text-sm">
                   <div className="font-medium capitalize">{d.key}</div>
                   <div className="text-muted-foreground break-all">{d.value}</div>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => downloadDoc(d.value)} disabled={downloading === d.value}>
                   {downloading === d.value ? "Downloading..." : "Download"}
                 </Button>
               </div>
             ))
           )}
         </CardContent>
       </Card>
     </div>
   )
 }
