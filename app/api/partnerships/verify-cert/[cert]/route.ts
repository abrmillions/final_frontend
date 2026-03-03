import { type NextRequest } from 'next/server'
import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cert: string }> },
) {
  const p = await params
  return proxyToDjango(
    request,
    `/api/partnerships/verify-cert/${encodeURIComponent(p.cert)}/`,
  )
}
