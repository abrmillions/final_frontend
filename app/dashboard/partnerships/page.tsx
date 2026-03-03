"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading } = useAuth()
  const [partnerships, setPartnerships] = useState<any[]>([])
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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
          const partnershipName = `${p?.main_contractor?.name || "Main"} + ${p?.partner_company?.name || "Partner"}`
          const partnershipType = String(p?.partnership_type || "joint_venture").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
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
    setDownloadingId(partnership.id)
    try {
      const detail = await partnershipsApi.getDetail(String(partnership.id))
      const pdf = await generatePartnershipPDF(detail)
      const fileName = `Partnership-${String(detail.id || partnership.id)}.pdf`
      downloadPDF(pdf, fileName)
      toast({
        title: "Downloaded",
        description: "Partnership certificate has been downloaded.",
      })
    } catch (error) {
      console.error("Error downloading:", error)
      toast({
        title: "Error",
        description: "Failed to download certificate.",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
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
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Partnership Management</h1>
              <p className="text-xs text-muted-foreground">{partnerships.length} partnerships registered</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button asChild className="h-8 px-3 text-xs w-full sm:w-auto">
              <Link href="/dashboard/partnerships/register">
                <Plus className="w-4 h-4 mr-2" />
                Register Partnership
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-8 px-3 text-xs w-full sm:w-auto">
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
              <Card key={partnership.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{partnership.data.partnershipName}</CardTitle>
                      <CardDescription>
                        Partnership ID: {partnership.id} • Registered{" "}
                        {new Date(partnership.registeredAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(partnership.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium text-foreground">{partnership.data.partnershipType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Partners:</span>
                      <p className="font-medium text-foreground">{partnership.data.partners?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valid Until:</span>
                      <p className="font-medium text-foreground">{partnership.data.validUntil || "N/A"}</p>
                    </div>
                  </div>
                  {partnership.data.certificateNumber && (
                    <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                      <span>
                        Certificate ID:{" "}
                        <span className="font-mono text-foreground">{partnership.data.certificateNumber}</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCertificate(partnership.data.certificateNumber)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/partnerships/${partnership.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Link>
                    </Button>
                    {partnership.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCertificate(partnership)}
                        disabled={downloadingId === partnership.id}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {downloadingId === partnership.id ? "Downloading..." : "Download Certificate"}
                      </Button>
                    )}
                    {["active", "approved"].includes(String(partnership.status || "").toLowerCase()) && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/partner/public/verify?id=${encodeURIComponent(partnership.id)}`}>
                          Verify Partnership
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
