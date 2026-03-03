"use client"

import React, { useEffect, useState } from "react"
import { DJANGO_API_URL, djangoApiRequest } from "@/lib/config/django-api"

type StatsData = {
  licensed_contractors: number
  professionals: number
  approval_rate?: number
  active_users?: number
  online_access_24_7: boolean
  contractor_applications?: number
  professional_applications?: number
  import_export_applications?: number
  applications_by_type?: {
    contractor?: number
    professional?: number
    import_export?: number
  }
}

export default function Stats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const url = `${DJANGO_API_URL}/api/stats/`
    djangoApiRequest<StatsData>(url, { skipAuth: true, suppressLog: true })
      .then((data) => {
        if (!mounted) return
        setStats(data)
      })
      .catch((e) => {
        if (!mounted) return
        setErr(e?.message || "Failed to load stats")
      })
    return () => {
      mounted = false
    }
  }, [])

  const formatCount = (n: number, threshold?: number, suffix?: string) => {
    if (threshold && n >= threshold) return `${threshold.toLocaleString()}+`
    return n.toLocaleString() + (suffix || "")
  }

  if (err) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="text-center">Error loading stats</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-8 bg-slate-200 animate-pulse rounded" />
            <div className="h-4 mt-2 bg-slate-200 animate-pulse rounded w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  const contractorApps =
    (stats.contractor_applications as number | undefined) ??
    (stats.applications_by_type?.contractor as number | undefined) ??
    0
  const professionalApps =
    (stats.professional_applications as number | undefined) ??
    (stats.applications_by_type?.professional as number | undefined) ??
    0
  const importExportApps =
    (stats.import_export_applications as number | undefined) ??
    (stats.applications_by_type?.import_export as number | undefined) ??
    0

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
          {formatCount(contractorApps)}
        </div>
        <div className="text-sm text-muted-foreground">Contractor Applications</div>
      </div>

      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
          {formatCount(professionalApps)}
        </div>
        <div className="text-sm text-muted-foreground">Professional Applications</div>
      </div>

      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
          {formatCount(importExportApps)}
        </div>
        <div className="text-sm text-muted-foreground">Import/Export Applications</div>
      </div>

      <div className="text-center">
        <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
          {(stats.approval_rate ?? (stats as any).approvalRate ?? 0)}%
        </div>
        <div className="text-sm text-muted-foreground">Approval Rate</div>
      </div>
    </div>
  )
}
