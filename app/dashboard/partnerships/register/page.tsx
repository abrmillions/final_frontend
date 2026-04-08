"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Users, ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import { PartnershipStep1 } from "@/components/partnerships/step1-basic-info"
import { PartnershipStep2 } from "@/components/partnerships/step2-partners"
import { PartnershipStep3 } from "@/components/partnerships/step3-documents"
import { PartnershipStep4 } from "@/components/partnerships/step4-review"
import { partnershipsApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function RegisterPartnershipPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { maintenanceMode, user } = useAuth()
  const isAdmin = (user?.role || "").toLowerCase() === "admin"
  const disabled = maintenanceMode && !isAdmin
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    partnershipName: "",
    partnershipType: "",
    registrationNumber: "",
    startDate: "",
    endDate: "",
    projectScope: "",
    projectLocation: "",
    estimatedValue: "",

    partners: [] as any[],

    documents: {
      partnershipAgreement: null,
      partnersLicenses: null,
      projectContract: null,
      financialGuarantee: null,
    },
  })

  const steps = [
    { number: 1, title: "Basic Information", description: "Partnership details" },
    { number: 2, title: "Partners", description: "Add partner companies" },
    { number: 3, title: "Documents", description: "Required files" },
    { number: 4, title: "Review", description: "Confirm & register" },
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
    if (disabled) {
      toast({ title: "Maintenance in Progress", description: "Submissions are temporarily disabled.", variant: "destructive" })
      return
    }
    try {
      const partners = formData.partners || []
      if (!partners || partners.length < 2) {
        throw new Error('Please add at least two partner companies')
      }

      const main = partners[0]
      const partner = partners[1]
      const mainShare = Number.parseFloat(main.sharePercentage || '0') || 50
      const partnerShare = Number.parseFloat(partner.sharePercentage || '0') || (100 - mainShare)

      const normalizeType = (t: string) => {
        const map: Record<string, string> = {
          'joint-venture': 'joint_venture',
          'general-partnership': 'consortium',
          'strategic-alliance': 'consortium',
          'consortium': 'consortium',
          'foreign-local': 'foreign_local',
          'subcontract': 'subcontract',
        }
        return map[t] || 'joint_venture'
      }

      const payload = {
        main_contractor: {
          name: main.companyName,
          registration_number: main.licenseNumber || formData.registrationNumber || `REG-${Date.now()}`,
          license_number: main.licenseNumber,
          country: 'AE',
        },
        partner_company: {
          name: partner.companyName,
          registration_number: partner.licenseNumber || `REG-${Date.now()}-B`,
          license_number: partner.licenseNumber,
          country: 'AE',
        },
        partnership_type: normalizeType(formData.partnershipType),
        ownership_ratio_main: mainShare,
        ownership_ratio_partner: partnerShare,
        start_date: formData.startDate || undefined,
        end_date: formData.endDate || undefined,
        registration_data: {
          partnershipName: formData.partnershipName,
          partnershipType: formData.partnershipType,
          registrationNumber: formData.registrationNumber,
          startDate: formData.startDate,
          endDate: formData.endDate,
          projectScope: formData.projectScope,
          projectLocation: formData.projectLocation,
          estimatedValue: formData.estimatedValue,
        },
        partners_data: formData.partners,
      }

      const partnership = await partnershipsApi.create(payload)

      try {
        const docTypes: Record<string, string> = {
          partnershipAgreement: "Partnership/JV Agreement",
          partnersLicenses: "All Partners' Licenses",
          projectContract: "Project Contract/Award Letter",
          financialGuarantee: "Financial Guarantee/Bond",
        }
        const uploads = Object.entries(formData.documents || {}).map(async ([key, value]) => {
          const file = value as unknown as File | null
          if (file && typeof (file as any).name === 'string') {
            try {
              await partnershipsApi.uploadDocument(String(partnership.id || partnership), file, docTypes[key] || key)
            } catch (e) {
              console.error('[clms] uploadDocument failed', e)
            }
          }
        })
        // Upload lead representative photo if provided
        const photoPromise = (async () => {
          try {
            const photo = (formData as any).lead_representative_photo as File | null
            if (photo && typeof (photo as any).name === 'string') {
              await partnershipsApi.uploadDocument(String(partnership.id || partnership), photo, 'Lead Representative Photo')
            }
          } catch (e) {
            console.error('[clms] photo upload failed', e)
          }
        })()
        // Run uploads in background, do not await
        Promise.allSettled([...uploads, photoPromise]).catch(() => {})
      } catch (e) {
        console.error('[clms] Document uploads encountered errors', e)
      }

      console.log("[clms] Partnership registered:", partnership)
      toast({
        title: "Successfully registered",
        description: "",
      })
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("clms_bg_uploads", "partnerships")
        }
      } catch {}
      // Navigate immediately; uploads continue in background
      router.push("/dashboard/partnerships")
    } catch (err: any) {
      // Prefer quiet handling with a clear toast; avoid noisy console/error overlays
      const msg = (err?.error?.detail && String(err.error.detail).trim()) || (err?.message && String(err.message).trim()) || ""
      toast({
        title: "Registration Failed",
        description: msg || "Failed to register partnership.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                Register New Partnership
              </h1>
              <p className="text-xs text-muted-foreground">
                Step {currentStep} of {steps.length}
              </p>
            </div>
          </div>
          <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/partnerships">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Partnerships
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Progress value={progress} className="h-2 mb-6" />
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
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
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
          {disabled && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-800 mb-4">
              <AlertTitle>Maintenance in Progress</AlertTitle>
              <AlertDescription>Submissions are temporarily disabled.</AlertDescription>
            </Alert>
          )}
            {currentStep === 1 && <PartnershipStep1 data={formData} updateData={updateFormData} onNext={handleNext} />}
            {currentStep === 2 && (
              <PartnershipStep2 data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 3 && (
              <PartnershipStep3 data={formData} updateData={updateFormData} onNext={handleNext} onBack={handleBack} />
            )}
            {currentStep === 4 && <PartnershipStep4 data={formData} onBack={handleBack} onSubmit={handleSubmit} />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
