"use client"
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DJANGO_API_URL } from "@/lib/config/django-api"

function QueryReader({ onFound }: { onFound: (uid: string | null, token: string | null) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const u = searchParams.get('uid')
    const t = searchParams.get('token')
    onFound(u, t)
  }, [searchParams])
  return null
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [uid, setUid] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!uid || !token) return setError('Missing uid or token')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')

    try {
      const resp = await fetch(`${DJANGO_API_URL}/api/users/password-reset/confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: password }),
      })
      const data = await resp.json()
      if (!resp.ok) throw data
      setMessage(data.detail || 'Password reset successfully. Redirecting to login...')
      setTimeout(() => router.push('/login'), 1500)
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to reset password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Suspense fallback={<div>Loading...</div>}>
        <QueryReader onFound={(u, t) => { setUid(u); setToken(t) }} />
      </Suspense>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && <div className="text-green-700">{message}</div>}
            {error && <div className="text-red-700">{error}</div>}
            <div>
              <label className="block text-sm mb-1">New password</label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>
            <div>
              <label className="block text-sm mb-1">Confirm password</label>
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Reset password</Button>
              <Button variant="secondary" onClick={() => router.push('/login')}>Back to login</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
