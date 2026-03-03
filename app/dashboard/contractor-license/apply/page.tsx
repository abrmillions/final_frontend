"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ContractorStep1 } from "@/components/licenses/contractor/step1-basic-info"
import { ContractorStep2 } from "@/components/licenses/contractor/step2-company-details"
import { ContractorStep3 } from "@/components/licenses/contractor/step3-documents"
import { ContractorStep4 } from "@/components/licenses/contractor/step4-review"
import { applicationsApi, documentsApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"

type ContractorFormData = {
  applicantName: string
  email: string
  phone: string
  nationalId: string
  dateOfBirth: string
  companyName: string
  registrationNumber: string
  taxId: string
  address: string
  city: string
  postalCode: string
  yearsOfExperience: string
  licenseType: string
  workScope: string[]
  profile_photo: File | null
  documents: Record<string, File | null>
}

export default function ContractorLicenseApplyPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ApplyContent />
    </Suspense>
  )
}

function ApplyContent() {
  const router = useRouter()
  const search = useSearchParams()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState("")
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
  })

  const steps = [
    { number: 1, title: "Basic Information", description: "Personal details" },
    { number: 2, title: "Company Details", description: "Business information" },
    { number: 3, title: "Documents", description: "Upload required files" },
    { number: 4, title: "Review", description: "Confirm and submit" },
  ]

  const progress = (currentStep / steps.length) * 100

  const updateFormData = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setError("")
    try {
      // Precheck for existing active application of same type to improve UX before hitting backend
      try {
        const existing = await applicationsApi.list()
        const apps = Array.isArray(existing) ? existing : (existing?.results || [])
        const hasActiveSameType = apps.some((a: any) => String(a.license_type) === "Contractor License" && String(a.status).toLowerCase() !== "rejected")
        if (hasActiveSameType) {
          setError("You already have an active application for this license type.")
          alert("You already have an active application for this license type.")
          return
        }
      } catch {
        // ignore precheck errors; continue with submit
      }
      // disable double submits
      // (could add isLoading state if desired)
      // Submit application to Django backend
      const payload: any = {
        license_type: "Contractor License",
        data: { ...formData, profile_photo: undefined, subtype: (search?.get('subtype') || 'company_new') },
      }
      if (formData.profile_photo instanceof File) {
        payload.profile_photo = formData.profile_photo
      }
      const application = await applicationsApi.create(payload)
      const appId = String(application?.id || "")
      const docs = (formData as any).documents || {}
      const labelMap: Record<string, string> = {
        nationalIdCopy: "National ID Copy",
        companyRegistration: "Company Registration",
        taxCertificate: "Tax Certificate",
        experienceCertificate: "Experience Certificate",
        financialStatement: "Financial Statement",
      }
      try {
        const uploads = Object.entries(docs)
          .filter(([_, v]) => v instanceof File)
          .map(([k, v]) => {
            const name = labelMap[k] || k
            return documentsApi.upload(v as File, appId, undefined, name).catch((e) => {
              console.error(`[clms] Document upload failed for ${k}`, e)
            })
          })
        // Fire-and-forget; do not block navigation
        Promise.allSettled(uploads).catch(() => {})
      } catch {}

      console.log("[clms] Application submitted:", application)
      toast({
        title: "Your application is submitted successfully",
        description: "",
      })
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("clms_bg_uploads", "applications")
        }
      } catch {}
      // Navigate immediately; uploads continue in background
      router.push("/dashboard/applications")
    } catch (err: any) {
      console.error("[clms] Submit error:", err)
      // Prefer structured backend field errors when available
      let message = err?.message || "Failed to submit application"
      if (err?.error && typeof err.error === 'object') {
        const fieldErrors = Object.entries(err.error)
          .map(([field, messages]: [string, any]) => {
            if (Array.isArray(messages)) return `${field}: ${messages.join(', ')}`
            if (typeof messages === 'object') return `${field}: ${JSON.stringify(messages)}`
            return `${field}: ${messages}`
          })
          .join('\n')
        message = fieldErrors || message
      }
      setError(message)
      alert(message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Contractor License Application</h1>
              <p className="text-xs text-muted-foreground">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div
                  className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-semibold ${
                    currentStep >= step.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                <div
                  className={`text-sm font-medium ${
                    currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">{step.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 text-sm text-destructive whitespace-pre-wrap">{error}</div>
            )}
            {currentStep === 1 && <ContractorStep1 data={formData} updateData={updateFormData} onNext={handleNext} />}
            {currentStep === 2 && (
              <ContractorStep2 data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 3 && (
              <ContractorStep3 data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 4 && <ContractorStep4 data={formData} onBack={handleBack} onSubmit={handleSubmit} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
