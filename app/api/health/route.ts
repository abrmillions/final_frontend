import { NextResponse } from "next/server"
import { DJANGO_API_URL } from "@/lib/config/django-api"

export async function GET() {
  let backendOk = false
  let status = 0
  let message = "ok"
  try {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), 2000)
    const res = await fetch(`${DJANGO_API_URL}/api/system/settings/`, { signal: ac.signal, cache: "no-store" })
    clearTimeout(t)
    status = res.status
    backendOk = res.ok || status === 503
    if (!backendOk) {
      try {
        message = (await res.text()) || res.statusText
      } catch {
        message = res.statusText
      }
    }
  } catch (e: any) {
    message = String(e?.message || "failed")
  }
  return NextResponse.json({ ok: backendOk, status, message })
}
