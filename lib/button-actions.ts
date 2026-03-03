/**
 * Utility functions for common button actions
 */

/**
 * Share a link to clipboard and social media
 */
export async function shareLink(url: string, title: string = "Construction License"): Promise<{success: boolean, message: string}> {
  try {
    // Check if Web Share API is available
    if (navigator.share) {
      await navigator.share({
        title,
        text: `Check out this ${title}`,
        url,
      })
      return { success: true, message: "Shared successfully" }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(url)
      return { success: true, message: "Link copied to clipboard" }
    }
  } catch (error) {
    console.error("[clms] Share error:", error)
    return { success: false, message: "Failed to share link" }
  }
}

/**
 * Download a file from URL
 */
export async function downloadFile(
  url: string,
  fileName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, message: `${fileName} downloaded successfully` }
  } catch (error) {
    console.error("[clms] Download error:", error)
    return { success: false, message: "Failed to download file" }
  }
}

/**
 * Print a page or element
 */
export function printPage(elementId?: string): void {
  try {
    if (elementId) {
      const element = document.getElementById(elementId)
      if (!element) {
        console.error("[clms] Element not found:", elementId)
        return
      }
      const printWindow = window.open("", "", "height=500,width=800")
      if (printWindow) {
        printWindow.document.write(element.innerHTML)
        printWindow.document.close()
        printWindow.print()
      }
    } else {
      window.print()
    }
  } catch (error) {
    console.error("[clms] Print error:", error)
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(
  text: string,
  label: string = "Text"
): Promise<{ success: boolean; message: string }> {
  try {
    await navigator.clipboard.writeText(text)
    return { success: true, message: `${label} copied to clipboard` }
  } catch (error) {
    console.error("[clms] Copy error:", error)
    return { success: false, message: "Failed to copy to clipboard" }
  }
}

/**
 * View a document or resource
 */
export function viewDocument(url: string, inNewTab: boolean = true): void {
  try {
    if (inNewTab) {
      window.open(url, "_blank")
    } else {
      window.location.href = url
    }
  } catch (error) {
    console.error("[clms] View error:", error)
  }
}

/**
 * API call for approve action
 */
export async function approveApplication(
  applicationId: string,
  comments: string = "",
  reviewNotes: string = ""
): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        status: "approved",
        review_comments: comments,
        review_notes: reviewNotes,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to approve application")
    }

    const data = await response.json()
    return { success: true, data, message: "Application approved successfully" }
  } catch (error) {
    console.error("[clms] Approval error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to approve application",
    }
  }
}

/**
 * API call for reject action
 */
export async function rejectApplication(
  applicationId: string,
  rejectionReason: string,
  reviewNotes: string = ""
): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    if (!rejectionReason.trim()) {
      return { success: false, message: "Rejection reason is required" }
    }

    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        status: "rejected",
        rejection_reason: rejectionReason,
        review_notes: reviewNotes,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to reject application")
    }

    const data = await response.json()
    return { success: true, data, message: "Application rejected successfully" }
  } catch (error) {
    console.error("[clms] Rejection error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reject application",
    }
  }
}

/**
 * API call for request info action
 */
export async function requestApplicationInfo(
  applicationId: string,
  infoRequest: string,
  reviewNotes: string = ""
): Promise<{ success: boolean; data?: any; message: string }> {
  try {
    if (!infoRequest.trim()) {
      return { success: false, message: "Information request details are required" }
    }

    const response = await fetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        status: "under_review",
        review_comments: infoRequest,
        review_notes: reviewNotes,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || "Failed to request information")
    }

    const data = await response.json()
    return { success: true, data, message: "Information request sent to applicant" }
  } catch (error) {
    console.error("[clms] Request info error:", error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to request information",
    }
  }
}

/**
 * API call for document download
 */
export async function downloadApplicationDocument(
  applicationId: string,
  documentId: string,
  fileName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `/api/applications/${applicationId}/documents/${documentId}/download`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to download document")
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)

    return { success: true, message: "Document downloaded successfully" }
  } catch (error) {
    console.error("[clms] Document download error:", error)
    return { success: false, message: "Failed to download document" }
  }
}
