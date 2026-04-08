"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Truck, ArrowLeft, Upload, FileText, CheckCircle2, Plus } from "lucide-react"
import Link from "next/link"
import { vehiclesApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function RegisterVehiclePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { maintenanceMode, user } = useAuth()
  const isAdmin = (user?.role || "").toLowerCase() === "admin"
  const disabled = maintenanceMode && !isAdmin
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, boolean>>({})
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({})
  const [formData, setFormData] = useState({
    registrationCategory: "commercial-vehicle",
    vehicleType: "",
    manufacturer: "",
    model: "",
    year: "",
    plateNumber: "",
    registrationNumber: "",
    chassisNumber: "",
    engineNumber: "",
    capacity: "",
    ownerName: "",
    ownerLicense: "",
    insuranceNumber: "",
    insuranceExpiry: "",
    currentProject: "",
    description: "",
    documents: {
      registration: null,
      insurance: null,
      inspection: null,
      ownership: null,
    },
  })

  const handleFileUpload = (key: string, files: FileList | null) => {
    if (files && files.length > 0) {
      setUploadedFiles((prev) => ({ ...prev, [key]: true }))
      setDocFiles((prev) => ({ ...prev, [key]: files[0] }))
      setFormData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [key]: files[0].name,
        },
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled) {
      toast({ title: "Maintenance in Progress", description: "Submissions are temporarily disabled.", variant: "destructive" })
      return
    }
    setIsSubmitting(true)

    try {
      try {
        const existing = await vehiclesApi.list()
        const plate = String(formData.plateNumber || "").trim().toLowerCase()
        const chassis = String(formData.chassisNumber || "").trim().toLowerCase()
        const dup = (existing || []).find((v: any) => {
          const p2 = String(v?.data?.plateNumber || "").trim().toLowerCase()
          const c2 = String(v?.data?.chassisNumber || "").trim().toLowerCase()
          return (plate && plate === p2) || (chassis && chassis === c2)
        })
        if (dup) {
          toast({
            title: "Duplicate Found",
            description: "A vehicle with the same plate or chassis already exists. Please review.",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }
      } catch {}
      
      const created = await vehiclesApi.create({
        status: "pending",
        data: formData
      })
      
      const vehicleId = created?.id || created?.vehicle?.id || created?.data?.id
      // Perform uploads and update in background to avoid blocking navigation
      if (vehicleId) {
        ;(async () => {
          const uploadedRefs: Record<string, any> = {}
          try {
            const client = await import("@/lib/api/django-client")
            const ups = documents.map(({ key, label }) => {
              const file = docFiles[key]
              if (!file) return Promise.resolve(null)
              return client.documentsApi
                .upload(file, undefined, String(vehicleId), label, key)
                .then((blobOrDoc: any) => {
                  const asJson = blobOrDoc
                  uploadedRefs[key] =
                    asJson?.url || asJson?.file || asJson?.id || file.name
                })
                .catch(() => {
                  uploadedRefs[key] = file.name
                })
            })
            await Promise.allSettled(ups)
          } catch {}
          try {
            await vehiclesApi.update(String(vehicleId), {
              status: "pending",
              data: {
                ...formData,
                documents: uploadedRefs,
              },
            })
          } catch {}
        })().catch(() => {})
      }

      toast({
        title: "Successfully registered",
        description: "",
      })
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("clms_bg_uploads", "vehicles")
        }
      } catch {}
      // Navigate immediately; background uploads will continue
      router.push("/dashboard/vehicles")
    } catch (error: any) {
      try {
        const msg = (error?.error?.detail && String(error.error.detail).trim()) || (error?.message && String(error.message).trim()) || ""
        const tb = error?.error?.traceback
        toast({ 
          title: "Error", 
          description: msg || "Failed to register vehicle.", 
          variant: "destructive" 
        })
        if (tb) console.error("Backend traceback:", tb)
      } catch {
        toast({ title: "Error", description: "Failed to register vehicle.", variant: "destructive" })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const documents = [
    { key: "registration", label: "Vehicle Registration Certificate", required: true },
    { key: "insurance", label: "Insurance Certificate", required: true },
    { key: "inspection", label: "Safety Inspection Certificate", required: true },
    { key: "ownership", label: "Proof of Ownership", required: true },
  ]

  const allRequiredUploaded = documents.filter((doc) => doc.required).every((doc) => uploadedFiles[doc.key])

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
                Register New Vehicle
              </h1>
              <p className="text-xs text-muted-foreground">
                Add to your equipment registry
              </p>
            </div>
          </div>
          <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
            <Link href="/dashboard/vehicles">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Vehicles
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {disabled && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-800">
              <AlertTitle>Maintenance in Progress</AlertTitle>
              <AlertDescription>Submissions are temporarily disabled.</AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>Basic details about the vehicle or equipment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationCategory">Registration Category *</Label>
                  <Select
                    value={formData.registrationCategory}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, registrationCategory: value, vehicleType: "" }))}
                  >
                    <SelectTrigger id="registrationCategory">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial-vehicle">Commercial Vehicle ($150)</SelectItem>
                      <SelectItem value="heavy-machinery">Heavy Machinery ($250)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicleType">Vehicle/Equipment Type *</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, vehicleType: value }))}
                  >
                    <SelectTrigger id="vehicleType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.registrationCategory === "heavy-machinery" ? (
                        <>
                          <SelectItem value="excavator">Excavator</SelectItem>
                          <SelectItem value="bulldozer">Bulldozer</SelectItem>
                          <SelectItem value="crane">Crane</SelectItem>
                          <SelectItem value="loader">Loader</SelectItem>
                          <SelectItem value="grader">Grader</SelectItem>
                          <SelectItem value="compactor">Compactor</SelectItem>
                          <SelectItem value="forklift">Forklift</SelectItem>
                          <SelectItem value="drilling-rig">Drilling Rig</SelectItem>
                          <SelectItem value="paver">Paver</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="pickup">Pickup Truck</SelectItem>
                          <SelectItem value="dump-truck">Dump Truck</SelectItem>
                          <SelectItem value="concrete-mixer">Concrete Mixer</SelectItem>
                          <SelectItem value="van">Commercial Van</SelectItem>
                          <SelectItem value="truck">Heavy Truck (Semi)</SelectItem>
                          <SelectItem value="trailer">Trailer</SelectItem>
                          <SelectItem value="bus">Commercial Bus</SelectItem>
                        </>
                      )}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="Caterpillar, Komatsu, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="Model name/number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year of Manufacture *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1950"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                    placeholder="2020"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plateNumber">Plate Number *</Label>
                  <Input
                    id="plateNumber"
                    value={formData.plateNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, plateNumber: e.target.value }))}
                    placeholder="ABC-1234"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number *</Label>
                  <Input
                    id="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                    placeholder="REG-123456"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chassisNumber">Chassis/Serial Number *</Label>
                  <Input
                    id="chassisNumber"
                    value={formData.chassisNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, chassisNumber: e.target.value }))}
                    placeholder="Chassis number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engineNumber">Engine Number</Label>
                  <Input
                    id="engineNumber"
                    value={formData.engineNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, engineNumber: e.target.value }))}
                    placeholder="Engine number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity/Tonnage</Label>
                  <Input
                    id="capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, capacity: e.target.value }))}
                    placeholder="e.g., 20 tons, 5 cubic meters"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details about the vehicle/equipment"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ownership & Insurance</CardTitle>
              <CardDescription>Owner and insurance information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Owner Name/Company *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ownerName: e.target.value }))}
                    placeholder="Owner name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerLicense">Owner License Number *</Label>
                  <Input
                    id="ownerLicense"
                    value={formData.ownerLicense}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ownerLicense: e.target.value }))}
                    placeholder="LIC-123456"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceNumber">Insurance Policy Number *</Label>
                  <Input
                    id="insuranceNumber"
                    value={formData.insuranceNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, insuranceNumber: e.target.value }))}
                    placeholder="INS-123456"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuranceExpiry">Insurance Expiry Date *</Label>
                  <Input
                    id="insuranceExpiry"
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => setFormData((prev) => ({ ...prev, insuranceExpiry: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="currentProject">Current Project Assignment</Label>
                  <Input
                    id="currentProject"
                    value={formData.currentProject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currentProject: e.target.value }))}
                    placeholder="Project name or leave empty if not assigned"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>Upload all necessary certificates and documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.map((doc) => (
                <Card key={doc.key}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        {uploadedFiles[doc.key] ? (
                          <CheckCircle2 className="w-6 h-6 text-accent" />
                        ) : (
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label className="text-sm font-semibold">{doc.label}</Label>
                          {doc.required && <span className="text-xs text-destructive">*</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant={uploadedFiles[doc.key] ? "outline" : "default"}
                            size="sm"
                            onClick={() => document.getElementById(`file-${doc.key}`)?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadedFiles[doc.key] ? "Replace File" : "Upload File"}
                          </Button>
                          {uploadedFiles[doc.key] && (
                            <span className="text-xs text-muted-foreground">
                              {formData.documents[doc.key as keyof typeof formData.documents]}
                            </span>
                          )}
                        </div>
                        <input
                          id={`file-${doc.key}`}
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(doc.key, e.target.files)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="outline" asChild className="w-full sm:w-auto order-2 sm:order-1">
              <Link href="/dashboard/vehicles">Cancel</Link>
            </Button>
            <Button type="submit" disabled={!allRequiredUploaded || isSubmitting || disabled} className="w-full sm:w-auto order-1 sm:order-2">
              {isSubmitting ? "Registering..." : "Register Vehicle"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
