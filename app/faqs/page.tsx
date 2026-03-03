import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"

export const metadata = {
  title: "FAQs",
  description: "Answers to common licensing questions, requirements, and system use.",
}

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Frequently Asked Questions</h1>
      <p className="mt-3 text-slate-600">Find quick answers about licensing, processing times, renewals, document standards, fees, and account issues.</p>
      <div className="mt-8 rounded-lg border bg-white">
        <Accordion type="single" collapsible>
          <AccordionItem value="q1">
            <AccordionTrigger>How long does processing take?</AccordionTrigger>
            <AccordionContent>Typical review time is 5–10 business days after a complete submission. Incomplete or unclear documents extend timelines.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>What documents are required?</AccordionTrigger>
            <AccordionContent>Requirements depend on the license type. Provide identification, professional credentials, tax clearance, insurance, and project references. Upload clear PDF or image files.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>How do I renew my license?</AccordionTrigger>
            <AccordionContent>Navigate to Licenses, select your license, and choose Renew. Submit updated documents and pay the renewal fee before the expiry date.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>Which photo should I upload?</AccordionTrigger>
            <AccordionContent>For professional competency, upload a recent professional photo that meets the system’s standards. Do not use passport photos unless specified for other license types.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q5">
            <AccordionTrigger>How are fees paid?</AccordionTrigger>
            <AccordionContent>Use the payment step in the application flow. Keep receipts for audit and future reference. Fees are posted per license category.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="q6">
            <AccordionTrigger>I cannot access my account</AccordionTrigger>
            <AccordionContent>Use Forgot Password, or contact Support with your registered email and ID. Accounts may be suspended for non‑compliance or security reasons.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </main>
  )
}
