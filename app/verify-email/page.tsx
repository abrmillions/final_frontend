 "use client";
 export const dynamic = 'force-dynamic';
 
 import { useEffect, useState, Suspense } from "react";
 import { useRouter, useSearchParams } from "next/navigation";
 import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Alert, AlertDescription } from "@/components/ui/alert";
 import { authApi } from "@/lib/api/django-client";
 import { useAuth } from "@/lib/auth/auth-context";
 import { Loader2, MailCheck, AlertCircle } from "lucide-react";
 
function QueryReader({ onParams }: { onParams: (uid: string | null, token: string | null) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const uid = searchParams.get("uid");
    const token = searchParams.get("token");
    onParams(uid, token);
  }, [searchParams]);
  return null;
}

export default function VerifyEmailPage() {
  const router = useRouter();
   const { isAuthenticated } = useAuth();
 
   const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
   const [message, setMessage] = useState<string>("");
 
  useEffect(() => {
    // handled via QueryReader
  }, []);
 
  const [uidState, setUidState] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<string | null>(null);
 
  useEffect(() => {
    const uid = uidState;
    const token = tokenState;
    if (!uid || !token) {
       setStatus("error");
       setMessage("Invalid verification link. Missing uid or token.");
       return;
     }
 
     const run = async () => {
       setStatus("loading");
       try {
         const resp = await authApi.confirmEmailVerification(uid, token);
         const detail = (resp && resp.detail) || "Email has been verified successfully.";
         setMessage(detail);
         setStatus("success");
       } catch (e: any) {
         const detail =
           e?.error?.detail ||
           e?.message ||
           "Verification failed. The link may be invalid or expired.";
         setMessage(String(detail));
         setStatus("error");
       }
     };
 
     void run();
   }, [uidState, tokenState]);
 
   const goNext = () => {
     if (isAuthenticated) {
       router.push("/dashboard");
     } else {
       router.push("/login");
     }
   };
 
   return (
     <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <QueryReader onParams={(u, t) => { setUidState(u); setTokenState(t); }} />
      </Suspense>
       <Card className="w-full max-w-md">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             {status === "success" ? (
               <MailCheck className="h-5 w-5 text-green-600" />
             ) : status === "error" ? (
               <AlertCircle className="h-5 w-5 text-red-600" />
             ) : (
               <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
             )}
             Verify Email
           </CardTitle>
           <CardDescription>Confirm your email address to secure your account</CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           {status === "loading" && (
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
               <Loader2 className="h-4 w-4 animate-spin" />
               Verifying your email…
             </div>
           )}
 
           {status === "success" && (
             <Alert>
               <AlertDescription>{message || "Your email is verified."}</AlertDescription>
             </Alert>
           )}
 
           {status === "error" && (
             <Alert variant="destructive">
               <AlertDescription>{message || "Verification failed."}</AlertDescription>
             </Alert>
           )}
         </CardContent>
         <CardFooter className="flex justify-end">
           {status !== "loading" && (
             <Button onClick={goNext}>
               {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
             </Button>
           )}
         </CardFooter>
       </Card>
     </div>
   );
 }
 
