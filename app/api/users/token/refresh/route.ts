import { proxyToDjango } from '@/lib/api/django-proxy'

export async function POST(request: Request) {
  return proxyToDjango(request, '/api/users/token/refresh/')
}
