import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export const metadata = {
  title: "Help Center",
  description: "Guides and resources for registration, applications, payments, and tracking.",
}

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Help Center</h1>
      <p className="mt-3 text-slate-600">Step‑by‑step guidance for using the Construction License Management System.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registration</CardTitle>
            <CardDescription>Create a secure account and verify your email.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>Provide your legal name, email, and phone number. Verify your email within 24 hours.</p>
            <p>Set a strong password and enable notifications to receive status updates.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>License Application</CardTitle>
            <CardDescription>Submit a new application for your license type.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>Choose Contractor, Professional Competency, or Import/Export licensing. Complete all required sections.</p>
            <p>Attach supporting documents in clear, legible format and review before submission.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Document Upload</CardTitle>
            <CardDescription>Accepted formats and photo standards.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>Accepted file types: PDF, JPEG, PNG. Maximum size: 10 MB per file.</p>
            <p>Professional photo: front‑facing, plain background, recent, aligned to system guidelines.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>Pay licensing fees securely.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>Use supported payment channels. Keep the receipt for audit and verification.</p>
            <p>Fees are non‑refundable once the application enters review.</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Track Status</CardTitle>
            <CardDescription>Follow your application through review and issuance.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 space-y-2">
            <p>Statuses include: Draft, Submitted, Under Review, Request for Information, Approved, Issued, or Rejected.</p>
            <p>Enable notifications to receive updates via email.</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-slate-700">
          <p>Find answers to common questions in the FAQs.</p>
        </div>
        <Button asChild>
          <Link href="/faqs">Go to FAQs</Link>
        </Button>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">User Manuals & Training</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Overview Guide</CardTitle>
              <CardDescription>Roles, workflows, and regulatory context.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              <p>Covers key modules, review processes, and record‑keeping requirements for compliance.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Application Tutorial</CardTitle>
              <CardDescription>Walkthrough for first‑time users.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-700">
              <p>Demonstrates profile setup, document upload, fee payment, and certificate download.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
