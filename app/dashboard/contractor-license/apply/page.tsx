"use client";

import { useState, Suspense, useEffect } from "react";
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
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ContractorStep1 } from "@/components/licenses/contractor/step1-basic-info";
import { ContractorStep2 } from "@/components/licenses/contractor/step2-company-details";
import { ContractorStep3 } from "@/components/licenses/contractor/step3-documents";
import { ContractorStep4 } from "@/components/licenses/contractor/step4-review";
import { applicationsApi, documentsApi } from "@/lib/api/django-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth/auth-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ContractorFormData = {
  applicantName: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  companyName: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  city: string;
  postalCode: string;
  yearsOfExperience: string;
  licenseType: string;
  workScope: string[];
  profile_photo: File | null;
  documents: Record<string, File | null>;
};

export default function ContractorLicenseApplyPage() {
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
  const [submitting, setSubmitting] = useState(false);
  const [hasActiveApplication, setHasActiveApplication] = useState(false);
  const [formData, setFormData] = useState<ContractorFormData>({
    applicantName: "",
    email: "",
    phone: "",
    nationalId: "",
    dateOfBirth: "",
    companyName: "",
    registrationNumber: "",
    taxId: "",
    address: "",
    city: "",
    postalCode: "",
    yearsOfExperience: "",
    licenseType: "",
    workScope: [],
    profile_photo: null,
    documents: {
      nationalIdCopy: null,
      companyRegistration: null,
      taxCertificate: null,
      experienceCertificate: null,
      financialStatement: null,
    } as Record<string, File | null>,
  });

  const steps = [
    { number: 1, title: "Basic Information", description: "Personal details" },
    {
      number: 2,
      title: "Company Details",
      description: "Business information",
    },
    { number: 3, title: "Documents", description: "Upload required files" },
    { number: 4, title: "Review", description: "Confirm and submit" },
  ];

  const progress = (currentStep / steps.length) * 100;

  useEffect(() => {
    (async () => {
      try {
        const existing = await applicationsApi.list();
        const apps = Array.isArray(existing)
          ? existing
          : (existing as any)?.results || [];
        const exists = apps.some(
          (a: any) =>
            String(a.license_type) === "Contractor License" &&
            String(a.status).toLowerCase() !== "rejected",
        );
        setHasActiveApplication(exists);
      } catch (e) {
        console.error("Failed to check active applications", e);
      }
    })();
  }, []);

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
        toast({
          title: "Maintenance in Progress",
          description: "Submissions are temporarily disabled.",
          variant: "destructive",
        });
        return;
      }
      // Precheck for existing active application of same type to improve UX before hitting backend
      if (hasActiveApplication) {
        toast({
          title: "Warning",
          description: "You already have an active application for this license type.",
          variant: "destructive",
        });
        // Continue with submit despite warning
      }
      // disable double submits
      // (could add isLoading state if desired)
      // Submit application to Django backend
      const payload: any = {
        license_type: "Contractor License",
        data: {
          ...formData,
          profile_photo: undefined,
          subtype: search?.get("subtype") || "company_new",
        },
      };
      if (formData.profile_photo instanceof File) {
        payload.profile_photo = formData.profile_photo;
      }
      const application = await applicationsApi.create(payload);
      const appId = String(application?.id || "");
      const docs = (formData as any).documents || {};
      const labelMap: Record<string, string> = {
        nationalIdCopy: "National ID Copy",
        companyRegistration: "Company Registration",
        taxCertificate: "Tax Certificate",
        degreeCertificate: "Degree Certificate",
        experienceCertificate: "Experience Certificate",
        financialStatement: "Financial Statement",
      };
      try {
        const uploads = Object.entries(docs)
          .filter(([_, v]) => v instanceof File)
          .map(([k, v]) => {
            const name = labelMap[k] || k;
            return documentsApi
              .upload(v as File, appId, undefined, name)
              .catch((e) => {
                console.error(`[clms] Document upload failed for ${k}`, e);
              });
          });
        // Fire-and-forget; do not block navigation
        Promise.allSettled(uploads).catch(() => {});
      } catch {}

      console.log("[clms] Application submitted:", application);
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
      console.error("[clms] Submit error:", err);
      // Prefer structured backend field errors when available
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
        // If it's just a duplicate application error, we might want to treat it as "submitted"
        // or at least not show a scary alert, per user request to "pass"
        toast({
          title: "Application Status",
          description: "You already have an active application for this license type.",
        });
        router.push("/dashboard/applications");
        return;
      }
      setError(message);
      alert(message);
    } finally {
      // keep submitting true to prevent double submits during navigation
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                Contractor License Application
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
          <Alert className="border-amber-300 bg-amber-50 text-amber-800 mb-6">
            <AlertTitle>Maintenance in Progress</AlertTitle>
            <AlertDescription>
              Submissions are temporarily disabled.
            </AlertDescription>
          </Alert>
        )}
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-6" />
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step) => (
              <div key={step.number} className="text-center relative">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-xs sm:text-sm font-bold transition-colors ${
                    currentStep >= step.number
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                <div
                  className={`text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider line-clamp-1 ${
                    currentStep >= step.number
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title.split(" ")[0]}
                </div>
                <div className="text-[10px] text-muted-foreground hidden md:block mt-0.5">
                  {step.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
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
              <ContractorStep1
                data={formData}
                updateData={updateFormData}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <ContractorStep2
                data={formData}
                updateData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <ContractorStep3
                data={formData}
                updateData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 4 && (
              <ContractorStep4
                data={formData}
                onBack={handleBack}
                onSubmit={handleSubmit}
                hasActiveApplication={hasActiveApplication}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
