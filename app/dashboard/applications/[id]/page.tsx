"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Download, Loader2, User, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { applicationsApi, documentsApi } from "@/lib/api/django-client"
import { getAppLicenseMapping, removeAppLicenseMapping } from '@/lib/storage/licenses-cache'

export default function ApplicationDetail() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { toast } = useToast()
  const [application, setApplication] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [documents, setDocuments] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const loadApplication = async () => {
      if (!id) return
      try {
        setIsLoading(true)
        const data = await applicationsApi.getDetail(id)
        setApplication(data)
      } catch (error) {
    console.error("[clms] Application load error:", error)
        toast({
          title: "Error",
          description: "Failed to load application details",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    const loadDocuments = async () => {
      if (!id) return
      try {
        const docs = await documentsApi.list({ application: id })
        // Handle pagination or direct list
        setDocuments(Array.isArray(docs) ? docs : docs.results || [])
      } catch (error) {
        console.error("Failed to load documents", error)
      }
    }

    loadApplication()
    loadDocuments()
  }, [id, toast])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return

    setIsUploading(true)
    try {
      await documentsApi.upload(file, id)
      toast({ title: "Success", description: "Document uploaded successfully" })
      // Reload documents
      const docs = await documentsApi.list({ application: id })
      setDocuments(Array.isArray(docs) ? docs : docs.results || [])
    } catch (error) {
      console.error("Upload error:", error)
      toast({ title: "Error", description: "Failed to upload document", variant: "destructive" })
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</Badge>
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      case "info_requested":
        return <Badge className="bg-amber-500 text-white"><AlertCircle className="w-3 h-3 mr-1" /> Info Requested</Badge>
      case "resubmitted":
        return <Badge className="bg-blue-500 text-white"><Clock className="w-3 h-3 mr-1" /> Resubmitted</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      contractor: "Contractor License",
      professional: "Professional License",
      import_export: "Import/Export License",
      partnership: "Partnership Registration",
      vehicle: "Vehicle Registration",
    }
    return types[type] || type
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Application Not Found</h1>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const data = application.data || {}

  const getLatestFeedback = () => {
    if (!application?.logs?.length) return null
    
    const relevantLogs = application.logs.filter((log: any) => 
      ['info_requested', 'rejected'].includes(log.action)
    )
    
    if (!relevantLogs.length) return null
    return relevantLogs[0] // Logs are ordered by timestamp desc in backend
  }

  const latestFeedback = getLatestFeedback()

  return (
    <div className="container py-10 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Application Details</h1>
        </div>
        <div className="flex gap-2">
        </div>
      </div>

      {latestFeedback && (
        <Alert variant={latestFeedback.action === 'rejected' ? "destructive" : "default"} className={latestFeedback.action === 'info_requested' ? "border-amber-500 bg-amber-50" : ""}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="capitalize">
            {latestFeedback.action === 'rejected' ? 'Application Rejected' : 'Information Requested'}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 text-sm font-medium">
              {latestFeedback.details}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {new Date(latestFeedback.timestamp).toLocaleString()}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Basic application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">ID</span>
              <span>{application.id}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">Type</span>
              <span>{getTypeLabel(application.license_type || application.type)}</span>
            </div>
            {String(application.license_type || application.type || "").toLowerCase().includes("contractor") && (data.grade || data.licenseType || data.category) && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-muted-foreground">Grade</span>
                <span>
                  {(() => {
                    const s = String(data.grade || data.licenseType || data.category).trim()
                    const l = s.toLowerCase()
                    if (l.includes("grade-a") || l === "a" || l.includes("grade a")) return "Grade A"
                    if (l.includes("grade-b") || l === "b" || l.includes("grade b")) return "Grade B"
                    if (l.includes("grade-c") || l === "c" || l.includes("grade c")) return "Grade C"
                    if (l.includes("specialized")) return "Specialized Contractor"
                    return s
                  })()}
                </span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">Status</span>
              <span>{getStatusBadge(application.status)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">Submitted</span>
              <span>{new Date(application.created_at || application.submittedAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applicant Information</CardTitle>
            <CardDescription>Details about the applicant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">Applicant</span>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{data.applicantName || data.fullName || application.applicant || "N/A"}</span>
              </div>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-muted-foreground">Company</span>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>{data.companyName || data.company_name || "N/A"}</span>
              </div>
            </div>
            {data.email && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-muted-foreground">Email</span>
                <span>{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-muted-foreground">Phone</span>
                <span>{data.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Data Section based on Application Data */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Application Data</CardTitle>
            <CardDescription>Submitted form data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(data).map(([key, value]) => {
                // Skip complex objects or already displayed fields
                if (typeof value === 'object' || ['applicantName', 'fullName', 'companyName', 'company_name', 'email', 'phone'].includes(key)) return null
                return (
                  <div key={key} className="flex flex-col gap-1 p-3 border rounded-md">
                    <span className="text-xs font-medium text-muted-foreground uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-sm font-medium">{String(value)}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Uploaded documents and files</CardDescription>
              </div>
              {!['approved', 'rejected'].includes(application.status) && (
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      id="doc-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    <Button asChild disabled={isUploading} size="sm">
                      <label htmlFor="doc-upload" className="cursor-pointer">
                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                        Upload Document
                      </label>
                    </Button>
                 </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
             <div className="border rounded-md divide-y">
               {documents.length === 0 ? (
                 <div className="p-4 text-center text-muted-foreground">No documents uploaded</div>
               ) : (
                 documents.map((doc: any) => (
                   <div key={doc.id} className="flex items-center justify-between p-3">
                     <div className="flex items-center gap-3">
                       <FileText className="w-5 h-5 text-blue-500" />
                       <div className="flex flex-col">
                         <span className="font-medium text-sm">{doc.name || doc.file.split('/').pop()}</span>
                         <span className="text-xs text-muted-foreground">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                       </div>
                     </div>
                     <Button variant="ghost" size="sm" asChild>
                       <a href={doc.file} target="_blank" rel="noopener noreferrer">
                         <Download className="w-4 h-4" />
                       </a>
                     </Button>
                   </div>
                 ))
               )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
