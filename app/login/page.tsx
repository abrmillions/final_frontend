import { LoginForm } from "@/components/auth/login-form"
import { Button } from "@/components/ui/button"
import { Building2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
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
          <div className="flex gap-2">
            {/* <Button variant="outline" asChild>
              <Link href="/admin-login">Admin Login</Link>
            </Button> */}
            <Button variant="outline" asChild>
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
