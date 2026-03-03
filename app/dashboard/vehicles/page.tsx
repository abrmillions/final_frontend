"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Truck, Plus, Eye, Download } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { vehiclesApi } from "@/lib/api/django-client"
import { generateVehicleCertificatePDF } from "@/lib/downloads/pdf-generator"

export default function VehiclesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

    setDownloadingId(vehicle.id)
    try {
      const pdf = await generateVehicleCertificatePDF(vehicle)
      pdf.save(`Vehicle-Certificate-${vehicle.id}.pdf`)

      toast({
        title: "Downloaded",
        description: "Vehicle certificate PDF has been downloaded.",
      })
    } catch (error) {
      console.error("Error downloading:", error)
      toast({
        title: "Error",
        description: "Failed to download certificate PDF.",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Vehicle & Equipment Registry</h1>
              <p className="text-xs text-muted-foreground">{vehicles.length} vehicles registered</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button asChild className="h-8 px-3 text-xs w-full sm:w-auto">
              <Link href="/dashboard/vehicles/register">
                <Plus className="w-4 h-4 mr-2" />
                Register Vehicle
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-8 px-3 text-xs w-full sm:w-auto">
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
              <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {vehicle.data.vehicleType} - {vehicle.data.manufacturer} {vehicle.data.model}
                      </CardTitle>
                      <CardDescription>
                        Registration: {vehicle.data.registrationNumber} • Added{" "}
                        {new Date(vehicle.registeredAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(vehicle.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Plate Number:</span>
                      <p className="font-medium text-foreground">{vehicle.data.plateNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Year:</span>
                      <p className="font-medium text-foreground">{vehicle.data.year}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Owner:</span>
                      <p className="font-medium text-foreground">{vehicle.data.ownerName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Current Project:</span>
                      <p className="font-medium text-foreground">{vehicle.data.currentProject || "Not assigned"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {vehicle.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCertificate(vehicle)}
                        disabled={downloadingId === vehicle.id}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {downloadingId === vehicle.id ? "Downloading..." : "Download Certificate"}
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
