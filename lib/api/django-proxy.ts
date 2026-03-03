import { NextResponse } from "next/server";
import { DJANGO_API_URL } from "@/lib/config/django-api";

async function copyHeadersToObject(headers: Headers) {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function proxyToDjango(request: Request, djangoPath: string) {
  // Build target URL preserving query string
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(djangoPath, DJANGO_API_URL);
  targetUrl.search = incomingUrl.search;

  // Logging: incoming request summary
  try {
    // eslint-disable-next-line no-console
    console.debug(
      "[proxy] Incoming",
      request.method,
      incomingUrl.pathname + incomingUrl.search,
    );
    const headerObj: Record<string, string> = {};
    for (const [k, v] of request.headers) headerObj[k] = v;
    // eslint-disable-next-line no-console
    console.debug("[proxy] Incoming headers", headerObj);
  } catch (e) {
    /* ignore logging errors */
  }

  const forwardHeaders: Record<string, string> = {};
  // copy headers, but let fetch set host
  for (const [k, v] of request.headers) {
    if (k.toLowerCase() === "host") continue;
    forwardHeaders[k] = v;
  }

  const method = (request.method || "GET").toUpperCase();
  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const init: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    redirect: "manual",
  };

  if (hasBody) {
    // stream the body
    const buf = await request.arrayBuffer().catch(() => null);
    if (buf) {
      init.body = buf;
      try {
        // log body size and a short preview (if text)
        const textPreview = new TextDecoder().decode(buf.slice(0, 1024));
        // eslint-disable-next-line no-console
        console.debug("[proxy] Forwarding body (bytes):", buf.byteLength);
        // eslint-disable-next-line no-console
        console.debug("[proxy] Body preview:", textPreview);
      } catch (_) {
        // ignore decode errors
      }
    }
  }

  // eslint-disable-next-line no-console
  console.debug("[proxy] Forwarding to", targetUrl.toString());

  const res = await fetch(targetUrl.toString(), init);

  const bodyBuffer = await res.arrayBuffer().catch(() => new ArrayBuffer(0));
  const respHeaders = await copyHeadersToObject(res.headers);

  // Try to decode body for logging and to ensure content-type
  let bodyText = "";
  try {
    bodyText = new TextDecoder().decode(bodyBuffer);
  } catch (e) {
    bodyText = "";
  }

  // Remove hop-by-hop and content-encoding headers to avoid double-decompression in the browser
  const forbidden = [
    "transfer-encoding",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "content-encoding",
  ];
  for (const h of forbidden) {
    if (respHeaders[h]) delete respHeaders[h];
  }

  // Ensure content-type for JSON payloads so client.json() parses correctly
  if (
    (!respHeaders["content-type"] ||
      respHeaders["content-type"].trim() === "") &&
    bodyText.trim().startsWith("{")
  ) {
    respHeaders["content-type"] = "application/json; charset=utf-8";
  }

  // Ensure content-length is accurate
  try {
    respHeaders["content-length"] = String(
      (bodyBuffer && bodyBuffer.byteLength) || 0,
    );
  } catch (e) {
    /* ignore */
  }

  // eslint-disable-next-line no-console
  console.debug("[proxy] Received from Django", {
    status: res.status,
    headers: respHeaders,
    bodyText: bodyText.slice(0, 2000),
  });

  return new NextResponse(new Uint8Array(bodyBuffer), {
    status: res.status,
    headers: respHeaders,
  });
}

export default proxyToDjango;
