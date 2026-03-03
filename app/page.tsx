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
} from "lucide-react"
import Stats from "@/components/Stats"
import { Footer } from "@/components/Footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">CLMS</h1>
              <p className="text-xs text-muted-foreground">Construction License Management</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
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
          <div className="flex items-center gap-3">
          
            <Button variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Government e-Platform</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Digital Licensing for the Construction Sector
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
              Streamline your licensing process with our comprehensive platform for contractor licenses, professional
              certifications, and import/export permits.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href="/register">Apply for License</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                <Link href="/verify">Verify a License</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Dynamic stats fetched from backend */}
          <Stats />
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Services</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive licensing and verification services for the construction industry
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <service.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Why Choose Our Platform?</h3>
              <div className="space-y-6">
                {[
                  {
                    icon: CheckCircle2,
                    title: "Automated Workflow",
                    description: " Automated application processing",
                  },
                  {
                    icon: Clock,
                    title: "Real-time Tracking",
                    description: "Monitor your application status and receive instant notifications",
                  },
                  {
                    icon: Shield,
                    title: "Secure & Compliant",
                    description: "Government-grade security with full regulatory compliance",
                  },
                  {
                    icon: BarChart3,
                    title: "Analytics Dashboard",
                    description: "Comprehensive reporting and insights for administrators",
                  },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <Card className="p-8">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 via-accent/20 to-background flex items-center justify-center">
                  <QrCode className="w-32 h-32 text-primary/40" />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-lg mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                Join thousands of professionals and contractors using our platform for efficient license management.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                  <Link href="/register">Create Account</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link href="/verify">Verify License</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 border-t border-border bg-muted/30 scroll-mt-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About CLMS</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The Construction License Management System (CLMS) is a unified platform for applying,
              issuing, and verifying construction-related licenses. It streamlines contractor,
              professional, and permit workflows with secure QR verification and digital credentials.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>What We Provide</CardTitle>
                <CardDescription>End-to-end licensing and verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Online applications and status tracking</p>
                <p>• Automated license issuance</p>
                <p>• QR-based verification for authenticity</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Why It Matters</CardTitle>
                <CardDescription>Transparency and trust in the industry</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Reduce fraud with instant checks</p>
                <p>• Improve compliance and oversight</p>
                <p>• Provide public-facing verification portal</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  )
}
