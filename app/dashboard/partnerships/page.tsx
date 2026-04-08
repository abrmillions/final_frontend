"use client"

import { Suspense } from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Users, Plus, Eye, Download, Copy } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { partnershipsApi } from "@/lib/api/django-client"
import { downloadPDF } from "@/lib/downloads/file-download"
import { generatePartnershipPDF } from "@/lib/downloads/pdf-generator"
import { copyToClipboard } from "@/lib/button-actions"

export default function PartnershipsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <PartnershipsContent />
    </Suspense>
  )
}

function PartnershipsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isAuthenticated, isLoading } = useAuth()
  const [partnerships, setPartnerships] = useState<any[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const processedPaidIdRef = useRef<string | null>(null)

  useEffect(() => {
    const paid = searchParams.get("paid")
    const id = searchParams.get("id")
    
    if (paid === "1" && id && partnerships.length > 0) {
      // Prevent double download by checking if this ID was already processed
      if (processedPaidIdRef.current === id) return;
      
      const target = partnerships.find((p) => String(p.id) === String(id))
      if (target) {
        const triggerDownload = async () => {
          processedPaidIdRef.current = id;
          setDownloadingId(target.id)
          try {
            const detail = await partnershipsApi.getDetail(String(target.id))
            const pdf = await generatePartnershipPDF(detail)
            const fileName = `Partnership-${String(detail.id || target.id)}.pdf`
            downloadPDF(pdf, fileName)
            toast({
              title: "Payment Successful! 🎉",
              description: "Your partnership certificate has been downloaded.",
            })
            // Clean up URL
            const url = new URL(window.location.href)
            url.searchParams.delete("paid")
            url.searchParams.delete("id")
            window.history.replaceState({}, "", url.toString())
          } catch (error) {
            console.error("Failed to download certificate:", error)
            processedPaidIdRef.current = null; // Reset on failure
          } finally {
            setDownloadingId(null)
          }
        }
        triggerDownload()
      }
    }
  }, [searchParams, partnerships, toast])

  useEffect(() => {
    // Show background upload indicator when returning from registration
    try {
      if (typeof window !== "undefined") {
        const flag = window.localStorage.getItem("clms_bg_uploads")
        if (flag) {
          toast({
            title: "Uploads in progress",
            description: "Partnership documents are uploading in the background.",
          })
          window.localStorage.removeItem("clms_bg_uploads")
        }
      }
    } catch {}

    const loadPartnerships = async () => {
      if (isLoading) return
      if (!isAuthenticated) {
        router.push("/login")
        return
      }

      try {
        const data = await partnershipsApi.list()
        const arr = Array.isArray(data) ? data : []

        // Normalize backend Partnership objects for UI
        const normalized = arr.map((p: any) => {
          const rawType = String(p?.partnership_type || "joint_venture")
          const partnershipName = `${p?.main_contractor?.name || "Main"} + ${p?.partner_company?.name || "Partner"}`
          const partnershipType = rawType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          const validUntil = p?.end_date || null
          const certificateNumber = p?.certificate_number || null
          const partners = [
            { companyName: p?.main_contractor?.name, licenseNumber: p?.main_contractor?.license_number },
            { companyName: p?.partner_company?.name, licenseNumber: p?.partner_company?.license_number },
          ].filter((x) => x.companyName)

          return {
            id: p.id,
            status: p.status || "active",
            registeredAt: p.created_at,
            rawType,
            data: {
              partnershipName,
              partnershipType,
              partners,
              validUntil,
              certificateNumber,
            },
          }
        })

        setPartnerships(normalized)
      } catch (err: any) {
        console.error("[clms] Failed to fetch partnerships:", err)
        toast({
          title: "Error",
          description: err?.message || "Failed to load partnerships",
          variant: "destructive",
        })
        setPartnerships([])
      }
    }

    loadPartnerships()
  }, [router, toast, isAuthenticated, isLoading])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending Verification</Badge>
      case "expired":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400">
            Expired
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleDownloadCertificate = async (partnership: any) => {
    if (partnership.status !== "active") {
      toast({
        title: "Not Available",
        description: "Certificates are only available for active partnerships.",
        variant: "destructive",
      })
      return
    }

    const type = String(partnership.rawType || "").toLowerCase()
    const category = (type.includes("foreign") || type.includes("local")) ? "partnership-foreign" : "partnership-standard"

    // Redirect to payment page instead of downloading directly
    router.push(`/dashboard/payments/certificate/${partnership.id}?section=partnership&category=${category}`)
  }

  const handleCopyCertificate = async (code: string | null) => {
    if (!code) {
      toast({
        title: "No Certificate",
        description: "Certificate ID is not available yet.",
        variant: "destructive",
      })
      return
    }
    try {
      const res = await copyToClipboard(code, "Certificate ID")
      toast({
        title: res.success ? "Copied" : "Copy Failed",
        description: res.message,
        variant: res.success ? undefined : "destructive",
      })
    } catch {
      toast({
        title: "Copy Failed",
        description: "Could not copy Certificate ID.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">Partnership Management</h1>
              <p className="text-xs text-muted-foreground">{partnerships.length} partnerships registered</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button asChild size="sm" className="h-8 px-3 text-xs w-full sm:w-auto">
              <Link href="/dashboard/partnerships/register">
                <Plus className="w-4 h-4 mr-2" />
                Register Partnership
              </Link>
            </Button>
            <Button variant="outlineBlueHover" size="sm" asChild className="h-8 px-3 text-xs w-full sm:w-auto">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {partnerships.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Partnerships Yet</h3>
              <p className="text-muted-foreground mb-6">
                Register a joint venture or partnership to collaborate on construction projects.
              </p>
              <Button asChild>
                <Link href="/dashboard/partnerships/register">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Partnership
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {partnerships.map((partnership) => (
              <Card key={partnership.id} className="hover:shadow-md transition-all duration-200 border-slate-200 overflow-hidden">
                <CardHeader className="px-4 sm:px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {partnership.data.partnershipName}
                      </CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs mt-1 font-medium">
                        ID: {partnership.id} • Registered{" "}
                        {new Date(partnership.registeredAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="shrink-0 scale-90 sm:scale-100 origin-right">
                      {getStatusBadge(partnership.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-5 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm mb-5 p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Type</span>
                      <p className="font-semibold text-slate-900">{partnership.data.partnershipType}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Partners</span>
                      <p className="font-semibold text-slate-900">{partnership.data.partners?.length || 0} Companies</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Valid Until</span>
                      <p className="font-semibold text-slate-900">{partnership.data.validUntil || "N/A"}</p>
                    </div>
                  </div>
                  
                  {partnership.data.certificateNumber && (
                    <div className="mb-5 p-3 bg-blue-50/30 rounded-lg border border-blue-100/50 flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-0.5">Certificate ID</span>
                        <code className="text-[11px] sm:text-xs font-mono font-bold text-blue-700 break-all">{partnership.data.certificateNumber}</code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0"
                        onClick={() => handleCopyCertificate(partnership.data.certificateNumber)}
                      >
                        <Copy className="w-3 h-3 mr-1.5" />
                        COPY ID
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold shadow-sm flex-1 sm:flex-none" asChild>
                      <Link href={`/dashboard/partnerships/${partnership.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-2" />
                        Details
                      </Link>
                    </Button>
                    {partnership.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm flex-1 sm:flex-none"
                        onClick={() => handleDownloadCertificate(partnership)}
                        disabled={downloadingId === partnership.id}
                      >
                        <Download className="w-3.5 h-3.5 mr-2" />
                        {downloadingId === partnership.id ? "..." : "Certificate"}
                      </Button>
                    )}
                    {["active", "approved"].includes(String(partnership.status || "").toLowerCase()) && (
                      <Button variant="outline" size="sm" className="h-9 px-4 text-xs font-bold border-slate-200 shadow-sm flex-1 sm:flex-none" asChild>
                        <Link href={`/partner/public/verify?id=${encodeURIComponent(partnership.id)}`}>
                          Verify
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
