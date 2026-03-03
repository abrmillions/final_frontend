export const metadata = {
  title: "Support",
  description: "Technical and licensing support for the Construction License Management System.",
}

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Support</h1>
      <p className="mt-3 text-slate-600">
        Get assistance with registration, license applications, document submissions, payments, and account access. This service supports contractors, licensed professionals, and government staff using the Construction License Management System.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Support Channels</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-slate-900">Email Support</h3>
            <p className="mt-2 text-sm text-slate-600">support@oca.gov.et</p>
            <p className="mt-1 text-sm text-slate-600">Target response: within one business day.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-slate-900">Phone Support</h3>
            <p className="mt-2 text-sm text-slate-600">+251 11 000 0000</p>
            <p className="mt-1 text-sm text-slate-600">Office hours: Monday–Friday, 9:00–17:00 (EAT).</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-slate-900">Ticket Portal</h3>
            <p className="mt-2 text-sm text-slate-600">Submit technical and licensing requests through the portal’s Support menu. Include license type and application ID for faster handling.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-slate-900">On‑Premise Service</h3>
            <p className="mt-2 text-sm text-slate-600">Oromia Construction Authority Service Desk, Addis Ababa. Bring identification and supporting documents.</p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">Role‑Based Support</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-slate-900">Contractors</h3>
            <p className="mt-2 text-sm text-slate-600">Assistance with grade selection, renewal timelines, insurance and tax clearance, and progress tracking.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-slate-900">Professionals</h3>
            <p className="mt-2 text-sm text-slate-600">Guidance on competency verification, professional photo submission, document standards, and certificate issuance.</p>
          </div>
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-sm font-medium text-slate-900">Government Staff</h3>
            <p className="mt-2 text-sm text-slate-600">Support for application review workflows, audit logs, and regulatory reporting.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
