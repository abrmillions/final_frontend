"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, ArrowLeft, TrendingUp, TrendingDown, Users, FileText, DollarSign, CheckCircle, Loader2 } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { analyticsApi } from "@/lib/api/django-client"
import { useToast } from "@/hooks/use-toast"
import { DJANGO_API_URL } from "@/lib/config/django-api"

interface AnalyticsData {
  applicationTrends: any[]
  licenseTypes: any[]
  revenueData: any[]
  totalApplications: number
  approvalRate: number
  totalRevenue: number
  activeUsers: number
  processingTimes: any[]
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("month")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAuthAndFetchAnalytics()
  }, [])

  const checkAuthAndFetchAnalytics = async () => {
    try {
        setLoading(true)
        // Check local user role first
        const userStr = localStorage.getItem('clms_user')
        if (userStr) {
            const user = JSON.parse(userStr)
            if (user.role !== 'Admin') {
                setError("Access Denied: You do not have administrator privileges.")
                setLoading(false)
                return
            }
        }

        const response = await analyticsApi.getDashboard()
        setData(response)
    } catch (error: any) {
        console.error("Failed to fetch analytics:", error)
        // Handle 403 specifically
        if (error?.status === 403 || error?.response?.status === 403 || error?.message?.includes("Permission denied")) {
             setError("Access Denied: You do not have administrator privileges.")
        } else {
             toast({
                title: "Error",
                description: "Failed to load analytics data",
                variant: "destructive",
            })
        }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

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

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Failed to load data</p>
        <Button onClick={checkAuthAndFetchAnalytics}>Retry</Button>
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
                <h1 className="text-xl font-bold text-slate-900">Analytics Dashboard</h1>
                <p className="text-sm text-slate-600">System performance and insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" asChild>
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Admin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Applications</CardTitle>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.totalApplications}</div>
              {/* Trends removed as backend doesn't provide comparison data yet */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Approval Rate</CardTitle>
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.approvalRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">${(data.totalRevenue / 1000).toFixed(1)}K</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">Active Users</CardTitle>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{data.activeUsers}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Application Trends</CardTitle>
              <CardDescription>Monthly application submissions and outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.applicationTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar dataKey="approved" fill="#10B981" name="Approved" />
                  <Bar dataKey="rejected" fill="#EF4444" name="Rejected" />
                  <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>License Distribution</CardTitle>
              <CardDescription>Breakdown by license type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.licenseTypes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.licenseTypes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>Monthly revenue overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Times</CardTitle>
              <CardDescription>Average processing time by license type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.processingTimes.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${index % 2 === 0 ? "bg-blue-500" : "bg-emerald-500"}`} />
                      <span className="text-sm font-medium text-slate-700">{item.type}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-32 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full ${index % 2 === 0 ? "bg-blue-500" : "bg-emerald-500"}`}
                          style={{ width: `${Math.min(item.avgDays * 10, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900">{item.avgDays} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
