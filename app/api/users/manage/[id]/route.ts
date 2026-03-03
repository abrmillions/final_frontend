import { type NextRequest } from 'next/server'
import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/users/manage/${p.id}/`)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/users/manage/${p.id}/`)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/users/manage/${p.id}/`)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/users/manage/${p.id}/`)
}
