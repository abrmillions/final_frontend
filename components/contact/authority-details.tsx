"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { settingsApi } from "@/lib/api/django-client"

export default function AuthorityDetails() {
  const [email, setEmail] = useState<string | null>(null)
  const [phone, setPhone] = useState<string | null>(null)
  useEffect(() => {
    ;(async () => {
      try {
        const s = await settingsApi.publicSupport()
        if (s.supportEmail && s.supportEmail.trim().length > 0) setEmail(s.supportEmail)
        if (s.supportPhone && s.supportPhone.trim().length > 0) setPhone(s.supportPhone)
      } catch {}
    })()
  }, [])
  return (
    <Card>
      <CardHeader>
        <CardTitle>Authority Details</CardTitle>
        <CardDescription>Oromia Construction Authority service desk</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        {email ? <p>Email: {email}</p> : null}
        {phone ? <p>Phone: {phone}</p> : null}
        <p>Address: Addis Ababa, Oromia Construction Authority</p>
        <p>Working Hours: Monday–Friday, 9:00–17:00 (EAT)</p>
        <div className="mt-4 h-40 w-full rounded-md border bg-slate-100" aria-label="Map placeholder" />
      </CardContent>
    </Card>
  )
}
