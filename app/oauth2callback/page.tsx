 "use client"
 
 import { useEffect, useState } from "react"
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
 import { DJANGO_API_URL } from "@/lib/config/django-api"
 import { setTokens } from "@/lib/config/django-api"
 import { authApi } from "@/lib/api/django-client"
 
 export default function OAuth2Callback() {
   const [message, setMessage] = useState("Processing Google sign-in...")
 
   useEffect(() => {
     try {
       if (typeof window === "undefined") return
       const url = new URL(window.location.href)
       const code = url.searchParams.get("code")
       const error = url.searchParams.get("error")
       if (error) {
         setMessage(`Google returned error: ${error}`)
         return
       }
       if (!code) {
         setMessage("Missing authorization code")
         return
       }
       const target = `${DJANGO_API_URL}/api/users/google/callback/?mode=json&code=${encodeURIComponent(code)}`
       ;(async () => {
         try {
           const resp = await fetch(target, { method: "GET", headers: { Accept: "application/json" } })
           if (!resp.ok) {
             const t = await resp.text().catch(() => "")
             setMessage(t || "Failed to complete sign-in")
             return
           }
           const data = await resp.json()
           if (data?.access && data?.refresh) {
             setTokens({ access: data.access, refresh: data.refresh })
             try {
               await authApi.getCurrentUser()
             } catch {}
             window.location.replace("/dashboard")
           } else {
             setMessage("Missing tokens in response")
           }
         } catch (e: any) {
           setMessage(e?.message || "Unexpected error")
         }
       })()
     } catch (e: any) {
       setMessage(e?.message || "Unexpected error")
     }
   }, [])
 
   return (
     <div className="min-h-screen flex items-center justify-center">
       <Card className="w-full max-w-md mx-auto">
         <CardHeader>
           <CardTitle>Google Sign-in</CardTitle>
           <CardDescription>Completing authentication...</CardDescription>
         </CardHeader>
         <CardContent>
           <p className="text-sm text-muted-foreground">{message}</p>
         </CardContent>
       </Card>
     </div>
   )
 }
