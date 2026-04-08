import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ContactForm from "@/components/contact/contact-form";
import AuthorityDetails from "@/components/contact/authority-details";

export const metadata = {
  title: "Contact",
  description:
    "Contact the Oromia Construction Authority for support and licensing inquiries.",
};
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sentValue = Array.isArray(params?.sent)
    ? params?.sent?.[0]
    : params?.sent;
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Contact
      </h1>
      <p className="mt-3 text-slate-600">
        Reach the Oromia Construction Authority for technical support and
        licensing questions.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Form</CardTitle>
            <CardDescription>
              Send us your request and we will respond during office hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sentValue === "1" || sentValue === "true" ? (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Your message has been sent successfully.
              </div>
            ) : null}
            <ContactForm />
          </CardContent>
        </Card>

        <AuthorityDetails />
      </div>
    </main>
  );
}
