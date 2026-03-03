"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Check, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { partnershipsApi } from "@/lib/api/django-client"
import type { Partnership } from "@/lib/types/partnership"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/auth-context"

export default function AdminPartnershipsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const [items, setItems] = useState<Partnership[]>([])
  const [loading, setLoading] = useState(false)

  const loadPending = async () => {
    if (loading) return
    setLoading(true)
    try {
      const data = await partnershipsApi.pending()
      setItems(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load pending partnerships", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated || !user?.role || user.role !== "Admin") {
      router.push("/dashboard")
      return
    }
    loadPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user])

  const handleApprove = async (id: string) => {
    try {
      await partnershipsApi.approve(id)
      toast({ title: "Approved", description: "Partnership approved" })
      loadPending()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Approval failed", variant: "destructive" })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await partnershipsApi.reject(id)
      toast({ title: "Rejected", description: "Partnership rejected" })
      loadPending()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Rejection failed", variant: "destructive" })
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
              <p className="text-xs text-muted-foreground">{items.length} pending</p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {items.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <p className="text-muted-foreground">No pending partnerships.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {p.main_contractor?.name} + {p.partner_company?.name}
                      </CardTitle>
                      <CardDescription>
                        Type: {p.partnership_type} • Period: {p.start_date} → {p.end_date}
                      </CardDescription>
                    </div>
                    {statusBadge(p.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(p.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => handleReject(p.id)}>
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
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
