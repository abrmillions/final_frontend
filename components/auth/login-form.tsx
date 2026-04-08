"use client"

import React, { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { DJANGO_API_URL } from "@/lib/config/django-api"
import { setTokens } from "@/lib/config/django-api"

export function LoginForm() {
  const router = useRouter()
  const { login, maintenanceMode } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    try {
      if (typeof window === "undefined") return
      const url = new URL(window.location.href)
      const access = url.searchParams.get("access")
      const refresh = url.searchParams.get("refresh")
      const emailParam = url.searchParams.get("email")
      const firstNameParam = url.searchParams.get("firstName")
      const lastNameParam = url.searchParams.get("lastName")
      if (access && refresh) {
        setTokens({ access, refresh } as any)
        // Clean params from URL
        url.searchParams.delete("access")
        url.searchParams.delete("refresh")
        url.searchParams.delete("email")
        url.searchParams.delete("firstName")
        url.searchParams.delete("lastName")
        window.history.replaceState({}, "", url.toString())
        router.replace("/dashboard")
        setTimeout(() => {
          try {
            if (typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
              window.location.assign("/dashboard")
            }
          } catch {}
        }, 300)
      } else {
        if (emailParam) setEmail(emailParam)
        // first/last are not used on login form, but removed from URL for cleanliness
      }
    } catch {}
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const trimmedEmail = email.trim()
    try {
      await login(trimmedEmail, password)

      // Fetch the updated user from localStorage to check role
      let userRole = ""
      try {
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("clms_user")
          if (stored) {
            const user = JSON.parse(stored)
            userRole = (user?.role || "").toLowerCase()
          }
        }
      } catch (e) { /* ignore */ }

      // If maintenance mode is ON and user is NOT an admin, log them out immediately
      if (maintenanceMode && userRole !== "admin") {
        const { authApi } = await import("@/lib/api/django-client")
        await authApi.logout()
        setError("The system is currently in maintenance.")
        setIsLoading(false)
        return
      }

      console.log("[clms] Login successful")
      // Immediately navigate; do not wait for any background requests
      router.push("/dashboard")
      // Ensure the loading state clears even if navigation is slow
      setIsLoading(false)
      // Hard-navigation fallback if the router transition is interrupted
      setTimeout(() => {
        try {
          if (typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
            window.location.assign("/dashboard")
          }
        } catch {}
      }, 400)
    } catch (err: any) {
      let errorMessage = "Login failed"

      // Show a friendly, non-revealing message for authentication failures
      const detail = err?.error?.detail || err?.message || ""
      if (err?.status === 401 || /no active account found|credentials/i.test(detail)) {
        errorMessage = "Invalid email or password. Try again."
      } else if (detail) {
        errorMessage = detail
      }

      setError(errorMessage)
      // Log a concise message (avoid printing full Error object/stacks in console)
      try {
        console.debug(`[clms] Login error: ${err?.message || JSON.stringify(err)}`)
      } catch {
        // fallback to safe log
        console.debug('[clms] Login error')
      }
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="px-4 pt-6 pb-4 md:p-6">
        <CardTitle className="text-2xl">Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-4 md:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-muted-foreground text-center">
          {"Don't have an account? "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Register here
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
