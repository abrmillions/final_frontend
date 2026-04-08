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
 
 type PracticingForm = {
   insuranceNumber: string;
   employerOrRegistration: string;
   cpdCompliant: boolean;
   practiceDocument?: File | null;
 };
 
 export default function ProfessionalUpgradePracticingPage() {
   const router = useRouter();
   const { toast } = useToast();
  const { maintenanceMode, user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const disabled = maintenanceMode && !isAdmin;
 
   const [form, setForm] = useState<PracticingForm>({
     insuranceNumber: "",
     employerOrRegistration: "",
     cpdCompliant: false,
     practiceDocument: null,
   });
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);
 
   const setField =
     (k: keyof PracticingForm) =>
     (v: string | boolean | File | null) =>
       setForm((prev) => ({ ...prev, [k]: v as any }));
 
   const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
     const f = e.target.files?.[0] || null;
     setField("practiceDocument")(f);
   };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
    if (disabled) {
      toast({ title: "Maintenance in Progress", description: "Submissions are temporarily disabled.", variant: "destructive" });
      return;
    }
     setError(null);
     if (!form.insuranceNumber && !form.employerOrRegistration) {
       setError("Provide insurance number or employment/registration details.");
       return;
     }
     setSubmitting(true);
     try {
       const payload: any = {
         license_type: "Professional License",
         subtype: "professional_upgrade_practicing",
         data: {
           practiceEligibility: {
             insuranceNumber: form.insuranceNumber,
             employerOrRegistration: form.employerOrRegistration,
           },
           cpdCompliant: form.cpdCompliant,
         },
       };
       const application = await applicationsApi.create(payload);
       const appId = String(application?.id || "");
       if (form.practiceDocument instanceof File) {
         documentsApi
           .upload(form.practiceDocument, appId, undefined, "Practice Eligibility Document")
           .catch(() => {});
       }
       toast({ title: "Practicing upgrade submitted", description: "" });
       router.push("/dashboard/applications");
     } catch (err: any) {
       setError(err?.message || "Failed to submit practicing upgrade");
     } finally {
       setSubmitting(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-background">
       <div className="container mx-auto px-4 py-8 max-w-3xl">
         <Card>
           <CardHeader>
             <CardTitle>Upgrade to Practicing Professional</CardTitle>
             <CardDescription>Provide eligibility and CPD compliance details.</CardDescription>
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
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="insurance">Insurance Number</Label>
                   <Input
                     id="insurance"
                     value={form.insuranceNumber}
                     onChange={(e) => setField("insuranceNumber")(e.target.value)}
                     placeholder="Policy no. (optional if employed/registered)"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="employer">Employment/Registration</Label>
                   <Input
                     id="employer"
                     value={form.employerOrRegistration}
                     onChange={(e) => setField("employerOrRegistration")(e.target.value)}
                     placeholder="Employer or registration body (optional if insured)"
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="inline-flex items-center gap-2">
                   <input
                     type="checkbox"
                     checked={form.cpdCompliant}
                     onChange={(e) => setField("cpdCompliant")(e.target.checked)}
                   />
                   <span className="text-sm">I meet CPD compliance requirements</span>
                 </label>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="practiceDoc">Practice Certificate / Insurance</Label>
                 <Input id="practiceDoc" type="file" onChange={onFile} />
               </div>
               <div className="pt-4">
                <Button type="submit" disabled={submitting || disabled}>
                   {submitting ? "Submitting..." : "Submit Practicing Upgrade"}
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }
