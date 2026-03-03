import { NextRequest } from "next/server"
import { proxyToDjango } from "@/lib/api/django-proxy"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  return proxyToDjango(request, url.pathname)
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url)
  return proxyToDjango(request, url.pathname)
}

export async function PUT(request: NextRequest) {
  const url = new URL(request.url)
  return proxyToDjango(request, url.pathname)
}

export async function PATCH(request: NextRequest) {
  const url = new URL(request.url)
  return proxyToDjango(request, url.pathname)
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url)
  return proxyToDjango(request, url.pathname)
}
