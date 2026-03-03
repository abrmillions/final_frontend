"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface Step4Props {
  data: any
  onBack: () => void
  onSubmit: () => void
}

export function ContractorStep4({ data, onBack, onSubmit }: Step4Props) {
  return (
    <div className="space-y-6">
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Review your application</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please verify all information is correct before submitting. You can go back to edit any section.
          </p>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Full Name:</span>
              <p className="font-medium text-foreground">{data.applicantName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium text-foreground">{data.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p className="font-medium text-foreground">{data.phone}</p>
            </div>
            <div>
              <span className="text-muted-foreground">National ID:</span>
              <p className="font-medium text-foreground">{data.nationalId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date of Birth:</span>
              <p className="font-medium text-foreground">{data.dateOfBirth}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Company Details</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Company Name:</span>
              <p className="font-medium text-foreground">{data.companyName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Registration Number:</span>
              <p className="font-medium text-foreground">{data.registrationNumber}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tax ID:</span>
              <p className="font-medium text-foreground">{data.taxId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Years of Experience:</span>
              <p className="font-medium text-foreground">{data.yearsOfExperience} years</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Address:</span>
              <p className="font-medium text-foreground">
                {data.address}, {data.city} {data.postalCode}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">License Type:</span>
              <p className="font-medium text-foreground">{data.licenseType}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Work Scope:</span>
              <p className="font-medium text-foreground">{data.workScope?.join(", ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Uploaded Documents</h3>
          <div className="space-y-2 text-sm">
            {(Object.entries(data.documents) as [string, any][]).map(
              ([key, value]) =>
                value && (
                  <div key={key} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    <span className="text-foreground">
                      {(() => {
                        if (value && typeof value === 'object' && 'name' in (value as any)) {
                          return String((value as File).name)
                        }
                        return String(value)
                      })()}
                    </span>
                  </div>
                ),
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <input type="checkbox" id="terms" className="mt-1" required />
          <label htmlFor="terms" className="text-sm text-foreground">
            I hereby declare that all information provided is true and accurate to the best of my knowledge. I
            understand that providing false information may result in rejection of this application or revocation of the
            license.
          </label>
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} size="lg">
          Submit Application
        </Button>
      </div>
    </div>
  )
}
