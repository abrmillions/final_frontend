 "use client";
 
 import { useState } from "react";
 import { useRouter } from "next/navigation";
 import { Button } from "@/components/ui/button";
 import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
 } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { applicationsApi, documentsApi } from "@/lib/api/django-client";
 import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 
 type ReplacementForm = {
   licenseNumber: string;
   lossEvidence?: File | null;
 };
 
 export default function ProfessionalReplacementPage() {
   const router = useRouter();
   const { toast } = useToast();
  const { maintenanceMode, user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const disabled = maintenanceMode && !isAdmin;
 
   const [form, setForm] = useState<ReplacementForm>({
     licenseNumber: "",
     lossEvidence: null,
   });
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);
 
   const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
     const f = e.target.files?.[0] || null;
     setForm((prev) => ({ ...prev, lossEvidence: f }));
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
    if (disabled) {
      toast({ title: "Maintenance in Progress", description: "Submissions are temporarily disabled.", variant: "destructive" });
      return;
    }
     setError(null);
     if (!form.licenseNumber) {
       setError("License number is required.");
       return;
     }
     setSubmitting(true);
     try {
       const payload: any = {
         license_type: "Professional License",
         subtype: "professional_replacement",
         data: {
           licenseNumber: form.licenseNumber,
         },
       };
       const application = await applicationsApi.create(payload);
       const appId = String(application?.id || "");
       if (form.lossEvidence instanceof File) {
         documentsApi
           .upload(form.lossEvidence, appId, undefined, "Loss Evidence")
           .catch(() => {});
       }
       toast({ title: "Replacement request submitted", description: "" });
       router.push("/dashboard/applications");
     } catch (err: any) {
       setError(err?.message || "Failed to submit replacement request");
     } finally {
       setSubmitting(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-background">
       <div className="container mx-auto px-4 py-8 max-w-3xl">
         <Card>
           <CardHeader>
             <CardTitle>Replacement of Professional License</CardTitle>
             <CardDescription>Request re-issue of license card/certificate.</CardDescription>
           </CardHeader>
           <CardContent>
            {disabled && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-800 mb-4">
                <AlertTitle>Maintenance in Progress</AlertTitle>
                <AlertDescription>Submissions are temporarily disabled.</AlertDescription>
              </Alert>
            )}
             {error && (
               <div className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</div>
             )}
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="licenseNumber">License Number</Label>
                 <Input
                   id="licenseNumber"
                   value={form.licenseNumber}
                   onChange={(e) =>
                     setForm((prev) => ({ ...prev, licenseNumber: e.target.value }))
                   }
                   placeholder="e.g., LIC-2025-000321"
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="evidence">Affidavit / Police Report</Label>
                 <Input id="evidence" type="file" onChange={onFile} />
               </div>
               <div className="pt-4">
                <Button type="submit" disabled={submitting || disabled}>
                   {submitting ? "Submitting..." : "Submit Replacement"}
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }
