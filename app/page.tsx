 "use client"
 
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Building2,
  FileText,
  Users,
  Package,
  QrCode,
  BarChart3,
  Shield,
  CheckCircle2,
  Clock,
  Globe,
  Menu,
  X,
} from "lucide-react"
import Stats from "@/components/Stats"
import { Footer } from "@/components/Footer"
import { useAuth } from "@/lib/auth/auth-context"
import { useEffect, useState } from "react"
import SystemBrand from "@/components/system/system-brand"

export default function HomePage() {
  const { user } = useAuth()
  const isAdmin = (user?.role || "").toLowerCase() === "admin"
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground"><SystemBrand /></h1>
              <p className="text-xs text-muted-foreground">Construction License Management</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-base font-bold text-foreground leading-none"><SystemBrand /></h1>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Services
            </Link>
            <Link href="/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Verify License
            </Link>
            <Link href="/partner/public/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Verify Partnership
            </Link>
            <Link href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Register</Link>
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-card animate-in slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
              <Link 
                href="#services" 
                className="text-base font-medium text-slate-600 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link 
                href="/verify" 
                className="text-base font-medium text-slate-600 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Verify License
              </Link>
              <Link 
                href="/partner/public/verify" 
                className="text-base font-medium text-slate-600 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Verify Partnership
              </Link>
              <Link 
                href="#about" 
                className="text-base font-medium text-slate-600 px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <hr className="my-2" />
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-full justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button className="w-full justify-start" asChild onClick={() => setIsMenuOpen(false)}>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative py-12 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-accent/5 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground mb-6">
              <Shield className="w-4 h-4 shrink-0" />
              <span className="text-xs sm:text-sm font-medium uppercase tracking-wider">Government e-Platform</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground mb-6 text-balance leading-tight">
              Digital Licensing For The Construction Sector
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto px-2">
              Streamline your licensing process with our comprehensive platform for contractor licenses, professional
              certifications, import/export permits, partnerships and vehicle registry.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-sm sm:max-w-none mx-auto">
              <Button size="lg" asChild className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base font-bold shadow-lg">
                <Link href="/register">Apply for License</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base font-bold bg-transparent border-slate-200">
                <Link href="/verify">Verify a License</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 overflow-hidden">
          {/* Dynamic stats fetched from backend */}
          <Stats />
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">Our Services</h3>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive licensing and verification services for the construction industry
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Building2,
                title: "Contractor Licenses",
                description:
                  "Apply for and manage construction contractor licenses with automated processing and status tracking.",
              },
              {
                icon: Users,
                title: "Professional Licenses",
                description: "Engineer and architect certification with document verification and digital credentials.",
              },
              {
                icon: Package,
                title: "Import/Export Permits",
                description: "Equipment and material import/export license management with customs integration.",
              },
              {
                icon: FileText,
                title: "Partnership Management",
                description: "Joint venture and partnership verification for collaborative projects.",
              },
              {
                icon: Globe,
                title: "Vehicle & Equipment",
                description: "Track and register construction vehicles and equipment across projects.",
              },
              {
                icon: QrCode,
                title: "QR Verification",
                description: "Instant license verification through secure QR code scanning technology.",
              },
            ].map((service, i) => (
              <Card key={i} className="hover:shadow-lg transition-all duration-300 border-slate-200">
                <CardHeader className="p-5 sm:p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-bold">{service.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed mt-2">{service.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-8">Why Choose Our Platform?</h3>
              <div className="space-y-6 sm:space-y-8">
                {[
                  {
                    icon: CheckCircle2,
                    title: "Automated Workflow",
                    description: "Automated application processing reducing manual overhead.",
                  },
                  {
                    icon: Clock,
                    title: "Real-time Tracking",
                    description: "Monitor your application status and receive instant notifications.",
                  },
                  {
                    icon: Shield,
                    title: "Secure & Compliant",
                    description: "Government-grade security with full regulatory compliance.",
                  },
                  {
                    icon: BarChart3,
                    title: "Analytics Dashboard",
                    description: "Comprehensive reporting and insights for administrators.",
                  },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 sm:gap-5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 shadow-sm">
                      <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1 text-base sm:text-lg">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <Card className="p-4 sm:p-8 bg-white border-slate-200 shadow-xl overflow-hidden group">
                <div className="aspect-square rounded-2xl bg-linear-to-br from-primary/10 via-accent/10 to-background flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
                  <QrCode className="w-32 h-32 sm:w-48 sm:h-48 text-primary/30 group-hover:scale-110 transition-transform duration-500" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground border-none overflow-hidden shadow-2xl">
            <CardContent className="p-8 sm:p-12 md:p-16 text-center relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Shield className="w-32 h-32 sm:w-64 sm:h-64 rotate-12" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 sm:mb-6 tracking-tight">Ready to Get Started?</h3>
                <p className="text-base sm:text-lg mb-8 sm:mb-10 text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of professionals and contractors using our platform for efficient license management and compliance.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto h-12 sm:h-14 px-10 text-base font-bold shadow-lg">
                    <Link href="/register">Create Account</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="w-full sm:w-auto h-12 sm:h-14 px-10 text-base font-bold bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <Link href="/verify">Verify License</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 border-t border-border bg-muted/30 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">About <SystemBrand /></h3>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
              The Construction License Management System (<SystemBrand />) is a unified platform for applying,
              issuing, and verifying construction-related licenses. It streamlines contractor,
              professional, and permit workflows with secure QR verification and digital credentials.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl sm:text-2xl font-bold">What We Provide</CardTitle>
                <CardDescription className="text-sm">End-to-end licensing and verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm sm:text-base text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>Online applications and real-time status tracking</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>Automated license issuance and renewal processing</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>Secure QR-based verification for instant authenticity checks</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl sm:text-2xl font-bold">Why It Matters</CardTitle>
                <CardDescription className="text-sm">Transparency and trust in the industry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm sm:text-base text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>Significantly reduce fraudulent licenses with instant digital checks</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>Improve regulatory compliance and government oversight</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <p>Provide a public-facing portal for transparent verification</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  )
}
