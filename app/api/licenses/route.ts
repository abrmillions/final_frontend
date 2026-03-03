import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(request: Request) {
  return proxyToDjango(request, '/api/licenses/')
}

export async function POST(request: Request) {
  return proxyToDjango(request, '/api/licenses/')
}
