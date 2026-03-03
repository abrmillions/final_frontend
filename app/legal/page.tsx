export const metadata = {
  title: "Legal",
  description: "Legal notices, system ownership, liability, and jurisdiction for the licensing portal.",
}

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Legal Notice</h1>
      <section className="mt-6 space-y-6 text-slate-700">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Regulatory Compliance</h2>
          <p className="mt-2 text-sm">The portal operates under Ethiopian construction sector laws and directives. All licensing decisions follow applicable regulations and official standards.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">System Ownership</h2>
          <p className="mt-2 text-sm">The Construction License Management System is owned and administered by the Oromia Construction Authority.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Liability</h2>
          <p className="mt-2 text-sm">The Authority is not liable for user‑submitted errors, incorrect documentation, or external system outages. Users are responsible for the accuracy of their submissions.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Jurisdiction</h2>
          <p className="mt-2 text-sm">This portal and its services are governed by the laws of Ethiopia. Disputes are subject to the jurisdiction of competent Ethiopian courts.</p>
        </div>
      </section>
    </main>
  )
}
