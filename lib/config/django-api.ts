/**
 * Django API Configuration
 * Central configuration for Django backend communication
 */

export const DJANGO_API_URL =
  process.env.NEXT_PUBLIC_DJANGO_API_URL ||
  process.env.DJANGO_API_URL ||
  "http://127.0.0.1:8000";
// Toggle whether the frontend should rewrite backend absolute URLs to same-origin proxy paths.
// Set NEXT_PUBLIC_USE_PROXY=1 in environment to enable proxy rewriting.
export const NEXT_PUBLIC_USE_PROXY =
  (process.env.NEXT_PUBLIC_USE_PROXY || "0") === "1";

export const DJANGO_ENDPOINTS = {
  // Auth endpoints
  auth: {
    register: `${DJANGO_API_URL}/api/users/register/`,
    login: `${DJANGO_API_URL}/api/users/token/`,
    refresh: `${DJANGO_API_URL}/api/users/token/refresh/`,
    logout: `${DJANGO_API_URL}/api/users/logout/`,
    me: `${DJANGO_API_URL}/api/users/me/`,
    checkEmail: `${DJANGO_API_URL}/api/users/check-email/`,
    requestEmailVerification: `${DJANGO_API_URL}/api/users/email-verification/request/`,
    confirmEmailVerification: `${DJANGO_API_URL}/api/users/email-verification/confirm/`,
  },

  // User management endpoints
  users: {
    list: `${DJANGO_API_URL}/api/users/manage/`,
    create: `${DJANGO_API_URL}/api/users/manage/`,
    detail: (id: string) => `${DJANGO_API_URL}/api/users/manage/${id}/`,
    update: (id: string) => `${DJANGO_API_URL}/api/users/manage/${id}/`,
  },

  // License endpoints
  licenses: {
    list: `${DJANGO_API_URL}/api/licenses/`,
    create: `${DJANGO_API_URL}/api/licenses/`,
    detail: (id: string) => `${DJANGO_API_URL}/api/licenses/${id}/`,
    update: (id: string) => `${DJANGO_API_URL}/api/licenses/${id}/`,
    renew: (id: string) => `${DJANGO_API_URL}/api/licenses/${id}/renew/`,
    verify: `${DJANGO_API_URL}/api/licenses/verify/`,
    qr: `${DJANGO_API_URL}/api/licenses/qr/`,
    download: (id: string) => `${DJANGO_API_URL}/api/licenses/download/${id}/`,
    renewalsList: `${DJANGO_API_URL}/api/licenses/renewals/`,
    renewalApprove: (id: string) => `${DJANGO_API_URL}/api/licenses/renewals/${id}/approve/`,
    renewalReject: (id: string) => `${DJANGO_API_URL}/api/licenses/renewals/${id}/reject/`,
  },

  // Application endpoints
  applications: {
    list: `${DJANGO_API_URL}/api/applications/`,
    create: `${DJANGO_API_URL}/api/applications/`,
    detail: (id: string) => `${DJANGO_API_URL}/api/applications/${id}/`,
    update: (id: string) => `${DJANGO_API_URL}/api/applications/${id}/`,
    getLicense: (id: string) => `${DJANGO_API_URL}/api/applications/${id}/license/`,
    approve: (id: string) =>
      `${DJANGO_API_URL}/api/applications/${id}/approve/`,
    reject: (id: string) => `${DJANGO_API_URL}/api/applications/${id}/reject/`,
    requestInfo: (id: string) =>
      `${DJANGO_API_URL}/api/applications/${id}/request_info/`,
    downloadDocuments: (id: string) =>
      `${DJANGO_API_URL}/api/applications/${id}/download_documents/`,
    verifyDocuments: (id: string) =>
      `${DJANGO_API_URL}/api/applications/${id}/verify_documents/`,
    stats: `${DJANGO_API_URL}/api/applications/stats/`,
  },

  // Document endpoints
  documents: {
    list: `${DJANGO_API_URL}/api/documents/`,
    upload: `${DJANGO_API_URL}/api/documents/upload/`,
    delete: (id: string) => `${DJANGO_API_URL}/api/documents/${id}/`,
    verify: (id: string) => `${DJANGO_API_URL}/api/documents/${id}/verify/`,
  },

  // Partnership endpoints
  partnerships: {
    list: `${DJANGO_API_URL}/api/partnerships/`,
    create: `${DJANGO_API_URL}/api/partnerships/create/`,
    detail: (id: string) => `${DJANGO_API_URL}/api/partnerships/${id}/`,
    confirm: (id: string) => `${DJANGO_API_URL}/api/partnerships/${id}/confirm/`,
    approve: (id: string) => `${DJANGO_API_URL}/api/partnerships/${id}/approve/`,
    reject: (id: string) => `${DJANGO_API_URL}/api/partnerships/${id}/reject/`,
    uploadDocument: (id: string) => `${DJANGO_API_URL}/api/partnerships/${id}/upload_document/`,
    pending: `${DJANGO_API_URL}/api/partnerships/pending/`,
    active: `${DJANGO_API_URL}/api/partnerships/active/`,
    public: (id: string) => `${DJANGO_API_URL}/api/partnerships/${id}/public/`,
    verify: (id: string) => `${DJANGO_API_URL}/api/partnerships/verify/${id}/`,
    verifyCert: (cert: string) => `${DJANGO_API_URL}/api/partnerships/verify-cert/${encodeURIComponent(cert)}/`,
  },
  
  // Payment endpoints
  payments: {
    list: `${DJANGO_API_URL}/api/payments/`,
    create: `${DJANGO_API_URL}/api/payments/`,
    detail: (id: string) => `${DJANGO_API_URL}/api/payments/${id}/`,
    update: (id: string) => `${DJANGO_API_URL}/api/payments/${id}/`,
  },

  // Vehicle endpoints
  vehicles: {
    list: `${DJANGO_API_URL}/api/vehicles/`,
    create: `${DJANGO_API_URL}/api/vehicles/`,
    detail: (id: string) => `${DJANGO_API_URL}/api/vehicles/${id}/`,
  },

  // Analytics endpoints
  analytics: {
    dashboard: `${DJANGO_API_URL}/api/stats/admin-dashboard/`,
    statistics: `${DJANGO_API_URL}/api/stats/`,
  },
  
  // Companies endpoints
  companies: {
    list: `${DJANGO_API_URL}/api/companies/`,
    create: `${DJANGO_API_URL}/api/companies/`,
    detail: (id: string) => `${DJANGO_API_URL}/api/companies/${id}/`,
    update: (id: string) => `${DJANGO_API_URL}/api/companies/${id}/`,
    delete: (id: string) => `${DJANGO_API_URL}/api/companies/${id}/`,
  },
  
  // System settings endpoints
  system: {
    settings: `${DJANGO_API_URL}/api/system/settings/`,
  },
};

/**
 * Get stored JWT tokens from localStorage
 */
export const getTokens = () => {
  if (typeof window === "undefined") return null;

  const tokens = localStorage.getItem("clms_tokens");
  if (!tokens) return null;

  try {
    return JSON.parse(tokens);
  } catch {
    return null;
  }
};

/**
 * Store JWT tokens in localStorage
 */
export const setTokens = (tokens: { access: string; refresh: string }) => {
  localStorage.setItem("clms_tokens", JSON.stringify(tokens));
};

/**
 * Clear stored tokens
 */
export const clearTokens = () => {
  localStorage.removeItem("clms_tokens");
};

/**
 * Make a Django API request with authentication
 */
export async function djangoApiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean; suppressLog?: boolean; responseType?: 'json' | 'blob' } = {},
): Promise<T> {
  const tokens = getTokens();
  const headers = new Headers(options.headers || {});

  // Add JWT token to Authorization header
  if (!options.skipAuth && tokens?.access) {
    headers.set("Authorization", `Bearer ${tokens.access}`);
  }

  if (!(options.body instanceof FormData)) {
    // Only set a default Content-Type when the caller hasn't specified one.
    // This allows callers to submit alternative encodings (e.g., x-www-form-urlencoded).
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  try {
    // If running in the browser and proxy rewriting is enabled, and the endpoint
    // points at the configured DJANGO_API_URL, rewrite to a same-origin path so
    // the Next.js API routes (proxy) can be used to avoid CORS in local/dev.
    // In production, keep NEXT_PUBLIC_USE_PROXY=0 to call the backend directly.
    if (
      typeof window !== "undefined" &&
      NEXT_PUBLIC_USE_PROXY &&
      endpoint.startsWith(DJANGO_API_URL)
    ) {
      try {
        const url = new URL(endpoint)
        const path = url.pathname || ""
        // Only rewrite API requests to same-origin proxy; leave media and other absolute URLs alone
        if (path.startsWith("/api/")) {
          endpoint = endpoint.replace(DJANGO_API_URL, "")
          // eslint-disable-next-line no-console
          console.debug("[clms] djangoApiRequest rewrote endpoint to use proxy:", endpoint)
        }
      } catch (e) {
        /* ignore */
      }
    }

    let response = await fetch(endpoint, {
      ...options,
      cache: "no-store",
      headers,
    });

    // Handle redirects (some dev servers may respond with 308/301 to normalize paths)
    if (response.status >= 300 && response.status < 400) {
      const loc = response.headers.get("location");
      if (loc) {
        // Resolve relative locations
        let target = loc;
        try {
          const baseOrigin =
            typeof window !== "undefined" &&
            window.location &&
            window.location.origin
              ? window.location.origin
              : DJANGO_API_URL;
          const base = new URL(
            String(endpoint).startsWith("http")
              ? endpoint
              : baseOrigin + String(endpoint),
            baseOrigin,
          );
          target = new URL(loc, base).toString();
        } catch (e) {
          /* ignore */
        }
        const followResp = await fetch(target, { ...options, headers });
        if (!followResp.ok) {
          // let error handling below process it
          response = followResp;
        } else {
          if (options.responseType === 'blob') {
            return followResp.blob() as Promise<T>;
          }
          return followResp.json() as Promise<T>;
        }
      }
    }

    // Handle unauthorized (401) - refresh token and retry
    if (response.status === 401 && tokens?.refresh && !options.skipAuth) {
      const refreshed = await refreshAccessToken(tokens.refresh);
      if (refreshed) {
        // Retry original request with new token
        return djangoApiRequest<T>(endpoint, { ...options, skipAuth: false });
      }
    }

    if (options.responseType === 'blob') {
      if (response.ok) {
        return response.blob() as Promise<T>;
      }
      // If not ok, fall through to error handling which expects JSON or text
    }

      if (!response.ok) {
      const errorData = await response.json().catch(async () => {
        // fallback to text if json parsing fails
        const txt = await response.text().catch(() => "");
        return { detail: txt };
      });

      // Normalize message: backends may return {detail: ""} which is not useful
      let message = "";
      // Special-case 401: prefer backend-provided detail when available.
      // Keep the friendly "Invalid email or password" text for explicit token/login requests
      if (response.status === 401) {
        const endpointStr = String(endpoint || "");
        if (errorData && typeof errorData === 'object' && errorData.detail && String(errorData.detail).trim().length > 0) {
          // Use server-provided detail for clarity (useful for registration or protected endpoints)
          message = String(errorData.detail);
        } else if (endpointStr.includes('/token/') || endpointStr.endsWith('/login/') || endpointStr.endsWith('/auth/')) {
          // Keep the concise, user-friendly message for typical login/token endpoints
          message = "Invalid email or password. Try again.";
        } else {
          // Generic 401 fallback
          message = `Authentication failed (401)`;
        }
      } else {
        if (errorData && typeof errorData === "object") {
          // If the backend provided a non-empty `detail`, prefer it
          if (errorData.detail && String(errorData.detail).trim().length > 0) {
            message = String(errorData.detail);
          } else {
            // Determine if the object has any meaningful (non-empty) fields
            const nonEmpty = Object.entries(errorData).some(([k, v]) => {
              if (v === null || v === undefined) return false
              if (typeof v === 'string') return String(v).trim().length > 0
              if (Array.isArray(v)) return v.length > 0
              if (typeof v === 'object') return Object.keys(v).length > 0
              return true
            })
            if (nonEmpty) {
              // Prefer a readable JSON string when there is useful content
              try {
                message = JSON.stringify(errorData)
              } catch (e) {
                message = String(errorData)
              }
            }
          }
        }
        if (!message) {
          // fallback to status text or generic message
          message = `API Error: ${response.status} ${response.statusText || ""}`.trim();
        }
      }

      // Ensure errorData.detail is populated for UI consumption
      try {
        if (!errorData || typeof errorData !== "object") {
          (errorData as any) = { detail: message };
        } else if (!errorData.detail || String(errorData.detail).trim().length === 0) {
          // Avoid setting detail to an empty JSON string like '{"detail":""}'.
          (errorData as any).detail = message;
        }
      } catch (e) {
        /* ignore */
      }

      // For authentication failures, throw an Error instance with an
      // `.error.detail` property so callers can inspect the backend message
      // without causing Fast Refresh to treat a thrown non-Error as a runtime
      // overlay. Consumers may still check `err.status` and `err.error.detail`.
      if (response.status === 401) {
        const authErr: any = new Error(message);
        authErr.status = response.status;
        authErr.error = { detail: message };
        try {
          authErr.endpoint = endpoint;
        } catch {}
        throw authErr;
      }

      const error: any = new Error(message);
      error.status = response.status;
      error.error = errorData;
      // attach endpoint for easier debugging
      try {
        (error as any).endpoint = endpoint;
      } catch {}
      // debug log: avoid printing sensitive/verbose bodies for auth failures
        if (!options.suppressLog) {
          if (response.status === 404) {
            console.debug("[clms][djangoApiRequest] Resource not found (404)", {
            endpoint,
            body: errorData,
          });
          } else if (response.status === 401) {
            console.debug("[clms][djangoApiRequest] Authentication failed (401)", { endpoint });
          } else {
            // eslint-disable-next-line no-console
            console.debug("[clms][djangoApiRequest] API error", {
            endpoint,
            status: response.status,
            body: errorData,
          });
        }
      }
      throw error;
    }

    return response.json() as Promise<T>;
  } catch (error) {
    // Network-level failures (e.g. DNS, connection refused) often surface as TypeError: "Failed to fetch".
    try {
      const asString = String(error || "");
      if (error instanceof TypeError || /failed to fetch/i.test(asString)) {
        const msg = `Network error: could not reach backend at ${DJANGO_API_URL}. Is the Django server running and reachable?`;
        const e: any = new Error(msg);
        e.status = 0;
        e.error = { detail: msg };
        try {
          e.endpoint = endpoint;
        } catch (e2) {}
        if (!options.suppressLog)
          console.error("[clms] Django API network error:", e?.message || (e && JSON.stringify(e)) || e);
        throw e;
      }
    } catch (ne) {
      // ignore and continue to normalization
    }

    // Normalize any other thrown error so callers always receive an object with a non-empty `error.detail`.
    try {
      const errAny: any = error || {};
      const candidateDetail =
        (errAny?.error?.detail && String(errAny.error.detail).trim()) ||
        (errAny?.message && String(errAny.message).trim()) ||
        "";
      if (!candidateDetail) {
        const msg =
          `API Error: ${errAny?.status || "network"} ${errAny?.statusText || ""}`.trim();
        const e: any = new Error(msg);
        e.status = errAny?.status || 0;
        e.error = { detail: msg };
        try {
          e.endpoint = endpoint;
        } catch (e2) {}
        if (!options.suppressLog)
          console.error("[clms] Django API normalized error:", e?.message || (e && JSON.stringify(e)) || e);
        throw e;
      }
    } catch (e) {
      // if normalization failed, fall back to throwing the original error
      if (!options.suppressLog)
        console.error("[clms] Django API error (normalization failed):", error);
      throw error;
    }

    if (!options.suppressLog) {
      if ((error as any)?.status === 404) {
        // 404s are common and usually handled by UI; keep as debug/warn to avoid console noise
        console.debug("[clms] Django API 404 (Not Found):", (error as any)?.message || error);
      } else if ((error as any)?.status === 401) {
        // Authentication failures are expected during login attempts — log as debug only
        console.debug("[clms] Django API auth failure:", (error as any)?.error?.detail || (error as any)?.message || "401");
      } else {
        console.error("[clms] Django API error:", (error as any)?.message || (error && JSON.stringify(error)) || error);
      }
    }
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<boolean> {
  try {
    const response = await fetch(DJANGO_ENDPOINTS.auth.refresh, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const data = await response.json();
    setTokens({ access: data.access, refresh: refreshToken });
    return true;
  } catch (error) {
    console.error("[clms] Token refresh failed:", error);
    clearTokens();
    return false;
  }
}
