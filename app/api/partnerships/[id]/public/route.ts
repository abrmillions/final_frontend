import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/partnerships/${p.id}/public/`)
}
