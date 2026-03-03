export function generateApplicationsCSV(applications: any[]) {
  const headers = ["Application ID", "Type", "Applicant Name", "Company", "Email", "Phone", "Submitted Date", "Status"]

  const rows = applications.map((app) => [
    app.id,
    app.type,
    app.applicantName,
    app.companyName,
    app.email,
    app.phone,
    new Date(app.submittedDate).toLocaleDateString(),
    app.status,
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  return csvContent
}

export function generateReportCSV(data: any[], type: string) {
  const headers =
    type === "licenses"
      ? ["License ID", "Type", "Holder Name", "Company", "Issue Date", "Expiry Date", "Status"]
      : ["ID", "Name", "Email", "Role", "Created Date", "Status"]

  const rows = data.map((item) =>
    type === "licenses"
      ? [item.id, item.type, item.holderName, item.companyName, item.issueDate, item.expiryDate, item.status]
      : [item.id, item.name, item.email, item.role, item.createdDate, item.status],
  )

  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  return csvContent
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
