"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  generateApplicationPDF,
  generateLicensePDF,
} from "@/lib/downloads/pdf-generator";
import { downloadPDF } from "@/lib/downloads/file-download";
import { applicationsApi, licensesApi } from "@/lib/api/django-client";
import {
  addOrUpdateCachedLicense,
  setAppLicenseMapping,
  getAppLicenseMapping,
  removeCachedLicense,
  removeAppLicenseMapping,
} from "@/lib/storage/licenses-cache";
import { useAuth } from "@/lib/auth/auth-context";
import {
  generateQRDataURL,
  createVerificationUrl,
  downloadQRCode,
  createLicenseQRPayload,
} from "@/lib/qr/qr-utils";
import { DJANGO_API_URL } from "@/lib/config/django-api";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ApplicationsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [appsLoading, setAppsLoading] = useState(true);
  const [error, setError] = useState("");
  const [licenses, setLicenses] = useState<any[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrVerificationUrl, setQrVerificationUrl] = useState<string | null>(
    null,
  );
  const [qrOpenFor, setQrOpenFor] = useState<string | null>(null);
  const [detailOpenFor, setDetailOpenFor] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [approvalRequired, setApprovalRequired] = useState<
    Record<string, string>
  >({});
  const [qrMeta, setQrMeta] = useState<{
    licenseNumber?: string;
    holderName?: string;
    companyName?: string;
    photoUrl?: string;
  } | null>(null);

function ArrivalBanner() {
  const params = useSearchParams();
  try {
    const newApp = params?.get("newApp");
    const appId = params?.get("appId");
    if (!newApp) return null;
    const label =
      newApp === "change-grade"
        ? "Grade Change"
        : newApp === "name-change"
        ? "Name Change"
        : newApp === "replacement"
        ? "Replacement"
        : "Application";
    return (
      <div className="mb-4 p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm">
        <strong>{label} submitted</strong>
        {appId ? ` — Application ID: ${appId}` : ""}
      </div>
    );
  } catch {
    return null;
  }
}

  useEffect(() => {
    // Show background-upload indicator if set by submit pages
    try {
      if (typeof window !== "undefined") {
        const flag = window.localStorage.getItem("clms_bg_uploads");
        if (flag) {
          toast({
            title: "Uploads in progress",
            description: "Your documents are uploading in the background.",
          });
          window.localStorage.removeItem("clms_bg_uploads");
        }
      }
    } catch {}

    // Wait for auth state to resolve before fetching; redirect if unauthenticated
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchApplications = async () => {
      try {
        setAppsLoading(true);
        const data = await applicationsApi.list();
        setApplications(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("[clms] Failed to fetch applications:", err);
        setError(err.message || "Failed to load applications");
        toast({
          title: "Error",
          description: "Failed to load applications",
          variant: "destructive",
        });
      } finally {
        setAppsLoading(false);
      }
    };

    fetchApplications();

    // fetch licenses for current user (if any)
    const fetchLicenses = async () => {
      try {
        const l = await licensesApi.list();
        setLicenses(Array.isArray(l) ? l : []);
      } catch (e) {
        console.warn("[clms] Failed to fetch licenses", e);
      }
    };

    fetchLicenses();
  }, [toast, isLoading, isAuthenticated, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="secondary"
            className="bg-green-500/10 text-green-700 dark:text-green-400"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="secondary"
            className="bg-red-500/10 text-red-700 dark:text-red-400"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "profile":
      case "contractor":
        return "Contractor License";
      case "professional":
        return "Professional License";
      case "company_representative":
      case "import-export":
        return "Import/Export License";
      default:
        // Try to handle raw values if they are already formatted
        if (
          type === "Contractor License" ||
          type === "Professional License" ||
          type === "Import/Export License"
        )
          return type;
        return type;
    }
  };

  const handleDownloadLicense = async (app: any) => {
    if (app.status !== "approved") {
      toast({
        title: "Not Available",
        description:
          "License downloads are only available for approved applications.",
        variant: "destructive",
      });
      return;
    }

    setDownloadingId(app.id);
    try {
      const data = app.data || {};
      const holderName =
        data.applicantName || data.fullName || app.applicant || "-";
      const companyName = data.companyName || data.company_name || "N/A";

      // Try to locate an existing License object for richer metadata
      const matched = licenses.find((lic: any) => {
        try {
          // match by owner id/email, license type or subtype if available
          if (
            lic.owner &&
            app.applicant &&
            String(lic.owner) === String(app.applicant)
          )
            return true;
          if (
            lic.license_type &&
            app.license_type &&
            lic.license_type === app.license_type
          )
            return true;
          const appYear = new Date(
            app.submittedAt || app.created_at || Date.now(),
          ).getFullYear();
          const fallbackNum = `LIC-${appYear}-${String(app.id).padStart(6, "0")}`;
          if (
            lic.data &&
            lic.data.registrationNumber &&
            (lic.data.registrationNumber === `LIC-${app.id}` ||
              lic.data.registrationNumber === fallbackNum)
          )
            return true;
        } catch (e) {
          return false;
        }
        return false;
      });

      const appYear = new Date(
        app.submittedAt || app.created_at || Date.now(),
      ).getFullYear();
      const fallbackLicenseNumber = `LIC-${appYear}-${String(app.id).padStart(6, "0")}`;
      // Prefer the license number saved on the application record itself, then the matched license, then fallback
      const savedLicenseNumber =
        app.data?.licenseNumber || app.data?.license_number;
      const licenseNumber =
        savedLicenseNumber ??
        matched?.data?.licenseNumber ??
        fallbackLicenseNumber;
      const issueDate =
        matched?.data?.issueDate ??
        (app.submittedAt || app.created_at || new Date().toISOString());
      const expiryDate =
        matched?.data?.expiryDate ??
        new Date(
          new Date(issueDate).setFullYear(
            new Date(issueDate).getFullYear() + 1,
          ),
        ).toISOString();

      // Build verification URL and QR code (include human-readable license number in URL)
      const verificationUrl = createVerificationUrl(
        undefined,
        matched?.id ? String(matched.id) : licenseNumber,
        licenseNumber,
      );

      const qrContent = {
        id: matched?.id ?? fallbackLicenseNumber,
        type: getTypeLabel(app.license_type || app.type),
        category: "License",
        holderName,
        companyName,
        registrationNumber: licenseNumber,
        issueDate: new Date(issueDate).toISOString(),
        expiryDate: new Date(expiryDate).toISOString(),
        status: matched?.status ?? "Active",
        verificationUrl,
      };

      const qrDataUrl = await generateQRDataURL(JSON.stringify(qrContent));

      const licensePayload = {
        ...qrContent,
        grade: (() => {
          try {
            const g =
              data.grade ??
              data.licenseType ??
              data.category ??
              matched?.data?.grade ??
              matched?.data?.licenseType ??
              matched?.data?.category;
            return g || "";
          } catch {
            return "";
          }
        })(),
        qrDataUrl,
        photoUrl: (() => {
          const raw =
            matched?.license_photo_base64 ||
            matched?.license_photo_url ||
            matched?.license_photo;
          if (!raw) return undefined;
          return typeof raw === "string" && raw.startsWith("http")
            ? raw
            : `${DJANGO_API_URL}${raw}`;
        })(),
      };

      // Try server-side download if we have a mapped backend license id
      // But always fall back to client-side generation if it fails (for approved apps)
      const mappedBackendId = getAppLicenseMapping(app.id) || matched?.id;

      if (mappedBackendId && app.status === "approved") {
        try {
          const resp = await licensesApi.download(String(mappedBackendId));
          // On success server returns serialized license object; build PDF client-side
          const licenseData = resp.license ?? resp;

          // Ensure we use the correct registration number for the QR code
          const finalRegNum =
            licenseData.data?.registrationNumber ??
            licensePayload.registrationNumber;
          // Force regeneration of verification URL and QR code to ensure consistency
          const finalVerificationUrl = createVerificationUrl(
            undefined,
            licenseData.id ? String(licenseData.id) : finalRegNum,
            finalRegNum,
          );

          const finalQrContent = {
            id: licenseData.id ?? licensePayload.id,
            registrationNumber: finalRegNum,
            type: licenseData.license_type ?? licensePayload.type,
            category: "License",
            holderName:
              licenseData.data?.holderName ?? licensePayload.holderName,
            companyName:
              licenseData.data?.companyName ?? licensePayload.companyName,
            issueDate:
              licenseData.issued_date ??
              licenseData.data?.issueDate ??
              licensePayload.issueDate,
            expiryDate:
              licenseData.expiry_date ??
              licenseData.data?.expiryDate ??
              licensePayload.expiryDate,
            status: licenseData.status ?? licensePayload.status,
            verificationUrl: finalVerificationUrl,
          };

          const finalQrDataUrl = await generateQRDataURL(
            JSON.stringify(finalQrContent),
          );

          const payloadFromServer = {
            ...finalQrContent,
            grade:
              licenseData?.data?.grade ??
              licenseData?.data?.licenseType ??
              licenseData?.data?.category ??
              "",
            qrDataUrl: finalQrDataUrl,
            photoUrl: (() => {
              const raw =
                licenseData.license_photo_base64 ||
                licenseData.license_photo_url ||
                licenseData.license_photo;
              if (!raw) return undefined;
              return typeof raw === "string" && raw.startsWith("http")
                ? raw
                : `${DJANGO_API_URL}${raw}`;
            })(),
          };

          const pdf = await generateLicensePDF(payloadFromServer);
          downloadPDF(
            pdf,
            `License-${payloadFromServer.registrationNumber}.pdf`,
          );
          toast({
            title: "Downloaded",
            description: "License certificate downloaded.",
          });
          return;
        } catch (err: any) {
          // For approved apps, always fall back to client-side generation on any error
          // This ensures downloads always work regardless of backend permission issues
          if (
            err?.status === 403 ||
            err?.status === 404 ||
            (err?.message && String(err.message).includes("Not permitted"))
          ) {
            // Quietly handle expected permission/not-found errors by removing the mapping
            console.debug(
              "[clms] Server download not available, falling back to client generation",
              err?.message,
            );
            removeAppLicenseMapping(app.id);
          } else {
            // eslint-disable-next-line no-console
            console.warn(
              "[clms] Server download failed, using client-side PDF generation",
              err?.status || err?.message || err,
            );
          }
          // Continue to client-side PDF generation below
        }
      }

      const pdf = await generateLicensePDF(licensePayload);
      downloadPDF(pdf, `License-${licensePayload.registrationNumber}.pdf`);
      toast({
        title: "Downloaded",
        description: "License certificate downloaded.",
      });
    } catch (error) {
      console.error("Error downloading:", error);
      toast({
        title: "Error",
        description: "Failed to download application.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                My Applications
              </h1>
              <p className="text-xs text-muted-foreground">
                {applications.length} total applications
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            asChild
            className="h-8 px-3 text-xs w-full sm:w-auto"
          >
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Suspense fallback={null}>
          <ArrivalBanner />
        </Suspense>
        {appsLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground">Loading applications...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <Button asChild>
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Applications Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                You haven't submitted any applications. Start by applying for a
                license.
              </p>
              <Button asChild className="h-8 px-3 text-xs w-full sm:w-auto">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) =>
              (() => {
                const data = app.data || {};
                const rawApplicant =
                  data.applicantName || data.fullName || app.applicant || "-";

                const computeApplicantName = (raw: any): string => {
                  if (!raw) return "-";
                  if (typeof raw === "string") {
                    // If it's an email, derive a name from the local-part
                    if (raw.includes("@")) {
                      const local = raw.split("@")[0];
                      const parts = local
                        .split(/[^a-zA-Z0-9]+/)
                        .filter(Boolean);
                      if (parts.length === 0) return local;
                      return parts
                        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                        .join(" ");
                    }
                    return raw;
                  }
                  if (typeof raw === "object") {
                    const name =
                      raw.name ||
                      raw.fullName ||
                      raw.first_name ||
                      raw.username ||
                      raw.email;
                    return computeApplicantName(name);
                  }
                  return String(raw);
                };

                const applicantName = computeApplicantName(rawApplicant);
                const companyName =
                  data.companyName || data.company_name || "N/A";
                const submittedAt =
                  app.submittedAt || app.created_at || app.updated_at || null;

                return (
                  <Card
                    key={app.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {getTypeLabel(app.license_type || app.type)}
                            {app.subtype ? ` — ${app.subtype}` : ""}
                          </CardTitle>
                          <CardDescription>
                            Application ID: {app.id}
                          </CardDescription>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">
                            Applicant:
                          </span>
                          <p className="font-medium text-foreground">
                            {applicantName}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Company:
                          </span>
                          <p className="font-medium text-foreground">
                            {companyName}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Submitted:
                          </span>
                          <p className="font-medium text-foreground">
                            {submittedAt
                              ? new Date(submittedAt).toLocaleDateString()
                              : "-"}
                          </p>
                        </div>
                      </div>

                      {/* License metadata - only for approved applications */}
                      {app.status === "approved" &&
                        (() => {
                          const matched = licenses.find((lic: any) => {
                            try {
                              const ld = lic.data || {};
                              return (
                                lic.license_type === app.license_type &&
                                (ld.subtype === app.subtype ||
                                  !app.subtype ||
                                  !ld.subtype)
                              );
                            } catch (e) {
                              return false;
                            }
                          });

                          const licenseId = matched?.id ?? null;
                          const appYear = new Date(
                            app.submittedAt || app.created_at || Date.now(),
                          ).getFullYear();
                          // Prefer the license number saved on the application record itself, then the matched license, then fallback
                          const savedLicenseNumber =
                            app.data?.licenseNumber || app.data?.license_number;
                          const licenseNumber =
                            savedLicenseNumber ??
                            matched?.data?.licenseNumber ??
                            `LIC-${appYear}-${String(app.id).padStart(6, "0")}`;
                          const issuedAt =
                            matched?.data?.issueDate ??
                            matched?.created_at ??
                            submittedAt;
                          const issuedDate = issuedAt
                            ? new Date(issuedAt).toLocaleDateString()
                            : "-";
                          const expiryRaw = matched?.data?.expiryDate;
                          const expiryDate = expiryRaw
                            ? new Date(expiryRaw).toLocaleDateString()
                            : new Date(
                                new Date(issuedAt || Date.now()).setFullYear(
                                  new Date(
                                    issuedAt || Date.now(),
                                  ).getFullYear() + 1,
                                ),
                              ).toLocaleDateString();
                          const verificationUrl = createVerificationUrl(
                            undefined,
                            licenseId ? String(licenseId) : licenseNumber,
                            licenseNumber,
                          );
                          const gradeRaw =
                            app.data?.grade ||
                            app.data?.licenseType ||
                            app.data?.category ||
                            matched?.data?.grade ||
                            matched?.data?.licenseType ||
                            matched?.data?.category ||
                            "";
                          const showGrade =
                            String(app.license_type || app.type || "")
                              .toLowerCase()
                              .includes("contractor") && !!gradeRaw;

                          return (
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-muted-foreground">
                                  Applicant Name:
                                </span>
                                <p className="font-medium text-foreground">
                                  {applicantName}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Issued:
                                </span>
                                <p className="font-medium text-foreground">
                                  {issuedDate}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Expiry:
                                </span>
                                <p className="font-medium text-foreground">
                                  {expiryDate}
                                </p>
                              </div>
                              {showGrade && (
                                <div className="md:col-span-3">
                                  <span className="text-muted-foreground">Grade:</span>
                                  <p className="font-medium text-foreground">
                                    {(() => {
                                      const s = String(gradeRaw).trim();
                                      const l = s.toLowerCase();
                                      if (l.includes("grade-a") || l === "a" || l.includes("grade a")) return "Grade A";
                                      if (l.includes("grade-b") || l === "b" || l.includes("grade b")) return "Grade B";
                                      if (l.includes("grade-c") || l === "c" || l.includes("grade c")) return "Grade C";
                                      if (l.includes("specialized")) return "Specialized Contractor";
                                      return s;
                                    })()}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {/* Inline approval required banner (if server indicated approval needed) */}
                      {approvalRequired[String(app.id)] && (
                        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">
                          <strong>Approval required:</strong>{" "}
                          {approvalRequired[String(app.id)]}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2">
                        <>
                          <Dialog
                            open={detailOpenFor === String(app.id)}
                            onOpenChange={(open) => {
                              if (!open) {
                                setDetailOpenFor(null);
                                setSelectedApp(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs w-full sm:w-auto"
                                onClick={() => {
                                  setSelectedApp(app);
                                  setDetailOpenFor(String(app.id));
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogTitle>Application Details</DialogTitle>
                              <DialogDescription className="mb-4">
                                Review the original application information
                                submitted by the user.
                              </DialogDescription>
                              {selectedApp ? (
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold">
                                      Application ID: {selectedApp.id}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      Status: {selectedApp.status}
                                    </p>
                                  </div>

                                  <div>
                                    <h5 className="font-medium">Applicant</h5>
                                    <p className="text-sm">
                                      {selectedApp.data?.applicantName ??
                                        selectedApp.data?.fullName ??
                                        selectedApp.applicant ??
                                        "-"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {(() => {
                                        const raw =
                                          selectedApp.data?.applicantName ??
                                          selectedApp.data?.fullName ??
                                          selectedApp.applicant ??
                                          selectedApp.data?.email ??
                                          selectedApp.email ??
                                          "-";
                                        if (!raw) return "-";
                                        if (typeof raw === "string") {
                                          if (raw.includes("@")) {
                                            const local = raw.split("@")[0];
                                            const parts = local
                                              .split(/[^a-zA-Z0-9]+/)
                                              .filter(Boolean);
                                            if (parts.length === 0)
                                              return local;
                                            return parts
                                              .map(
                                                (p) =>
                                                  p.charAt(0).toUpperCase() +
                                                  p.slice(1),
                                              )
                                              .join(" ");
                                          }
                                          return raw;
                                        }
                                        if (typeof raw === "object") {
                                          const name =
                                            raw.name ||
                                            raw.fullName ||
                                            raw.first_name ||
                                            raw.username ||
                                            raw.email;
                                          return typeof name === "string"
                                            ? name
                                            : String(name);
                                        }
                                        return String(raw);
                                      })()}
                                    </p>
                                  </div>

                                  <div>
                                    <h5 className="font-medium">Company</h5>
                                    <p className="text-sm">
                                      {selectedApp.data?.companyName ??
                                        selectedApp.data?.company_name ??
                                        "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <h5 className="font-medium">
                                      License Details
                                    </h5>
                                    <p className="text-sm">
                                      Type:{" "}
                                      {getTypeLabel(
                                        selectedApp.license_type ??
                                          selectedApp.type,
                                      )}
                                    </p>
                                    {selectedApp.subtype && (
                                      <p className="text-sm">
                                        Subtype: {selectedApp.subtype}
                                      </p>
                                    )}
                                    <p className="text-sm">
                                      Submitted:{" "}
                                      {selectedApp.submittedAt
                                        ? new Date(
                                            selectedApp.submittedAt,
                                          ).toLocaleString()
                                        : selectedApp.created_at
                                          ? new Date(
                                              selectedApp.created_at,
                                            ).toLocaleString()
                                          : "-"}
                                    </p>
                                  </div>

                                  <div>
                                    <h5 className="font-medium">Raw Data</h5>
                                    <pre className="text-xs bg-muted p-2 rounded max-h-40 overflow-auto">
                                      {JSON.stringify(
                                        selectedApp.data ?? selectedApp,
                                        null,
                                        2,
                                      )}
                                    </pre>
                                  </div>
                                </div>
                              ) : (
                                <p>Loading…</p>
                              )}
                              <DialogFooter />
                            </DialogContent>
                          </Dialog>
                        </>
                        {app.status === "approved" && (
                          <>
                            <Dialog
                              open={qrOpenFor === String(app.id)}
                              onOpenChange={(open) => {
                                if (!open) {
                                  setQrOpenFor(null);
                                  setQrDataUrl(null);
                                  setQrVerificationUrl(null);
                                  setQrMeta(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs w-full sm:w-auto"
                                  onClick={async () => {
                                    try {
                                      // Build the same license payload used by the Download handler so QR contains identical data
                                      const data = app.data || {};
                                      const holderName =
                                        data.applicantName ||
                                        data.fullName ||
                                        app.applicant ||
                                        "-";
                                      const companyName =
                                        data.companyName ||
                                        data.company_name ||
                                        "N/A";

                                      // Try to find matching backend license if available
                                      const matched = licenses.find((lic: any) => {
                                        try {
                                          if (
                                            lic.owner &&
                                            app.applicant &&
                                            String(lic.owner) ===
                                              String(app.applicant)
                                          )
                                            return true;
                                          if (
                                            lic.license_type &&
                                            app.license_type &&
                                            lic.license_type ===
                                              app.license_type
                                          )
                                            return true;
                                          const appYear = new Date(
                                            app.submittedAt ||
                                              app.created_at ||
                                              Date.now(),
                                          ).getFullYear();
                                          const fallbackNum = `LIC-${appYear}-${String(app.id).padStart(6, "0")}`;
                                          if (
                                            lic.data &&
                                            lic.data.registrationNumber &&
                                            (lic.data.registrationNumber ===
                                              `LIC-${app.id}` ||
                                              lic.data.registrationNumber ===
                                                fallbackNum)
                                          )
                                            return true;
                                        } catch (e) {
                                          return false;
                                        }
                                        return false;
                                      });

                                      const appYear = new Date(
                                        app.submittedAt ||
                                          app.created_at ||
                                          Date.now(),
                                      ).getFullYear();
                                      const fallbackLicenseNumber = `LIC-${appYear}-${String(app.id).padStart(6, "0")}`;

                                      // Prefer mapped backend license if present (get license_number from server)
                                      const mappedBackendId =
                                        getAppLicenseMapping(app.id) ||
                                        matched?.id;
                                      let licenseNumber = fallbackLicenseNumber;
                                      if (mappedBackendId) {
                                        try {
                                          const licenseObj = await (
                                            await import("@/lib/api/django-client")
                                          ).licensesApi.getLicense(
                                            String(mappedBackendId),
                                          );
                                          licenseNumber =
                                            licenseObj.license_number ||
                                            licenseObj.licenseNumber ||
                                            licenseObj.data?.licenseNumber ||
                                            fallbackLicenseNumber;
                                        } catch (e) {
                                          // fallback to matched or generated number
                                          licenseNumber =
                                            matched?.data?.licenseNumber ??
                                            fallbackLicenseNumber;
                                        }
                                      } else {
                                        licenseNumber =
                                          matched?.data?.licenseNumber ??
                                          fallbackLicenseNumber;
                                      }
                                      let issueDate =
                                        matched?.data?.issueDate ??
                                        "2026-02-15T00:00:00Z";
                                      let expiryDate =
                                        matched?.data?.expiryDate ??
                                        "2031-02-15T00:00:00Z";
                                      if (mappedBackendId) {
                                        try {
                                          const lic = await (
                                            await import("@/lib/api/django-client")
                                          ).licensesApi.getLicense(
                                            String(mappedBackendId),
                                          );
                                          issueDate =
                                            lic.issued_date ||
                                            lic.issueDate ||
                                            issueDate;
                                          expiryDate =
                                            lic.expiry_date ||
                                            lic.expiryDate ||
                                            expiryDate;
                                        } catch {}
                                      }
                                      const verificationUrl =
                                        createVerificationUrl(
                                          undefined,
                                          matched?.id
                                            ? String(matched.id)
                                            : licenseNumber,
                                          licenseNumber,
                                        );

                                      const licensePayload = {
                                        id:
                                          matched?.id ?? fallbackLicenseNumber,
                                        type: getTypeLabel(
                                          app.license_type || app.type,
                                        ),
                                        category: "License",
                                        holderName,
                                        companyName,
                                        grade:
                                          app?.data?.grade ??
                                          app?.data?.licenseType ??
                                          app?.data?.category ??
                                          matched?.data?.grade ??
                                          matched?.data?.licenseType ??
                                          matched?.data?.category ??
                                          "",
                                        registrationNumber: licenseNumber,
                                        issueDate: new Date(
                                          issueDate,
                                        ).toISOString(),
                                        expiryDate: new Date(
                                          expiryDate,
                                        ).toISOString(),
                                        status: matched?.status ?? "Active",
                                        verificationUrl,
                                      };

                                      // Encode full JSON payload including verificationUrl for richer scanning
                                      const payload = createLicenseQRPayload({
                                        licenseId: String(
                                          matched?.id ?? app.id,
                                        ),
                                        licenseNumber,
                                        holderName,
                                        companyName,
                                        type: getTypeLabel(
                                          app.license_type || app.type,
                                        ),
                                        issueDate: new Date(
                                          issueDate,
                                        ).toISOString(),
                                        expiryDate: new Date(
                                          expiryDate,
                                        ).toISOString(),
                                        verificationUrl,
                                      });
                                      const dataUrl = await generateQRDataURL(
                                        JSON.stringify(payload),
                                      );
                                      setQrDataUrl(dataUrl);
                                      setQrVerificationUrl(verificationUrl);
                                      const rawPhotoUrl =
                                        (matched?.license_photo_base64 ||
                                          matched?.license_photo_url ||
                                          matched?.license_photo) as
                                          | string
                                          | undefined;
                                      const photoUrl = rawPhotoUrl
                                        ? rawPhotoUrl.startsWith("http")
                                          ? rawPhotoUrl
                                          : `${DJANGO_API_URL}${rawPhotoUrl}`
                                        : undefined;
                                      setQrMeta({
                                        licenseNumber,
                                        holderName,
                                        companyName,
                                        photoUrl,
                                      });
                                      setQrOpenFor(String(app.id));
                                    } catch (e) {
                                      console.error("QR gen failed", e);
                                      toast({
                                        title: "Error",
                                        description:
                                          "Failed to generate QR code",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View QR Code
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogTitle>QR Code</DialogTitle>
                                <DialogDescription className="mb-4">
                                  Scan to verify the license.
                                </DialogDescription>
                                {qrDataUrl ? (
                                  <div className="flex flex-col items-center gap-4">
                                    <img
                                      src={qrDataUrl}
                                      alt="QR code"
                                      className="w-48 h-48"
                                    />
                                    {/* {qrMeta?.photoUrl && (
                                  <div className="flex flex-col items-center">
                                    <img src={qrMeta.photoUrl} alt="Profile photo" className="w-20 h-20 rounded-full object-cover border" />
                                    <span className="text-xs text-muted-foreground mt-1">Applicant Photo</span>
                                  </div>
                                )} */}
                                    {qrMeta && (
                                      <div className="text-sm text-center">
                                        <p className="text-muted-foreground">
                                          License #:{" "}
                                          <span className="text-foreground font-medium">
                                            {qrMeta.licenseNumber}
                                          </span>
                                        </p>
                                        <p className="text-muted-foreground">
                                          Holder:{" "}
                                          <span className="text-foreground font-medium">
                                            {qrMeta.holderName}
                                          </span>
                                        </p>
                                        <p className="text-muted-foreground">
                                          Company:{" "}
                                          <span className="text-foreground font-medium">
                                            {qrMeta.companyName || "N/A"}
                                          </span>
                                        </p>
                                      </div>
                                    )}
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          downloadQRCode(
                                            qrDataUrl,
                                            `License-${app.id}-qr.png`,
                                          )
                                        }
                                      >
                                        Download QR
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (qrVerificationUrl) {
                                            navigator.clipboard?.writeText(
                                              qrVerificationUrl,
                                            );
                                            toast({
                                              title: "Copied",
                                              description:
                                                "Verification URL copied to clipboard.",
                                            });
                                          }
                                        }}
                                      >
                                        Copy URL
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p>Generating…</p>
                                )}
                                <DialogFooter />
                              </DialogContent>
                            </Dialog>

                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs w-full sm:w-auto"
                              onClick={() => router.push("/dashboard/licenses")}
                              disabled={downloadingId === app.id}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              {downloadingId === app.id
                                ? "Opening..."
                                : "Download License"}
                            </Button>

                            {/* Renew button removed per UI update */}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })(),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
