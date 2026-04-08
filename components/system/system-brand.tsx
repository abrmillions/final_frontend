"use client"
import { useEffect, useState } from "react"
import { settingsApi } from "@/lib/api/django-client"

export default function SystemBrand({ fallback = "CLMS" }: { fallback?: string }) {
  const [name, setName] = useState<string>(fallback)
  useEffect(() => {
    ;(async () => {
      try {
        const s = await settingsApi.publicSupport()
        const n = (s.systemName || "").trim()
        if (n) setName(n)
      } catch {}
    })()
  }, [])
  return <span>{name}</span>
}
