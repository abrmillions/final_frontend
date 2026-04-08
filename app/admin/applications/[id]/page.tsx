"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Building2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Eye,
  MessageSquare,
  Loader2,
  User,
  Phone,
  Mail,
  History,
  Search,
} from "lucide-react";
import { VerificationResultDisplay } from "@/components/verification-result-display";
import { computePriorityChips } from "../../../../verification/chips/priorityFields";
import { useToast } from "@/hooks/use-toast";
import {
  generateApplicationPDF,
  generateLicensePDF,
} from "@/lib/downloads/pdf-generator";
import { downloadPDF } from "@/lib/downloads/file-download";
import {
  applicationsApi,
  documentsApi,
} from "@/lib/api/django-client";
import { settingsApi } from "@/lib/api/django-client";

export default function ApplicationReview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [comments, setComments] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);
  const [verifiedInSession, setVerifiedInSession] = useState<Set<string>>(
    new Set(),
  );
  const [verificationSummary, setVerificationSummary] = useState<any | null>(
    null,
  );
  const [verifyEnabled, setVerifyEnabled] = useState<boolean>(false);
  const [license, setLicense] = useState<any | null>(null);
  const [showSlowLoad, setShowSlowLoad] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // Safety timer for slow loads
    const slowLoadTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        setShowSlowLoad(true);
      }
    }, 8000); // 8 seconds

    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log(`[admin] Fetching application ${id}...`);
        
        // Use Promise.all to fetch application and settings in parallel
        // Increase timeout for this critical call to 15s
        const [appData, settingsData] = await Promise.all([
          applicationsApi.getDetail(id).catch(err => {
            console.error(`[admin] Failed to fetch application ${id}:`, err);
            throw err;
          }),
          settingsApi.get().catch(err => {
            console.warn("[admin] Failed to fetch settings:", err);
            return { documentVerificationEnabled: false };
          })
        ]);

        if (!isMounted) return;

        console.log(`[admin] Application ${id} loaded:`, appData);
        setApplication(appData);
        setStatus(appData.status);
        setVerifyEnabled(!!settingsData.documentVerificationEnabled);
        
        // Critical data loaded, stop the main spinner
        setIsLoading(false);
        setShowSlowLoad(false);
        clearTimeout(slowLoadTimer);

        // Conditional fetches based on application status (background)
        // 1. Fetch license if approved
        if (String(appData.status || "").toLowerCase() === "approved") {
          applicationsApi.getLicense(id)
            .then(lic => {
              if (isMounted) setLicense(lic);
            })
            .catch(err => {
              console.warn(`[admin] Failed to fetch license for application ${id}:`, err);
              if (isMounted) setLicense(null);
            });
        }

        // 2. Fetch documents
        documentsApi.list({ application: id })
          .then(docsData => {
            if (isMounted) {
              const docsList = Array.isArray(docsData) ? docsData : docsData.results || [];
              setDocuments(docsList);
            }
          })
          .catch(err => {
            console.warn(`[admin] Failed to fetch documents for application ${id}:`, err);
            if (isMounted) setDocuments([]);
          });

      } catch (error: any) {
        console.error("[admin] Critical error loading application data:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: error?.message || "Failed to load application data",
            variant: "destructive",
          });
          setApplication(null);
          setIsLoading(false);
          setShowSlowLoad(false);
          clearTimeout(slowLoadTimer);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      clearTimeout(slowLoadTimer);
    };
  }, [id]);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await applicationsApi.approve(id);
      toast({
        title: "Application Approved",
        description: `Application ${id} has been approved successfully.`,
      });

      setStatus("approved");
      const updatedApp = await applicationsApi.getDetail(id);
      setApplication(updatedApp);
      try {
        const lic = await applicationsApi.getLicense(id);
        setLicense(lic);
      } catch {}
    } catch (error: any) {
      const msg =
        (error?.error?.detail && String(error.error.detail).trim()) ||
        (error?.message && String(error.message).trim()) ||
        "Failed to approve application.";
      toast({
        title: "Approval Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleDownloadLicense = async () => {
    if (!application) return;
    try {
      const lic = await applicationsApi.getLicense(id);
      const payload = {
        id: lic.id,
        type: lic.license_type,
        companyName:
          lic?.data?.companyName ||
          lic?.data?.company_name ||
          application?.data?.companyName ||
          application?.data?.company_name ||
          "",
        holderName:
          application?.data?.applicantName ||
          application?.applicant_name ||
          lic.holder_full_name ||
          lic?.data?.holderName ||
          application?.applicant ||
          "",
        registrationNumber: lic.license_number || lic?.data?.registrationNumber,
        issueDate: lic.issued_date,
        expiryDate: lic.expiry_date,
        status: lic.status || "Active",
        photoUrl: 
          lic.license_photo_base64 || 
          lic.license_photo_url || 
          lic.license_photo || 
          lic.licensePhoto || 
          lic?.data?.photoUrl ||
          application?.data?.profile_photo ||
          application?.data?.profilePhoto ||
          application?.data?.applicantPhoto,
      };
      const pdf = await generateLicensePDF(payload as any);
      downloadPDF(
        pdf,
        `License-${payload.registrationNumber || payload.id}.pdf`,
      );
      toast({
        title: "Downloaded",
        description: "License certificate downloaded.",
      });
    } catch (e: any) {
      toast({
        title: "Download Failed",
        description: e?.message || "Unable to download license",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide rejection comments before rejecting.",
        variant: "destructive",
      });
      return;
    }

    setIsRejecting(true);
    try {
      await applicationsApi.reject(id, comments);

      toast({
        title: "Application Rejected",
        description: `Application ${id} has been rejected.`,
        variant: "destructive",
      });
      setStatus("rejected");
      const updatedApp = await applicationsApi.getDetail(id);
      setApplication(updatedApp);
    } catch (error) {
      console.error("[clms] Error rejecting application:", error);
      toast({
        title: "Error",
        description: "Failed to reject application.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!comments.trim()) {
      toast({
        title: "Details Required",
        description:
          "Please provide information request details before sending.",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingInfo(true);
    try {
      await applicationsApi.requestInfo(id, [comments]);

      toast({
        title: "Information Requested",
        description: "Request sent to applicant.",
      });
      setComments("");
      setReviewNotes("");
      setStatus("info_requested");
      const updatedApp = await applicationsApi.getDetail(id);
      setApplication(updatedApp);
    } catch (error) {
      console.error("[clms] Request info error:", error);
      toast({
        title: "Error",
        description: "Failed to request information.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingInfo(false);
    }
  };

  const handleVerifySingleDocument = async (docId: string) => {
    setVerifyingDocId(docId);
    try {
      await documentsApi.verify(docId);
      const docsData = await documentsApi.list({ application: id });
      const newDocs = Array.isArray(docsData) ? docsData : docsData.results || [];
      setDocuments(newDocs);
      setVerifiedInSession((prev) => new Set(prev).add(docId));
      
      // Recalculate summary
      const summary = {
        verified_true: 0,
        verified_fake: 0,
        inconclusive: 0,
        pending: 0,
        missing: 0,
        error: 0,
      };
      newDocs.forEach((d: any) => {
        if (verifiedInSession.has(d.id) || d.id === docId) {
          const st = d.verification_status || "pending";
          if (st in summary) {
            (summary as any)[st]++;
          }
        }
      });
      setVerificationSummary(summary);
      
      toast({
        title: "Document Verified",
        description: "The document has been verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error?.message || "Failed to verify document.",
        variant: "destructive",
      });
    } finally {
      setVerifyingDocId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-500 animate-pulse">Loading application data...</p>
        {showSlowLoad && (
          <div className="flex flex-col items-center gap-2 animate-in fade-in duration-500">
            <p className="text-sm text-amber-600 font-medium text-center max-w-xs">
              This is taking longer than usual. The server might be slow or unreachable.
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Application Not Found</h1>
        <Button asChild>
          <Link href="/admin/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  const data = application.data || {};

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 shadow-blue-200 shadow-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-slate-900 truncate">
                  Review Application
                </h1>
                <p className="text-sm text-slate-500 font-mono">ID: {application.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outlineBlueHover" size="sm" asChild className="w-full sm:w-auto">
                <Link href="/admin/applications">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Back to Applications</span>
                  <span className="xs:hidden">Back</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Badge
                    className={
                      status === "approved"
                        ? "bg-green-500 hover:bg-green-600"
                        : status === "rejected"
                          ? "bg-red-500 hover:bg-red-600"
                          : status === "info_requested"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : "bg-blue-500 hover:bg-blue-600"
                    }
                  >
                    {status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <History className="w-4 h-4" />
                    Submitted on{" "}
                    {new Date(application.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Applicant Details */}
            <Card>
              <CardHeader>
                <CardTitle>Applicant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-500">Applicant Name</Label>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="font-medium">
                        {data.applicantName ||
                          data.fullName ||
                          application.applicant}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500">Company Name</Label>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <p className="font-medium">
                        {data.companyName || data.company_name || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <p className="font-medium">
                        {data.email || application.applicant}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500">Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <p className="font-medium">{data.phone || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {license && (
              <Card>
                <CardHeader>
                  <CardTitle>Issued License</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-slate-500">License Number</Label>
                      <p className="font-medium">{license.license_number}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-500">Status</Label>
                      <Badge className="bg-green-600">
                        {String(license.status || "active").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-500">Issued Date</Label>
                      <p className="font-medium">
                        {license.issued_date
                          ? new Date(license.issued_date).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-slate-500">Expiry Date</Label>
                      <p className="font-medium">
                        {license.expiry_date
                          ? new Date(license.expiry_date).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Data */}
            <Card>
              <CardHeader>
                <CardTitle>Application Data</CardTitle>
                <CardDescription>Submitted form information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(data).map(([key, value]) => {
                    if (
                      typeof value === "object" ||
                      [
                        "applicantName",
                        "fullName",
                        "companyName",
                        "company_name",
                        "email",
                        "phone",
                      ].includes(key)
                    )
                      return null;
                    return (
                      <div
                        key={key}
                        className="space-y-1 p-2 border rounded bg-slate-50"
                      >
                        <Label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        <p className="text-sm font-medium wrap-break-word text-slate-700">
                          {String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Uploaded files for review</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                </div>
                {verificationSummary && verifyEnabled && (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    <Badge className="bg-green-600">
                      Verified True: {verificationSummary.verified_true || 0}
                    </Badge>
                    <Badge className="bg-red-600">
                      Verified Fake: {verificationSummary.verified_fake || 0}
                    </Badge>
                    <Badge className="bg-slate-700">
                      Inconclusive: {verificationSummary.inconclusive || 0}
                    </Badge>
                    <Badge className="bg-amber-500">
                      Pending: {verificationSummary.pending || 0}
                    </Badge>
                    <Badge className="bg-slate-400">
                      Missing: {verificationSummary.missing || 0}
                    </Badge>
                    <Badge className="bg-rose-600">
                      Error: {verificationSummary.error || 0}
                    </Badge>
                  </div>
                )}
                {/* {documents.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleDownloadAllDocuments}>
                        {isDownloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileArchive className="w-4 h-4 mr-2" />}
                        Download All
                    </Button>
                )} */}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No documents uploaded.
                    </p>
                  ) : (
                    documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate" title={doc.name || doc.file.split("/").pop()}>
                              {doc.name || doc.file.split("/").pop()}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <History className="w-3 h-3" />
                              {new Date(doc.uploaded_at).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            {verifyEnabled &&
                              verificationSummary &&
                              doc.verification_status &&
                              verifiedInSession.has(doc.id) && (
                                <div className="mt-3 space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge
                                      className={
                                        doc.verification_status ===
                                        "verified_true"
                                          ? "bg-green-600 hover:bg-green-700"
                                          : doc.verification_status ===
                                              "verified_fake"
                                            ? "bg-red-600 hover:bg-red-700"
                                            : doc.verification_status ===
                                                "pending"
                                              ? "bg-amber-500 hover:bg-amber-600"
                                              : doc.verification_status ===
                                                  "error"
                                                ? "bg-rose-600 hover:bg-rose-700"
                                                : "bg-slate-600 hover:bg-slate-700"
                                      }
                                    >
                                      {String(doc.verification_status)
                                        .replace("_", " ")
                                        .toUpperCase()}
                                    </Badge>
                                    {typeof doc.verification_score ===
                                      "number" && (
                                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                        Confidence:{" "}
                                        {(doc.verification_score * 100).toFixed(
                                          1,
                                        )}
                                        %
                                      </span>
                                    )}
                                  </div>
                                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200 overflow-hidden">
                                    <VerificationResultDisplay details={doc.verification_details} />
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-initial" asChild>
                            <a
                              href={doc.file}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </Button>
                          {verifyEnabled && (
                            <Button
                              variant="hoverBlue"
                              size="sm"
                              className="flex-1 sm:flex-initial"
                              onClick={() => handleVerifySingleDocument(doc.id)}
                              disabled={verifyingDocId === doc.id}
                            >
                              {verifyingDocId === doc.id ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4 mr-2" />
                              )}
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail */}
            {application.logs && application.logs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative border-l border-slate-200 ml-3 space-y-6">
                    {application.logs.map((log: any) => (
                      <div key={log.id} className="relative pl-6">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-white bg-slate-300 ring-4 ring-white" />
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 capitalize">
                              {log.action.replace("_", " ")}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            by{" "}
                            <span className="font-medium">
                              {log.actor_name || log.actor_email || "System"}
                            </span>
                          </p>
                          {log.details && (
                            <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded mt-1">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
                <CardDescription>Process this application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Review Notes (Internal)</Label>
                  <Textarea
                    placeholder="Add internal notes..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Comments for Applicant</Label>
                  <Textarea
                    placeholder="Add comments or rejection reason..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={status === "approved" || isApproving}
                  >
                    {isApproving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve Application
                  </Button>
                  {status === "approved" && (
                    <Button className="w-full" onClick={handleDownloadLicense}>
                      <Download className="w-4 h-4 mr-2" />
                      Download License Certificate
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleReject}
                    disabled={status === "rejected" || isRejecting}
                  >
                    {isRejecting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject Application
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleRequestInfo}
                    disabled={status === "info_requested" || isRequestingInfo}
                  >
                    {isRequestingInfo ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-2" />
                    )}
                    Request More Info
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
