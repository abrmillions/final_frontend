import { type NextRequest } from "next/server";
import { proxyToDjango } from "@/lib/api/django-proxy";

export async function POST(request: NextRequest) {
  return proxyToDjango(request, "/api/documents/upload/");
}
