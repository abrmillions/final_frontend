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
 import { Textarea } from "@/components/ui/textarea";
 import { applicationsApi, documentsApi } from "@/lib/api/django-client";
 import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 
 type UpgradeForm = {
   currentCategory: string;
   requestedCategory: string;
   experienceSummary: string;
   references?: File | null;
   projectLogs?: File | null;
   cpdProof?: File | null;
 };
 
 export default function ProfessionalUpgradePage() {
   const router = useRouter();
   const { toast } = useToast();
  const { maintenanceMode, user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const disabled = maintenanceMode && !isAdmin;
 
   const [form, setForm] = useState<UpgradeForm>({
     currentCategory: "",
     requestedCategory: "",
     experienceSummary: "",
     references: null,
     projectLogs: null,
     cpdProof: null,
   });
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);
 
   const setField =
     (k: keyof UpgradeForm) =>
     (v: string | File | null) =>
       setForm((prev) => ({ ...prev, [k]: v }));
 
   const onFile =
     (k: keyof UpgradeForm) =>
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
     if (!form.currentCategory || !form.requestedCategory) {
       setError("Current and requested category are required.");
       return;
     }
     setSubmitting(true);
     try {
       const payload: any = {
         license_type: "Professional License",
         subtype: "professional_upgrade",
         data: {
           currentCategory: form.currentCategory,
           requestedCategory: form.requestedCategory,
           experienceSummary: form.experienceSummary,
         },
       };
       const application = await applicationsApi.create(payload);
       const appId = String(application?.id || "");
 
      const pairs: Array<[string, File | null]> = [
        ["References", form.references || null],
        ["Project Logs", form.projectLogs || null],
        ["CPD Proof", form.cpdProof || null],
      ];
      const uploads = pairs
        .filter(([, f]) => f instanceof File)
        .map(([name, f]) =>
          documentsApi.upload(f as File, appId, undefined, name as string).catch(() => {})
        );
       Promise.allSettled(uploads).catch(() => {});
 
       toast({ title: "Upgrade application submitted", description: "" });
       router.push("/dashboard/applications");
     } catch (err: any) {
       setError(err?.message || "Failed to submit upgrade");
     } finally {
       setSubmitting(false);
     }
   };
 
   return (
     <div className="min-h-screen bg-background">
       <div className="container mx-auto px-4 py-8 max-w-3xl">
         <Card>
           <CardHeader>
             <CardTitle>Upgrade Professional License</CardTitle>
             <CardDescription>Request a change in category/grade.</CardDescription>
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
                   <Label htmlFor="currentCategory">Current Category</Label>
                   <Input
                     id="currentCategory"
                     value={form.currentCategory}
                     onChange={(e) => setField("currentCategory")(e.target.value)}
                     placeholder="e.g., Junior"
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="requestedCategory">Requested Category</Label>
                   <Input
                     id="requestedCategory"
                     value={form.requestedCategory}
                     onChange={(e) => setField("requestedCategory")(e.target.value)}
                     placeholder="e.g., Senior"
                     required
                   />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="experience">Experience Evidence (summary)</Label>
                 <Textarea
                   id="experience"
                   value={form.experienceSummary}
                   onChange={(e) => setField("experienceSummary")(e.target.value)}
                   placeholder="Describe experience and responsibilities"
                 />
               </div>
               <div className="grid md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="references">References</Label>
                   <Input id="references" type="file" onChange={onFile("references")} />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="projectLogs">Project Logs</Label>
                   <Input id="projectLogs" type="file" onChange={onFile("projectLogs")} />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="cpdProof">CPD Proof</Label>
                   <Input id="cpdProof" type="file" onChange={onFile("cpdProof")} />
                 </div>
               </div>
               <div className="pt-4">
                <Button type="submit" disabled={submitting || disabled}>
                   {submitting ? "Submitting..." : "Submit Upgrade"}
                 </Button>
               </div>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }
