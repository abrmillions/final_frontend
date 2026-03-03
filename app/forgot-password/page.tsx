"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { DJANGO_API_URL } from "@/lib/config/django-api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetUrl, setResetUrl] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setResetUrl(null)
    try {
      const resp = await fetch(`${DJANGO_API_URL}/api/users/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frontend_url: window.location.origin }),
      })
      const data = await resp.json()
      if (!resp.ok) throw data
      setMessage(data.detail || "If this email is registered, a reset link has been sent.")
      if (data.reset_url) setResetUrl(data.reset_url)
    } catch (err: any) {
      setError(err?.detail || err?.message || "Failed to request password reset.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter the email associated with your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && <div className="text-green-700">{message}</div>}
            {error && <div className="text-red-700">{error}</div>}
            <div>
              <label className="block text-sm mb-1">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Send reset link</Button>
              <Button variant="secondary" onClick={() => router.push('/login')}>Back to login</Button>
            </div>
            {resetUrl && (
              <div className="mt-2 text-sm text-muted-foreground">
                Developer reset URL (copy and open): <a className="underline" href={resetUrl}>{resetUrl}</a>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
