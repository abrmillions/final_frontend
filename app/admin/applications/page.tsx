"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Building2, Search, Filter, Eye, ArrowLeft, Loader2, Download, FileDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { applicationsApi } from "@/lib/api/django-client"
import { documentsApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"
import { DJANGO_API_URL } from "@/lib/config/django-api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Application {
  id: string
  license_type: string
  applicant: string
  created_at: string
  status: string
  data: any
}

export default function AdminApplications() {
  const { toast } = useToast()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [docsModalFor, setDocsModalFor] = useState<string | null>(null)
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsList, setDocsList] = useState<any[]>([])
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null)

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true)
        const data = await applicationsApi.list()
        // Handle DRF pagination
        setApplications(Array.isArray(data) ? data : data.results || [])
      } catch (err: any) {
        console.error("[clms] Failed to fetch admin applications:", err)
        const msg = err?.message || "Failed to load applications"
        setError(msg)
        try {
          const lower = String(msg).toLowerCase()
          if (err?.status === 401 || lower.includes("authentication credentials were not provided")) {
            router.push("/admin-login")
            toast({ title: "Sign in required", description: "Please sign in to access admin applications.", variant: "destructive" })
          }
        } catch {}
        setApplications([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchApplications()
  }, [])

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const handleDownloadZip = async (id: string) => {
    try {
      setDownloadingZipId(id)
      const blob = await applicationsApi.downloadDocuments(id)
      if (blob.type === 'application/json') {
        try {
          const text = await (blob as any).text?.() || await new Response(blob).text()
          const json = JSON.parse(text)
          toast({ title: "Download Failed", description: json.detail || "Could not download documents.", variant: "destructive" })
          return
        } catch {
          toast({ title: "Download Failed", description: "Could not download documents.", variant: "destructive" })
          return
        }
      }
      const filename = `application-${id}-documents.zip`
      downloadBlob(blob, filename)
      toast({ title: "Download Started", description: `Downloading ${filename}` })
    } catch (e: any) {
      console.error("Download ZIP error:", e)
      toast({ title: "Download Failed", description: e?.message || "Could not download ZIP.", variant: "destructive" })
    } finally {
      setDownloadingZipId(null)
    }
  }

  const openDocsModal = async (id: string) => {
    setDocsModalFor(id)
    setDocsLoading(true)
    try {
      const docs = await documentsApi.list({ application: id })
      const results = Array.isArray(docs) ? docs : docs.results || []
      // Also fetch application detail to include photo fields
      const appDetail = await applicationsApi.getDetail(id)
      const photos: any[] = []
      try {
        const p1 = appDetail?.profile_photo
        const p2 = appDetail?.professional_photo
        const p3 = appDetail?.company_representative_photo
        if (p1) photos.push({ id: `photo-profile-${id}`, filename: 'profile_photo', file: p1, mime: 'image', _kind: 'photo' })
        if (p2) photos.push({ id: `photo-professional-${id}`, filename: 'professional_photo', file: p2, mime: 'image', _kind: 'photo' })
        if (p3) photos.push({ id: `photo-company-representative-${id}`, filename: 'company_representative_photo', file: p3, mime: 'image', _kind: 'photo' })
      } catch {}
      setDocsList([...photos, ...results])
    } catch (e: any) {
      console.error("List documents error:", e)
      setDocsList([])
      toast({ title: "Failed to load documents", description: e?.message || "Error loading documents", variant: "destructive" })
    } finally {
      setDocsLoading(false)
    }
  }

  const handleDownloadDoc = async (doc: any) => {
    try {
      let blob: Blob
      if (doc._kind === 'photo' && doc.file) {
        blob = await documentsApi.downloadByUrl(String(doc.file))
      } else if (doc.file) {
        blob = await documentsApi.downloadByUrl(String(doc.file))
      } else {
        blob = await documentsApi.download(String(doc.id))
      }
      if (blob.type === 'application/json') {
        try {
          const text = await (blob as any).text?.() || await new Response(blob).text()
          const json = JSON.parse(text)
          toast({ title: "Download Failed", description: json.detail || "Could not download file.", variant: "destructive" })
          return
        } catch {
          toast({ title: "Download Failed", description: "Could not download file.", variant: "destructive" })
          return
        }
      }
      const name = doc.filename || doc.name || doc.file || `document-${doc.id}`
      const safeName = String(name).split('/').pop() || `document-${doc.id}`
      downloadBlob(blob, safeName)
    } catch (e: any) {
      console.error("Download doc error:", e)
      toast({ title: "Download Failed", description: e?.message || "Could not download file.", variant: "destructive" })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            Pending
          </Badge>
        )
      case "under_review":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
            Under Review
          </Badge>
        )
      case "approved":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      profile: "Contractor License",
      professional: "Professional License",
      company_representative: "Import/Export License",
      partnership: "Partnership Registration",
      vehicle: "Vehicle Registration",
    }
    return types[type] || type
  }

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      String(app.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(app.applicant).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.data?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || app.status === statusFilter
    const matchesType = typeFilter === "all" || app.license_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Application Review</h1>
                <p className="text-sm text-slate-600">Review and process applications</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-spin" />
              <p className="text-slate-500">Loading applications...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <Button asChild>
                <Link href="/admin">Back to Admin</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filter Applications</CardTitle>
                <CardDescription>Search and filter applications by various criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by ID, name, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="profile">Contractor License</SelectItem>
                      <SelectItem value="professional">Professional License</SelectItem>
                      <SelectItem value="company_representative">Import/Export License</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredApplications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">No applications found matching your filters</p>
                  </CardContent>
                </Card>
              ) : (
                filteredApplications.map((app) => (
                  <Card key={app.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{app.id}</h3>
                            {getStatusBadge(app.status)}
                          </div>
                          <div className="grid gap-2 text-sm">
                            <div className="flex gap-2">
                              <span className="font-medium text-slate-700">Type:</span>
                              <span className="text-slate-600">{app.license_type}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium text-slate-700">Applicant:</span>
                              <span className="text-slate-600">{app.data?.applicantName || app.data?.fullName || app.applicant}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium text-slate-700">Company:</span>
                              <span className="text-slate-600">{app.data?.companyName || app.data?.company_name || "N/A"}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="font-medium text-slate-700">Submitted:</span>
                              <span className="text-slate-600">{new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Button asChild>
                          <Link href={`/admin/applications/${app.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Link>
                        </Button>
                        {/* <div className="flex gap-2 ml-3">
                          <Button variant="outline" onClick={() => handleDownloadZip(app.id)} disabled={downloadingZipId === app.id}>
                            <Download className="h-4 w-4 mr-2" />
                            {downloadingZipId === app.id ? "Preparing..." : "Download ZIP"}
                          </Button>
                          <Button variant="outline" onClick={() => openDocsModal(app.id)}>
                            <FileDown className="h-4 w-4 mr-2" />
                            Documents
                          </Button>
                        </div> */}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <Dialog open={!!docsModalFor} onOpenChange={(open) => !open && setDocsModalFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Documents</DialogTitle>
            <DialogDescription>Download files individually</DialogDescription>
          </DialogHeader>
          {docsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : docsList.length === 0 ? (
            <div className="py-4 text-slate-600">No documents found for this application.</div>
          ) : (
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">File</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-slate-500">Type</th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {docsList.map((d) => (
                      <tr key={String(d.id)} className="border-b">
                        <td className="p-4 align-middle">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">{String(d.filename || d.name || d.file || `document-${d.id}`)}</span>
                            <span className="text-xs text-slate-500">{String(d.file || '')}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-slate-600">{String(d.content_type || d.mime || (d._kind === 'photo' ? 'Photo' : 'Document'))}</td>
                        <td className="p-4 align-middle text-right">
                          <Button variant="outline" onClick={() => handleDownloadDoc(d)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
