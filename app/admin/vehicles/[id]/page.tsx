"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  vehiclesApi,
  documentsApi,
  settingsApi,
} from "@/lib/api/django-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Eye, Info, ArrowLeft, Search } from "lucide-react";
import { VerificationResultDisplay } from "@/components/verification-result-display";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminVehicleDetailPage() {
  const { id } = useParams() as { id: string };
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [docsList, setDocsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [updating, setUpdating] = useState<"approve" | "reject" | null>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [verifyEnabled, setVerifyEnabled] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [currentVerificationResult, setCurrentVerificationResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      try {
        const v = await vehiclesApi.getDetail(String(id));
        setVehicle(v);
        try {
          const docs = await documentsApi.list({ vehicle: id });
          setDocsList(Array.isArray(docs) ? docs : docs.results || []);
        } catch (e) {
          console.error("Failed to load vehicle docs:", e);
        }
        try {
          const s = await settingsApi.get();
          setVerifyEnabled(!!s.documentVerificationEnabled);
        } catch {}
        try {
          const list = await vehiclesApi.list();
          const plate = String(v?.data?.plateNumber || "")
            .trim()
            .toLowerCase();
          const chassis = String(v?.data?.chassisNumber || "")
            .trim()
            .toLowerCase();
          const dups = (list || []).filter((item: any) => {
            if (String(item?.id) === String(id)) return false;
            const p2 = String(item?.data?.plateNumber || "")
              .trim()
              .toLowerCase();
            const c2 = String(item?.data?.chassisNumber || "")
              .trim()
              .toLowerCase();
            return (plate && plate === p2) || (chassis && chassis === c2);
          });
          setDuplicates(dups);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const downloadDoc = async (doc: any) => {
    const identifier = doc.id || doc.file || doc.url;
    setDownloading(identifier);
    try {
      let blob: Blob;
      if (doc.file || doc.url) {
        blob = await documentsApi.downloadByUrl(doc.file || doc.url);
      } else {
        blob = await documentsApi.download(String(doc.id));
      }

      if (blob.type === "application/json") {
        try {
          const text = await blob.text();
          const json = JSON.parse(text);
          toast({
            title: "Download Failed",
            description: json.detail || "Could not download document.",
            variant: "destructive",
          });
          return;
        } catch {}
      }

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      const filename = doc.name || doc.filename || `vehicle-${id}-doc`;
      link.download = filename.includes(".") ? filename : `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(null);
    }
  };

  const handleVerify = async () => {
    setVerifying("all");
    try {
      await vehiclesApi.verifyDocuments(String(id));
      const docs = await documentsApi.list({ vehicle: id });
      setDocsList(Array.isArray(docs) ? docs : docs.results || []);
      toast({
        title: "Verification Complete",
        description: "Vehicle documents verified.",
      });
    } catch (e: any) {
      console.error("[clms] Vehicle verification failed:", e);
      const detail = e?.error?.detail || e?.message || "Verification failed";
      toast({
        title: "Verification Failed",
        description: String(detail),
        variant: "destructive",
      });
    } finally {
      setVerifying(null);
    }
  };

  const handleVerifySingle = async (docId: string) => {
    setVerifying(docId);
    try {
      // Use the new dedicated endpoint for vehicle document verification
      const result = await vehiclesApi.verifyDocument(docId);

      // Refresh the document list to show new status
      const docs = await documentsApi.list({ vehicle: id });
      const updatedDocs = Array.isArray(docs) ? docs : docs.results || [];
      setDocsList(updatedDocs);

      // Find the specific doc in updated list to show its result
      const updatedDoc = updatedDocs.find((d: any) => d.id === docId);
      if (updatedDoc) {
        setCurrentVerificationResult(updatedDoc);
        setShowResultDialog(true);
      }

      toast({
        title: "Verified",
        description: "Document verified successfully",
        variant: "default",
      });
    } catch (e: any) {
      console.error("[clms] Single vehicle verification failed:", e);
      const detail = e?.error?.detail || e?.message || "Verification failed";
      toast({
        title: "Verification Failed",
        description: String(detail),
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setVerifying(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vehicle) {
    return <div className="container mx-auto px-4 py-8">Vehicle not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between mb-2">
        <Button variant="outline" asChild size="sm">
          <Link href="/admin/applications">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Application
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vehicle Details</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2">
                {String(vehicle.status || "").toUpperCase()}
              </Badge>
              <Button
                size="sm"
                onClick={async () => {
                  setUpdating("approve");
                  try {
                    const updated = await vehiclesApi.update(String(id), {
                      status: "active",
                    });
                    setVehicle(updated);
                    toast({
                      title: "Approved",
                      description: "Vehicle marked as active.",
                    });
                  } catch {
                    toast({
                      title: "Error",
                      description: "Failed to approve vehicle.",
                      variant: "destructive",
                    });
                  } finally {
                    setUpdating(null);
                  }
                }}
                disabled={updating !== null}
              >
                {updating === "approve" ? "Approving..." : "Approve"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={async () => {
                  setUpdating("reject");
                  try {
                    const updated = await vehiclesApi.update(String(id), {
                      status: "rejected",
                    });
                    setVehicle(updated);
                    toast({
                      title: "Rejected",
                      description: "Vehicle has been rejected.",
                    });
                  } catch {
                    toast({
                      title: "Error",
                      description: "Failed to reject vehicle.",
                      variant: "destructive",
                    });
                  } finally {
                    setUpdating(null);
                  }
                }}
                disabled={updating !== null}
              >
                {updating === "reject" ? "Rejecting..." : "Reject"}
              </Button>
              {verifyEnabled && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleVerify}
                  disabled={verifying !== null}
                  className="hidden"
                >
                  {verifying === "all" ? "Verifying..." : "Verify Documents"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Registration ID</div>
          <div className="font-medium">{vehicle.id}</div>
          <div className="text-muted-foreground">Plate Number</div>
          <div className="font-medium">{vehicle.data?.plateNumber}</div>
          <div className="text-muted-foreground">Registration Number</div>
          <div className="font-medium">{vehicle.data?.registrationNumber}</div>
          <div className="text-muted-foreground">Chassis Number</div>
          <div className="font-medium">{vehicle.data?.chassisNumber}</div>
          <div className="text-muted-foreground">Engine Number</div>
          <div className="font-medium">{vehicle.data?.engineNumber}</div>
          <div className="text-muted-foreground">Vehicle Type</div>
          <div className="font-medium">{vehicle.data?.vehicleType}</div>
          <div className="text-muted-foreground">Manufacturer</div>
          <div className="font-medium">{vehicle.data?.manufacturer}</div>
          <div className="text-muted-foreground">Model</div>
          <div className="font-medium">{vehicle.data?.model}</div>
          <div className="text-muted-foreground">Year</div>
          <div className="font-medium">{vehicle.data?.year}</div>
          <div className="text-muted-foreground">Owner</div>
          <div className="font-medium">{vehicle.data?.ownerName}</div>
          <div className="text-muted-foreground">Owner License</div>
          <div className="font-medium">{vehicle.data?.ownerLicense}</div>
          <div className="text-muted-foreground">Insurance Policy</div>
          <div className="font-medium">{vehicle.data?.insuranceNumber}</div>
          <div className="text-muted-foreground">Insurance Expiry</div>
          <div className="font-medium">{vehicle.data?.insuranceExpiry}</div>
          <div className="text-muted-foreground">Address</div>
          <div className="font-medium">{vehicle.data?.address || "N/A"}</div>
          <div className="text-muted-foreground">TIN</div>
          <div className="font-medium">{vehicle.data?.tinNumber || "N/A"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Potential Duplicates</CardTitle>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No duplicates found by plate/chassis.
            </div>
          ) : (
            <div className="space-y-2">
              {duplicates.map((d) => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">
                      #{d.id} · {d.data?.plateNumber} · {d.data?.chassisNumber}
                    </div>
                    <div className="text-muted-foreground">
                      {d.data?.manufacturer} {d.data?.model}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.location.assign(`/admin/vehicles/${d.id}`)
                    }
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {docsList.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No documents uploaded
            </div>
          ) : (
            docsList.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50"
              >
                <div className="text-sm">
                  <div className="font-medium capitalize flex items-center gap-2">
                    {d.name || "General Document"}
                  </div>
                  <div className="text-muted-foreground break-all text-xs mt-1">
                    {d.file || d.url}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {d.verification_status && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Badge
                          className={`h-5 text-[10px] px-1.5 cursor-pointer hover:opacity-80 transition-opacity ${
                            d.verification_status === "verified_true"
                              ? "bg-green-500"
                              : d.verification_status === "verified_fake"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          }`}
                        >
                          {d.verification_status
                            .replace("_", " ")
                            .toUpperCase()}
                        </Badge>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            AI Verification Analysis
                          </DialogTitle>
                          <DialogDescription>
                            Detailed breakdown for {d.name || "Document"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                                Overall Score
                              </p>
                              <p className="text-2xl font-bold text-blue-700">
                                {Math.round(d.verification_score || 0)}%
                              </p>
                            </div>
                            <Badge
                              className={
                                d.verification_status === "verified_true"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : d.verification_status === "verified_fake"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }
                            >
                              {d.verification_status
                                .replace("_", " ")
                                .toUpperCase()}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold flex items-center gap-2">
                              <Info className="w-4 h-4 text-slate-400" />
                              Verification Result
                            </h5>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                              <VerificationResultDisplay 
                                details={d.verification_details} 
                              />
                            </div>
                          </div>

                          <div className="text-[10px] text-muted-foreground text-right italic">
                            Verified on:{" "}
                            {d.verified_at
                              ? new Date(d.verified_at).toLocaleString()
                              : "N/A"}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {verifyEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        d.verification_status
                          ? "border-primary text-primary"
                          : "text-muted-foreground"
                      }
                      onClick={() => handleVerifySingle(d.id)}
                      disabled={verifying !== null}
                    >
                      {verifying === d.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Shield className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Verify
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDoc(d)}
                    disabled={downloading === (d.id || d.file || d.url)}
                  >
                    {downloading === (d.id || d.file || d.url)
                      ? "Opening..."
                      : "View"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Global Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              AI Verification Results
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown for{" "}
              {currentVerificationResult?.name || "Document"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                  Overall Score
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.round(
                    currentVerificationResult?.verification_score || 0,
                  )}
                  %
                </p>
              </div>
              <Badge
                className={
                  currentVerificationResult?.verification_status ===
                  "verified_true"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : currentVerificationResult?.verification_status ===
                        "verified_fake"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : "bg-yellow-100 text-yellow-700 border-yellow-200"
                }
              >
                {(currentVerificationResult?.verification_status || "")
                  .replace("_", " ")
                  .toUpperCase()}
              </Badge>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400" />
                Verification Result
              </h5>
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <VerificationResultDisplay 
                  details={currentVerificationResult?.verification_details} 
                />
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground text-right italic">
              Verified on:{" "}
              {currentVerificationResult?.verified_at
                ? new Date(
                    currentVerificationResult.verified_at,
                  ).toLocaleString()
                : "N/A"}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
