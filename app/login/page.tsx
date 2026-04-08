 "use client"
 
import { LoginForm } from "@/components/auth/login-form"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import SystemBrand from "@/components/system/system-brand"

export default function LoginPage() {
  const { maintenanceMode } = useAuth()
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate"><SystemBrand /></h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Construction License Management</p>
            </div>
          </Link>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    </div>
  )
}
