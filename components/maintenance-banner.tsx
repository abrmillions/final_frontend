 "use client"
 
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
 import { useAuth } from "@/lib/auth/auth-context"
 import { ShieldAlert } from "lucide-react"
 
 export default function MaintenanceBanner({ forceShow }: { forceShow?: boolean }) {
  const { maintenanceMode } = useAuth()
  
  // Show if either the server-side initial check or the client-side polling says maintenance is on
  const show = forceShow || maintenanceMode

  if (!show) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-9999 w-full pointer-events-none">
       <Alert className="border-amber-300 bg-amber-50 text-amber-800 pointer-events-auto">
         <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Maintenance in Progress</AlertTitle>
        <AlertDescription>The system is currently in Maintenance in Progress updating. Please check back later.</AlertDescription>
       </Alert>
     </div>
   )
 }
