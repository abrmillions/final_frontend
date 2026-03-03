export const metadata = {
  title: "Terms of Service",
  description: "Conditions of use for the Construction License Management System.",
}

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Terms of Service</h1>
      <section className="mt-6 space-y-6 text-slate-700">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">User Responsibilities</h2>
          <p className="mt-2 text-sm">You must provide accurate information, keep your credentials secure, and update your profile when changes occur.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Acceptable Use</h2>
          <p className="mt-2 text-sm">Do not misuse the system, disrupt services, submit fraudulent documents, or access accounts without authorization.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Account Termination</h2>
          <p className="mt-2 text-sm">Accounts may be suspended or terminated for violations, fraud, security threats, or non‑compliance. Appeals can be submitted through the Support channel.</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Regulatory Compliance</h2>
          <p className="mt-2 text-sm">All activities must align with Ethiopian construction sector laws and directives. The Oromia Construction Authority oversees compliance and enforcement.</p>
        </div>
      </section>
    </main>
  )
}
