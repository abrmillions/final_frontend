"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { partnershipsApi, documentsApi, settingsApi } from "@/lib/api/django-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Shield, Loader2, Eye, Info, Building2, FileText, ArrowLeft, Download, Check, X, Search } from "lucide-react"
import Link from "next/link"
import { VerificationResultDisplay } from "@/components/verification-result-display"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Partnership } from "@/lib/types/partnership"

export default function AdminPartnershipDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [verifying, setVerifying] = useState<string | null>(null)
  const [updating, setUpdating] = useState<"approve" | "reject" | null>(null)
  const [verifyEnabled, setVerifyEnabled] = useState(false)
  const [showResultDialog, setShowResultDialog] = useState(false)
  const [currentVerificationResult, setCurrentVerificationResult] = useState<any>(null)
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const p = await partnershipsApi.getDetail(String(id))
      setPartnership(p)
      try {
        const s = await settingsApi.get()
        setVerifyEnabled(!!s.documentVerificationEnabled)
      } catch {}
      return p
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load partnership", variant: "destructive" })
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleApprove = async () => {
    setUpdating("approve")
    try {
      await partnershipsApi.approve(String(id))
      toast({ title: "Approved", description: "Partnership approved successfully." })
      loadData()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Approval failed.", variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const handleReject = async () => {
    setUpdating("reject")
    try {
      await partnershipsApi.reject(String(id))
      toast({ title: "Rejected", description: "Partnership has been rejected." })
      loadData()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Rejection failed.", variant: "destructive" })
    } finally {
      setUpdating(null)
    }
  }

  const handleVerify = async () => {
    setVerifying("all")
    try {
      await partnershipsApi.verifyDocuments(String(id))
      toast({ title: "Verification Complete", description: "Partnership documents verified." })
      await loadData()
    } catch (e: any) {
      const detail = e?.error?.detail || e?.message || "Verification failed"
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
      const updatedPartnership = await loadData()

      // After loadData, try to find the updated document to show the result
      if (updatedPartnership) {
        const updatedDoc = updatedPartnership.documents?.find((d: any) => d.id === docId)
        if (updatedDoc) {
          setCurrentVerificationResult(updatedDoc)
          setShowResultDialog(true)
        }
      }
    } catch (e: any) {
      const detail = e?.error?.detail || e?.message || "Verification failed"
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
      case "approved":
      case "active":
        return <Badge className="bg-green-500/10 text-green-700">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "pending":
        return <Badge className="bg-muted">Pending</Badge>
      default:
        return <Badge variant="secondary">{s}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading partnership details...</p>
      </div>
    )
  }

  if (!partnership) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold">Partnership not found</h2>
        <Button variant="link" asChild className="mt-4">
          <Link href="/admin/partnerships">Back to list</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground line-clamp-1">Partnership Review</h1>
              <p className="text-xs text-muted-foreground">ID: {partnership.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/admin/partnerships">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Partnership Information</CardTitle>
                  {statusBadge(partnership.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Main Contractor</label>
                      <p className="text-sm font-semibold mt-1">{partnership.main_contractor?.name}</p>
                      <p className="text-xs text-muted-foreground">{partnership.main_contractor?.registration_number}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Partner Company</label>
                      <p className="text-sm font-semibold mt-1">{partnership.partner_company?.name}</p>
                      <p className="text-xs text-muted-foreground">{partnership.partner_company?.registration_number}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Partnership Type</label>
                      <p className="text-sm font-medium mt-1 capitalize">{String(partnership.partnership_type || "").replace("_", " ")}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Ownership Ratio</label>
                      <p className="text-sm font-medium mt-1">{partnership.ownership_ratio_main}% / {partnership.ownership_ratio_partner}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">Start Date</label>
                      <p className="text-sm font-medium mt-1">{partnership.start_date || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase">End Date</label>
                      <p className="text-sm font-medium mt-1">{partnership.end_date || "N/A"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Certificate Number</label>
                    <p className="text-sm font-mono font-bold mt-1 text-blue-600">{partnership.certificate_number || "Pending Approval"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </CardTitle>
                <CardDescription>Review and verify legal documents for this partnership.</CardDescription>
              </CardHeader>
              <CardContent>
                {(!partnership.documents || partnership.documents.length === 0) ? (
                  <div className="text-center py-10 bg-muted/20 rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">No documents uploaded for this partnership.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {partnership.documents.map((doc: any) => (
                      <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{doc.document_type || "General Document"}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {doc.verification_status && (
                                <Badge
                                  className={`h-5 text-[10px] px-1.5 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap ${
                                    doc.verification_status === "verified_true"
                                      ? "bg-green-500/10 text-green-700"
                                      : doc.verification_status ===
                                          "verified_fake"
                                        ? "bg-red-500/10 text-red-700"
                                        : "bg-yellow-500/10 text-yellow-700"
                                  }`}
                                  onClick={() => {
                                    setCurrentVerificationResult(doc);
                                    setShowResultDialog(true);
                                  }}
                                >
                                  {doc.verification_status
                                    .replace("_", " ")
                                    .toUpperCase()}
                                </Badge>
                              )}
                              <p className="text-[10px] text-muted-foreground">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View details"
                            className="h-8 w-8"
                            onClick={() => {
                              setCurrentVerificationResult(doc);
                              setShowResultDialog(true);
                            }}
                          >
                            <Info className="w-4 h-4" />
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(doc.file, `partnership-${partnership.id}-${doc.document_type}.pdf`)}
                            disabled={downloading === doc.file}
                          >
                            {downloading === doc.file ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          </Button>

                          {verifyEnabled && (
                            <Button
                              variant="outline"
                              size="sm"
                              className={`h-8 text-xs ${doc.verification_status ? "border-primary text-primary" : "text-muted-foreground"}`}
                              onClick={() => handleVerifySingle(doc.id)}
                              disabled={verifying === doc.id}
                            >
                              {verifying === doc.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              ) : (
                                <Shield className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
                <CardDescription>Government review controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  onClick={handleApprove}
                  disabled={updating !== null || partnership.status === "approved" || partnership.status === "active"}
                >
                  {updating === "approve" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Approve Partnership
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleReject}
                  disabled={updating !== null || partnership.status === "rejected"}
                >
                  {updating === "reject" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                  Reject Partnership
                </Button>
                
                {verifyEnabled && (
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={handleVerify}
                    disabled={verifying !== null}
                  >
                    {verifying === "all" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                    Verify All Documents
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-xs text-muted-foreground">{new Date(partnership.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {partnership.status !== "pending" && (
                    <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        partnership.status === "approved" ? "bg-green-500" : 
                        partnership.status === "rejected" ? "bg-red-500" : "bg-yellow-500"
                      }`} />
                      <div>
                        <p className="text-sm font-medium capitalize">{partnership.status.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">Latest Update</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Global Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="w-5 h-5 text-blue-600" />
              AI Verification Results
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Detailed breakdown for{" "}
              {currentVerificationResult?.document_type || "Document"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg border gap-3">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Overall Score
                </p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">
                  {Math.round(
                    currentVerificationResult?.verification_score || 0,
                  )}
                  %
                </p>
              </div>
              <Badge
                className={`w-fit ${
                  currentVerificationResult?.verification_status ===
                  "verified_true"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : currentVerificationResult?.verification_status ===
                        "verified_fake"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                }`}
              >
                {(currentVerificationResult?.verification_status || "")
                  .replace("_", " ")
                  .toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Verification Result
              </h5>
              <div className="bg-slate-50 p-3 sm:p-6 rounded-xl border border-slate-200">
                <VerificationResultDisplay 
                  details={currentVerificationResult?.verification_details} 
                />
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground text-right italic">
              Verified on:{" "}
              {currentVerificationResult?.verified_at
                ? new Date(
                    currentVerificationResult.verified_at,
                  ).toLocaleString()
                : "N/A"}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
