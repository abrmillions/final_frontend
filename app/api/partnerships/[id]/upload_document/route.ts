import { proxyToDjango } from '@/lib/api/django-proxy'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const p = await params
  return proxyToDjango(request, `/api/partnerships/${p.id}/upload_document/`)
}
