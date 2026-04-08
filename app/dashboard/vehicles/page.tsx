"use client"

import { Suspense } from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Truck, Plus, Eye, Download } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { vehiclesApi } from "@/lib/api/django-client"
import { generateVehicleCertificatePDF } from "@/lib/downloads/pdf-generator"

function VehiclesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const processedPaidIdRef = useRef<string | null>(null)

  useEffect(() => {
    const paid = searchParams.get("paid")
    const id = searchParams.get("id")
    
    if (paid === "1" && id && vehicles.length > 0) {
      // Prevent double download
      if (processedPaidIdRef.current === id) return;
      
      const target = vehicles.find((v) => String(v.id) === String(id))
      if (target) {
        // Trigger download directly since payment is already verified via URL param
        const triggerDownload = async () => {
          processedPaidIdRef.current = id;
          setDownloadingId(target.id)
          try {
            const pdf = await generateVehicleCertificatePDF(target)
            pdf.save(`Vehicle-Certificate-${target.id}.pdf`)
            toast({
              title: "Payment Successful! 🎉",
              description: "Your vehicle certificate has been downloaded.",
            })
            // Clean up URL
            const url = new URL(window.location.href)
            url.searchParams.delete("paid")
            url.searchParams.delete("id")
            window.history.replaceState({}, "", url.toString())
          } catch (error) {
            console.error("Failed to download certificate:", error)
            processedPaidIdRef.current = null; // Reset on failure
          } finally {
            setDownloadingId(null)
          }
        }
        triggerDownload()
      }
    }
  }, [searchParams, vehicles, toast])

  useEffect(() => {
    // Surface background uploads indicator set during registration
    try {
      if (typeof window !== "undefined") {
        const flag = window.localStorage.getItem("clms_bg_uploads")
        if (flag) {
          toast({
            title: "Uploads in progress",
            description: "Your vehicle documents are uploading in the background.",
          })
          window.localStorage.removeItem("clms_bg_uploads")
        }
      }
    } catch {}

    const fetchVehicles = async () => {
      try {
        const data = await vehiclesApi.list()
        setVehicles(data)
      } catch (error) {
        console.error("Failed to fetch vehicles:", error)
        const status = (error as any)?.status
        if (status === 401) {
          toast({
            title: "Login Required",
            description: "Please log in to view your vehicles.",
            variant: "destructive",
          })
          router.push("/login")
        } else {
          toast({
            title: "Error",
            description: "Failed to load vehicles.",
            variant: "destructive",
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchVehicles()
  }, [toast])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending Verification</Badge>
      case "inactive":
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-700 dark:text-gray-400">
            Inactive
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleDownloadCertificate = async (vehicle: any) => {
    if (vehicle.status !== "active") {
      toast({
        title: "Not Available",
        description: "Certificates are only available for active vehicles.",
        variant: "destructive",
      })
      return
    }

    const type = String(vehicle.data?.vehicleType || "").toLowerCase()
    const category = type.includes("machinery") ? "heavy-machinery" : "commercial-vehicle"

    // Redirect to payment page instead of downloading directly
    router.push(`/dashboard/payments/certificate/${vehicle.id}?section=vehicle&category=${category}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">Vehicle Management</h1>
              <p className="text-xs text-muted-foreground">{vehicles.length} vehicles registered</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button asChild size="sm" className="h-8 px-3 text-xs w-full sm:w-auto">
              <Link href="/dashboard/vehicles/register">
                <Plus className="w-4 h-4 mr-2" />
                Register Vehicle
              </Link>
            </Button>
            <Button variant="outlineBlueHover" size="sm" asChild className="h-8 px-3 text-xs w-full sm:w-auto">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Vehicles Registered</h3>
              <p className="text-muted-foreground mb-6">
                Register construction vehicles and equipment for project tracking and compliance.
              </p>
              <Button asChild>
                <Link href="/dashboard/vehicles/register">
                  <Plus className="w-4 h-4 mr-2" />
                  Register Vehicle
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="hover:shadow-md transition-all duration-200 border-slate-200 overflow-hidden">
                <CardHeader className="px-4 sm:px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border shadow-sm">
                        <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-snug truncate">
                          {vehicle.data.vehicleType} - {vehicle.data.manufacturer} {vehicle.data.model}
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs mt-1 font-medium">
                          Registration: {vehicle.data.registrationNumber} • Added{" "}
                          {new Date(vehicle.registeredAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="shrink-0 scale-90 sm:scale-100 origin-right">
                      {getStatusBadge(vehicle.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-5 pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm mb-5 p-3 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Plate Number</span>
                      <p className="font-semibold text-slate-900">{vehicle.data.plateNumber}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Year</span>
                      <p className="font-semibold text-slate-900">{vehicle.data.year}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Owner</span>
                      <p className="font-semibold text-slate-900 truncate">{vehicle.data.ownerName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Current Project</span>
                      <p className="font-semibold text-slate-900 truncate">{vehicle.data.currentProject || "Not assigned"}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {vehicle.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm flex-1 sm:flex-none"
                        onClick={() => handleDownloadCertificate(vehicle)}
                        disabled={downloadingId === vehicle.id}
                      >
                        <Download className="w-3.5 h-3.5 mr-2" />
                        {downloadingId === vehicle.id ? "..." : "Certificate"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <VehiclesContent />
    </Suspense>
  )
}
