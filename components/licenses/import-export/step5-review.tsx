"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface Step5Props {
  data: any
  onBack: () => void
  onSubmit: () => void
}

export function ImportExportStep5({ data, onBack, onSubmit }: Step5Props) {
  const calculateTotalValue = () => {
    return data.items?.reduce((sum: number, item: any) => sum + (Number.parseFloat(item.value) || 0), 0).toFixed(2)
  }

  return (
    <div className="space-y-6">
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Review your permit application</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please verify all information before submitting to customs authority.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Company Information</h3>
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
              <span className="text-muted-foreground">Contact Person:</span>
              <p className="font-medium text-foreground">{data.contactPerson}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-medium text-foreground">{data.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Permit Details</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Permit Type:</span>
              <p className="font-medium text-foreground">{data.permitType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <p className="font-medium text-foreground">{data.duration}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Customs Office:</span>
              <p className="font-medium text-foreground">{data.customsOffice}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Purpose:</span>
              <p className="font-medium text-foreground">{data.purposeOfImport}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Items Summary</h3>
          <div className="space-y-3">
            {data.items?.map((item: any, index: number) => (
              <div key={index} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">${item.value}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Qty:</span>
                    <span className="ml-1 text-foreground">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Origin:</span>
                    <span className="ml-1 text-foreground">{item.countryOfOrigin}</span>
                  </div>
                  {item.hsCode && (
                    <div>
                      <span className="text-muted-foreground">HS Code:</span>
                      <span className="ml-1 text-foreground">{item.hsCode}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="font-semibold text-foreground">Total Value:</span>
            <span className="text-lg font-bold text-primary">${calculateTotalValue()} USD</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Uploaded Documents</h3>
          <div className="space-y-2 text-sm">
            {(Object.entries(data.documents) as [string, any][]).map(([key, value]) => {
              if (!value) return null
              const label = (value instanceof File) ? value.name : String(value)
              return (
                <div key={key} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <span className="text-foreground">{label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <input type="checkbox" id="terms" className="mt-1" required />
          <label htmlFor="terms" className="text-sm text-foreground">
            I declare that all information and documents provided are accurate and genuine. I understand that providing
            false information may result in permit rejection, legal action, and potential customs penalties.
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
