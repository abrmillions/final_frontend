"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface Step3Props {
  data: any
  updateData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

export function ContractorStep3({ data, updateData, onNext, onBack }: Step3Props) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, boolean>>({})

  const documents = [
    // { key: "companyPhoto", label: "Company Logo/Photo", required: true },
    { key: "nationalIdCopy", label: "National ID Copy", required: true },
    // { key: "companyRegistration", label: "Company Registration Certificate", required: true },
    { key: "taxCertificate", label: "Tax Registration Certificate", required: true },
    { key: "experienceCertificate", label: "Experience Certificates", required: true },
    { key: "financialStatement", label: "Financial Statement (Last 2 years)", required: true },
  ]

  const handleFileUpload = (key: string, files: FileList | null) => {
    if (files && files.length > 0) {
      setUploadedFiles((prev) => ({ ...prev, [key]: true }))
      const file = files[0]
      const nextDocs = { ...data.documents, [key]: file }
      updateData({ documents: nextDocs })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  const allRequiredUploaded = documents.filter((doc) => doc.required).every((doc) => uploadedFiles[doc.key])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {documents.map((doc) => (
          <Card key={doc.key}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
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
                        {(() => {
                          const v = data.documents?.[doc.key]
                          if (v && typeof v === 'object' && 'name' in v) return String((v as File).name)
                          return String(v || 'File selected')
                        })()}
                      </span>
                    )}
                  </div>
                  <input
                    id={`file-${doc.key}`}
                    type="file"
                    className="hidden"
                    accept={doc.key === 'companyPhoto' ? 'image/*' : '.pdf,.jpg,.jpeg,.png'}
                    onChange={(e) => handleFileUpload(doc.key, e.target.files)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" disabled={!allRequiredUploaded}>
          Continue to Review
        </Button>
      </div>
    </form>
  )
}
