import { type NextRequest } from 'next/server'
import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/applications/${p.id}/`)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/applications/${p.id}/`)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/applications/${p.id}/`)
}
