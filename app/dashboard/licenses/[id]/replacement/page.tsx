"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ReplacementPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { toast, dismiss } = useToast()
  const { maintenanceMode, user } = useAuth()
  const isAdmin = (user?.role || "").toLowerCase() === "admin"
  const disabled = maintenanceMode && !isAdmin
  const [licenseType, setLicenseType] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        const client = await import('@/lib/api/django-client')
        const lic = await client.licensesApi.getLicense(String(id))
        setLicenseType(String(lic.license_type || 'Contractor License'))
      } catch {
        setLicenseType('Contractor License')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSubmit = async () => {
    dismiss()
    if (disabled) {
      toast({ title: "Maintenance in Progress", description: "Submissions are temporarily disabled.", variant: "destructive" })
      return
    }
    if (!reason.trim()) {
      toast({ title: "Missing", description: "Enter the replacement reason", variant: "destructive" })
      return
    }
    try {
      setSubmitting(true)
      const isProfessional = String(licenseType || '').toLowerCase().includes('professional')
      const subtype = isProfessional ? 'professional_replacement' : 'company_replacement'
      const payload: any = {
        license_type: licenseType || (isProfessional ? "Professional License" : "Contractor License"),
        data: { subtype, replacementReason: reason.trim(), reason: reason.trim() },
      }
      const client = await import('@/lib/api/django-client')
      const app = await client.applicationsApi.create(payload)
      const appId = String(app?.id || app?.application?.id || '')
      if (appId) setSubmittedAppId(appId)
      dismiss()
      toast({ title: "Submitted", description: "Your replacement request was submitted" })
    } catch (e: any) {
      dismiss()
      toast({ title: "Error", description: e?.message || "Failed to submit", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      {!submittedAppId ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">License Replacement</h1>
            <Button asChild variant="outlineBlueHover"><Link href={`/dashboard/licenses/${id}`}>Back to License</Link></Button>
          </div>
          {disabled && (
            <Alert className="border-amber-300 bg-amber-50 text-amber-800 mb-4">
              <AlertTitle>Maintenance in Progress</AlertTitle>
              <AlertDescription>Submissions are temporarily disabled.</AlertDescription>
            </Alert>
          )}
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Replacement Reason</CardTitle>
              <CardDescription>Provide details about the lost/damaged certificate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" rows={5} value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} />
              </div>
              <div className="flex gap-3">
                <Button variant="outlineBlueHover" asChild><Link href={`/dashboard/licenses/${id}`}>Cancel</Link></Button>
                <Button onClick={handleSubmit} disabled={submitting || loading || disabled}>Submit</Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Request Submitted</h1>
          </div>
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>Replacement Submitted</CardTitle>
              <CardDescription>Your application was created successfully</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button asChild className="flex-1"><Link href={`/dashboard/applications?newApp=replacement&appId=${encodeURIComponent(submittedAppId || '')}`}>View Applications</Link></Button>
                <Button asChild variant="outlineBlueHover" className="flex-1 bg-transparent"><Link href={`/dashboard/licenses/${id}`}>Back to License</Link></Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
