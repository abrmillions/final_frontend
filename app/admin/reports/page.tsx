"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, ArrowLeft, Download, FileText, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateApplicationsCSV, downloadCSV } from "@/lib/downloads/csv-generator"
import { generateReportPDF } from "@/lib/downloads/pdf-generator"
import { downloadPDF } from "@/lib/downloads/file-download"
import { applicationsApi, analyticsApi } from "@/lib/api/django-client"

export default function ReportsPage() {
  const { toast } = useToast()
  const [reportType, setReportType] = useState("applications")
  const [timeRange, setTimeRange] = useState("month")
  const [format, setFormat] = useState("pdf")
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeDetails, setIncludeDetails] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const reportTypes = [
    { value: "applications", label: "Applications Report", description: "Detailed report on all applications" },
    { value: "licenses", label: "Licenses Report", description: "Active and expired licenses" },
    { value: "revenue", label: "Revenue Report", description: "Financial overview and payments" },
    { value: "performance", label: "Performance Report", description: "Processing times and efficiency" },
    { value: "compliance", label: "Compliance Report", description: "Regulatory compliance status" },
  ]

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const appsResp = await applicationsApi.list({})
      const apps = Array.isArray(appsResp) ? appsResp : (appsResp.results || [])
      const now = new Date()
      const cutoff = (() => {
        if (timeRange === "week") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        if (timeRange === "month") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        if (timeRange === "quarter") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        if (timeRange === "year") return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        return new Date(0)
      })()
      const filtered = (apps || []).filter((a: any) => {
        const dt = a.created_at ? new Date(a.created_at) : null
        return !dt || dt >= cutoff
      }).map((a: any) => ({
        id: a.id,
        type: a.license_type || a.type || "",
        applicantName: a.applicant_name || a.applicant || a.user_name || "",
        companyName: a.company_name || "",
        email: a.email || a.applicant_email || "",
        phone: a.phone || a.applicant_phone || "",
        submittedDate: a.created_at || a.submitted_at || "",
        status: a.status || "",
      }))

      if (format === "csv") {
        const csv = generateApplicationsCSV(filtered)
        downloadCSV(csv, `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`)
      } else if (format === "pdf") {
        let dashboard: any = {}
        try {
          dashboard = await analyticsApi.getDashboard()
        } catch {}
        const pdf = await generateReportPDF({
          reportType,
          timeRange,
          data: filtered,
          includeCharts,
          includeDetails,
          dashboard,
        })
        downloadPDF(pdf, `${reportType}-report-${new Date().toISOString().split("T")[0]}.pdf`)
      }

      toast({
        title: "Report Generated",
        description: `Your ${reportType} report has been downloaded as ${format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const [recent, setRecent] = useState<{ name: string; date: string; size?: string }[]>([])
  useEffect(() => {
    (async () => {
      try {
        const dash = await analyticsApi.getDashboard()
        const items = (dash?.applicationTrends || []).slice(-5).map((e: any) => ({
          name: `Applications Report - ${e.month}`,
          date: new Date().toISOString(),
          size: undefined,
        }))
        setRecent(items)
      } catch {
        setRecent([])
      }
    })()
  }, [])
  const handleDownloadRecent = (reportName: string) => {
    handleGenerate()
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
                <h1 className="text-xl font-bold text-slate-900">Generate Reports</h1>
                <p className="text-sm text-slate-600">Create custom system reports</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>Configure your report parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="report-type" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500 mt-2">
                    {reportTypes.find((t) => t.value === reportType)?.description}
                  </p>
                </div>

                <div>
                  <Label htmlFor="time-range">Time Range</Label>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger id="time-range" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                      <SelectItem value="year">Last Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger id="format" className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                      <SelectItem value="csv">CSV File</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Report Options</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-charts"
                        checked={includeCharts}
                        onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                      />
                      <Label htmlFor="include-charts" className="font-normal">
                        Include charts and visualizations
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-details"
                        checked={includeDetails}
                        onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                      />
                      <Label htmlFor="include-details" className="font-normal">
                        Include detailed breakdowns
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-summary" defaultChecked />
                      <Label htmlFor="include-summary" className="font-normal">
                        Include executive summary
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-recommendations" />
                      <Label htmlFor="include-recommendations" className="font-normal">
                        Include recommendations
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recent.map((report, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-900">{report.name}</p>
                          <p className="text-sm text-slate-500">
                            {new Date(report.date).toLocaleDateString()} {report.size ? `• ${report.size}` : ""}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadRecent(report.name)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>What will be included</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {reportTypes.find((t) => t.value === reportType)?.label}
                    </p>
                    <p className="text-sm text-slate-600">
                      Data from the {timeRange === "custom" ? "selected" : timeRange} period
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Time Range</p>
                    <p className="text-sm text-slate-600 capitalize">{timeRange}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Export Format</p>
                    <p className="text-sm text-slate-600 uppercase">{format}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-slate-700 mb-2">Included Sections:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {includeCharts && <li>• Charts and visualizations</li>}
                    {includeDetails && <li>• Detailed breakdowns</li>}
                    <li>• Executive summary</li>
                    <li>• Data tables</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Ready to Generate?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Your report will be generated based on the selected parameters and will be available for download.
                </p>
                <Button
                  className="w-full bg-white text-blue-600 hover:bg-blue-50"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Report"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
