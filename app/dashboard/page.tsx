"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  FileText,
  Users,
  Package,
  BarChart3,
  Menu,
  Plus,
  Handshake,
  Truck,
  Award,
  ClockIcon,
  XCircle,
  Home,
  Settings,
  User,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { UserMenu } from "@/components/user-menu"
import { useAuth } from "@/lib/auth/auth-context"
import { setTokens, DJANGO_API_URL } from "@/lib/config/django-api"
import { authApi } from "@/lib/api/django-client"
import { LogOut } from "lucide-react"
import { licensesApi, applicationsApi } from "@/lib/api/django-client"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, updateUser, maintenanceMode } = useAuth()
  const [recentApplications, setRecentApplications] = useState<any[]>([])
  const [isLoadingApps, setIsLoadingApps] = useState(true)
  const [stats, setStats] = useState<any>({
    activeApplications: 0,
    activeLicenses: 0,
    pendingReviewals: 0,
    rejectedApplications: 0,
    expiringLicenses: 0,
  })
  const [authReady, setAuthReady] = useState(false)

  const handleLogout = () => {
    // Logout logic here
  }

  useEffect(() => {
    const captureTokens = async () => {
      try {
        if (typeof window === "undefined") return setAuthReady(true)
        const url = new URL(window.location.href)
        const access = url.searchParams.get("access")
        const refresh = url.searchParams.get("refresh")
        if (access && refresh) {
          setTokens({ access, refresh } as any)
          url.searchParams.delete("access")
          url.searchParams.delete("refresh")
          window.history.replaceState({}, "", url.toString())
          try {
            const u = await authApi.getCurrentUser()
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
            updateUser(mappedUser as any)
          } catch {}
        }
      } finally {
        setAuthReady(true)
      }
    }
    captureTokens()
  }, [updateUser])

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Wait for token capture and auth state to resolve before deciding where to go
        if (isLoading || !authReady) return

        if (!user) {
          router.push("/login")
          return
        }

        // Load stats from backend if available
        try {
          const [apps, licenses] = await Promise.all([
            applicationsApi.list(),
            licensesApi.list()
          ])
          setRecentApplications(Array.isArray(apps) ? apps.slice(0, 5) : []) // Get top 5 recent applications
          
          // Calculate stats based on fetched applications
          const active = licenses.filter((lic: any) => lic.status === 'active').length
          const pending = Array.isArray(apps) ? apps.filter((app: any) => app.status === 'pending').length : 0
          const rejected = Array.isArray(apps) ? apps.filter((app: any) => app.status === 'rejected').length : 0
          
          setStats({
            activeApplications: Array.isArray(apps) ? apps.length : 0,
            activeLicenses: active,
            pendingReviewals: pending,
            rejectedApplications: rejected,
            expiringLicenses: 0, // Placeholder
          })
        } catch (err: any) {
          const msg = String(err?.message || "")
          const isMaintenance =
            err?.status === 503 ||
            /maintenance/i.test(msg) ||
            /maintenance/i.test(String(err?.error?.message || ""))
          if (isMaintenance) {
            // keep defaults; skip noisy error logs during maintenance
          } else {
            console.error("[clms] Failed to fetch dashboard data:", err)
          }
        } finally {
          setIsLoadingApps(false)
        }
      } catch (error) {
        console.error("[clms] Dashboard load error:", error)
        setIsLoadingApps(false)
      }
    }

    loadDashboard()
  }, [router, user, isLoading, authReady])

  // While auth is loading, don't flash the dashboard or redirect
  if (isLoading) {
    return null
  }

  if (!user) {
    return null
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case "pending":
      case "resubmitted":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pending</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "info_requested":
        return <Badge className="bg-amber-500 text-white hover:bg-amber-600">Info Requested</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">CLMS Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                Welcome back, {((user as any)?.fullName || (user as any)?.firstName || (user as any)?.email || "").toString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outlineBlueHover" size="sm" asChild className="hidden md:flex">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <Link href="/dashboard" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                    <Home className="w-5 h-5" />
                    Dashboard
                  </Link>
                  <Link href="/dashboard/licenses" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                    <Award className="w-5 h-5" />
                    My Licenses
                  </Link>
                  <Link href="/dashboard/applications" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                    <FileText className="w-5 h-5" />
                    Applications
                  </Link>
                  <Link href="/dashboard/partnerships" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                    <Handshake className="w-5 h-5" />
                    Partnerships
                  </Link>
                  <Link href="/dashboard/vehicles" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                    <Truck className="w-5 h-5" />
                    Vehicles
                  </Link>
                  <Link href="/dashboard/profile" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                    <User className="w-5 h-5" />
                    Profile
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {maintenanceMode && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-800 mb-4">
            <AlertTitle>Maintenance in Progress</AlertTitle>
            <AlertDescription>Some dashboard data may be temporarily unavailable.</AlertDescription>
          </Alert>
        )}
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Licenses", value: stats.activeLicenses, icon: FileText },
            { label: "Pending Applications", value: stats.pendingReviewals, icon: ClockIcon },
            { label: "Rejected Applications", value: stats.rejectedApplications, icon: XCircle },
            { label: "Total Applications", value: stats.activeApplications, icon: BarChart3 },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Quick Access</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                icon: Award,
                title: "My Licenses",
                description: "View your active licenses",
                href: "/dashboard/licenses",
              },
              {
                icon: FileText,
                title: "Applications",
                description: "Track application status",
                href: "/dashboard/applications",
              },
              {
                icon: Handshake,
                title: "Partnerships",
                description: "Manage partnerships",
                href: "/dashboard/partnerships",
              },
              {
                icon: Truck,
                title: "Vehicles",
                description: "Registered equipment",
                href: "/dashboard/vehicles",
              },
            ].map((action, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <Link href={action.href} className="block">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <action.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{action.title}</h3>
                        <p className="text-xs text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Apply for License</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Building2,
                title: "Contractor License",
                description: "Apply for a construction contractor license",
                href: "/dashboard/contractor-license/apply",
              },
              {
                icon: Users,
                title: "Professional License",
                description: "Engineer or architect certification",
                href: "/dashboard/professional-license/apply",
              },
              {
                icon: Package,
                title: "Import/Export Permit",
                description: "Equipment import/export authorization",
                href: "/dashboard/import-export/apply",
              },
            ].map((action, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <action.icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full">
                    <Link href={action.href}>
                      <Plus className="w-4 h-4 mr-2" />
                      Apply Now
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Recent Applications</h2>
            <Button variant="outline" asChild size="sm">
              <Link href="/dashboard/applications">View All</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              {isLoadingApps ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : recentApplications.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No applications yet</p>
                  <p className="text-sm mt-2">Apply for a license to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {app.license_type === 'contractor' ? 'Contractor License' : 
                             app.license_type === 'professional' ? 'Professional License' : 
                             app.license_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Applied on {new Date(app.created_at || app.issueDate || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getStatusBadge(app.status)}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/applications/${app.id}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
