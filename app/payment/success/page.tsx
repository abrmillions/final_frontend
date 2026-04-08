"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  Loader2,
  Home,
  FileText,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [licenseId, setLicenseId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyPayment = async () => {
      if (typeof window === "undefined") return;

      const txRef = localStorage.getItem("clms_pending_payment_tx");
      const licId = localStorage.getItem("clms_pending_payment_lic");
      const p = localStorage.getItem("clms_pending_payment_purpose");

      if (!txRef) {
        if (isMounted) {
          setError("No recent transaction reference found.");
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLicenseId(licId);
        setPurpose(p);
      }

      try {
        // Use dynamic import to avoid potential circular dependencies or loading issues
        const { paymentsApi } = await import("@/lib/api/django-client");
        const response = await paymentsApi.verifyChapa(txRef);

        if (!isMounted) return;

        if (response.status === "success") {
          setPaymentData(response.data);
          toast({
            title: "Payment Verified! 🎉",
            description: "Your payment has been successfully processed.",
          });

          const autoApproved = response.data?.auto_approved === true;

          // Trigger download if licenseId exists and it's not a renewal (OR if it's an auto-approved renewal)
          if (licId && (p !== "renewal" || autoApproved)) {
            handleDownload(licId);
          } else if (licId && p === "renewal") {
            toast({
              title: "Renewal Submitted! ⏳",
              description:
                "Your renewal payment was successful. Your license will be updated once approved by an administrator.",
            });
          }
        } else {
          setError(
            "Verification failed. Please contact support if you have been charged.",
          );
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "An error occurred during verification.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // Clear pending items so we don't re-verify on refresh
          localStorage.removeItem("clms_pending_payment_tx");
          localStorage.removeItem("clms_pending_payment_lic");
          localStorage.removeItem("clms_pending_payment_section");
          localStorage.removeItem("clms_pending_payment_purpose");
        }
      }
    };

    verifyPayment();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = async (id: string) => {
    try {
      const section =
        localStorage.getItem("clms_pending_payment_section") || "contractor";

      const { licensesApi, partnershipsApi, vehiclesApi } =
        await import("@/lib/api/django-client");
      const {
        generateLicensePDF,
        generatePartnershipPDF,
        generateVehicleCertificatePDF,
      } = await import("@/lib/downloads/pdf-generator");

      let pdf: any;
      let fileName: string = `Certificate_${id}.pdf`;

      if (section === "partnership") {
        const detail = await partnershipsApi.getDetail(id);
        pdf = await generatePartnershipPDF(detail);
        fileName = `Partnership_${id}.pdf`;
      } else if (section === "vehicle") {
        const detail = await vehiclesApi.getDetail(id);
        pdf = await generateVehicleCertificatePDF(detail);
        fileName = `Vehicle_${id}.pdf`;
      } else {
        const response = await licensesApi.download(id);

        // response is now the JSON data of the license
        if (!response || !response.license) {
          throw new Error("License data not found");
        }

        pdf = await generateLicensePDF(response.license);
        fileName = `License_${id}.pdf`;
      }

      if (pdf) {
        pdf.save(fileName);
        toast({
          title: "Certificate Downloaded",
          description: "Your certificate has been generated and saved.",
        });
      }
    } catch (error: any) {
      console.error("Download error:", error);
      const isApprovalError =
        error.message?.toLowerCase().includes("approval required") ||
        error.error?.detail?.toLowerCase().includes("approval required");

      toast({
        title: isApprovalError ? "Approval Pending" : "Download Failed",
        description: isApprovalError
          ? "Your payment was successful. The certificate is currently awaiting administrative approval and will be available for download shortly."
          : "Unable to download the certificate automatically. Please try downloading it from your dashboard.",
        variant: isApprovalError ? "default" : "destructive",
      });
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const { generateReceiptPDF } =
        await import("@/lib/downloads/pdf-generator");

      // Prepare the payment data for the receipt
      const receiptData = {
        tx_ref:
          paymentData?.tx_ref ||
          localStorage.getItem("clms_pending_payment_tx") ||
          "N/A",
        amount: paymentData?.amount || "0",
        currency: paymentData?.currency || "ETB",
        payment_method: paymentData?.payment_method || "telebirr",
        payer_name: paymentData?.customer?.first_name
          ? `${paymentData.customer.first_name} ${paymentData.customer.last_name || ""}`
          : "Customer",
        email: paymentData?.customer?.email || "N/A",
        phone_number: paymentData?.customer?.mobile || "N/A",
        payment_date: new Date()
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-"),
        bank_ref: paymentData?.reference || "N/A",
      };

      const pdf = await generateReceiptPDF(receiptData);
      pdf.save(`Receipt_${receiptData.tx_ref}.pdf`);

      toast({
        title: "Receipt Downloaded",
        description:
          "Your official payment receipt has been generated and saved.",
      });
    } catch (error: any) {
      console.error("Receipt download error:", error);
      toast({
        title: "Download Failed",
        description:
          "Unable to generate the receipt PDF. Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-sm border-none sm:border">
          <CardContent className="flex flex-col items-center py-10 sm:py-16 px-6 text-center">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-blue-600 mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              Verifying Payment...
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-xs">
              Please wait while we confirm your transaction with Chapa. This
              will only take a moment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-100 shadow-md">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
                <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-red-900">
              Something went wrong
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-2">
              {error}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-3 pt-6">
            <Button
              className="w-full h-11 text-sm font-bold shadow-sm"
              onClick={() => router.push("/dashboard/licenses")}
            >
              Go to My Licenses
            </Button>
            <Button
              variant="outline"
              className="w-full h-11 text-sm font-bold"
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg border-none sm:border overflow-hidden">
        <CardHeader className="text-center pb-2 pt-6 sm:pt-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shadow-inner">
              <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Payment Successful!
          </CardTitle>
          <CardDescription className="text-sm sm:text-base font-medium text-slate-500 mt-1">
            Your transaction has been completed successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-5 sm:px-8">
          {paymentData && (
            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Receipt className="h-3 w-3" />
                Transaction Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Reference
                  </span>
                  <span className="text-[11px] sm:text-xs font-mono text-slate-700 break-all text-right">
                    {paymentData.tx_ref || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-100 pt-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Amount
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {paymentData.amount} {paymentData.currency || "ETB"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-100 pt-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Method
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-slate-700 capitalize">
                    {paymentData.payment_method || "Telebirr"}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 border-t border-slate-100 pt-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </span>
                  <span className="text-[11px] sm:text-xs font-extrabold text-green-600 uppercase tracking-widest">
                    PAID
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {licenseId &&
              (purpose !== "renewal" ||
                paymentData?.auto_approved === true) && (
                <Button
                  variant="outline"
                  className="w-full h-10 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm transition-all active:scale-95"
                  onClick={() => handleDownload(licenseId)}
                >
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Download Certificate
                </Button>
              )}

            {purpose === "renewal" && paymentData?.auto_approved !== true && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] sm:text-[11px] text-blue-800 text-center font-medium leading-relaxed">
                Your license renewal is pending final administrative approval.
                You can download your updated certificate from the dashboard
                once approved.
              </div>
            )}

            <Button
              variant="outline"
              className="w-full h-10 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
              onClick={handleDownloadReceipt}
              disabled={!paymentData}
            >
              <FileText className="mr-2 h-3.5 w-3.5" />
              Download Receipt
            </Button>

            <Button
              variant="default"
              className="w-full h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 shadow-md transition-all active:scale-95"
              onClick={() => router.push("/dashboard/licenses")}
            >
              <Home className="mr-2 h-3.5 w-3.5" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-slate-50 pt-4 pb-6">
          <p className="text-[10px] sm:text-[11px] text-center text-slate-400 font-medium px-4">
            A confirmation email has been sent to your registered address. For
            support, please quote your reference number.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
