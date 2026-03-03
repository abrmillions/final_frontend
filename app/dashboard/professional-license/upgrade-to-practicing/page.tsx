"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applicationsApi, documentsApi } from "@/lib/api/django-client";
import { useToast } from "@/hooks/use-toast";

type PracticingForm = {
  justification: string;
  professionalOath?: File | null;
  councilRegistration?: File | null;
};

export default function ProfessionalUpgradeToPracticingPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<PracticingForm>({
    justification: "",
    professionalOath: null,
    councilRegistration: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField =
    (k: keyof PracticingForm) =>
    (v: string | File | null) =>
      setForm((prev) => ({ ...prev, [k]: v }));

  const onFile =
    (k: keyof PracticingForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      setField(k)(f);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.justification.trim()) {
      setError("Justification is required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload: any = {
        license_type: "Professional License",
        subtype: "professional_upgrade_to_practicing",
        data: {
          justification: form.justification,
        },
      };
      const application = await applicationsApi.create(payload);
      const appId = String(application?.id || "");

      const pairs: Array<[string, File | null]> = [
        ["Professional Oath", form.professionalOath || null],
        ["Council Registration", form.councilRegistration || null],
      ];
      const uploads = pairs
        .filter(([, f]) => f instanceof File)
        .map(([name, f]) =>
          documentsApi.upload(f as File, appId, undefined, name as string).catch(() => {})
        );
      Promise.allSettled(uploads).catch(() => {});

      toast({ title: "Upgrade to Practicing submitted", description: "" });
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
            <CardTitle>Upgrade to Practicing</CardTitle>
            <CardDescription>Request practicing status for your professional license.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  value={form.justification}
                  onChange={(e) => setField("justification")(e.target.value)}
                  placeholder="Explain why you qualify for practicing status"
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oath">Professional Oath (optional)</Label>
                  <Input id="oath" type="file" onChange={onFile("professionalOath")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="councilReg">Council Registration (optional)</Label>
                  <Input id="councilReg" type="file" onChange={onFile("councilRegistration")} />
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
