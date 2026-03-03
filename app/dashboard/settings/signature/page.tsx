 "use client"
 import { useEffect, useState } from "react"
 import { useRouter } from "next/navigation"
 import { Button } from "@/components/ui/button"
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
 import { Input } from "@/components/ui/input"
 import { useToast } from "@/hooks/use-toast"
 
 export default function SignatureSettingsPage() {
   const router = useRouter()
   const { toast } = useToast()
   const [preview, setPreview] = useState<string | null>(null)
 
   useEffect(() => {
     try {
       const v = typeof window !== "undefined" ? window.localStorage.getItem("clms_signature_dataurl") : null
       if (v && v.startsWith("data:image/")) setPreview(v)
     } catch {}
   }, [])
 
   const handleFile = async (file?: File) => {
     if (!file) return
     try {
       const reader = new FileReader()
       reader.onloadend = () => {
         const dataUrl = String(reader.result || "")
         if (!dataUrl.startsWith("data:image/")) {
           toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" })
           return
         }
         try {
           if (typeof window !== "undefined") {
             window.localStorage.setItem("clms_signature_dataurl", dataUrl)
           }
           setPreview(dataUrl)
           toast({ title: "Saved", description: "Signature image saved for certificates." })
         } catch (e: any) {
           toast({ title: "Error", description: e?.message || "Failed to save signature", variant: "destructive" })
         }
       }
       reader.readAsDataURL(file)
     } catch (e: any) {
       toast({ title: "Error", description: e?.message || "Failed to read file", variant: "destructive" })
     }
   }
 
   const clearSignature = () => {
     try {
       if (typeof window !== "undefined") {
         window.localStorage.removeItem("clms_signature_dataurl")
       }
       setPreview(null)
       toast({ title: "Removed", description: "Signature image removed." })
     } catch {}
   }
 
   return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
       <div className="container mx-auto px-4 py-10 max-w-2xl">
         <Card>
           <CardHeader>
             <CardTitle>Certificate Signature</CardTitle>
             <CardDescription>Upload a small signature image for vehicle certificates</CardDescription>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
               <Input
                 type="file"
                 accept="image/png,image/jpeg,image/webp"
                 onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
               />
               <p className="text-xs text-slate-500">
                 Recommended size: very small (about 18×6 mm rendered). PNG or WEBP preferred.
               </p>
             </div>
             {preview ? (
               <div className="flex items-center gap-4">
                 <img src={preview} alt="signature preview" className="h-10 w-auto border rounded bg-white" />
                 <Button variant="outline" onClick={clearSignature}>Remove</Button>
               </div>
             ) : (
               <p className="text-xs text-slate-500">No signature saved</p>
             )}
             <div className="flex justify-between">
               <Button variant="outline" onClick={() => router.push("/dashboard")}>Back</Button>
               <Button onClick={() => router.push("/dashboard/vehicles")}>Go to Vehicles</Button>
             </div>
           </CardContent>
         </Card>
       </div>
     </div>
   )
 }
