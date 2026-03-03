import { RegisterForm } from "@/components/auth/register-form"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">CLMS</h1>
              <p className="text-xs text-muted-foreground">Construction License Management</p>
            </div>
          </Link>
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <RegisterForm />
      </div>
    </div>
  )
}
