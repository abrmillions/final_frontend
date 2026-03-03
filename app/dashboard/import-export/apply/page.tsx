"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Package, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ImportExportStep1 } from "@/components/licenses/import-export/step1-company"
import { ImportExportStep2 } from "@/components/licenses/import-export/step2-permit-details"
import { ImportExportStep3 } from "@/components/licenses/import-export/step3-items"
import { ImportExportStep4 } from "@/components/licenses/import-export/step4-documents"
import { ImportExportStep5 } from "@/components/licenses/import-export/step5-review"
import { applicationsApi, documentsApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"

type ImportExportFormData = {
  companyName: string
  registrationNumber: string
  taxId: string
  address: string
  contactPerson: string
  email: string
  phone: string
  permitType: string
  duration: string
  customsOffice: string
  purposeOfImport: string
  items: any[]
  company_representative_photo: File | null
  documents: Record<string, File | null>
}

export default function ImportExportApplyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ImportExportFormData>({
    // Company Info
    companyName: "",
    registrationNumber: "",
    taxId: "",
    address: "",
    contactPerson: "",
    email: "",
    phone: "",

    // Permit Details
    permitType: "",
    duration: "",
    customsOffice: "",
    purposeOfImport: "",

    // Items
    items: [] as any[],

    // Documents
    company_representative_photo: null,
    documents: {
      companyRegistration: null,
      taxCertificate: null,
      customsLicense: null,
      itemSpecifications: null,
      proformaInvoice: null,
    } as Record<string, File | null>,
  })

  const steps = [
    { number: 1, title: "Company Info", description: "Business details" },
    { number: 2, title: "Permit Details", description: "Type & purpose" },
    { number: 3, title: "Items", description: "Equipment list" },
    { number: 4, title: "Documents", description: "Required files" },
    { number: 5, title: "Review", description: "Confirm & submit" },
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
    try {
      const payload: any = {
        license_type: "Import/Export License",
        data: { ...formData, company_representative_photo: undefined },
      }
      if (formData.company_representative_photo instanceof File) {
        payload.company_representative_photo = formData.company_representative_photo
      }
      const application = await applicationsApi.create(payload)
      const appId = String(application?.id || "")
      const docs = formData.documents || {}
      const labelMap: Record<string, string> = {
        companyRegistration: "Company Registration",
        taxCertificate: "Tax Certificate",
        customsLicense: "Customs License",
        itemSpecifications: "Item Specifications",
        proformaInvoice: "Proforma Invoice",
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
        // Fire-and-forget
        Promise.allSettled(uploads).catch(() => {})
      } catch {}

      console.log("[clms] Import/Export application submitted:", application)
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
      alert(err?.message || "Failed to submit application")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Import/Export Permit Application</h1>
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
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-4" />
          <div className="grid grid-cols-5 gap-2">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div
                  className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center font-semibold text-sm ${
                    currentStep >= step.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                <div
                  className={`text-xs font-medium ${
                    currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && <ImportExportStep1 data={formData} updateData={updateFormData} onNext={handleNext} />}
            {currentStep === 2 && (
              <ImportExportStep2 data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 3 && (
              <ImportExportStep3 data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 4 && (
              <ImportExportStep4 data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 5 && <ImportExportStep5 data={formData} onBack={handleBack} onSubmit={handleSubmit} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
