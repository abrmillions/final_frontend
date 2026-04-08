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
        const map: Record<string, string> = {
          oauth_not_configured: "Google OAuth not configured in backend",
          missing_code: "Authorization code missing; try starting from Register → Continue with Google",
        }
        setMessage(map[error] || `Google returned error: ${error}`)
         return
       }
       if (!code) {
         setMessage("Missing authorization code")
         return
       }
       const redirectUri = `${window.location.origin}/oauth2callback`
       const body = JSON.stringify({ code, redirect_uri: redirectUri, mode: "json" })
       
       ;(async () => {
         try {
           // Use POST directly as it's more standard for code-to-token exchange in this app
           const resp = await fetch("/api/users/google/callback/", {
             method: "POST",
             headers: { "Content-Type": "application/json", Accept: "application/json" },
             body,
           })
           
           if (resp.status === 200) {
             const ct = resp.headers.get("content-type") || ""
             if (/application\/json/i.test(ct)) {
               const data = await resp.json()
               if (data?.access && data?.refresh) {
                 setTokens({ access: data.access, refresh: data.refresh })
                 try { await authApi.getCurrentUser() } catch {}
                 window.location.replace("/dashboard")
                 return
               } else {
                 setMessage(data?.detail || "Tokens missing in response from backend")
               }
             } else {
               const text = await resp.text().catch(() => "")
               setMessage(text || `Unexpected response format (Status: ${resp.status})`)
             }
           } else {
             const data = await resp.json().catch(() => ({}))
             setMessage(data?.detail || `Authentication failed. Status: ${resp.status}`)
           }
         } catch (e: any) {
           setMessage(e?.message || "Connection error. Ensure the server is running.")
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
