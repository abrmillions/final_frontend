 "use client"
 
 import { useEffect, useState } from "react"
 import Link from "next/link"
 import { vehiclesApi } from "@/lib/api/django-client"
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
 import { Button } from "@/components/ui/button"
 import { Badge } from "@/components/ui/badge"
 
 export default function AdminVehiclesPage() {
   const [vehicles, setVehicles] = useState<any[]>([])
   const [loading, setLoading] = useState(true)
 
   useEffect(() => {
     const run = async () => {
       try {
         const list = await vehiclesApi.list()
         setVehicles(list)
       } finally {
         setLoading(false)
       }
     }
     run()
   }, [])
 
   const statusBadge = (s: string) => {
     const st = String(s || "").toLowerCase()
     if (st === "active") return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Active</Badge>
     if (st === "pending") return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending</Badge>
     return <Badge variant="secondary">{s}</Badge>
   }
 
   return (
     <div className="container mx-auto px-4 py-8 max-w-6xl">
       <div className="mb-6">
         <h1 className="text-xl font-semibold">Admin · Vehicles</h1>
         <p className="text-sm text-muted-foreground">Review registered vehicles and their documents</p>
       </div>
       {loading ? (
         <div className="flex justify-center py-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
         </div>
       ) : vehicles.length === 0 ? (
         <Card>
           <CardContent className="p-8 text-center">No vehicles.</CardContent>
         </Card>
       ) : (
         <div className="space-y-4">
           {vehicles.map((v) => (
             <Card key={v.id}>
               <CardHeader>
                 <div className="flex items-start justify-between">
                   <div>
                     <CardTitle className="text-lg">{v.data?.vehicleType} · {v.data?.manufacturer} {v.data?.model}</CardTitle>
                     <CardDescription>Plate: {v.data?.plateNumber} • Registration: {v.data?.registrationNumber}</CardDescription>
                   </div>
                   {statusBadge(v.status)}
                 </div>
               </CardHeader>
               <CardContent className="flex gap-2">
                 <Button asChild variant="outline" size="sm">
                   <Link href={`/admin/vehicles/${v.id}`}>Review</Link>
                 </Button>
                 <Button asChild variant="outline" size="sm">
                   <Link href={`/dashboard/vehicles/${v.id}/certificate`}>Certificate</Link>
                 </Button>
               </CardContent>
             </Card>
           ))}
         </div>
       )}
     </div>
   )
 }
