"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

interface Step5Props {
  data: any
  onBack: () => void
  onSubmit: () => void
}

export function ProfessionalStep5({ data, onBack, onSubmit }: Step5Props) {
  return (
    <div className="space-y-6">
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Review your application</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please verify all information is correct before submitting.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Personal Information</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Full Name:</span>
              <p className="font-medium text-foreground">{data.fullName}</p>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Qualifications</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Profession:</span>
              <p className="font-medium text-foreground">{data.profession}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Specialization:</span>
              <p className="font-medium text-foreground">{data.specialization}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Degree:</span>
              <p className="font-medium text-foreground">{data.degree}</p>
            </div>
            <div>
              <span className="text-muted-foreground">University:</span>
              <p className="font-medium text-foreground">{data.university}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Experience</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="text-muted-foreground">Years of Experience:</span>
              <p className="font-medium text-foreground">{data.yearsOfExperience} years</p>
            </div>
            <div>
              <span className="text-muted-foreground">Current Employer:</span>
              <p className="font-medium text-foreground">{data.currentEmployer}</p>
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Notable Projects:</span>
            {data.projects?.map((project: any, index: number) => (
              <div key={index} className="bg-muted/50 rounded-lg p-3">
                <p className="font-medium text-foreground text-sm">{project.name}</p>
                <p className="text-xs text-muted-foreground">
                  {project.role} - {project.year}
                </p>
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
            I hereby declare that all information provided is true and accurate. I understand that providing false
            information may result in rejection or revocation of my professional license.
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
