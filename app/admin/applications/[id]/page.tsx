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
  MessageSquare,
  Loader2,
  User,
  Phone,
  Mail,
  FileArchive,
  History,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateApplicationPDF, generateLicensePDF } from "@/lib/downloads/pdf-generator";
import { downloadPDF } from "@/lib/downloads/file-download";
import { requestApplicationInfo } from "@/lib/button-actions";
import {
  applicationsApi,
  documentsApi,
  applicationsApiEx,
} from "@/lib/api/django-client";
import { settingsApi } from "@/lib/api/django-client";
import { licensesApi } from "@/lib/api/django-client";

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSummary, setVerificationSummary] = useState<any | null>(
    null,
  );
  const [verifyEnabled, setVerifyEnabled] = useState<boolean>(false);
  const [license, setLicense] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const appData = await applicationsApi.getDetail(id);
        setApplication(appData);
        setStatus(appData.status);
        try {
          if (String(appData.status || "").toLowerCase() === "approved") {
            const lic = await applicationsApi.getLicense(id);
            setLicense(lic);
          } else {
            setLicense(null);
          }
        } catch {}
        try {
          const docsData = await documentsApi.list({ application: id });
          setDocuments(
            Array.isArray(docsData) ? docsData : docsData.results || [],
          );
        } catch (docErr: any) {
          setDocuments([]);
        }
        try {
          const s = await settingsApi.get();
          setVerifyEnabled(!!s.documentVerificationEnabled);
        } catch {}
      } catch (error) {
        console.error("Failed to load application data:", error);
        toast({
          title: "Error",
          description: "Failed to load application data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, toast]);

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
          lic?.data?.holderName ||
          application?.data?.applicantName ||
          application?.applicant ||
          "",
        registrationNumber: lic.license_number || lic?.data?.registrationNumber,
        issueDate: lic.issued_date,
        expiryDate: lic.expiry_date,
        status: lic.status || "Active",
      };
      const pdf = await generateLicensePDF(payload as any);
      downloadPDF(pdf, `License-${payload.registrationNumber || payload.id}.pdf`);
      toast({ title: "Downloaded", description: "License certificate downloaded." });
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

  const handleDownloadAllDocuments = async () => {
    setIsDownloading(true);
    try {
      const blob = await applicationsApi.downloadDocuments(id);
      if (blob.type === "application/json") {
        const text = await blob.text();
        try {
          const error = JSON.parse(text);
          const msg = String(error?.detail || "").trim();
          if (msg && /not found/i.test(msg)) {
            toast({
              title: "No Documents",
              description: "No documents found for this application.",
              variant: "destructive",
            });
            return;
          }
          throw new Error(msg || "Failed to download documents");
        } catch {
          if (/not found/i.test(text)) {
            toast({
              title: "No Documents",
              description: "No documents found for this application.",
              variant: "destructive",
            });
            return;
          }
          throw new Error(text || "Failed to download documents");
        }
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `application_${id}_documents.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: "Downloaded",
        description: "All documents have been downloaded as a ZIP file.",
      });
    } catch (error: any) {
      console.error("Error downloading documents:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to download documents.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleVerifyDocuments = async () => {
    setIsVerifying(true);
    try {
      const res = await applicationsApiEx.verifyDocuments(id);
      try {
        setVerificationSummary(res?.summary || null);
      } catch {
        setVerificationSummary(null);
      }
      const docsData = await documentsApi.list({ application: id });
      setDocuments(Array.isArray(docsData) ? docsData : docsData.results || []);
      toast({
        title: "Verification Complete",
        description: "Document verification finished.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error?.message || "Failed to verify documents.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownloadApplicationPDF = async () => {
    if (!application) return;
    setIsDownloading(true);
    try {
      const pdf = await generateApplicationPDF(application);
      downloadPDF(pdf, `Application-${application.id}.pdf`);
      toast({
        title: "Downloaded",
        description: "Application report has been downloaded as PDF.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download application.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
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
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Review Application
                </h1>
                <p className="text-sm text-slate-600">ID: {application.id}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/applications">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Link>
            </Button>
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
                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      status === "approved"
                        ? "bg-green-500"
                        : status === "rejected"
                          ? "bg-red-500"
                          : status === "info_requested"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                    }
                  >
                    {status.replace("_", " ").toUpperCase()}
                  </Badge>
                  <span className="text-sm text-slate-500">
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
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-slate-500">License Number</Label>
                    <p className="font-medium">{license.license_number}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500">Status</Label>
                    <Badge className="bg-green-600">{String(license.status || "active").toUpperCase()}</Badge>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500">Issued Date</Label>
                    <p className="font-medium">
                      {license.issued_date ? new Date(license.issued_date).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-500">Expiry Date</Label>
                    <p className="font-medium">
                      {license.expiry_date ? new Date(license.expiry_date).toLocaleDateString() : "—"}
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
                        <Label className="text-xs text-slate-500 uppercase">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </Label>
                        <p className="text-sm font-medium wrap-break-word">
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
                  {documents.length > 0 && verifyEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyDocuments}
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Verify Documents
                    </Button>
                  )}
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
                        className="flex items-center justify-between p-3 border rounded-lg bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {doc.name || doc.file.split("/").pop()}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                            {verifyEnabled &&
                              verificationSummary &&
                              doc.verification_status && (
                                <div className="mt-1">
                                  <Badge
                                    className={
                                      doc.verification_status ===
                                      "verified_true"
                                        ? "bg-green-600"
                                        : doc.verification_status ===
                                            "verified_fake"
                                          ? "bg-red-600"
                                          : doc.verification_status ===
                                              "pending"
                                            ? "bg-amber-500"
                                            : "bg-slate-600"
                                    }
                                  >
                                    {String(doc.verification_status)
                                      .replace("_", " ")
                                      .toUpperCase()}
                                  </Badge>
                                  {typeof doc.verification_score ===
                                    "number" && (
                                    <span className="ml-2 text-xs text-slate-600">
                                      Score: {doc.verification_score.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={doc.file}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </a>
                        </Button>
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
                    <Button
                      className="w-full"
                      onClick={handleDownloadLicense}
                    >
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
