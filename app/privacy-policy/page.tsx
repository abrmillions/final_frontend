export const metadata = {
  title: "Privacy Policy",
  description: "Data protection practices, user rights, retention, and security measures.",
}

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Privacy Policy</h1>
      <section className="mt-6 space-y-6 text-slate-700">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Data Collection</h2>
          <p className="mt-2 text-sm">We collect identification, contact details, professional credentials, and licensing documents to process applications and manage issued licenses.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Use of Data</h2>
          <p className="mt-2 text-sm">Data is used for application review, verification, fee processing, audit compliance, and service improvement. We do not sell personal data.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Storage & Security</h2>
          <p className="mt-2 text-sm">Records are stored securely with encryption in transit and at rest. Access is restricted to authorized personnel. System activity is logged for audit.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">User Rights</h2>
          <p className="mt-2 text-sm">You may request access, correction, or deletion where legally permissible. Submit requests through the Support channel with proof of identity.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Retention</h2>
          <p className="mt-2 text-sm">Licensing records are retained per regulatory requirements. Non‑essential data is minimized and removed when no longer needed.</p>
        </div>
      </section>
    </main>
  )
}
