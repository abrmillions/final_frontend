import { NextResponse } from 'next/server'
import { DJANGO_API_URL } from '@/lib/config/django-api'

export async function GET(request: Request) {
  const url = new URL('/api/contact/messages/', DJANGO_API_URL)
  url.search = new URL(request.url).search
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: request.headers,
    redirect: 'manual',
  })
  const body = await res.arrayBuffer()
  return new NextResponse(new Uint8Array(body), { status: res.status, headers: res.headers })
}

export async function POST(request: Request) {
  try {
    const settingsUrl = new URL('/api/system/settings/', DJANGO_API_URL)
    const s = await fetch(settingsUrl.toString(), { method: 'GET', headers: request.headers }).then(r => r.json()).catch(() => null)
    const isMaintenance = !!(s && (s.maintenance_mode ?? s.maintenanceMode))
    if (isMaintenance) {
      const payload = JSON.stringify({ detail: 'The system is currently in Maintenance in Progress updating. Please try again later.' })
      return new NextResponse(payload, { status: 503, headers: { 'Content-Type': 'application/json' } })
    }
  } catch {}
  const incoming = new URL(request.url)
  const url = new URL('/api/contact/messages/', DJANGO_API_URL)
  const buf = await request.arrayBuffer().catch(() => null)
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: request.headers,
    body: buf || undefined,
    redirect: 'manual',
  })
  const ct = request.headers.get('content-type') || ''
  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const redirectUrl = new URL('/contact?sent=1', incoming.origin)
    return NextResponse.redirect(redirectUrl.toString(), { status: 303 })
  }
  const body = await res.arrayBuffer()
  return new NextResponse(new Uint8Array(body), { status: res.status, headers: res.headers })
}
