"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Search,
  Filter,
  Eye,
  ArrowLeft,
  Loader2,
  Download,
  FileDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applicationsApi,
  partnershipsApi,
  vehiclesApi,
  documentsApi,
} from "@/lib/api/django-client";
import { useToast } from "@/hooks/use-toast";
import { DJANGO_API_URL } from "@/lib/config/django-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Application {
  id: string;
  license_type: string;
  applicant: string;
  created_at: string;
  status: string;
  data: any;
}

export default function AdminApplications() {
  const { toast } = useToast();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [docsModalFor, setDocsModalFor] = useState<string | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsList, setDocsList] = useState<any[]>([]);
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        // Fetch all application-related data in parallel, handling individual failures gracefully
        const [appsData, partnershipsData, vehiclesData] = await Promise.all([
          applicationsApi.list().catch((e) => {
            console.error("[clms] Failed to fetch standard apps:", e);
            return [];
          }),
          partnershipsApi.list().catch((e) => {
            console.error("[clms] Failed to fetch partnerships:", e);
            return [];
          }),
          vehiclesApi.list().catch((e) => {
            console.error("[clms] Failed to fetch vehicles:", e);
            return [];
          }),
        ]);

        // Normalize data structures
        const normalApps = (
          Array.isArray(appsData) ? appsData : appsData.results || []
        ).map((a: any) => ({
          ...a,
          _uniqueKey: `app-${a.id}`,
        }));

        const normalPartnerships = (
          Array.isArray(partnershipsData)
            ? partnershipsData
            : (partnershipsData as any).results || []
        ).map((p: any) => ({
          id: p.id,
          _uniqueKey: `partnership-${p.id}`,
          applicant: p.owner_email || p.owner?.email || "N/A",
          license_type: "Partnership Registration",
          status: p.status,
          created_at: p.created_at,
          data: {
            ...p,
            companyName:
              p.main_contractor?.name ||
              p.registration_data?.partnershipName ||
              "N/A",
          },
        }));

        const normalVehicles = (
          Array.isArray(vehiclesData)
            ? vehiclesData
            : (vehiclesData as any).results || []
        ).map((v: any) => ({
          id: v.id,
          _uniqueKey: `vehicle-${v.id}`,
          applicant: v.owner_email || v.owner?.email || "N/A",
          license_type: "Vehicle Registration",
          status: v.status,
          created_at: v.created_at,
          data: {
            ...v,
            companyName: v.plate_number || v.vehicle_type || "N/A",
          },
        }));

        // Combine all applications
        setApplications([
          ...normalApps,
          ...normalPartnerships,
          ...normalVehicles,
        ]);
      } catch (err: any) {
        console.error("[clms] Failed to fetch admin applications:", err);
        const msg = err?.message || "Failed to load applications";
        setError(msg);
        try {
          const lower = String(msg).toLowerCase();
          if (
            err?.status === 401 ||
            lower.includes("authentication credentials were not provided")
          ) {
            router.push("/admin-login");
            toast({
              title: "Sign in required",
              description: "Please sign in to access admin applications.",
              variant: "destructive",
            });
          }
        } catch {}
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleDownloadZip = async (id: string) => {
    try {
      setDownloadingZipId(id);
      const blob = await applicationsApi.downloadDocuments(id);
      if (blob.type === "application/json") {
        try {
          const text =
            (await (blob as any).text?.()) || (await new Response(blob).text());
          const json = JSON.parse(text);
          toast({
            title: "Download Failed",
            description: json.detail || "Could not download documents.",
            variant: "destructive",
          });
          return;
        } catch {
          toast({
            title: "Download Failed",
            description: "Could not download documents.",
            variant: "destructive",
          });
          return;
        }
      }
      const filename = `application-${id}-documents.zip`;
      downloadBlob(blob, filename);
      toast({
        title: "Download Started",
        description: `Downloading ${filename}`,
      });
    } catch (e: any) {
      console.error("Download ZIP error:", e);
      toast({
        title: "Download Failed",
        description: e?.message || "Could not download ZIP.",
        variant: "destructive",
      });
    } finally {
      setDownloadingZipId(null);
    }
  };

  const openDocsModal = async (id: string) => {
    setDocsModalFor(id);
    setDocsLoading(true);
    try {
      const docs = await documentsApi.list({ application: id });
      const results = Array.isArray(docs) ? docs : docs.results || [];
      // Also fetch application detail to include photo fields
      const appDetail = await applicationsApi.getDetail(id);
      const photos: any[] = [];
      try {
        const p1 = appDetail?.profile_photo;
        const p2 = appDetail?.professional_photo;
        const p3 = appDetail?.company_representative_photo;
        if (p1)
          photos.push({
            id: `photo-profile-${id}`,
            filename: "profile_photo",
            file: p1,
            mime: "image",
            _kind: "photo",
          });
        if (p2)
          photos.push({
            id: `photo-professional-${id}`,
            filename: "professional_photo",
            file: p2,
            mime: "image",
            _kind: "photo",
          });
        if (p3)
          photos.push({
            id: `photo-company-representative-${id}`,
            filename: "company_representative_photo",
            file: p3,
            mime: "image",
            _kind: "photo",
          });
      } catch {}
      setDocsList([...photos, ...results]);
    } catch (e: any) {
      console.error("List documents error:", e);
      setDocsList([]);
      toast({
        title: "Failed to load documents",
        description: e?.message || "Error loading documents",
        variant: "destructive",
      });
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDownloadDoc = async (doc: any) => {
    try {
      let blob: Blob;
      if (doc._kind === "photo" && doc.file) {
        blob = await documentsApi.downloadByUrl(String(doc.file));
      } else if (doc.file) {
        blob = await documentsApi.downloadByUrl(String(doc.file));
      } else {
        blob = await documentsApi.download(String(doc.id));
      }
      if (blob.type === "application/json") {
        try {
          const text =
            (await (blob as any).text?.()) || (await new Response(blob).text());
          const json = JSON.parse(text);
          toast({
            title: "Download Failed",
            description: json.detail || "Could not download file.",
            variant: "destructive",
          });
          return;
        } catch {
          toast({
            title: "Download Failed",
            description: "Could not download file.",
            variant: "destructive",
          });
          return;
        }
      }
      const name = doc.filename || doc.name || doc.file || `document-${doc.id}`;
      const safeName = String(name).split("/").pop() || `document-${doc.id}`;
      downloadBlob(blob, safeName);
    } catch (e: any) {
      console.error("Download doc error:", e);
      toast({
        title: "Download Failed",
        description: e?.message || "Could not download file.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-300"
          >
            Pending
          </Badge>
        );
      case "under_review":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-300"
          >
            Under Review
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-300"
          >
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-300"
          >
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      contractor: "Contractor License",
      profile: "Contractor License",
      "Contractor License": "Contractor License",
      professional: "Professional License",
      "Professional License": "Professional License",
      import_export: "Import/Export License",
      company_representative: "Import/Export License",
      "Import/Export License": "Import/Export License",
      partnership: "Partnership Registration",
      vehicle: "Vehicle Registration",
    };
    return types[type] || type;
  };

  const filteredApplications = applications.filter((app) => {
    // console.log("Filtering app:", app.id, "Type:", app.license_type, "Status:", app.status);
    const matchesSearch =
      String(app.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(app.applicant || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(app.data?.applicantName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(app.data?.fullName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(app.data?.companyName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(app.data?.company_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      String(app.status).toLowerCase() === statusFilter.toLowerCase();

    // Normalize and match types
    const appType = (app.license_type || "").toLowerCase().trim();
    let matchesType = typeFilter === "all";
    if (!matchesType) {
      if (typeFilter === "contractor") {
        matchesType =
          appType.includes("contractor") || appType.includes("profile");
      } else if (typeFilter === "professional") {
        matchesType = appType.includes("professional");
      } else if (typeFilter === "import_export") {
        matchesType =
          appType.includes("import") ||
          appType.includes("export") ||
          appType.includes("company");
      } else if (typeFilter === "partnership") {
        matchesType = appType.includes("partnership");
      } else if (typeFilter === "vehicle") {
        matchesType = appType.includes("vehicle");
      } else {
        matchesType = appType === typeFilter.toLowerCase();
      }
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  Application Review
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  Review and process applications
                </p>
              </div>
            </div>
            <Button
              variant="outlineBlueHover"
              size="sm"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-spin" />
              <p className="text-slate-500">Loading applications...</p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <Button asChild>
                <Link href="/admin">Back to Admin</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Filter Applications</CardTitle>
                <CardDescription>
                  Search and filter applications by various criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by ID, name, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="contractor">
                        Contractor License
                      </SelectItem>
                      <SelectItem value="professional">
                        Professional License
                      </SelectItem>
                      <SelectItem value="import_export">
                        Import/Export License
                      </SelectItem>
                      <SelectItem value="partnership">
                        Partnership Registration
                      </SelectItem>
                      <SelectItem value="vehicle">
                        Vehicle Registration
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredApplications.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">
                      No applications found matching your filters
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredApplications.map((app: any) => (
                  <Card
                    key={app._uniqueKey || app.id}
                    className="hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 break-all">
                              {app.id}
                            </h3>
                            {getStatusBadge(app.status)}
                          </div>
                          <div className="grid gap-2 text-sm">
                            <div className="flex flex-col sm:flex-row sm:gap-2">
                              <span className="font-semibold text-slate-700 sm:w-24 shrink-0">
                                Type:
                              </span>
                              <span className="text-slate-600">
                                {getTypeLabel(app.license_type)}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:gap-2">
                              <span className="font-semibold text-slate-700 sm:w-24 shrink-0">
                                Applicant:
                              </span>
                              <span className="text-slate-600 truncate">
                                {app.data?.applicantName ||
                                  app.data?.fullName ||
                                  app.applicant}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:gap-2">
                              <span className="font-semibold text-slate-700 sm:w-24 shrink-0">
                                Company:
                              </span>
                              <span className="text-slate-600 truncate">
                                {app.data?.companyName ||
                                  app.data?.company_name ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:gap-2">
                              <span className="font-semibold text-slate-700 sm:w-24 shrink-0">
                                Submitted:
                              </span>
                              <span className="text-slate-600">
                                {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto mt-2 sm:mt-0">
                          <Button asChild className="w-full">
                            <Link
                              href={
                                app.license_type === "Vehicle Registration"
                                  ? `/admin/vehicles/${app.id}`
                                  : app.license_type === "Partnership Registration"
                                  ? `/admin/partnerships/${app.id}`
                                  : `/admin/applications/${app.id}`
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <Dialog
        open={!!docsModalFor}
        onOpenChange={(open) => !open && setDocsModalFor(null)}
      >
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Documents</DialogTitle>
            <DialogDescription>Download files individually</DialogDescription>
          </DialogHeader>
          {docsLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : docsList.length === 0 ? (
            <div className="py-4 text-slate-600 text-center">
              No documents found for this application.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-semibold text-slate-600">
                        File Details
                      </th>
                      <th className="h-10 px-4 text-right align-middle font-semibold text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsList.map((d) => (
                      <tr key={String(d.id)} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="font-bold text-slate-900 break-all line-clamp-1" title={String(d.filename || d.name)}>
                              {String(d.filename || d.name || d.file || `document-${d.id}`)}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                                {String(d.content_type || d.mime || (d._kind === "photo" ? "Photo" : "Document")).split('/')[0].toUpperCase()}
                              </Badge>
                              <span className="text-[10px] text-slate-400 truncate max-w-37.5">
                                {String(d.file || "").split('/').pop()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDoc(d)}
                            className="h-8"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
