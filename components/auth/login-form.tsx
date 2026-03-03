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
  const { login } = useAuth()
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
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            disabled={isLoading}
            aria-label="Continue with Google"
            onClick={() => {
              if (typeof window === "undefined") return
              const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "650560089798-q076f69msk5mi2iuvi1hb6ptja4oiqb7.apps.googleusercontent.com").trim()
              const redirectUri = `${window.location.origin}/oauth2callback`
              const scope = "openid email profile"
              const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
                client_id: clientId,
                redirect_uri: redirectUri,
                response_type: "code",
                scope,
                access_type: "offline",
                prompt: "consent",
              }).toString()
              window.location.href = authUrl
            }}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Continue with Google</span>
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
