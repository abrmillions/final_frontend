"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { authApi } from "@/lib/api/django-client"
import { DJANGO_API_URL } from "@/lib/config/django-api"

interface User {
  id: string
  email: string
  fullName?: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  profilePhoto?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  isAuthenticated: boolean
  updateUser: (u: User) => void
  maintenanceMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, initialMaintenance }: { children: React.ReactNode; initialMaintenance?: boolean }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(Boolean(initialMaintenance))

  // Check session on mount and restore from JWT if available
  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const { DJANGO_ENDPOINTS } = await import("@/lib/config/django-api")
        const endpoint = typeof window !== 'undefined' ? '/api/system/maintenance/' : DJANGO_ENDPOINTS.system.maintenance
        const r = await fetch(endpoint, { cache: "no-store" })
        if (r.ok) {
          const s = await r.json()
          setMaintenanceMode(!!s.maintenance_mode)
        } else if (r.status === 503) {
          setMaintenanceMode(true)
        }
      } catch (e) {
        console.warn("[clms] Could not fetch maintenance status:", e)
      }
    }

    // Initial fetch to sync client with potentially stale SSR value
    fetchMaintenance()

    // Poll for maintenance mode every 30 seconds
    const interval = setInterval(fetchMaintenance, 30000)

    const checkSession = async () => {
      try {
        const tokens = typeof window !== "undefined" ? localStorage.getItem("clms_tokens") : null
        if (tokens) {
          try {
            const currentUser = await authApi.getCurrentUser()
            // Map snake_case to camelCase
            const mappedUser: User = {
                id: currentUser.id,
                email: currentUser.email,
                firstName: currentUser.first_name,
                lastName: currentUser.last_name,
                fullName: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username,
                phone: currentUser.phone,
                profilePhoto: currentUser.profile_photo ? (currentUser.profile_photo.startsWith('http') ? currentUser.profile_photo : `${DJANGO_API_URL}${currentUser.profile_photo}`) : null,
                role: currentUser.is_staff ? 'Admin' : 'User'
            }
            
            setUser(mappedUser)
            if (typeof window !== "undefined") localStorage.setItem("clms_user", JSON.stringify(mappedUser))
          } catch (e) {
            console.warn("[clms] Failed to restore user from token:", e)
            if (typeof window !== "undefined") {
              localStorage.removeItem("clms_tokens")
              localStorage.removeItem("clms_user")
            }
          }
        } else {
          // If no tokens are found, ensure we clear any stale user data
          if (typeof window !== "undefined") {
            localStorage.removeItem("clms_user")
          }
          setUser(null)
        }
      } catch (error) {
        console.error("[clms] Failed to restore session:", error)
        if (typeof window !== "undefined") localStorage.removeItem("clms_user")
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()

    return () => {
      clearInterval(interval)
    }
  }, [])

  const logout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("clms_user")
        localStorage.removeItem("clms_tokens")
      }
    } catch (error) {
      console.error("[clms] Logout error:", error)
    }
  }

  const login = async (email: string, password: string) => {
    // Perform login to get tokens (returns quickly)
    await authApi.login(email, password)
    // Optimistically set minimal user to unblock UI immediately
    const minimalUser: User = { id: '', email }
    setUser(minimalUser)
    if (typeof window !== "undefined") localStorage.setItem("clms_user", JSON.stringify(minimalUser))

    // Refresh full profile in background without blocking caller
    ;(async () => {
      try {
        const currentUser = await authApi.getCurrentUser()
        const mappedUser: User = {
          id: currentUser.id,
          email: currentUser.email,
          firstName: currentUser.first_name,
          lastName: currentUser.last_name,
          fullName: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username,
          phone: currentUser.phone,
          profilePhoto: currentUser.profile_photo ? (currentUser.profile_photo.startsWith('http') ? currentUser.profile_photo : `${DJANGO_API_URL}${currentUser.profile_photo}`) : null,
          role: currentUser.is_staff ? 'Admin' : 'User',
        }
        setUser(mappedUser)
        if (typeof window !== "undefined") localStorage.setItem("clms_user", JSON.stringify(mappedUser))
      } catch (e) {
        // keep minimal user; allow UI to function
      }
    })()
  }

  const updateUser = (u: User) => {
    setUser(u)
    if (typeof window !== "undefined") localStorage.setItem("clms_user", JSON.stringify(u))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        logout,
        login,
        isAuthenticated: user !== null,
        updateUser,
        maintenanceMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
