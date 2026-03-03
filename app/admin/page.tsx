"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, Users, Building2, FileText, TrendingUp, Settings, Loader2 } from "lucide-react"
import { applicationsApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"
import { DJANGO_API_URL } from "@/lib/config/django-api"

export default function AdminDashboard() {

  const [stats, setStats] = useState({
    pending: 0,
    under_review: 0,
    approved_today: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchStats = async () => {
      try {
        // Check local user role first to avoid unnecessary 403s
        const userStr = localStorage.getItem('clms_user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (user.role !== 'Admin') {
                setError("Access Denied: You do not have administrator privileges.")
                setIsLoading(false)
                return
            }
        }

        const data = await applicationsApi.getStats()
        setStats(data)
      } catch (error: any) {
        // Handle 403 specifically
        if (error?.status === 403 || error?.response?.status === 403 || error?.message?.includes("Permission denied")) {
             setError("Access Denied: You do not have administrator privileges.")
        } else if (error?.status === 401 || /Authentication credentials were not provided/i.test(String(error?.message || ""))) {
             setError("Authentication required. Please sign in as an administrator.")
             toast({
                title: "Sign In Required",
                description: "Please sign in to access the Admin Dashboard.",
                variant: "destructive"
             })
             try {
               router.push("/admin-login")
             } catch {}
        } else {
             toast({
                title: "Error",
                description: "Failed to load dashboard statistics",
                variant: "destructive"
            })
        }
      } finally {
        setIsLoading(false)
      }
    }
    checkAuthAndFetchStats()
  }, [toast])

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Access Denied
                    </CardTitle>
                    <CardDescription>
                        {error}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/dashboard">Return to User Portal</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Admin Portal</h1>
                <p className="text-sm text-slate-600">Construction License Management</p>
              </div>
            </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard">User Portal</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`${DJANGO_API_URL}/admin/`} target="_blank">Django Admin</Link>
                </Button>
              </div>
          </div>
        </div>
      </header>


      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-600 mt-2">Manage applications and system settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              ) : (
                  <>
                    <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
                    <p className="text-xs text-slate-500 mt-1">Awaiting review</p>
                  </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
              ) : (
                  <>
                    <div className="text-3xl font-bold text-amber-600">{stats.under_review}</div>
                    <p className="text-xs text-slate-500 mt-1">In progress</p>
                  </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Approved Today</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              ) : (
                  <>
                    <div className="text-3xl font-bold text-emerald-600">{stats.approved_today}</div>
                    <p className="text-xs text-slate-500 mt-1">Completed applications</p>
                  </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Review Applications</CardTitle>
                  <CardDescription>Process pending applications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/admin/applications">View Applications</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <Users className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage system users</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>View system analytics</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/admin/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <FileText className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>Generate system reports</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/admin/reports">Generate Reports</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Settings className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Configure system</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/admin/settings">System Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
