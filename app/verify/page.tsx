"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Building2, QrCode, Search, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import QRScanner from "@/components/qr-scanner"
import djangoApi, { licensesApi } from "@/lib/api/django-client"
import { parseQRData } from "@/lib/qr/qr-utils"
import { useAuth } from "@/lib/auth/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

function QueryReader({ onParams }: { onParams: (p: { licenseNumber?: string; token?: string }) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    const licenseNumber = searchParams.get('licenseNumber') || undefined
    const token = searchParams.get('token') || undefined
    onParams({ licenseNumber, token })
    // Intentionally run only once on mount to avoid dependency length changes during HMR
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

export default function VerifyPage() {
  const [licenseNumber, setLicenseNumber] = useState("")
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { maintenanceMode } = useAuth()
  const { toast } = useToast()

  const localVerify = async (targetNumber?: string) => {
    const num = String(targetNumber || licenseNumber || '').trim()
    if (!num) return false
    try {
      const all: any[] = await licensesApi.list()
      const target = (all || []).find((lic) => {
        const n = String(
          lic.license_number ||
            (lic.data && (lic.data.licenseNumber || lic.data.registrationNumber)) ||
            ''
        ).trim()
        return n.toUpperCase() === num.toUpperCase()
      })
      if (target) {
        const st = String(target.status || '').toLowerCase()
        const notExpired = !target.expiry_date || new Date(target.expiry_date) >= new Date()
        if (st === 'active' || st === 'approved') {
          if (notExpired) {
            setLicenseNumber(num)
            setVerificationResult({
              found: true,
              data: {
                licenseId: target.id,
                licenseNumber: num,
                companyName: target.data?.companyName || '',
                licenseType: target.license_type || '',
                issueDate: target.issued_date || target.data?.issueDate || 'N/A',
                expiryDate: target.expiry_date || target.data?.expiryDate || 'N/A',
                authorizedScope: target.license_type || '',
                status: target.status || 'active',
                verified: true,
              },
            })
            return true
          }
        }
      }
    } catch {}
    return false
  }

  const runVerification = async (options: { licenseNumber?: string; token?: string }) => {
    if (!options.licenseNumber && !options.token) return

    setIsSearching(true)
    setError(null)

    try {
      const result = await djangoApi.verifyLicense(options)
      
      if (result.valid) {
        // Ensure the input shows the verified license number
        if (result.license_number) {
          setLicenseNumber(result.license_number)
        }
        
        // Format license type for display
        const formatLicenseType = (type: string, subtype?: string) => {
          if (!type) return "Construction License"
          const typeMap: Record<string, string> = {
            contractor: "Contractor License",
            professional: "Professional License",
            vehicle: "Vehicle License"
          }
          const baseType = typeMap[type.toLowerCase()] || type
          if (subtype) {
            // Capitalize first letter of each word in subtype
            const formattedSubtype = subtype.split(/[-_\s]/).map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')
            return `${baseType} - Grade ${formattedSubtype}`
          }
          return baseType
        }
        
        setVerificationResult({
          found: true,
          data: {
            licenseId: result.id,
            licenseNumber: result.license_number,
            companyName: result.company_name || "",
            licenseType: formatLicenseType(result.license_type, result.subtype),
            issueDate: result.issued_date || "N/A",
            expiryDate: result.expiry_date || "N/A",
            authorizedScope: result.authorized_scope || result.license_type || "General Construction",
            status: result.status || "active",
            verified: true,
          },
        })
      } else {
        const ok = await localVerify(options.licenseNumber)
        if (!ok) {
          setVerificationResult({ found: false, data: null })
          const errorMsg = result.detail || "The license number you entered was not found in the database."
          setError(errorMsg)
          toast({
            title: "Verification Failed",
            description: errorMsg,
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      const ok = await localVerify(options.licenseNumber)
      if (!ok) {
        setVerificationResult({
          found: false,
          data: null,
        })
        const errorMsg = error?.message || 'An error occurred during verification.'
        setError(errorMsg)
        toast({
          title: "Verification Error",
          description: errorMsg,
          variant: "destructive",
        })
      }
    } finally {
      setIsSearching(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    await runVerification({ licenseNumber })
  }

  const handleParams = (p: { licenseNumber?: string; token?: string }) => {
    if (p.token) {
      void runVerification({ token: p.token })
      return
    }
    if (p.licenseNumber) {
      setLicenseNumber(p.licenseNumber)
      void runVerification({ licenseNumber: p.licenseNumber })
    }
  }

  const handleQRScan = (qrData: string) => {
    const parsed = parseQRData(qrData)
    const licNum = parsed?.licenseNumber || parsed?.licenseId || (parsed?.type === 'text' ? parsed.value : null)
    
    if (licNum) {
      setLicenseNumber(licNum)
      setShowScanner(false)
      void runVerification({ licenseNumber: licNum })
    } else {
      setError('Could not extract a valid license number from the QR code.')
      setShowScanner(false)
    }
  }

  // (download certificate handler removed; not currently used)

  return (
      <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="p-6">Loading...</div>}>
        <QueryReader onParams={handleParams} />
      </Suspense>
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">CLMS</h1>
              <p className="text-xs text-muted-foreground">License Verification Portal</p>
            </div>
          </Link>
          <Button variant="outlineBlueHover" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
        {maintenanceMode && (
          <div className="w-full">
            <div className="container mx-auto px-4 pb-3">
              <Alert className="border-amber-300 bg-amber-50 text-amber-800">
                <AlertTitle>Maintenance in Progress</AlertTitle>
                <AlertDescription>Verification may be temporarily unavailable during updates.</AlertDescription>
              </Alert>
            </div>
          </div>
        )}
      </header>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Verify Construction License</h2>
          <p className="text-muted-foreground">Enter a license number or scan the QR code to verify authenticity</p>
        </div>

        {!showScanner ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>License Verification</CardTitle>
              <CardDescription>Verify contractor licenses, professional certifications, and permits</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="licenseNumber"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="Enter license number (e.g., LIC-2026-000123)"
                      className="flex-1"
                      required
                    />
                    <Button type="submit" disabled={isSearching}>
                      <Search className="w-4 h-4 mr-2" />
                      {isSearching ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                  {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <div className="flex-1 border-t border-border"></div>
                  <span className="text-sm text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-border"></div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="w-full bg-transparent"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR Code with Camera
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="flex justify-center mb-8">
            <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
          </div>
        )}

        {verificationResult && (
          <Card className={verificationResult.found ? "border-accent" : "border-destructive"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {verificationResult.found ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      License Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-destructive" />
                      License Not Found
                    </>
                  )}
                </CardTitle>
                {verificationResult.found && (
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {verificationResult.found ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">License Number:</span>
                      <p className="font-medium text-foreground">{verificationResult.data.licenseNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">License Type:</span>
                      <p className="font-medium text-foreground">{verificationResult.data.licenseType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issue Date:</span>
                      <p className="font-medium text-foreground">{verificationResult.data.issueDate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expiry Date:</span>
                      <p className="font-medium text-foreground">{verificationResult.data.expiryDate}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground">Authorized Scope:</span>
                      <p className="font-medium text-foreground">{verificationResult.data.authorizedScope || verificationResult.data.scope}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">License is valid and verified</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This license has been issued by the Construction Licensing Authority and is currently active.
                      </p>
                    </div>
                  </div>

                  
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    The license number you entered was not found in our database.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please verify the license number and try again, or contact support for assistance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
