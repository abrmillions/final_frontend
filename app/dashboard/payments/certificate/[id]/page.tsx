 "use client"
import { useEffect, useMemo, useState } from "react"
 import { useRouter, useParams } from "next/navigation"
 import { Button } from "@/components/ui/button"
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
 import { CreditCard, Loader2 } from "lucide-react"
 import { useToast } from "@/hooks/use-toast"
 import { paymentsApi, licensesApi } from "@/lib/api/django-client"
 
 export default function PayCertificatePage() {
   const router = useRouter()
   const { toast } = useToast()
   const params = useParams()
  const [loading, setLoading] = useState(false)
   const [license, setLicense] = useState<any>(null)
  const [method, setMethod] = useState<string>("card")
   const licId = String(params?.id || "").trim()
 
   useEffect(() => {
     let mounted = true
     const run = async () => {
       try {
         if (!licId) return
         const list = await licensesApi.list()
         const arr = Array.isArray(list) ? list : []
         const found = arr.find((x: any) => String(x.id) === licId || String(x.license_number) === licId)
         if (mounted) setLicense(found || null)
       } catch {}
     }
     run()
     return () => { mounted = false }
   }, [licId])
 
  const amount = useMemo(() => {
    try {
      const t = String(license?.license_type || license?.type || "").toLowerCase()
      const g = String(license?.data?.subtype || license?.subtype || "").toLowerCase()
      if (t.includes("contractor")) {
        if (g.includes("grade-1") || g.includes("grade a") || g.includes("grade-a")) return "500.00"
        if (g.includes("grade-2")) return "450.00"
        if (g.includes("grade-3")) return "400.00"
        if (g.includes("grade-4")) return "350.00"
        if (g.includes("grade-5")) return "300.00"
        if (g.includes("grade-6")) return "200.00"
        if (g.includes("grade-7") || g.includes("grade b") || g.includes("grade-b")) return "150.00"
        return "250.00"
      }
      if (t.includes("professional")) return "200.00"
      if (t.includes("import") || t.includes("export")) return "300.00"
      return "150.00"
    } catch { return "150.00" }
  }, [license])

   const handlePay = async () => {
     if (!licId) return
     try {
       setLoading(true)
       await paymentsApi.create({
        amount,
         currency: "USD",
         status: "completed",
         metadata: {
           purpose: "certificate",
           license_id: licId,
          method,
         },
       })
       try {
         if (typeof window !== "undefined") {
           window.localStorage.setItem("clms_licenses_refresh", String(Date.now()))
         }
       } catch {}
      toast({ title: "succesfully  paid", description: "You can download the certificate now." })
       router.push("/dashboard/licenses?paid=1")
     } catch (e: any) {
       toast({ title: "Payment failed", description: e?.message || "Unable to process payment.", variant: "destructive" })
     } finally {
       setLoading(false)
     }
   }
 
   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
       <div className="container mx-auto px-4 py-10 max-w-2xl">
         <Card>
           <CardHeader>
             <CardTitle>Pay to Download Certificate</CardTitle>
             <CardDescription>License ID: {licId}</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="text-sm">
              <p>Amount: {amount} USD</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant={method === "card" ? "default" : "outline"} onClick={() => setMethod("card")}>
                Card
              </Button>
              <Button type="button" variant={method === "chapa" ? "default" : "outline"} onClick={() => setMethod("chapa")}>
                Chapa
              </Button>
              <Button type="button" variant={method === "bank" ? "default" : "outline"} onClick={() => setMethod("bank")}>
                Bank
              </Button>
             </div>
             <Button onClick={handlePay} disabled={loading} className="w-full">
               {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
               {loading ? "Processing..." : "Pay Now"}
             </Button>
           </CardContent>
         </Card>
       </div>
     </div>
   )
 }
