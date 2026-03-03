import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(request: Request) {
  return proxyToDjango(request, '/api/admin/users/')
}

export async function PATCH(request: Request) {
  return proxyToDjango(request, '/api/admin/users/')
}

export async function DELETE(request: Request) {
  return proxyToDjango(request, '/api/admin/users/')
}
