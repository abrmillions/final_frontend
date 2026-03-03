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
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      toast({
        title: "Missing Information",
        description: "Please fill in all payment details.",
        variant: "destructive",
      })
      return
    }

    try {
      toast({ title: "Payment Processing", description: "Your payment is being processed..." })
      const price = renewalOptions.find((o) => o.value === renewalPeriod)?.price || 0
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: price, cardNumber, expiryDate: cardExpiry, cvv: cardCvv }),
      })
      const json = await res.json()
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "Payment processing failed")
      }

      const client = await import("@/lib/api/django-client")
      const meta = {
        application_id: applicationId,
        license_id: id,
        renewal_period: renewalPeriod,
        transaction_id: json.transactionId,
      }
      await client.paymentsApi.create({
        amount: price,
        currency: "USD",
        status: "completed",
        metadata: meta,
      })

      setStep(3)
      toast({ title: "Payment Successful", description: "Your renewal payment has been recorded." })
    } catch (e: any) {
      toast({ title: "Payment Failed", description: e?.message || "Payment processing failed", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
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
            <Button variant="outline" asChild>
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
                            <span className="text-lg font-bold text-blue-600">${option.price}</span>
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
                    <p className="text-3xl font-bold text-blue-600">${selectedOption?.price}</p>
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
                      <p className="text-2xl font-bold text-blue-600">${selectedOption?.price}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Payment Method</Label>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-3 border rounded-lg p-4">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Credit / Debit Card
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        placeholder="John Smith"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardExpiry">Expiry Date</Label>
                        <Input
                          id="cardExpiry"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input
                          id="cardCvv"
                          placeholder="123"
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-2 pt-4">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                    I agree to the terms and conditions for license renewal and authorize the payment of $
                    {selectedOption?.price}
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handlePayment}>
                    Pay ${selectedOption?.price}
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
                    {new Date(
                      new Date(license.expiryDate).setFullYear(
                        new Date(license.expiryDate).getFullYear() + Number.parseInt(renewalPeriod),
                      ),
                    ).toLocaleDateString()}
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
