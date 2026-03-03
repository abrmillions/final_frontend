"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Mail, Phone, MapPin, Plus } from "lucide-react"
import { companiesApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

type Company = {
  id: string
  name: string
  registration_number?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  created_at?: string
}

export default function CompaniesPage() {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await companiesApi.list()
        const list = Array.isArray(res) ? res : res.results || []
        setCompanies(list)
      } catch (e: any) {
        toast({
          title: "Error",
          description: "Failed to load companies",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [toast])

  return (
    <div className="container py-8 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/companies/register">
              <Plus className="w-4 h-4 mr-2" />
              New Registration
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-1/2 bg-muted rounded" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-4 w-2/3 bg-muted rounded" />
                <div className="h-4 w-1/3 bg-muted rounded" />
              </CardContent>
            </Card>
          ))
        ) : companies.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-6 text-center text-muted-foreground">
              No companies found. Start a new company registration to see it here.
            </CardContent>
          </Card>
        ) : (
          companies.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      <Link href={`/dashboard/companies/${c.id}`}>{c.name}</Link>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Reg. No: {c.registration_number || "—"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {(c.email || c.phone) && (
                  <p className="text-sm flex items-center gap-2">
                    {c.email && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {c.email}
                      </span>
                    )}
                    {c.phone && (
                      <span className="inline-flex items-center gap-1 ml-4">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {c.phone}
                      </span>
                    )}
                  </p>
                )}
                {(c.address || c.city || c.state || c.zip_code) && (
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span>
                      {[c.address, c.city, c.state, c.zip_code].filter(Boolean).join(", ")}
                    </span>
                  </p>
                )}
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/contractor-license/apply">New Certification</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
