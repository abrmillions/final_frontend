import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(request: Request) {
  return proxyToDjango(request, '/api/payments/')
}

export async function POST(request: Request) {
  return proxyToDjango(request, '/api/payments/')
}
