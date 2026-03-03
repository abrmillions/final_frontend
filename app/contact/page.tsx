import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import ContactForm from "@/components/contact/contact-form"

export const metadata = {
  title: "Contact",
  description: "Contact the Oromia Construction Authority for support and licensing inquiries.",
}

export default function Page({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Contact</h1>
      <p className="mt-3 text-slate-600">Reach the Oromia Construction Authority for technical support and licensing questions.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
            <CardDescription>Send us your request and we will respond during office hours.</CardDescription>
          </CardHeader>
          <CardContent>
            {searchParams && (searchParams["sent"] === "1" || searchParams["sent"] === "true") ? (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Your message has been sent successfully.
              </div>
            ) : null}
            <ContactForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Authority Details</CardTitle>
            <CardDescription>Oromia Construction Authority service desk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>Email: support@oca.gov.et</p>
            <p>Phone: +251 11 000 0000</p>
            <p>Address: Addis Ababa, Oromia Construction Authority</p>
            <p>Working Hours: Monday–Friday, 9:00–17:00 (EAT)</p>
            <div className="mt-4 h-40 w-full rounded-md border bg-slate-100" aria-label="Map placeholder" />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
