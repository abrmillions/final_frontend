import { type NextRequest } from 'next/server'
import { proxyToDjango } from '@/lib/api/django-proxy'

export async function GET(request: NextRequest) {
  return proxyToDjango(request, '/api/users/google/callback/')
}

export async function POST(request: NextRequest) {
  return proxyToDjango(request, '/api/users/google/callback/')
}
