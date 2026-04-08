"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Check, X, ArrowLeft, FileText, Download, Eye, Loader2, Shield, Info, Search } from "lucide-react"
import Link from "next/link"
import { VerificationResultDisplay } from "@/components/verification-result-display"
import { partnershipsApi, documentsApi, settingsApi } from "@/lib/api/django-client"
import type { Partnership } from "@/lib/types/partnership"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminPartnershipsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [items, setItems] = useState<Partnership[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [verifyEnabled, setVerifyEnabled] = useState(false)

  const loadItems = async () => {
    if (loading) return
    setLoading(true)
    try {
      const data = await partnershipsApi.list()
      setItems(Array.isArray(data) ? data : [])
      try {
        const s = await settingsApi.get()
        setVerifyEnabled(!!s.documentVerificationEnabled)
      } catch {}
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load partnerships", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "Admin") {
      router.push("/dashboard")
      return
    }
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  const handleApprove = async (id: string) => {
    try {
      await partnershipsApi.approve(id)
      toast({ title: "Approved", description: "Partnership approved" })
      loadItems()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Approval failed", variant: "destructive" })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await partnershipsApi.reject(id)
      toast({ title: "Rejected", description: "Partnership rejected" })
      loadItems()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Rejection failed", variant: "destructive" })
    }
  }

  const handleVerify = async (id: string) => {
    setVerifying(id)
    try {
      await partnershipsApi.verifyDocuments(id)
      toast({ title: "Verification Complete", description: "Document verification finished" })
      loadItems()
    } catch (e: any) {
      const detail = e?.error?.detail || e?.message || "Verification failed"
      console.error("[clms] Verification error:", e)
      toast({ title: "Verification Failed", description: String(detail), variant: "destructive" })
    } finally {
      setVerifying(null)
    }
  }

  const handleVerifySingle = async (docId: string) => {
    setVerifying(docId)
    try {
      await partnershipsApi.verifyDocument(docId)
      toast({ title: "Verified", description: "Document verified successfully" })
      loadItems()
    } catch (e: any) {
      const detail = e?.error?.detail || e?.message || "Verification failed"
      console.error("[clms] Single verification error:", e)
      toast({ 
        title: "Verification Failed", 
        description: String(detail), 
        variant: "destructive",
        duration: 5000 
      })
    } finally {
      setVerifying(null)
    }
  }

  const handleDownload = async (url: string, filename: string) => {
    setDownloading(url)
    try {
      const blob = await documentsApi.downloadByUrl(url)
      
      if (blob.type === "application/json") {
        const text = await blob.text()
        const json = JSON.parse(text)
        toast({ title: "Download Failed", description: json.detail || "File not found", variant: "destructive" })
        return
      }

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e: any) {
      toast({ title: "Error", description: "Failed to download file", variant: "destructive" })
    } finally {
      setDownloading(null)
    }
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case "awaiting_government_review":
        return <Badge className="bg-yellow-500/10 text-yellow-700">Gov Review</Badge>
      case "awaiting_partner_approval":
        return <Badge className="bg-blue-500/10 text-blue-700">Awaiting Partner</Badge>
      case "pending":
        return <Badge className="bg-muted">Pending</Badge>
      default:
        return <Badge variant="secondary">{s}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Government Partnerships</h1>
              <p className="text-xs text-muted-foreground">{items.length} total registrations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outlineBlueHover" asChild>
              <Link href="/admin/applications">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Review
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <p className="text-muted-foreground">No partnership registrations found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <CardTitle className="text-lg">
                          {p.main_contractor?.name || "Main Contractor"} + {p.partner_company?.name || "Partner Company"}
                        </CardTitle>
                        {statusBadge(p.status)}
                      </div>
                      <CardDescription>
                        Type: <span className="capitalize">{String(p.partnership_type || "").replace("_", " ")}</span> • 
                        Period: {p.start_date || "N/A"} → {p.end_date || "N/A"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm border rounded-lg p-3 bg-slate-50/50">
                    <div>
                      <p className="text-muted-foreground">Main Contractor Registration</p>
                      <p className="font-medium">{p.main_contractor?.registration_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Partner Registration</p>
                      <p className="font-medium">{p.partner_company?.registration_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ownership Ratio</p>
                      <p className="font-medium">{p.ownership_ratio_main}% / {p.ownership_ratio_partner}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Certificate Number</p>
                      <p className="font-medium font-mono text-blue-600">{p.certificate_number || "Pending Approval"}</p>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Uploaded Documents
                    </h4>
                    {(!p.documents || p.documents.length === 0) ? (
                      <p className="text-xs text-muted-foreground bg-slate-50 p-2 rounded italic">No documents uploaded.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {p.documents.map((doc: any) => (
                          <div key={doc.id} className="space-y-1">
                            <div className="flex items-center justify-between p-2 border rounded bg-white text-xs">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate font-medium">{doc.document_type || "General Document"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {doc.verification_status && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Badge 
                                        className={`h-5 text-[10px] px-1.5 cursor-pointer hover:opacity-80 transition-opacity ${
                                          doc.verification_status === 'verified_true' ? 'bg-green-500' :
                                          doc.verification_status === 'verified_fake' ? 'bg-red-500' :
                                          'bg-yellow-500'
                                        }`}
                                      >
                                        {doc.verification_status.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                          <Shield className="w-5 h-5 text-blue-600" />
                                          AI Verification Analysis
                                        </DialogTitle>
                                        <DialogDescription>
                                          Detailed breakdown for {doc.document_type || "Document"}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                                          <div>
                                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Overall Score</p>
                                            <p className="text-2xl font-bold text-blue-700">{Math.round(doc.verification_score || 0)}%</p>
                                          </div>
                                          <Badge className={
                                            doc.verification_status === 'verified_true' ? 'bg-green-100 text-green-700 border-green-200' :
                                            doc.verification_status === 'verified_fake' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-yellow-100 text-yellow-700 border-yellow-200'
                                          }>
                                            {doc.verification_status.replace('_', ' ').toUpperCase()}
                                          </Badge>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <h5 className="text-sm font-semibold flex items-center gap-2">
                                            <Info className="w-4 h-4 text-slate-400" />
                                            Verification Result
                                          </h5>
                                          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                            <VerificationResultDisplay 
                                              details={doc.verification_details} 
                                            />
                                          </div>
                                        </div>

                                        <div className="text-[10px] text-muted-foreground text-right italic">
                                          Verified on: {doc.verified_at ? new Date(doc.verified_at).toLocaleString() : "N/A"}
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                                {verifyEnabled && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0" 
                                    onClick={() => handleVerifySingle(doc.id)}
                                    disabled={verifying === doc.id}
                                  >
                                    {verifying === doc.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Shield className="w-3 h-3 text-blue-600" />
                                    )}
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0" 
                                  onClick={() => handleDownload(doc.file, `partnership-${p.id}-${doc.document_type}.pdf`)}
                                  disabled={downloading === doc.file}
                                >
                                  {downloading === doc.file ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center">
                    {p.status === "awaiting_government_review" && (
                      <>
                        <Button onClick={() => handleApprove(p.id)}>
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button variant="outline" onClick={() => handleReject(p.id)}>
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {verifyEnabled && p.documents && p.documents.length > 0 && (
                      <Button 
                        variant="secondary" 
                        onClick={() => handleVerify(p.id)}
                        disabled={verifying === p.id}
                      >
                        {verifying === p.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Verify Documents
                      </Button>
                    )}
                  </div>

                  {p.status === "approved" && (
                    <div className="mt-4 text-sm text-emerald-600 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      This partnership has been approved and is active.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
