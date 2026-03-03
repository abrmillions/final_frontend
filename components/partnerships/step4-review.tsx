"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface Step4Props {
  data: any
  onBack: () => void
  onSubmit: () => void
}

export function PartnershipStep4({ data, onBack, onSubmit }: Step4Props) {
  return (
    <div className="space-y-6">
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Review partnership registration</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please verify all information before submitting for verification.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Partnership Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Partnership Name:</span>
              <p className="font-medium text-foreground">{data.partnershipName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium text-foreground">{data.partnershipType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <p className="font-medium text-foreground">
                {data.startDate} to {data.endDate}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Project Value:</span>
              <p className="font-medium text-foreground">${data.estimatedValue} USD</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Project Location:</span>
              <p className="font-medium text-foreground">{data.projectLocation}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Project Scope:</span>
              <p className="font-medium text-foreground">{data.projectScope}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Partners ({data.partners?.length || 0})</h3>
          <div className="space-y-3">
            {data.partners?.map((partner: any, index: number) => (
              <div key={index} className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{partner.companyName}</p>
                    <p className="text-xs text-muted-foreground">License: {partner.licenseNumber}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">{partner.sharePercentage}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Contact:</span>
                    <span className="ml-1 text-foreground">{partner.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-1 text-foreground">{partner.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                      {typeof value === 'object' && (value as any)?.name ? (value as any).name : String(value)}
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
            All partners hereby confirm that the information provided is accurate and that they agree to the terms of
            this partnership. We understand that verification will be conducted for all partner licenses and documents.
          </label>
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} size="lg">
          Register Partnership
        </Button>
      </div>
    </div>
  )
}
