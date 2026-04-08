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
 
 type RenewalForm = {
   previousLicenseNumber: string;
   cpdPoints: string;
   cpdHours: string;
   renewalPeriod: string;
   paymentRef: string;
   cpdProof?: File | null;
   goodStanding?: File | null;
 };
 
 export default function ProfessionalRenewPage() {
   const router = useRouter();
   const { toast } = useToast();
  const { maintenanceMode, user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const disabled = maintenanceMode && !isAdmin;
 
   const [form, setForm] = useState<RenewalForm>({
     previousLicenseNumber: "",
     cpdPoints: "",
     cpdHours: "",
     renewalPeriod: "",
     paymentRef: "",
     cpdProof: null,
     goodStanding: null,
   });
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);
 
   const setField =
     (k: keyof RenewalForm) =>
     (v: string | File | null) =>
       setForm((prev) => ({ ...prev, [k]: v }));
 
   const handleFile =
     (k: keyof RenewalForm) =>
     (e: React.ChangeEvent<HTMLInputElement>) => {
       const f = e.target.files?.[0] || null;
       setField(k)(f);
     };
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
    if (disabled) {
      toast({ title: "Maintenance in Progress", description: "Submissions are temporarily disabled.", variant: "destructive" });
      return;
    }
     setError(null);
     if (!form.previousLicenseNumber || !form.renewalPeriod) {
       setError("Previous license number and renewal period are required.");
       return;
     }
     setSubmitting(true);
     try {
       const payload: any = {
         license_type: "Professional License",
         is_renewal: true,
         subtype: "professional_renewal",
         data: {
           previousLicenseNumber: form.previousLicenseNumber,
           cpdPoints: form.cpdPoints,
           cpdHours: form.cpdHours,
           renewalPeriod: form.renewalPeriod,
           paymentRef: form.paymentRef,
         },
       };
 
       const application = await applicationsApi.create(payload);
       const appId = String(application?.id || "");
 
       const toUpload: Array<[string, File | null]> = [
         ["CPD Proof", form.cpdProof || null],
         ["Good Standing Letters", form.goodStanding || null],
       ];
       const uploads = toUpload
         .filter(([, f]) => f instanceof File)
         .map(([name, f]) =>
           documentsApi.upload(f as File, appId, undefined, name).catch(() => {})
         );
       Promise.allSettled(uploads).catch(() => {});
 
       toast({
         title: "Renewal application submitted successfully",
         description: "",
       });
       router.push("/dashboard/applications");
     } catch (err: any) {
       let message = err?.message || "Failed to submit renewal";
       if (err?.error && typeof err.error === "object") {
         const fieldErrors = Object.entries(err.error)
           .map(([field, messages]: [string, any]) => {
             if (Array.isArray(messages)) return `${field}: ${messages.join(", ")}`;
             if (typeof messages === "object")
               return `${field}: ${JSON.stringify(messages)}`;
             return `${field}: ${messages}`;
           })
           .join("\n");
         message = fieldErrors || message;
       }
       setError(message);
     } finally {
       setSubmitting(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-background">
       <div className="container mx-auto px-4 py-8 max-w-3xl">
         <Card>
           <CardHeader>
             <CardTitle>Renew Professional License</CardTitle>
             <CardDescription>
               Provide previous license details and CPD evidence.
             </CardDescription>
           </CardHeader>
           <CardContent>
            {disabled && (
              <Alert className="border-amber-300 bg-amber-50 text-amber-800 mb-4">
                <AlertTitle>Maintenance in Progress</AlertTitle>
                <AlertDescription>Submissions are temporarily disabled.</AlertDescription>
              </Alert>
            )}
             {error && (
               <div className="mb-4 text-sm text-destructive whitespace-pre-wrap">
                 {error}
               </div>
             )}
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="prev">Previous License Number</Label>
                   <Input
                     id="prev"
                     value={form.previousLicenseNumber}
                     onChange={(e) => setField("previousLicenseNumber")(e.target.value)}
                     placeholder="e.g., LIC-2024-000123"
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="period">Renewal Period</Label>
                   <Input
                     id="period"
                     value={form.renewalPeriod}
                     onChange={(e) => setField("renewalPeriod")(e.target.value)}
                     placeholder="e.g., 1 year"
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="cpdPoints">CPD Points</Label>
                   <Input
                     id="cpdPoints"
                     value={form.cpdPoints}
                     onChange={(e) => setField("cpdPoints")(e.target.value)}
                     placeholder="e.g., 20"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="cpdHours">CPD Hours</Label>
                   <Input
                     id="cpdHours"
                     value={form.cpdHours}
                     onChange={(e) => setField("cpdHours")(e.target.value)}
                     placeholder="e.g., 40"
                   />
                 </div>
                 <div className="space-y-2 md:col-span-2">
                   <Label htmlFor="paymentRef">Payment Reference</Label>
                   <Input
                     id="paymentRef"
                     value={form.paymentRef}
                     onChange={(e) => setField("paymentRef")(e.target.value)}
                     placeholder="Transaction reference (optional)"
                   />
                 </div>
               </div>
 
               <div className="grid md:grid-cols-2 gap-4 pt-2">
                 <div className="space-y-2">
                   <Label htmlFor="cpdProof">Upload CPD Proof</Label>
                   <Input id="cpdProof" type="file" accept="*/*" onChange={handleFile("cpdProof")} />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="goodStanding">Good Standing Letters</Label>
                   <Input id="goodStanding" type="file" accept="*/*" onChange={handleFile("goodStanding")} />
                 </div>
               </div>
 
               <div className="pt-4">
                <Button type="submit" disabled={submitting || disabled}>
                   {submitting ? "Submitting..." : "Submit Renewal"}
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }
