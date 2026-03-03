import { type NextRequest, NextResponse } from "next/server"

interface QRGenerationRequest {
  licenseId: string
  licenseNumber: string
  holderName: string
  verificationUrl: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QRGenerationRequest

    const { licenseId, licenseNumber, holderName, verificationUrl } = body

    if (!licenseNumber || !verificationUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // In production, this would call the Django backend to store QR metadata
    // For now, return the QR data that should be encoded
    const qrData = {
      id: licenseId,
      licenseNumber,
      holderName,
      verificationUrl,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }

    console.log("[clms] QR generation request:", qrData)

    return NextResponse.json({
      success: true,
      qrData: JSON.stringify(qrData),
      qrText: verificationUrl, // QRCode library will encode this
      message: "QR code data generated successfully",
    })
  } catch (error) {
    console.error("[clms] QR generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const licenseId = searchParams.get("licenseId")

    if (!licenseId) {
      return NextResponse.json(
        { error: "License ID is required" },
        { status: 400 }
      )
    }

    // In production, fetch from Django backend
    const qrData = {
      id: licenseId,
      licenseNumber: `LIC-${licenseId.toUpperCase()}`,
      status: "active",
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      qrData,
    })
  } catch (error) {
    console.error("[clms] QR retrieval error:", error)
    return NextResponse.json(
      { error: "Failed to retrieve QR code data" },
      { status: 500 }
    )
  }
}
