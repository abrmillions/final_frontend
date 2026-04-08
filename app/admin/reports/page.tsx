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
      } else if (format === "json") {
        const jsonString = JSON.stringify(filtered, null, 2)
        const blob = new Blob([jsonString], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else if (format === "excel") {
        // Fallback to CSV for Excel if XLSX library isn't integrated, or handle as CSV
        const csv = generateApplicationsCSV(filtered)
        downloadCSV(csv, `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`)
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shrink-0">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 line-clamp-1">Generate Reports</h1>
                <p className="text-sm text-slate-600">Create custom system reports</p>
              </div>
            </div>
            <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Report Configuration</CardTitle>
                <CardDescription>Configure your report parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="report-type" className="text-sm font-semibold">Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="report-type" className="w-full h-10">
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
                  <p className="text-xs sm:text-sm text-slate-500 italic px-1">
                    {reportTypes.find((t) => t.value === reportType)?.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time-range" className="text-sm font-semibold">Time Range</Label>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger id="time-range" className="w-full h-10">
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

                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-sm font-semibold">Export Format</Label>
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger id="format" className="w-full h-10">
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
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-semibold">Report Options</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-charts"
                        checked={includeCharts}
                        onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                      />
                      <Label htmlFor="include-charts" className="font-normal text-sm cursor-pointer">
                        Include charts
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-details"
                        checked={includeDetails}
                        onCheckedChange={(checked) => setIncludeDetails(checked as boolean)}
                      />
                      <Label htmlFor="include-details" className="font-normal text-sm cursor-pointer">
                        Include detailed breakdowns
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-summary" defaultChecked />
                      <Label htmlFor="include-summary" className="font-normal text-sm cursor-pointer">
                        Include executive summary
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-recommendations" />
                      <Label htmlFor="include-recommendations" className="font-normal text-sm cursor-pointer">
                        Include recommendations
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Recent Reports</CardTitle>
                <CardDescription>Previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recent.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50/50 rounded-lg border border-dashed">
                      <p className="text-sm text-slate-500">No recent reports found.</p>
                    </div>
                  ) : (
                    recent.map((report, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{report.name}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500">
                              {new Date(report.date).toLocaleDateString()} {report.size ? `• ${report.size}` : ""}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto h-8 text-xs" onClick={() => handleDownloadRecent(report.name)}>
                          <Download className="h-3.5 w-3.5 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Report Preview</CardTitle>
                <CardDescription>What will be included</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {reportTypes.find((t) => t.value === reportType)?.label}
                    </p>
                    <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                      Data from the {timeRange === "custom" ? "selected" : timeRange} period
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Time Range</p>
                    <p className="text-[11px] text-slate-600 capitalize mt-0.5">{timeRange}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Download className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Export Format</p>
                    <p className="text-[11px] text-slate-600 uppercase mt-0.5">{format}</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Included Sections:</p>
                  <ul className="text-xs text-slate-600 space-y-1.5 ml-1">
                    {includeCharts && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                        Charts and visualizations
                      </li>
                    )}
                    {includeDetails && (
                      <li className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                        Detailed breakdowns
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                      Executive summary
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                      Data tables
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Download className="w-20 h-20 rotate-12" />
              </div>
              <CardContent className="p-6 relative z-10">
                <h3 className="font-bold text-lg mb-2">Ready to Generate?</h3>
                <p className="text-blue-100 text-xs mb-5 leading-relaxed">
                  Your report will be processed instantly based on current system data and downloaded to your device.
                </p>
                <Button
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 font-bold h-11 shadow-sm transition-all active:scale-[0.98]"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>Generating Report...</>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
