"use client";
import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  CreditCard,
  Loader2,
  Landmark,
  Wallet,
  CheckCircle2,
  Building,
  BadgeCheck,
  Download,
  AlertCircle,
  HardHat,
  Briefcase,
  Globe,
  Users,
  Wrench,
  Hammer,
  Paintbrush,
  Zap,
  PenTool,
  Truck,
  Ship,
  Package,
  Phone,
  Smartphone,
  Mail,
  Banknote,
  Hash,
  FileText,
  Flag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { licensesApi, partnershipsApi, vehiclesApi } from "@/lib/api/django-client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Country codes for phone numbers
const COUNTRY_CODES = [
  { code: "+251", country: "ET", name: "Ethiopia", flag: "🇪🇹", length: 9 },
  { code: "+254", country: "KE", name: "Kenya", flag: "🇰🇪", length: 9 },
  { code: "+255", country: "TZ", name: "Tanzania", flag: "🇹🇿", length: 9 },
  { code: "+256", country: "UG", name: "Uganda", flag: "🇺🇬", length: 9 },
  { code: "+252", country: "SO", name: "Somalia", flag: "🇸🇴", length: 8 },
  { code: "+211", country: "SS", name: "South Sudan", flag: "🇸🇸", length: 9 },
];

// License type sections with categories
const LICENSE_SECTIONS = {
  contractor: {
    id: "contractor",
    title: "Contractor License",
    icon: HardHat,
    description: "For construction and contracting businesses",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    categories: [
      {
        id: "grade-1",
        name: "Grade 1",
        price: "500.00",
        description: "Unlimited contract value",
        icon: Building,
      },
      {
        id: "grade-2",
        name: "Grade 2",
        price: "450.00",
        description: "Up to 10M ETB contract value",
        icon: Building,
      },
      {
        id: "grade-3",
        name: "Grade 3",
        price: "400.00",
        description: "Up to 5M ETB contract value",
        icon: Building,
      },
      {
        id: "grade-4",
        name: "Grade 4",
        price: "350.00",
        description: "Up to 2M ETB contract value",
        icon: Building,
      },
      {
        id: "grade-5",
        name: "Grade 5",
        price: "300.00",
        description: "Up to 1M ETB contract value",
        icon: Building,
      },
      {
        id: "grade-6",
        name: "Grade 6",
        price: "200.00",
        description: "Up to 500K ETB contract value",
        icon: Building,
      },
      {
        id: "grade-7",
        name: "Grade 7",
        price: "150.00",
        description: "Up to 200K ETB contract value",
        icon: Building,
      },
      {
        id: "grade-b",
        name: "Grade B",
        price: "150.00",
        description: "Specialty contractor",
        icon: Wrench,
      },
    ],
  },
  professional: {
    id: "professional",
    title: "Professional License",
    icon: Briefcase,
    description: "For individual professionals and consultants",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    categories: [
      {
        id: "engineer",
        name: "Professional Engineer",
        price: "200.00",
        description: "Engineering services",
        icon: PenTool,
      },
      {
        id: "architect",
        name: "Architect",
        price: "200.00",
        description: "Architectural services",
        icon: Paintbrush,
      },
      {
        id: "surveyor",
        name: "Land Surveyor",
        price: "200.00",
        description: "Surveying services",
        icon: Zap,
      },
      {
        id: "consultant",
        name: "Consultant",
        price: "200.00",
        description: "Professional consulting",
        icon: Users,
      },
    ],
  },
  importExport: {
    id: "importExport",
    title: "Import/Export License",
    icon: Globe,
    description: "For international trade businesses",
    color: "text-green-600",
    bgColor: "bg-green-100",
    categories: [
      {
        id: "general-importer",
        name: "General Importer",
        price: "300.00",
        description: "Import all goods",
        icon: Truck,
      },
      {
        id: "general-exporter",
        name: "General Exporter",
        price: "300.00",
        description: "Export all goods",
        icon: Ship,
      },
      {
        id: "special-importer",
        name: "Special Importer",
        price: "250.00",
        description: "Specific goods only",
        icon: Package,
      },
      {
        id: "special-exporter",
        name: "Special Exporter",
        price: "250.00",
        description: "Specific goods only",
        icon: Package,
      },
    ],
  },
  partnership: {
    id: "partnership",
    title: "Partnership/JV License",
    icon: Users,
    description: "For joint ventures and partnerships",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    categories: [
      {
        id: "partnership-standard",
        name: "Standard Partnership",
        price: "400.00",
        description: "Standard JV agreement",
        icon: Users,
      },
      {
        id: "partnership-foreign",
        name: "Foreign Partnership",
        price: "600.00",
        description: "International JV agreement",
        icon: Globe,
      },
    ],
  },
  vehicle: {
    id: "vehicle",
    title: "Vehicle Registration",
    icon: Truck,
    description: "For commercial vehicle registration",
    color: "text-rose-600",
    bgColor: "bg-rose-100",
    categories: [
      {
        id: "commercial-vehicle",
        name: "Commercial Vehicle",
        price: "150.00",
        description: "Standard commercial vehicle",
        icon: Truck,
      },
      {
        id: "heavy-machinery",
        name: "Heavy Machinery",
        price: "250.00",
        description: "Construction machinery",
        icon: Wrench,
      },
    ],
  },
};

// Payment method configuration with dynamic field requirements
const PAYMENT_METHODS = [
  {
    id: "card",
    name: "Telebirr",
    icon: CreditCard,
    description: "Pay securely with Telebirr",
    brands: ["Ethio-Telecom"],
    processingTime: "Instant",
    fieldRequired: true,
    fieldType: "phone",
    fieldLabel: "Telebirr Phone Number",
    fieldPlaceholder: "91XXXXXX",
    fieldIcon: Phone,
    fieldHelp: "Enter your 9-digit Telebirr number (without country code)",
    defaultCountryCode: "+251",
    allowedCountryCodes: ["+251"],
    localNumberLength: 9,
    totalWithCodeLength: 13,
  },
];

export default function PayCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <PayCertificateContent />
    </Suspense>
  );
}

function PayCertificateContent() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [license, setLicense] = useState<any>(null);
  const [method, setMethod] = useState<string>("card");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentField, setPaymentField] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("+251");
  const [businessDetails, setBusinessDetails] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
  });
  const [isLocked, setIsLocked] = useState(false);
  const licId = String(params?.id || "").trim();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        if (!licId) return;
        setLoading(true);
        
        // Priority 1: Check section from URL
        const sectionFromUrl = searchParams.get("section");
        const categoryFromUrl = searchParams.get("category");
        
        let found: any = null;
        let resolvedSection = sectionFromUrl || "";
        
        // Fetch based on section
        if (resolvedSection === "partnership") {
          try {
            const list = await partnershipsApi.list();
            const arr = Array.isArray(list) ? list : [];
            found = arr.find(x => String(x.id) === licId);
          } catch (e) {
            console.warn("Failed to fetch from partnershipsApi:", e);
          }
        } else if (resolvedSection === "vehicle") {
          try {
            const list = await vehiclesApi.list();
            const arr = Array.isArray(list) ? list : [];
            found = arr.find(x => String(x.id) === licId);
          } catch (e) {
            console.warn("Failed to fetch from vehiclesApi:", e);
          }
        }
        
        // If not found yet, try licensesApi
        if (!found) {
          try {
            const list = await licensesApi.list();
            const arr = Array.isArray(list) ? list : [];
            found = arr.find(
              (x: any) =>
                String(x.id) === licId || String(x.license_number) === licId,
            );
          } catch (e) {
            console.warn("Failed to fetch from licensesApi:", e);
          }
        }

        if (mounted && found) {
          setLicense(found);
          setIsLocked(true);

          const type = String(
            found.license_type || found.type || found.partnership_type || found.partnershipType || "",
          ).toLowerCase();
          
          let grade = String(
            found.grade ||
              found.data?.grade ||
              found.data?.subtype ||
              found.subtype ||
              "",
          )
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");
          
          const position = String(
            found.data?.position ||
              found.data?.current_position ||
              found.data?.currentPosition ||
              found.position ||
              "",
          ).toLowerCase();
          
          const permitDetails = String(
            found.data?.permitDetails ||
              found.data?.permit_details ||
              found.permitDetails ||
              "",
          ).toLowerCase();

          // Normalize numeric grades: "1" -> "grade-1"
          if (/^\d+$/.test(grade)) {
            grade = `grade-${grade}`;
          }

          // Section Resolution (if not already set from URL)
          if (!resolvedSection) {
            if (
              type.includes("professional") ||
              type.includes("consultant") ||
              position.length > 0
            )
              resolvedSection = "professional";
            else if (type.includes("import") || type.includes("export"))
              resolvedSection = "importExport";
            else if (type.includes("partnership") || type.includes("jv"))
              resolvedSection = "partnership";
            else if (type.includes("vehicle")) 
              resolvedSection = "vehicle";
            else
              resolvedSection = "contractor";
          }

          setSelectedSection(resolvedSection);

          // Category Resolution with robust mapping
          let category: string = categoryFromUrl || "";

          if (!category) {
            // Contractor Mapping
            if (resolvedSection === "contractor") {
              if (grade.includes("1")) category = "grade-1";
              else if (grade.includes("2")) category = "grade-2";
              else if (grade.includes("3")) category = "grade-3";
              else if (grade.includes("4")) category = "grade-4";
              else if (grade.includes("5")) category = "grade-5";
              else if (grade.includes("6")) category = "grade-6";
              else if (grade.includes("7")) category = "grade-7";
              else if (grade.includes("b")) category = "grade-b";
              else category = "grade-1"; // Default for contractor
            }
            // Professional Mapping
            else if (resolvedSection === "professional") {
              if (
                type.includes("engineer") ||
                grade.includes("engineer") ||
                position.includes("engineer")
              )
                category = "engineer";
              else if (
                type.includes("architect") ||
                grade.includes("architect") ||
                position.includes("architect")
              )
                category = "architect";
              else if (
                type.includes("surveyor") ||
                grade.includes("surveyor") ||
                position.includes("surveyor")
              )
                category = "surveyor";
              else if (
                type.includes("consultant") ||
                grade.includes("consultant") ||
                position.includes("consultant")
              )
                category = "consultant";
              else category = "engineer"; // Default for professional
            }
            // Import/Export Mapping
            else if (resolvedSection === "importExport") {
              const isSpecial =
                type.includes("special") ||
                grade.includes("special") ||
                permitDetails.includes("special");
              if (
                type.includes("importer") ||
                grade.includes("importer") ||
                permitDetails.includes("importer")
              ) {
                category = isSpecial ? "special-importer" : "general-importer";
              } else if (
                type.includes("exporter") ||
                grade.includes("exporter") ||
                permitDetails.includes("exporter")
              ) {
                category = isSpecial ? "special-exporter" : "general-exporter";
              } else {
                category = "general-importer"; // Default
              }
            }
            // Partnership Mapping
            else if (resolvedSection === "partnership") {
              category =
                type.includes("foreign") || grade.includes("foreign")
                  ? "partnership-foreign"
                  : "partnership-standard";
            }
            // Vehicle Mapping
            else if (resolvedSection === "vehicle") {
              category =
                type.includes("machinery") || grade.includes("machinery")
                  ? "heavy-machinery"
                  : "commercial-vehicle";
            }
          }

          if (category && category !== "null") {
            setSelectedCategory(category);
          }
        }
      } catch (error) {
        console.error("Failed to fetch license:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [licId, searchParams]);

  useEffect(() => {
    const s = searchParams?.get("section");
    const c = searchParams?.get("category");
    if (s) {
      setSelectedSection(s);
      setIsLocked(true);
    }
    if (c) {
      setSelectedCategory(c);
      setIsLocked(true);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const el = document.getElementById(`section-${selectedSection}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
  }, [selectedSection]);

  const currentSection =
    LICENSE_SECTIONS[selectedSection as keyof typeof LICENSE_SECTIONS];
  const selectedCategoryData = currentSection?.categories.find(
    (c: any) => c.id === selectedCategory,
  );

  const amount = useMemo(() => {
    if (selectedCategoryData) {
      return selectedCategoryData.price;
    }
    return "0.00";
  }, [selectedCategoryData]);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === method);
  const FieldIcon = selectedMethod?.fieldIcon || Phone;

  const availableCountryCodes = useMemo(() => {
    if (!selectedMethod?.allowedCountryCodes) return COUNTRY_CODES;
    return COUNTRY_CODES.filter((cc) =>
      selectedMethod.allowedCountryCodes.includes(cc.code),
    );
  }, [selectedMethod]);

  useEffect(() => {
    if (selectedMethod?.defaultCountryCode) {
      setCountryCode(selectedMethod.defaultCountryCode);
    }
    setPaymentField("");
  }, [selectedMethod]);

  const validateEthiopianPhone = (phone: string): boolean => {
    const ethiopianPhoneRegex = /^[9][0-9]{8}$/;
    return ethiopianPhoneRegex.test(phone);
  };

  const validatePhoneWithCountryCode = (
    phone: string,
    code: string,
  ): boolean => {
    const selectedCountry = COUNTRY_CODES.find((cc) => cc.code === code);
    if (!selectedCountry) return false;

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length !== selectedCountry.length) return false;

    if (code === "+251") {
      return validateEthiopianPhone(cleanPhone);
    }

    return /^\d+$/.test(cleanPhone);
  };

  const validateField = (value: string) => {
    if (!selectedMethod?.fieldRequired) return true;
    return validatePhoneWithCountryCode(value, countryCode);
  };

  const formatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, "");
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = formatPhoneNumber(value);
    value = value.slice(0, 9);
    setPaymentField(value);
  };

  const getFullPhoneNumber = () => {
    if (selectedMethod?.fieldType !== "phone") return paymentField;
    const cleanLocal = paymentField.replace(/^0+/, "");
    return `${countryCode}${cleanLocal}`;
  };

  const canPay = useMemo(() => {
    if (!selectedCategoryData) return false;
    if (selectedMethod?.fieldType === "phone") {
      return validateField(paymentField);
    }
    return !!businessDetails.businessName && !!businessDetails.email;
  }, [
    selectedCategoryData,
    businessDetails.businessName,
    businessDetails.email,
    selectedMethod,
    paymentField,
    countryCode,
  ]);

  const handlePay = async () => {
    if (!licId || !selectedCategory) {
      toast({
        title: "Selection Required",
        description: "Please select a license category to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!businessDetails.businessName || !businessDetails.email) {
      toast({
        title: "Business Details Required",
        description: "Please fill in the required business information.",
        variant: "destructive",
      });
      return;
    }

    if (selectedMethod?.fieldRequired && !paymentField) {
      toast({
        title: `${selectedMethod?.fieldType === "account" ? "Account Number" : "Phone Number"} Required`,
        description: `Please enter your ${selectedMethod?.fieldLabel.toLowerCase()} to continue.`,
        variant: "destructive",
      });
      return;
    }

    if (paymentField && !validateField(paymentField)) {
      if (selectedMethod?.fieldType === "account") {
        toast({
          title: "Invalid Account Number",
          description: "Please enter a valid 13-digit CBE account number",
          variant: "destructive",
        });
      } else {
        const selectedCountry = COUNTRY_CODES.find(
          (cc) => cc.code === countryCode,
        );
        toast({
          title: "Invalid Phone Number",
          description: `Please enter a valid ${selectedCountry?.name} phone number (${selectedCountry?.length} digits)`,
          variant: "destructive",
        });
      }
      return;
    }

    try {
      setIsProcessing(true);
      const { paymentsApi: api } = await import("@/lib/api/django-client");

      const metadata: any = {
        purpose: "certificate",
        license_id: licId,
        license_section: selectedSection,
        license_category: selectedCategory,
        payment_method: method,
        license_number: license?.license_number,
        business_name: businessDetails.businessName,
        contact_person: businessDetails.contactPerson,
        email: businessDetails.email,
        business_phone: businessDetails.phone,
      };

      if (selectedMethod?.fieldType === "account") {
        metadata.account_number = paymentField;
      } else {
        const fullNumber = getFullPhoneNumber();
        metadata.payment_phone = fullNumber;
        metadata.country_code = countryCode;
        metadata.local_number = paymentField;
        metadata.total_digits = fullNumber.replace(/\D/g, "").length;
      }

      const chapaResponse = await api.initializeChapa({
        amount,
        currency: "ETB",
        metadata,
      });

      if (
        chapaResponse?.status === "success" &&
        chapaResponse?.data?.checkout_url
      ) {
        toast({
          title: "Payment Initialized! 🚀",
          description: "Redirecting to Chapa checkout...",
          variant: "default",
        });

        // Save current license ID and path to verify after redirect back
        if (typeof window !== "undefined") {
          localStorage.setItem("clms_pending_payment_lic", licId);
          localStorage.setItem("clms_pending_payment_tx", chapaResponse.data.tx_ref);
          localStorage.setItem("clms_pending_payment_section", selectedSection);
          localStorage.setItem("clms_pending_payment_purpose", "certificate");
        }

        setTimeout(() => {
          window.location.href = chapaResponse.data.checkout_url;
        }, 1000);
      } else {
        throw new Error(
          chapaResponse?.message || "Failed to initialize payment with Chapa",
        );
      }
    } catch (e: any) {
      toast({
        title: "Payment Failed",
        description:
          e?.message || "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || !selectedSection) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Loading license details...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-10">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <BadgeCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            License Certificate Payment
          </h1>
          <p className="text-slate-600">
            Select your license type and complete payment to download
            certificate
          </p>
        </div>

        {/* License Type Selection */}
        <div className="mb-8">
          <Tabs
            value={selectedSection}
            onValueChange={(val) => !isLocked && setSelectedSection(val as any)}
            className="w-full"
          >
            <TabsList
              className={cn(
                "grid w-full h-auto grid-cols-2 sm:grid-cols-5",
                isLocked && "opacity-60 cursor-not-allowed pointer-events-none",
              )}
            >
              {Object.values(LICENSE_SECTIONS).map((section) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{section.title}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(LICENSE_SECTIONS).map(([key, section]) => {
              const Icon = section.icon;
              return (
                <TabsContent
                  key={key}
                  value={key}
                  className="mt-6"
                  id={`section-${key}`}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={cn("p-3 rounded-lg", section.bgColor)}>
                          <Icon className={cn("h-6 w-6", section.color)} />
                        </div>
                        <div>
                          <CardTitle>{section.title}</CardTitle>
                          <CardDescription>
                            {section.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                        className={cn(
                          "grid gap-4 md:grid-cols-2",
                          isLocked && "opacity-60 pointer-events-none",
                        )}
                      >
                        {section.categories.map((category: any) => {
                          const CategoryIcon = category.icon;
                          return (
                            <div key={category.id}>
                              <RadioGroupItem
                                value={category.id}
                                id={category.id}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={category.id}
                                className={cn(
                                  "flex flex-col p-4 rounded-lg border-2 transition-all",
                                  !isLocked &&
                                    "cursor-pointer hover:border-primary/50 hover:bg-primary/5",
                                  isLocked && "cursor-not-allowed",
                                  selectedCategory === category.id
                                    ? "border-primary bg-primary/5"
                                    : "border-muted",
                                )}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                                  <Badge
                                    variant={
                                      selectedCategory === category.id
                                        ? "default"
                                        : "outline"
                                    }
                                  >
                                    {category.price} ETB
                                  </Badge>
                                </div>
                                <span className="font-medium">
                                  {category.name}
                                </span>
                                <span className="text-sm text-muted-foreground mt-1">
                                  {category.description}
                                </span>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Payment Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* License Summary */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  License Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">License ID</label>
                    <div className="p-2 bg-slate-50 rounded-md border font-mono text-sm">
                      {licId}
                    </div>
                  </div>
                  {license?.license_number && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        License Number
                      </label>
                      <div className="p-2 bg-slate-50 rounded-md border font-mono text-sm">
                        {license.license_number}
                      </div>
                    </div>
                  )}
                </div>

                {selectedCategoryData && (
                  <Alert className="bg-primary/5 border-primary/20">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      Selected:{" "}
                      <span className="font-medium">
                        {currentSection.title} - {selectedCategoryData.name}
                      </span>{" "}
                      ({selectedCategoryData.price} ETB)
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Please provide your business details for the certificate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={businessDetails.businessName}
                      onChange={(e) =>
                        setBusinessDetails((prev) => ({
                          ...prev,
                          businessName: e.target.value,
                        }))
                      }
                      placeholder="Enter business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={businessDetails.contactPerson}
                      onChange={(e) =>
                        setBusinessDetails((prev) => ({
                          ...prev,
                          contactPerson: e.target.value,
                        }))
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={businessDetails.email}
                      onChange={(e) =>
                        setBusinessDetails((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Business Phone</Label>
                    <Input
                      id="phone"
                      value={businessDetails.phone}
                      onChange={(e) =>
                        setBusinessDetails((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Method
                </CardTitle>
                <CardDescription>Choose how you want to pay</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {PAYMENT_METHODS.map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = method === pm.id;

                    return (
                      <button
                        key={pm.id}
                        onClick={() => {
                          setMethod(pm.id);
                          setPaymentField(""); // Reset field when changing method
                        }}
                        className={cn(
                          "w-full text-left p-4 rounded-lg border-2 transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-muted bg-white",
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-slate-100",
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{pm.name}</span>
                              {isSelected && (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {pm.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              {pm.brands.map((brand) => (
                                <Badge
                                  key={brand}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {brand}
                                </Badge>
                              ))}
                              <Badge variant="outline" className="text-xs">
                                {pm.processingTime}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedCategoryData && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        License Type
                      </span>
                      <span className="font-medium">
                        {currentSection.title}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">
                        {selectedCategoryData.name}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{amount} ETB</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Processing Fee
                      </span>
                      <span>0.00 ETB</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-medium">
                      <span>Total</span>
                      <span className="text-xl text-primary">{amount} ETB</span>
                    </div>
                  </div>
                )}

                {!selectedCategoryData && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please select a license category
                    </AlertDescription>
                  </Alert>
                )}

                {/* Dynamic Field - Phone or Account Number based on payment method */}
                {selectedMethod && selectedCategoryData && (
                  <div className="space-y-3 pt-2">
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FieldIcon className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">
                          {selectedMethod.fieldLabel}
                          {selectedMethod.fieldRequired && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                      </div>

                      {selectedMethod.fieldType === "phone" ? (
                        <div className="flex gap-2">
                          <Select
                            value={countryCode}
                            onValueChange={setCountryCode}
                          >
                            <SelectTrigger className="w-27.5">
                              <SelectValue>
                                <span className="flex items-center gap-1">
                                  {
                                    COUNTRY_CODES.find(
                                      (c) => c.code === countryCode,
                                    )?.flag
                                  }{" "}
                                  {countryCode}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {availableCountryCodes.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.flag} {c.code} ({c.name})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={paymentField}
                            onChange={handleFieldChange}
                            placeholder={selectedMethod.fieldPlaceholder}
                            className="flex-1"
                          />
                        </div>
                      ) : (
                        <Input
                          value={paymentField}
                          onChange={handleFieldChange}
                          placeholder={selectedMethod.fieldPlaceholder}
                        />
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedMethod.fieldHelp}
                      </p>
                    </div>
                  </div>
                )}

                <CardFooter className="px-0 pt-6">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePay}
                    disabled={isProcessing || !canPay}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>Pay {amount} ETB & Continue</>
                    )}
                  </Button>
                </CardFooter>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
