export function downloadPDF(pdf: any, filename: string) {
  const blob: Blob = pdf.output("blob")
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function downloadFromUrl(url: string, filename: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    downloadFile(blob, filename)
  } catch (error) {
    console.error("Error downloading file:", error)
    throw error
  }
}
