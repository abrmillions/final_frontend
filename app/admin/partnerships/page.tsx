"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, FileText, Download, Eye, Loader2, Shield, Info, Check, X, Search, Clock } from "lucide-react"
import Link from "next/link"
import { partnershipsApi, documentsApi, settingsApi } from "@/lib/api/django-client"
import type { Partnership } from "@/lib/types/partnership"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"
import { Input } from "@/components/ui/input"

export default function AdminPartnershipsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [items, setItems] = useState<Partnership[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const loadItems = async () => {
    if (loading) return
    setLoading(true)
    try {
      const data = await partnershipsApi.list()
      setItems(Array.isArray(data) ? data : [])
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

  const filteredItems = items.filter(p => {
    const search = searchQuery.toLowerCase()
    return (
      (p.main_contractor?.name || "").toLowerCase().includes(search) ||
      (p.partner_company?.name || "").toLowerCase().includes(search) ||
      (p.certificate_number || "").toLowerCase().includes(search)
    )
  })

  const statusBadge = (s: string) => {
    switch (s) {
      case "awaiting_government_review":
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">Gov Review</Badge>
      case "awaiting_partner_approval":
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">Awaiting Partner</Badge>
      case "approved":
      case "active":
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Approved</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "pending":
        return <Badge className="bg-muted">Pending</Badge>
      default:
        return <Badge variant="secondary">{s}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-blue-200 shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 truncate">
                  Partnerships
                </h1>
                <p className="text-sm text-slate-500">{items.length} total registrations</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Back to Admin</span>
                  <span className="xs:hidden">Back</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <Card className="border-none shadow-none bg-transparent">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by company name or certificate number..." 
              className="pl-10 h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading partnerships...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No partnership registrations found.</p>
              {searchQuery && (
                <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map((p) => (
              <Card key={p.id} className="hover:border-blue-300 transition-all group shadow-sm hover:shadow-md bg-white border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors wrap-break-word">
                          {p.main_contractor?.name || "Main Contractor"} <span className="text-slate-400 font-normal">&</span> {p.partner_company?.name || "Partner Company"}
                        </CardTitle>
                        {statusBadge(p.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                        <Badge variant="outline" className="text-[10px] h-5 px-2 bg-slate-50 border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                          {String(p.partnership_type || "").replace("_", " ")}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.start_date || "N/A"} → {p.end_date || "N/A"}</span>
                        </div>
                        {p.certificate_number && (
                          <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-mono text-blue-600 font-bold">{p.certificate_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="hoverBlue" size="sm" asChild className="shrink-0 w-full sm:w-auto">
                      <Link href={`/admin/partnerships/${p.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-100 pt-4 mt-1">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                        Ownership: <span className="font-bold text-slate-700">{p.ownership_ratio_main}% / {p.ownership_ratio_partner}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Documents: <span className="font-bold text-slate-700">{p.documents?.length || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 sm:bg-transparent sm:p-0 sm:border-0">
                      <Info className="w-3.5 h-3.5 text-slate-400 sm:hidden" />
                      Created: <span className="font-medium">{new Date(p.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
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
