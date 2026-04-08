"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProfessionalStep1 } from "@/components/licenses/professional/step1-personal";
import { ProfessionalStep2 } from "@/components/licenses/professional/step2-qualifications";
import { ProfessionalStep3 } from "@/components/licenses/professional/step3-experience";
import { ProfessionalStep4 } from "@/components/licenses/professional/step4-documents";
import { ProfessionalStep5 } from "@/components/licenses/professional/step5-review";
import { applicationsApi } from "@/lib/api/django-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ProfessionalFormData = {
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  address: string;
  profession: string;
  specialization: string;
  degree: string;
  university: string;
  graduationYear: string;
  licenseNumber: string;
  yearsOfExperience: string;
  currentEmployer: string;
  position: string;
  projects: any[];
  professional_photo: File | null;
  documents: Record<string, File | null>;
};

export default function ProfessionalLicenseApplyPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ApplyContent />
    </Suspense>
  );
}

function ApplyContent() {
  const router = useRouter();
  const search = useSearchParams();
  const { toast } = useToast();
  const { maintenanceMode, user } = useAuth();
  const isAdmin = (user?.role || "").toLowerCase() === "admin";
  const disabled = maintenanceMode && !isAdmin;
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [canApply, setCanApply] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProfessionalFormData>({
    // Personal Info
    fullName: "",
    email: "",
    phone: "",
    nationalId: "",
    dateOfBirth: "",
    address: "",

    // Qualifications
    profession: "",
    specialization: "",
    degree: "",
    university: "",
    graduationYear: "",
    licenseNumber: "",

    // Experience
    yearsOfExperience: "",
    currentEmployer: "",
    position: "",
    projects: [] as any[],

    // Documents
    professional_photo: null,
    documents: {
      nationalIdCopy: null,
      degreeCertificate: null,
      transcripts: null,
      experienceLetter: null,
      professionalPhoto: null,
      previousLicense: null,
    } as Record<string, File | null>,
  });

  const steps = [
    { number: 1, title: "Personal Info", description: "Basic details" },
    {
      number: 2,
      title: "Qualifications",
      description: "Education & credentials",
    },
    { number: 3, title: "Experience", description: "Work history" },
    { number: 4, title: "Documents", description: "Required files" },
    { number: 5, title: "Review", description: "Confirm & submit" },
  ];

  const progress = (currentStep / steps.length) * 100;

  const updateFormData = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      if (disabled) {
        toast({ title: "Maintenance in Progress", description: "Submissions are temporarily disabled.", variant: "destructive" });
        return;
      }
      const payload: any = {
        license_type: "Professional License",
        data: {
          ...formData,
          professional_photo: undefined,
          subtype: search?.get("subtype") || "professional_new",
        },
      };
      if (formData.professional_photo instanceof File) {
        payload.professional_photo = formData.professional_photo;
      }
      const application = await applicationsApi.create(payload);

      try {
        const appId = String(application?.id || "");
        if (appId) {
          const docs = formData.documents || {};
          const labelMap: Record<string, string> = {
            nationalIdCopy: "National ID Copy",
            degreeCertificate: "Degree Certificate",
            transcripts: "Transcripts",
            experienceLetter: "Experience Letter",
            professionalPhoto: "Professional Photo",
            previousLicense: "Previous License",
          };
          const uploads = Object.entries(docs)
            .filter(([_, v]) => v instanceof File)
            .map(async ([k, v]) => {
              try {
                const mod = await import("@/lib/api/django-client");
                const name = labelMap[k] || k;
                await mod.documentsApi.upload(
                  v as File,
                  appId,
                  undefined,
                  name,
                );
              } catch (e) {
                /* continue uploading other files */
              }
            });
          // Run in background, do not block navigation
          Promise.allSettled(uploads).catch(() => {});
        }
      } catch {
        /* ignore */
      }

      console.log("[clms] Professional application submitted:", application);
      toast({
        title: "Your application is submitted successfully",
        description: "",
      });
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("clms_bg_uploads", "applications");
        }
      } catch {}
      // Navigate immediately; uploads continue in background
      router.push("/dashboard/applications");
    } catch (err: any) {
      let message = err?.message || "Failed to submit application";
      if (err?.error && typeof err.error === "object") {
        const fieldErrors = Object.entries(err.error)
          .map(([field, messages]: [string, any]) => {
            if (Array.isArray(messages))
              return `${field}: ${messages.join(", ")}`;
            if (typeof messages === "object")
              return `${field}: ${JSON.stringify(messages)}`;
            return `${field}: ${messages}`;
          })
          .join("\n");
        message = fieldErrors || message;
      }
      const lc = String(message || "").toLowerCase();
      if (lc.includes("active application")) {
        setError(
          "You already have an active professional license application.",
        );
        router.push("/dashboard/applications");
        return;
      }
      setError(message);
      alert(message);
    } finally {
      // keep submitting true to prevent double submits during navigation
    }
  };

  // Prevent showing the application form if the user already has a professional license
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Previously this page restricted users with an existing professional license
        // or active application. That restriction has been removed per requirements.
        // We still keep this effect scaffold for future telemetry if needed.
        if (!mounted) return;
      } catch (e) {
        /* ignore — server will enforce */
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                Professional License Application
              </h1>
              <p className="text-xs text-muted-foreground">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>
          <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {disabled && (
          <Alert className="mb-8 border-amber-300 bg-amber-50 text-amber-800">
            <AlertTitle>Maintenance in Progress</AlertTitle>
            <AlertDescription>Submissions are temporarily disabled.</AlertDescription>
          </Alert>
        )}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-6" />
          <div className="grid grid-cols-5 gap-1 sm:gap-2">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-xs sm:text-sm transition-colors ${
                    currentStep >= step.number
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                <div
                  className={`text-[9px] sm:text-xs font-bold uppercase tracking-tighter sm:tracking-wider line-clamp-1 ${
                    currentStep >= step.number
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title.split(" ")[0]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 text-sm text-destructive whitespace-pre-wrap">
                {error}
              </div>
            )}
            {currentStep === 1 && (
              <ProfessionalStep1
                data={formData}
                updateData={updateFormData}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <ProfessionalStep2
                data={formData}
                updateData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <ProfessionalStep3
                data={formData}
                updateData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <ProfessionalStep4
                data={formData}
                updateData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 5 && (
              <ProfessionalStep5
                data={formData}
                onBack={handleBack}
                onSubmit={handleSubmit}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
