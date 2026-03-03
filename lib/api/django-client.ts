// High-level axios-free utilities removed in favor of `djangoApiRequest`
/**
 * Django API Client Utilities
 * High-level functions for common API operations
 */

import { djangoApiRequest, DJANGO_ENDPOINTS, DJANGO_API_URL, NEXT_PUBLIC_USE_PROXY, getTokens, setTokens, clearTokens } from '@/lib/config/django-api'
import type { Partnership } from '@/lib/types/partnership'

// Auth APIs
export const authApi = {
  register: async (data: any) => {
    // Create the user then immediately obtain tokens by logging in
    // Normalize payload to support multiple backend field conventions
    const payload: any = {
      email: data.email,
      username: data.username || data.email,
      password: data.password,
      // include both common variations for confirm password
      password_confirm: data.password_confirm || data.confirmPassword || data.password_confirm || data.passwordConfirm,
      confirmPassword: data.confirmPassword || data.password_confirm || data.passwordConfirm || data.password_confirm,
      // include both name variations
      first_name: data.first_name || data.firstName || data.fullName || data.fullname,
      fullName: data.fullName || data.first_name || data.firstName || data.fullname,
      phone: data.phone,
      role: data.role || data.accountType || data.type || 'applicant',
    }

    try {
      const user = await djangoApiRequest(`${DJANGO_ENDPOINTS.auth.register}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
        suppressLog: true,
      })

      try {
        // Use form-encoded to maximize compatibility
        const formBody = new URLSearchParams({ email: data.email, username: data.email, password: data.password }).toString()
        const direct = await fetch(DJANGO_ENDPOINTS.auth.login, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: formBody,
        })
        if (!direct.ok) {
          throw new Error(`Login after register failed with ${direct.status}`)
        }
        const tokens = await direct.json()
        setTokens(tokens)
        try {
          const u = await djangoApiRequest(DJANGO_ENDPOINTS.auth.me)
          const mappedUser = {
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            phone: u.phone,
            profilePhoto: u.profile_photo ? (u.profile_photo.startsWith('http') ? u.profile_photo : `${DJANGO_API_URL}${u.profile_photo}`) : null,
            role: u.is_staff ? 'Admin' : 'User',
          }
          if (typeof window !== 'undefined') localStorage.setItem('clms_user', JSON.stringify(mappedUser))
        } catch (e) {
          console.warn('[clms] Failed to fetch user after register:', e)
        }
      } catch (e) {
        console.warn('[clms] Login after register failed:', e)
      }
      return user
    } catch (err: any) {
      // If the account already exists, attempt login automatically
      const dupEmail = !!(err?.error && (JSON.stringify(err.error).toLowerCase().includes('already exists')))
      if (dupEmail) {
        try {
          const formBody = new URLSearchParams({ email: data.email, username: data.email, password: data.password }).toString()
          const direct = await fetch(DJANGO_ENDPOINTS.auth.login, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: formBody,
          })
          if (!direct.ok) {
            throw new Error(`Login after duplicate register failed with ${direct.status}`)
          }
          const tokens = await direct.json()
          setTokens(tokens)
          try {
            const u = await djangoApiRequest(DJANGO_ENDPOINTS.auth.me)
            const mappedUser = {
              id: u.id,
              email: u.email,
              firstName: u.first_name,
              lastName: u.last_name,
              fullName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
              phone: u.phone,
              profilePhoto: u.profile_photo ? (u.profile_photo.startsWith('http') ? u.profile_photo : `${DJANGO_API_URL}${u.profile_photo}`) : null,
              role: u.is_staff ? 'Admin' : 'User',
            }
            if (typeof window !== 'undefined') localStorage.setItem('clms_user', JSON.stringify(mappedUser))
          } catch (e) {
            /* ignore */
          }
          // Return a minimal object indicating login succeeded
          return { login: 'ok' }
        } catch (loginErr: any) {
          // Provide a cleaner message when login fails after duplicate registration
          const e: any = new Error('Account already exists. Please sign in with your password.')
          e.status = loginErr?.status || 400
          e.error = { detail: 'Account already exists. Please sign in with your password.' }
          throw e
        }
      }
      throw err
    }
  },

  login: async (email: string, password: string) => {
    // Prefer form-encoded for maximum compatibility with diverse deployments
    let response: { access: string; refresh: string }
    try {
      const formBody = new URLSearchParams({ email, username: email, password }).toString()
      const direct = await fetch(DJANGO_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formBody,
      })
      if (!direct.ok) {
        const data = await direct.text().catch(() => '')
        const err: any = new Error(`API Error: ${direct.status} ${direct.statusText}`)
        err.status = direct.status
        err.error = { detail: data || 'Login failed' }
        throw err
      }
      response = await direct.json()
    } catch (e: any) {
      const status = e?.status || 0
      const msg = String(e?.message || '')
      const isNetworkFail = /failed to fetch/i.test(msg) || e?.name === 'TypeError'
      const shouldFallback =
        (typeof window !== 'undefined') &&
        (isNetworkFail || status === 404 || status === 405 || status === 415 || status === 400)
      if (shouldFallback) {
        // Fallback 1: same-origin proxy with JSON
        const payload = JSON.stringify({ email, username: email, password })
        try {
          response = await djangoApiRequest<{ access: string; refresh: string }>(
            '/api/users/token/',
            {
              method: 'POST',
              body: payload,
              skipAuth: true,
            },
          )
        } catch (e2: any) {
          // Fallback 2: direct JSON to backend
          try {
            const direct = await fetch(DJANGO_ENDPOINTS.auth.login, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: payload,
            })
            if (!direct.ok) {
              const data = await direct.text().catch(() => '')
              const err: any = new Error(`API Error: ${direct.status} ${direct.statusText}`)
              err.status = direct.status
              err.error = { detail: data || 'Login failed' }
              throw err
            }
            response = await direct.json()
          } catch (e3) {
            // Final fallback 3: same-origin proxy with form-encoded
            const formBody = new URLSearchParams({ email, username: email, password }).toString()
            response = await djangoApiRequest<{ access: string; refresh: string }>(
              '/api/users/token/',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody,
                skipAuth: true,
                suppressLog: true,
              },
            )
          }
        }
      } else {
        throw e
      }
    }

    // Debug: log token response for troubleshooting login issues
    try {
      // avoid leaking tokens in production logs; this is temporary
      // eslint-disable-next-line no-console
      console.debug('[clms][authApi] login token response:', response)
    } catch (e) {
      /* ignore logging errors */
    }

    // Store tokens
    setTokens(response)
    // Kick off background fetch for current user; do NOT block login completion
    ;(async () => {
      try {
        const user = await djangoApiRequest(DJANGO_ENDPOINTS.auth.me)
        const mappedUser = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
          phone: user.phone,
          profilePhoto: user.profile_photo ? (user.profile_photo.startsWith('http') ? user.profile_photo : `${DJANGO_API_URL}${user.profile_photo}`) : null,
          role: user.is_staff ? 'Admin' : 'User',
        }
        if (typeof window !== 'undefined') localStorage.setItem('clms_user', JSON.stringify(mappedUser))
      } catch (e) {
        // ignore background error
      }
    })()
    return response
  },

  getCurrentUser: async () => {
    return djangoApiRequest(DJANGO_ENDPOINTS.auth.me)
  },

  checkEmail: async (email: string) => {
    const url = `${DJANGO_ENDPOINTS.auth.checkEmail}?email=${encodeURIComponent(email)}`
    return djangoApiRequest(url, { skipAuth: true })
  },

  requestEmailVerification: async (email: string, frontendUrl?: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.auth.requestEmailVerification, {
      method: 'POST',
      body: JSON.stringify({ email, frontend_url: frontendUrl }),
      skipAuth: true,
    })
  },

  confirmEmailVerification: async (uid: string, token: string) => {
    const url = `${DJANGO_ENDPOINTS.auth.confirmEmailVerification}?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`
    return djangoApiRequest(url, { method: 'POST', skipAuth: true })
  },

  logout: async () => {
    // Send refresh token to backend to blacklist it, then clear tokens locally.
    // If there are no tokens, just clear any stale user/session data without
    // calling the backend.
    const tokens = getTokens()
    try {
      if (tokens?.refresh) {
        await djangoApiRequest(DJANGO_ENDPOINTS.auth.logout, {
          method: 'POST',
          body: JSON.stringify({ refresh: tokens.refresh }),
          // Use normal auth header so backends that require authentication
          // on logout (IsAuthenticated) work correctly.
          skipAuth: false,
          suppressLog: true,
        })
      }
    } catch (error: any) {
      // If logout fails due to missing/invalid credentials, treat it as
      // already-logged-out and continue clearing local state.
      // Swallow errors to avoid noisy overlays/logs in dev
    } finally {
      clearTokens()
      if (typeof window !== 'undefined') localStorage.removeItem('clms_user')
    }
  },

  updateProfile: async (data: any) => {
    let body = data;
    if (data.profile_photo instanceof File) {
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });
        body = formData;
    } else {
        body = JSON.stringify(data);
    }
    
    return djangoApiRequest(DJANGO_ENDPOINTS.auth.me, {
      method: 'PATCH',
      body: body,
    })
  },

  changePassword: async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    return djangoApiRequest(`${DJANGO_ENDPOINTS.auth.login.replace('/token/', '/change_password/')}`, {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      }),
    })
  },
}

// User Management APIs (Admin)
export const usersApi = {
  list: async (filters?: Record<string, any>) => {
    const query = new URLSearchParams(filters).toString()
    try {
      return await djangoApiRequest(`${DJANGO_ENDPOINTS.users.list}?${query}`)
    } catch (e: any) {
      if (e?.status === 404) {
        return []
      }
      throw e
    }
  },

  getDetail: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.users.detail(id))
  },

  create: async (data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.users.create, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    if (!id || String(id).trim() === '' || String(id).toLowerCase() === 'undefined') {
      const e: any = new Error('Invalid user id for update')
      e.status = 400
      e.error = { detail: 'Invalid user id for update' }
      throw e
    }
    // Support multipart when updating profile photo
    const hasFile =
      data &&
      (data.profile_photo instanceof File ||
        Object.values(data).some((v) => v instanceof File))
    if (hasFile) {
      const fd = new FormData()
      Object.keys(data || {}).forEach((key) => {
        const val = (data as any)[key]
        if (val instanceof File) {
          fd.append(key, val)
        } else if (typeof val === 'object' && val !== null) {
          fd.append(key, JSON.stringify(val))
        } else if (val !== undefined && val !== null) {
          fd.append(key, String(val))
        }
      })
      try {
        return await djangoApiRequest(DJANGO_ENDPOINTS.users.update(id), {
          method: 'PATCH',
          body: fd,
          suppressLog: true,
        })
      } catch (e: any) {
        const msg =
          (e?.error?.detail && String(e.error.detail).trim()) ||
          (e?.message && String(e.message).trim()) ||
          'Failed to update user'
        const ne: any = new Error(msg)
        ne.status = e?.status || 0
        ne.error = { detail: msg }
        throw ne
      }
    }
    try {
      return await djangoApiRequest(DJANGO_ENDPOINTS.users.update(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
        suppressLog: true,
      })
    } catch (e: any) {
      // Fallback: if running in browser, explicitly hit same-origin proxy path
      const status = e?.status || 0
      const isBrowser = typeof window !== 'undefined'
      if (isBrowser && (status === 404 || status === 405)) {
        try {
          return await djangoApiRequest(`/api/users/manage/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
            suppressLog: true,
          })
        } catch (e2: any) {
          const msg2 =
            (e2?.error?.detail && String(e2.error.detail).trim()) ||
            (e2?.message && String(e2.message).trim()) ||
            'Failed to update user'
          const ne2: any = new Error(msg2)
          ne2.status = e2?.status || 0
          ne2.error = { detail: msg2 }
          throw ne2
        }
      }
      const msg =
        (e?.error?.detail && String(e.error.detail).trim()) ||
        (e?.message && String(e.message).trim()) ||
        'Failed to update user'
      const ne: any = new Error(msg)
      ne.status = e?.status || 0
      ne.error = { detail: msg }
      throw ne
    }
  },

  delete: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.users.detail(id), {
      method: 'DELETE',
    })
  },
}


// License APIs
export const licensesApi = {
  list: async (filters?: Record<string, any>) => {
    const query = new URLSearchParams(filters).toString()
    return djangoApiRequest(`${DJANGO_ENDPOINTS.licenses.list}?${query}`)
  },

  getDetail: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.detail(id))
  },

  // Backwards-compatible alias: getLicense
  getLicense: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.detail(id))
  },

  create: async (data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.create, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.update(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  renew: async (id: string, data: any) => {
    try {
      return await djangoApiRequest(DJANGO_ENDPOINTS.licenses.renew(id), {
        method: 'POST',
        body: JSON.stringify(data),
        suppressLog: true,
      })
    } catch (e: any) {
      const msg =
        (e?.error?.detail && String(e.error.detail).trim()) ||
        (e?.message && String(e.message).trim()) ||
        'Failed to start renewal'
      // Graceful fallback: if renewal application already exists, locate it and return a compatible shape
      try {
        const isActiveExisting =
          /already have an active application/i.test(msg) ||
          /active application/i.test(msg)
        if (isActiveExisting) {
          // Try renewals list first
          try {
            const renewals = await djangoApiRequest<any[]>(DJANGO_ENDPOINTS.licenses.renewalsList, { suppressLog: true })
            const match = (renewals || []).find((r: any) => {
              const licId =
                String(r?.license_id || r?.licenseId || r?.license?.id || '').trim()
              return licId && String(licId) === String(id)
            })
            const appId = String(match?.application_id || match?.applicationId || match?.application?.id || '')
            if (appId) {
              return { id: appId, application: { id: appId } }
            }
          } catch {}
          // Fallback: scan applications list
          try {
            const apps = await djangoApiRequest<any[]>(DJANGO_ENDPOINTS.applications.list, { suppressLog: true })
            const candidate = (apps || []).find((a: any) => {
              const licId =
                String(a?.license_id || a?.licenseId || a?.license?.id || a?.data?.license_id || '').trim()
              const status = String(a?.status || a?.state || '').toLowerCase()
              const kind = String(a?.type || a?.category || a?.purpose || '').toLowerCase()
              const looksRenewal = kind.includes('renew')
              const pendingish = !status || ['pending', 'in_progress', 'active', 'open'].includes(status)
              return licId && String(licId) === String(id) && (looksRenewal || pendingish)
            })
            const appId = String(candidate?.id || candidate?.application?.id || '')
            if (appId) {
              return { id: appId, application: { id: appId } }
            }
          } catch {}
        }
      } catch {}
      const ne: any = new Error(msg)
      ne.status = e?.status || 0
      ne.error = { detail: msg }
      throw ne
    }
  },
  
  listRenewals: async () => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.renewalsList)
  },
  approveRenewal: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.renewalApprove(id), { method: 'PATCH' })
  },
  rejectRenewal: async (id: string, reason?: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.renewalReject(id), { method: 'PATCH', body: JSON.stringify({ reason }) })
  },

  verify: async (licenseNumber: string) => {
    return djangoApiRequest(`${DJANGO_ENDPOINTS.licenses.verify}?license_number=${licenseNumber}`)
  },

  generateQrData: async (licenseId: string, frontendUrl?: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.qr, {
      method: 'POST',
      body: JSON.stringify({ license_id: licenseId, frontend_url: frontendUrl }),
    })
  },
  
  download: async (id: string) => {
    try {
      return await djangoApiRequest(DJANGO_ENDPOINTS.licenses.download(id), { suppressLog: true })
    } catch (e: any) {
      // Normalize error so callers get a clear message
      const msg = (e?.error?.detail && String(e.error.detail).trim()) || (e?.message && String(e.message).trim()) || `License download failed (${e?.status || 'error'})`
      const ne: any = new Error(msg)
      ne.status = e?.status || 0
      ne.error = { detail: msg }
      throw ne
    }
  },
}

// Application APIs
export const applicationsApi = {
  list: async (filters?: Record<string, any>) => {
    const query = new URLSearchParams(filters).toString()
    return djangoApiRequest(`${DJANGO_ENDPOINTS.applications.list}?${query}`)
  },
  
  getLicense: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.applications.getLicense(id))
  },

  getDetail: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.applications.detail(id))
  },

  create: async (data: any) => {
    // If any photo fields are File objects, submit as multipart/form-data
    const photoKeys = ['profile_photo', 'professional_photo', 'lead_representative_photo', 'company_representative_photo']
    const hasFile = photoKeys.some(k => data && data[k] instanceof File)
    if (hasFile) {
      const fd = new FormData()
      // Append all keys; if value is object (like data JSON) stringify it
      Object.keys(data || {}).forEach(key => {
        const val = (data as any)[key]
        if (val instanceof File) {
          fd.append(key, val)
        } else if (typeof val === 'object') {
          fd.append(key, JSON.stringify(val))
        } else if (val !== undefined && val !== null) {
          fd.append(key, String(val))
        }
      })
      try {
        return await djangoApiRequest(DJANGO_ENDPOINTS.applications.create, {
          method: 'POST',
          body: fd,
          headers: {
            // Let the browser set Content-Type for FormData
          },
          suppressLog: true,
        })
      } catch (e: any) {
        const status = e?.status || 0
        if (status === 405) {
          // Fallback to same-origin proxy path explicitly
          return await djangoApiRequest('/api/applications/', {
            method: 'POST',
            body: fd,
            headers: {},
            suppressLog: true,
          })
        }
        throw e
      }
    }

    try {
      return await djangoApiRequest(DJANGO_ENDPOINTS.applications.create, {
        method: 'POST',
        body: JSON.stringify(data),
        suppressLog: true,
      })
    } catch (e: any) {
      const status = e?.status || 0
      if (status === 405) {
        return await djangoApiRequest('/api/applications/', {
          method: 'POST',
          body: JSON.stringify(data),
          suppressLog: true,
        })
      }
      throw e
    }
  },

  update: async (id: string, data: any) => {
    // Support multipart when updating photos
    const photoKeys = ['profile_photo', 'professional_photo', 'lead_representative_photo', 'company_representative_photo']
    const hasFile = photoKeys.some(k => data && data[k] instanceof File)
    if (hasFile) {
      const fd = new FormData()
      Object.keys(data || {}).forEach(key => {
        const val = (data as any)[key]
        if (val instanceof File) fd.append(key, val)
        else if (typeof val === 'object') fd.append(key, JSON.stringify(val))
        else if (val !== undefined && val !== null) fd.append(key, String(val))
      })
      return djangoApiRequest(DJANGO_ENDPOINTS.applications.update(id), {
        method: 'PATCH',
        body: fd,
      })
    }

    return djangoApiRequest(DJANGO_ENDPOINTS.applications.update(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  approve: async (id: string) => {
    try {
      return await djangoApiRequest(DJANGO_ENDPOINTS.applications.approve(id), {
        method: 'POST',
        suppressLog: true,
      })
    } catch (e: any) {
      const msg =
        (e?.error?.detail && String(e.error.detail).trim()) ||
        (e?.message && String(e.message).trim()) ||
        "Failed to approve application."
      const ne: any = new Error(msg)
      ne.status = e?.status || 0
      ne.error = { detail: msg }
      throw ne
    }
  },

  reject: async (id: string, reason: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.applications.reject(id), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  requestInfo: async (id: string, infoNeeded: string[]) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.applications.requestInfo(id), {
      method: 'POST',
      body: JSON.stringify({ info_needed: infoNeeded }),
    })
  },

  downloadDocuments: async (id: string) => {
    try {
      const endpoint =
        typeof window !== 'undefined'
          ? `/api/applications/${id}/download_documents/`
          : DJANGO_ENDPOINTS.applications.downloadDocuments(id)
      const blob = await djangoApiRequest<Blob>(endpoint, {
        method: 'GET',
        responseType: 'blob',
      })
      try {
        const size = (blob as any).size ?? 0
        if (!size) {
          const ne: any = new Error('Documents download returned empty file.')
          ne.status = 0
          ne.error = { detail: 'Empty ZIP returned' }
          throw ne
        }
      } catch {
        /* ignore size check errors */
      }
      return blob
    } catch (e: any) {
      // If backend returned a structured error (e.error.detail), convert it
      // into a JSON blob so UI callers that expect a blob can detect
      // and parse the error (checks for blob.type === 'application/json').
      const msg = (e?.error?.detail && String(e.error.detail).trim()) || (e?.message && String(e.message).trim()) || `Documents download failed (${e?.status || 'error'})`;
      const errorPayload = JSON.stringify({ detail: msg })
      const errorBlob = new Blob([errorPayload], { type: 'application/json' })
      // Attach status for downstream debugging if available
      try {
        ;(errorBlob as any).status = e?.status || 0
      } catch {}
      return errorBlob as unknown as Blob
    }
  },

  getStats: async () => {
    return djangoApiRequest(DJANGO_ENDPOINTS.applications.stats, { suppressLog: true })
  },
}


// Partnership APIs
export const partnershipsApi = {
  list: async (): Promise<Partnership[]> => {
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.list)
  },

  getDetail: async (id: string): Promise<Partnership> => {
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.detail(id))
  },

  create: async (data: any): Promise<Partnership> => {
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.create, {
      method: 'POST',
      body: JSON.stringify(data),
      suppressLog: true,
    })
  },

  confirm: async (id: string, action: 'accept' | 'reject'): Promise<Partnership> => {
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.confirm(id), {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
  },

  approve: async (id: string): Promise<Partnership> => {
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.approve(id), { method: 'POST' })
  },

  reject: async (id: string): Promise<Partnership> => {
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.reject(id), { method: 'POST' })
  },

  pending: async (): Promise<Partnership[]> => {
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.pending)
  },

  active: async (): Promise<Partnership[]> => {
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.active)
  },

  publicVerify: async (id: string): Promise<any> => {
    const raw = String(id || '').trim()
    const endpointPublic = DJANGO_ENDPOINTS.partnerships.public(raw)
    const endpointAlias = DJANGO_ENDPOINTS.partnerships.verify(raw)
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
      const isCertLike = /^CP-\d{4}-[A-Z0-9]{6}$/i.test(raw) || /^PCERT-/i.test(raw)
      if (!isUuid && isCertLike) {
        return await djangoApiRequest(DJANGO_ENDPOINTS.partnerships.verifyCert(raw), { skipAuth: true })
      }
      try {
        return await djangoApiRequest(endpointPublic, { skipAuth: true })
      } catch (errPublic: any) {
        // Fallback to alias endpoint if the public endpoint is unavailable
        return await djangoApiRequest(endpointAlias, { skipAuth: true })
      }
    } catch (e: any) {
      if (e?.status === 404) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)
        if (isUuid) {
          // Retry via alias endpoint for UUIDs
          try {
            return await djangoApiRequest(endpointAlias, { skipAuth: true })
          } catch {}
        } else {
          // Non-UUID: try certificate verification
          try {
            return await djangoApiRequest(DJANGO_ENDPOINTS.partnerships.verifyCert(raw), { skipAuth: true })
          } catch (certErr) {
            throw e
          }
        }
      }
      throw e
    }
  },

  uploadDocument: async (id: string, file: File, documentType?: string) => {
    const fd = new FormData()
    fd.append('file', file)
    if (documentType) fd.append('document_type', documentType)
    return djangoApiRequest(DJANGO_ENDPOINTS.partnerships.uploadDocument(id), {
      method: 'POST',
      body: fd,
      headers: {},
    })
  },
}

// Payment APIs
export const paymentsApi = {
  list: async () => {
    return djangoApiRequest(DJANGO_ENDPOINTS.payments.list)
  },
  create: async (data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.payments.create, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
  update: async (id: string, data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.payments.update(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

// Vehicle APIs
export const vehiclesApi = {
  list: async () => {
    return djangoApiRequest(DJANGO_ENDPOINTS.vehicles.list)
  },

  getDetail: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.vehicles.detail(id))
  },

  create: async (data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.vehicles.create, {
      method: 'POST',
      body: JSON.stringify(data),
      suppressLog: true,
    })
  },
  
  update: async (id: string, data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.vehicles.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
}

// Analytics APIs
export const analyticsApi = {
  getDashboard: async () => {
    return djangoApiRequest(DJANGO_ENDPOINTS.analytics.dashboard)
  },

  getStatistics: async () => {
    return djangoApiRequest(DJANGO_ENDPOINTS.analytics.statistics)
  },
}

export const applicationsApiEx = {
  verifyDocuments: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.applications.verifyDocuments(id), { method: 'POST' })
  },
}

// System Settings API
export const settingsApi = {
  get: async () => {
    const endpoint = typeof window !== 'undefined' ? '/api/system/settings/' : DJANGO_ENDPOINTS.system.settings
    const data = await djangoApiRequest(endpoint, { suppressLog: true })
    // Map snake_case to camelCase for UI
    return {
      systemName: data.system_name,
      supportEmail: data.support_email,
      supportPhone: data.support_phone,
      emailNotifications: data.email_notifications,
      smsNotifications: data.sms_notifications,
      autoApproval: data.auto_approval,
      maintenanceMode: data.maintenance_mode,
      documentVerificationEnabled: data.document_verification_enabled,
      sessionTimeout: data.session_timeout,
      maxLoginAttempts: data.max_login_attempts,
      passwordMinLength: data.password_min_length,
      smtpHost: data.smtp_host,
      smtpPort: data.smtp_port,
      smtpUser: data.smtp_user,
      smtpPassword: data.smtp_password,
      useTls: data.use_tls,
      notificationTemplate: data.notification_template,
      updatedAt: data.updated_at,
    }
  },

  update: async (settings: any) => {
    const endpoint = typeof window !== 'undefined' ? '/api/system/settings/' : DJANGO_ENDPOINTS.system.settings
    // Map camelCase to snake_case
    const payload = {
      system_name: settings.systemName,
      support_email: settings.supportEmail,
      support_phone: settings.supportPhone,
      email_notifications: settings.emailNotifications,
      sms_notifications: settings.smsNotifications,
      auto_approval: settings.autoApproval,
      maintenance_mode: settings.maintenanceMode,
      document_verification_enabled: settings.documentVerificationEnabled,
      session_timeout: settings.sessionTimeout,
      max_login_attempts: settings.maxLoginAttempts,
      password_min_length: settings.passwordMinLength,
      smtp_host: settings.smtpHost,
      smtp_port: settings.smtpPort,
      smtp_user: settings.smtpUser,
      smtp_password: settings.smtpPassword,
      openai_api_key: settings.openaiApiKey,
      use_tls: settings.useTls,
      notification_template: settings.notificationTemplate,
    }
    const data = await djangoApiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(payload), suppressLog: true })
    // return mapped
    return {
      systemName: data.system_name,
      supportEmail: data.support_email,
      supportPhone: data.support_phone,
      emailNotifications: data.email_notifications,
      smsNotifications: data.sms_notifications,
      autoApproval: data.auto_approval,
      maintenanceMode: data.maintenance_mode,
      sessionTimeout: data.session_timeout,
      maxLoginAttempts: data.max_login_attempts,
      passwordMinLength: data.password_min_length,
      smtpHost: data.smtp_host,
      smtpPort: data.smtp_port,
      smtpUser: data.smtp_user,
      smtpPassword: data.smtp_password,
      useTls: data.use_tls,
      notificationTemplate: data.notification_template,
      updatedAt: data.updated_at,
    }
  },
}

// Companies API
export const companiesApi = {
  list: async (filters?: Record<string, any>) => {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : ''
    return djangoApiRequest(`${DJANGO_ENDPOINTS.companies.list}${query}`)
  },
  getDetail: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.companies.detail(id))
  },
  create: async (data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.companies.create, {
      method: 'POST',
      body: JSON.stringify(data),
      suppressLog: true,
    })
  },
  update: async (id: string, data: any) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.companies.update(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },
  delete: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.companies.delete(id), {
      method: 'DELETE',
    })
  },
}

// Document APIs
export const documentsApi = {
  list: async (filters?: Record<string, any>) => {
    const query = new URLSearchParams(filters).toString()
    try {
      return await djangoApiRequest(`${DJANGO_ENDPOINTS.documents.list}?${query}`)
    } catch (e: any) {
      if (e?.status === 404) {
        return []
      }
      throw e
    }
  },

  upload: async (file: File, applicationId?: string, vehicleId?: string, name?: string, documentType?: string) => {
    const fd = new FormData()
    fd.append('file', file)
    if (applicationId) {
      fd.append('application', applicationId)
    }
    if (vehicleId) {
      fd.append('vehicle', vehicleId)
    }
    if (name) {
      fd.append('name', name)
    }
    if (documentType) {
      fd.append('document_type', documentType)
    }
    
    try {
      return await djangoApiRequest(DJANGO_ENDPOINTS.documents.upload, {
        method: 'POST',
        body: fd,
        headers: {
          // Let the browser set Content-Type for FormData
        },
      })
    } catch (e: any) {
      if (e?.status === 405) {
        try {
          // Try list endpoint (DRF router create)
          return await djangoApiRequest(DJANGO_ENDPOINTS.documents.list, {
            method: 'POST',
            body: fd,
            headers: {},
          })
        } catch (e2: any) {
          // Final fallback to same-origin proxy upload path
          return await djangoApiRequest('/api/documents/upload/', {
            method: 'POST',
            body: fd,
            suppressLog: true,
          })
        }
      }
      throw e
    }
  },

  delete: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.documents.delete(id), {
      method: 'DELETE',
    })
  },
  
  download: async (id: string) => {
    // Download by document detail URL (served by Django media if serializer includes direct URL)
    const detailUrl = DJANGO_ENDPOINTS.documents.delete(id).replace(/\/$/, '/')
    return djangoApiRequest<Blob>(detailUrl, { method: 'GET', responseType: 'blob' })
  },

  downloadByUrl: async (url: string) => {
    const full = url.startsWith('http') ? url : `${DJANGO_API_URL}${url}`
    try {
      if (typeof window !== 'undefined' && NEXT_PUBLIC_USE_PROXY) {
        try {
          const u = new URL(full)
          const path = u.pathname || ''
          if (path.startsWith('/media/')) {
            const proxied = `/api/media/${path.replace(/^\/media\//, '')}`
            return await djangoApiRequest<Blob>(proxied, { method: 'GET', responseType: 'blob' })
          }
        } catch {
          /* ignore URL parse errors and fall through */
        }
      }
      return await djangoApiRequest<Blob>(full, { method: 'GET', responseType: 'blob' })
    } catch (e: any) {
      // Normalize error for callers expecting blob
      const msg = (e?.error?.detail && String(e.error.detail).trim()) || (e?.message && String(e.message).trim()) || 'Failed to fetch'
      const errorPayload = JSON.stringify({ detail: msg })
      const errorBlob = new Blob([errorPayload], { type: 'application/json' })
      try { ;(errorBlob as any).status = e?.status || 0 } catch {}
      return errorBlob as unknown as Blob
    }
  },

  verify: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.documents.verify(id), { method: 'POST' })
  },
}

// High-level default API used by frontend pages (uses djangoApiRequest)
const djangoApi = {
  getLicenseById: async (id: string) => {
    return djangoApiRequest(DJANGO_ENDPOINTS.licenses.detail(id))
  },
  generateLicenseQrData: async (licenseId: string, frontendUrl?: string) => {
    return djangoApiRequest(`${DJANGO_API_URL}/api/licenses/qr/`, {
      method: 'POST',
      body: JSON.stringify({ license_id: licenseId, frontend_url: frontendUrl }),
    })
  },
  verifyLicense: async (opts: { licenseNumber?: string; token?: string } | string) => {
    const params = new URLSearchParams()

    if (typeof opts === 'string') {
      if (opts) {
        // Backwards-compatible string argument: treat as licenseNumber
        params.set('licenseNumber', opts)
        params.set('license_number', opts)
      }
    } else {
      if (opts.licenseNumber) {
        params.set('licenseNumber', opts.licenseNumber)
        params.set('license_number', opts.licenseNumber)
      }
      if (opts.token) params.set('token', opts.token)
    }

    const query = params.toString()
    return djangoApiRequest(`${DJANGO_ENDPOINTS.licenses.verify}${query ? `?${query}` : ''}`)
  },
}

export default djangoApi;
