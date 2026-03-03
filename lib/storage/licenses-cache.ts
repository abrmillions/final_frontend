/**
 * Small localStorage-backed cache for frontend-only licenses.
 * Used to surface licenses derived from applications until they exist on backend.
 */
const CACHE_KEY = 'clms_licenses_cache'

export type CachedLicense = {
  id: string
  type?: string
  category?: string
  holderName?: string
  companyName?: string
  issueDate?: string
  expiryDate?: string
  status?: string
  verificationUrl?: string
  qrDataUrl?: string
}

export function getCachedLicenses(): CachedLicense[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[licenses-cache] failed to read cache', e)
    return []
  }
}

export function setCachedLicenses(items: CachedLicense[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(items))
  } catch (e) {
    console.warn('[licenses-cache] failed to write cache', e)
  }
}

export function addOrUpdateCachedLicense(item: CachedLicense) {
  if (typeof window === 'undefined') return
  try {
    const items = getCachedLicenses()
    const idx = items.findIndex((i) => String(i.id) === String(item.id))
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...item }
    } else {
      items.push(item)
    }
    setCachedLicenses(items)
  } catch (e) {
    console.warn('[licenses-cache] add/update failed', e)
  }
}

export function removeCachedLicense(id: string | number) {
  if (typeof window === 'undefined') return
  try {
    const items = getCachedLicenses()
    const filtered = items.filter((i) => String(i.id) !== String(id))
    setCachedLicenses(filtered)
  } catch (e) {
    console.warn('[licenses-cache] remove failed', e)
  }
}

export function clearCachedLicenses() {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (e) {
    console.warn('[licenses-cache] clear failed', e)
  }
}

// Mapping between application id -> created backend license id to avoid duplicate creates
const APP_LICENSE_MAP_KEY = 'clms_app_license_map'

export function getAppLicenseMap(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(APP_LICENSE_MAP_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch (e) {
    console.warn('[licenses-cache] failed to read app-license map', e)
    return {}
  }
}

export function setAppLicenseMap(map: Record<string, string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(APP_LICENSE_MAP_KEY, JSON.stringify(map))
  } catch (e) {
    console.warn('[licenses-cache] failed to write app-license map', e)
  }
}

export function setAppLicenseMapping(appId: string | number, licenseId: string) {
  try {
    const map = getAppLicenseMap()
    map[String(appId)] = String(licenseId)
    setAppLicenseMap(map)
  } catch (e) {
    console.warn('[licenses-cache] set mapping failed', e)
  }
}

export function getAppLicenseMapping(appId: string | number) {
  try {
    const map = getAppLicenseMap()
    return map[String(appId)] || null
  } catch (e) {
    return null
  }
}

export function removeAppLicenseMapping(appId: string | number) {
  try {
    const map = getAppLicenseMap()
    delete map[String(appId)]
    setAppLicenseMap(map)
  } catch (e) {
    console.warn('[licenses-cache] remove mapping failed', e)
  }
}
