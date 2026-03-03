"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { companiesApi } from "@/lib/api/django-client"

export default function CompanyEditPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    name: "",
    registration_number: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  })

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        setLoading(true)
        const data = await companiesApi.getDetail(String(id))
        setForm({
          name: data.name || "",
          registration_number: data.registration_number || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip_code: data.zip_code || "",
        })
      } catch (e: any) {
        toast({
          title: "Error",
          description: "Failed to load company",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, toast])

  const update = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      await companiesApi.update(String(id), form)
      toast({ title: "Saved", description: "Company updated" })
      router.push("/dashboard/companies")
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to save",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Company</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/companies">Back</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration_number">Registration Number</Label>
              <Input id="registration_number" value={form.registration_number} onChange={(e) => update("registration_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" value={form.state} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">Zip Code</Label>
              <Input id="zip_code" value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.push("/dashboard/companies")}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

