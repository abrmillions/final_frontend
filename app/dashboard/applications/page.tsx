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
  Bell,
  Trash2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  generateApplicationPDF,
  generateLicensePDF,
} from "@/lib/downloads/pdf-generator";
import { downloadPDF } from "@/lib/downloads/file-download";
import { applicationsApi, licensesApi, notificationsApi } from "@/lib/api/django-client";
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
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <ApplicationsContent />
    </Suspense>
  )
}

function ApplicationsContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
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

    // fetch notifications for current user
    const fetchNotifications = async () => {
      try {
        const n = await notificationsApi.list();
        setNotifications(Array.isArray(n) ? n : []);
      } catch (e) {
        console.warn("[clms] Failed to fetch notifications", e);
      }
    };

    fetchNotifications();
  }, [toast, isLoading, isAuthenticated, router]);

  const markNotificationAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
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
      case "info_requested":
        return (
          <Badge
            variant="secondary"
            className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Info Requested
          </Badge>
        );
      case "resubmitted":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-500/10 text-blue-700 dark:text-blue-400"
          >
            <Clock className="w-3 h-3 mr-1" />
            Resubmitted
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
            variant="outlineBlueHover"
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

        {notifications.length > 0 && (
          <div className="mb-8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              {notifications.some((n) => !n.is_read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-primary"
                  onClick={markAllNotificationsAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="grid gap-3 max-h-100 overflow-y-auto pr-2 custom-scrollbar">
              {notifications.map((n: any) => (
                <Card
                  key={n.id}
                  className={`border-l-4 ${
                    n.is_read ? "border-l-muted opacity-80" : "border-l-primary bg-primary/5"
                  } transition-all shadow-sm`}
                >
                  <CardContent className="p-2.5">
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className={`font-semibold text-xs truncate ${n.is_read ? "text-muted-foreground" : "text-foreground"}`}>
                            {n.title}
                          </h4>
                          {!n.is_read && (
                            <Badge className="h-1 w-1 rounded-full p-0 bg-primary" />
                          )}
                        </div>
                        <p className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-muted-foreground/50 mt-0.5 block">
                          {new Date(n.created_at).toLocaleString()}
                        </span>
                      </div>
                      {!n.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary shrink-0"
                          onClick={() => markNotificationAsRead(n.id)}
                          title="Mark as read"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

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
              <Button variant="outlineBlueHover" asChild>
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

                      {/* Feedback banner for info_requested or rejected status */}
                      {(app.status === "info_requested" || app.status === "rejected") &&
                        (() => {
                          const logs = Array.isArray(app.logs) ? app.logs : [];
                          const latestFeedback = logs.find((log: any) =>
                            ["info_requested", "rejected"].includes(log.action)
                          );
                          if (!latestFeedback) return null;

                          return (
                            <div
                              className={`mb-4 p-3 rounded-md border text-sm flex items-start gap-3 ${
                                app.status === "rejected"
                                  ? "bg-red-50 border-red-100 text-red-800"
                                  : "bg-amber-50 border-amber-100 text-amber-800"
                              }`}
                            >
                              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                              <div className="flex-1">
                                <p className="font-semibold mb-0.5">
                                  {app.status === "rejected"
                                    ? "Application Rejected"
                                    : "Information Requested"}
                                </p>
                                <p className="text-xs opacity-90 line-clamp-2">
                                  {latestFeedback.details}
                                </p>
                              </div>
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
                              <DialogHeader>
                                <DialogTitle>Application Details</DialogTitle>
                                <DialogDescription>
                                  Review the original application information
                                  submitted by the user.
                                </DialogDescription>
                              </DialogHeader>
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
                                          const licenseObj = await licensesApi.getLicense(
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
                                <DialogHeader>
                                  <DialogTitle>QR Code</DialogTitle>
                                  <DialogDescription>
                                    Scan to verify the license.
                                  </DialogDescription>
                                </DialogHeader>
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
