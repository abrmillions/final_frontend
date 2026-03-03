import { type NextRequest } from 'next/server'
import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const p = await params
  const joined = Array.isArray(p.path) ? p.path.join('/') : String(p.path || '')
  return proxyToDjango(request, `/media/${joined}`)
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const p = await params
  const joined = Array.isArray(p.path) ? p.path.join('/') : String(p.path || '')
  return proxyToDjango(request, `/media/${joined}`)
}

