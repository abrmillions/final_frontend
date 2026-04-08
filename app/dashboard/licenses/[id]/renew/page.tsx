"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, ArrowLeft, CreditCard, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"

export default function RenewLicense() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [renewalPeriod, setRenewalPeriod] = useState("1year")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [applicationId, setApplicationId] = useState<string | null>(null)

  const [license, setLicense] = useState<{ id: string | undefined; type?: string; expiryDate?: string }>({ id })

  useEffect(() => {
    const load = async () => {
      try {
        const client = await import("@/lib/api/django-client")
        const lic = await client.licensesApi.getLicense(String(id))
        setLicense({
          id,
          type: lic.license_type,
          expiryDate: lic.expiry_date || lic.data?.expiryDate,
        })
      } catch {}
    }
    if (id) load()
  }, [id])

  const renewalOptions = [
    { value: "1year", label: "1 Year", price: 500 },
    { value: "2years", label: "2 Years", price: 900 },
    { value: "3years", label: "3 Years", price: 1200 },
  ]

  const selectedOption = renewalOptions.find((opt) => opt.value === renewalPeriod)

  const handlePayment = async () => {
    try {
      const price = renewalOptions.find((o) => o.value === renewalPeriod)?.price || 0
      
      const { paymentsApi: api } = await import("@/lib/api/django-client")
      
      const metadata = {
        purpose: "renewal",
        license_id: id,
        application_id: applicationId,
        renewal_period: renewalPeriod,
      }

      const chapaResponse = await api.initializeChapa({
        amount: price,
        currency: "ETB",
        metadata,
      })
      
      if (chapaResponse?.status === "success" && chapaResponse?.data?.checkout_url) {
        toast({ 
          title: "Payment Initialized! 🚀", 
          description: "Redirecting to Chapa checkout...",
          variant: "default",
        })
        
        // Save current license ID and path to verify after redirect back
        if (typeof window !== "undefined") {
          localStorage.setItem("clms_pending_payment_lic", String(id))
          localStorage.setItem("clms_pending_payment_tx", chapaResponse.data.tx_ref)
          localStorage.setItem("clms_pending_payment_purpose", "renewal")
          if (chapaResponse.data.checkout_url) {
            localStorage.setItem("clms_pending_payment_url", chapaResponse.data.checkout_url)
          }
        }

        setTimeout(() => {
          window.location.href = chapaResponse.data.checkout_url
        }, 1000)
      } else {
        throw new Error(chapaResponse?.message || "Failed to initialize payment with Chapa")
      }
    } catch (e: any) {
      toast({ title: "Payment Failed", description: e?.message || "Payment processing failed", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Renew License</h1>
                <p className="text-sm text-slate-600">{license.id}</p>
              </div>
            </div>
            <Button variant="outlineBlueHover" asChild>
              <Link href={`/dashboard/licenses/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to License
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Renewal Period</CardTitle>
                <CardDescription>Choose how long you want to renew your license for</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  {license.expiryDate && (
                    <p className="text-sm text-slate-600 mb-4">
                      Current expiry date:{" "}
                      <span className="font-semibold">{new Date(license.expiryDate).toLocaleDateString()}</span>
                    </p>
                  )}
                  <RadioGroup value={renewalPeriod} onValueChange={setRenewalPeriod}>
                    {renewalOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-lg font-bold text-blue-600">{option.price} ETB</span>
                          </div>
                          <p className="text-sm text-slate-500">
                            New expiry:{" "}
                            {license.expiryDate
                              ? new Date(
                                  new Date(license.expiryDate).setFullYear(
                                    new Date(license.expiryDate).getFullYear() + Number.parseInt(option.value),
                                  ),
                                ).toLocaleDateString()
                              : "—"}
                          </p>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-900">Total Amount</p>
                      <p className="text-sm text-slate-600">Including processing fees</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">{selectedOption?.price} ETB</p>
                  </div>
                </div>

              <Button
                className="w-full"
                size="lg"
                onClick={async () => {
                  try {
                    const client = await import("@/lib/api/django-client")
                    const data = { data: { renewalPeriod } }
                    const app = await client.licensesApi.renew(String(id), data)
                    const appId = String(app?.id || app?.application?.id || "")
                    if (appId) setApplicationId(appId)
                    setStep(2)
                  } catch (e: any) {
                    toast({ title: "Error", description: e?.message || "Failed to start renewal", variant: "destructive" })
                  }
                }}
              >
                  Continue to Payment
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Enter your payment details to complete the renewal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-50 border rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-600">Renewal Period</p>
                      <p className="font-semibold text-slate-900">{selectedOption?.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Amount Due</p>
                      <p className="text-2xl font-bold text-blue-600">{selectedOption?.price} ETB</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3 text-amber-800">
                    <CheckCircle className="h-5 w-5 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">Ready to Renew</p>
                      <p>You will be redirected to Chapa's secure checkout to complete your renewal payment of {selectedOption?.price} ETB.</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-4">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                    I agree to the terms and conditions for license renewal and authorize the payment of{" "}
                    {selectedOption?.price} ETB
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handlePayment}>
                    Pay {selectedOption?.price} ETB & Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-emerald-600" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Payment Successful!</h2>
                <p className="text-slate-600 mb-2">Your license has been renewed successfully.</p>
                <p className="text-slate-600 mb-8">
                  New expiry date:{" "}
                  <span className="font-semibold">
                    {(() => {
                      const base = license.expiryDate ? new Date(license.expiryDate) : new Date()
                      const yrs = Number.parseInt(renewalPeriod || "1")
                      const d = new Date(base)
                      d.setFullYear(base.getFullYear() + (isNaN(yrs) ? 1 : yrs))
                      return d.toLocaleDateString()
                    })()}
                  </span>
                </p>
                <div className="space-y-3">
                  <Button asChild className="w-full">
                    <Link href={`/dashboard/licenses/${id}`}>View Updated License</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/dashboard/licenses">Back to My Licenses</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
