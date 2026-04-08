"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { djangoApiRequest } from "@/lib/config/django-api";
import { DJANGO_API_URL, NEXT_PUBLIC_USE_PROXY } from "@/lib/config/django-api";
import { generateQRDataURL } from "@/lib/qr/qr-utils";

export async function generateLicensePDF(license: any) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;

  // Colors
  const gold = { r: 212, g: 175, b: 55 };
  const darkGold = { r: 169, g: 139, b: 44 };
  const black = { r: 20, g: 20, b: 20 };
  const green = { r: 34, g: 197, b: 94 };
  const grey = { r: 100, g: 100, b: 100 };

  // 1. Background & Watermark
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Subtle geometric watermark pattern
  pdf.setDrawColor(245, 245, 245);
  pdf.setLineWidth(0.2);
  const step = 15;
  for (let x = 0; x < pageWidth; x += step) {
    for (let y = 0; y < pageHeight; y += step) {
      pdf.circle(x, y, 1, "S");
    }
  }

  // 2. Elegant Gold Border
  const borderInset = 10;
  const borderWidth = 1.5;

  // Outer line (thin)
  pdf.setDrawColor(gold.r, gold.g, gold.b);
  pdf.setLineWidth(0.5);
  pdf.rect(
    borderInset,
    borderInset,
    pageWidth - borderInset * 2,
    pageHeight - borderInset * 2,
  );

  // Inner line (thick)
  pdf.setLineWidth(borderWidth);
  pdf.rect(
    borderInset + 2,
    borderInset + 2,
    pageWidth - (borderInset + 2) * 2,
    pageHeight - (borderInset + 2) * 2,
  );

  // Decorative Corners (Flourishes)
  const cornerSize = 25;
  pdf.setLineWidth(2);
  pdf.setDrawColor(gold.r, gold.g, gold.b);

  const drawCorner = (x: number, y: number, xDir: number, yDir: number) => {
    pdf.line(x, y, x + cornerSize * xDir, y);
    pdf.line(x, y, x, y + cornerSize * yDir);
    pdf.line(
      x + 4 * xDir,
      y + 4 * yDir,
      x + (cornerSize - 8) * xDir,
      y + 4 * yDir,
    );
    pdf.line(
      x + 4 * xDir,
      y + 4 * yDir,
      x + 4 * xDir,
      y + (cornerSize - 8) * yDir,
    );
    pdf.setFillColor(gold.r, gold.g, gold.b);
    pdf.circle(x + cornerSize * xDir, y, 1.5, "F");
    pdf.circle(x, y + cornerSize * yDir, 1.5, "F");
  };

  drawCorner(borderInset + 6, borderInset + 6, 1, 1);
  drawCorner(pageWidth - borderInset - 6, borderInset + 6, -1, 1);
  drawCorner(borderInset + 6, pageHeight - borderInset - 6, 1, -1);
  drawCorner(pageWidth - borderInset - 6, pageHeight - borderInset - 6, -1, -1);

  // 3. Header Section (Logo & Title)
  const logoY = borderInset + 20;

  // Draw Stylized Building Logo
  pdf.setFillColor(gold.r, gold.g, gold.b);
  const logoX = pageWidth / 2;

  // Main building block
  pdf.rect(logoX - 12, logoY + 5, 8, 14, "F");
  pdf.rect(logoX - 2, logoY, 4, 19, "F");
  pdf.rect(logoX + 4, logoY + 5, 8, 14, "F");

  // Roofs
  pdf.triangle(
    logoX - 12,
    logoY + 5,
    logoX - 4,
    logoY + 5,
    logoX - 8,
    logoY + 1,
    "F",
  );
  pdf.triangle(logoX - 2, logoY, logoX + 2, logoY, logoX, logoY - 4, "F");
  pdf.triangle(
    logoX + 4,
    logoY + 5,
    logoX + 12,
    logoY + 5,
    logoX + 8,
    logoY + 1,
    "F",
  );

  // Base
  pdf.rect(logoX - 18, logoY + 19, 36, 2, "F");

  // Title
  pdf.setFont("times", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(gold.r, gold.g, gold.b);

  let typeStr = (
    license.license_type ||
    license.type ||
    "PROFESSIONAL"
  ).toString();
  // Map internal types to display names
  if (
    typeStr === "Contractor License" ||
    typeStr === "contractor" ||
    typeStr === "profile"
  )
    typeStr = "CONTRACTOR LICENSE";
  else if (
    typeStr === "Import-export License" ||
    typeStr === "import-export" ||
    typeStr === "company_representative"
  )
    typeStr = "IMPORT/EXPORT LICENSE";
  else if (typeStr === "Professional License" || typeStr === "professional")
    typeStr = "PROFESSIONAL LICENSE";
  else typeStr = typeStr.toUpperCase().replace(/_/g, " ");

  if (
    !typeStr.endsWith(" LICENSE") &&
    !typeStr.endsWith(" PERMIT") &&
    !typeStr.endsWith(" CERTIFICATE")
  ) {
    typeStr += " LICENSE";
  }
  // Ensure we don't double up
  if (typeStr.endsWith(" LICENSE LICENSE")) {
    typeStr = typeStr.replace(" LICENSE LICENSE", " LICENSE");
  }

  pdf.text(typeStr, pageWidth / 2, logoY + 35, { align: "center" });

  // 4. Main Section (Photo & Name)
  const photoY = logoY + 50;
  const photoW = 45;
  const photoH = 55;
  const photoX = pageWidth / 2 - photoW / 2;

  // Photo Frame
  pdf.setDrawColor(gold.r, gold.g, gold.b);
  pdf.setLineWidth(1);
  pdf.rect(photoX - 2, photoY - 2, photoW + 4, photoH + 4);
  pdf.setDrawColor(220, 220, 220);
  pdf.rect(photoX, photoY, photoW, photoH);

  // Embed Photo
  const photoUrl =
    (license as any).photoUrl ||
    (license as any).licensePhotoUrl ||
    (license as any).license_photo_url ||
    null;
  if (photoUrl) {
    try {
      // If already a data URL, embed directly
      if (typeof photoUrl === "string" && photoUrl.startsWith("data:")) {
        const mime = photoUrl.split(";")[0].split(":")[1] || "JPEG";
        const format = mime.split("/")[1]?.toUpperCase() || "JPEG";
        pdf.addImage(photoUrl, format, photoX, photoY, photoW, photoH);
      } else {
        const resolvedUrl = (() => {
          const s = String(photoUrl);
          if (s.startsWith("http")) return s;
          if (s.startsWith("/")) return `${DJANGO_API_URL}${s}`;
          return s;
        })();
        let blob: Blob;
        // Use authenticated proxy-aware request for Django-hosted media to avoid CORS
        if (
          typeof resolvedUrl === "string" &&
          (resolvedUrl.startsWith(DJANGO_API_URL) || NEXT_PUBLIC_USE_PROXY)
        ) {
          blob = await djangoApiRequest<Blob>(resolvedUrl, {
            responseType: "blob",
          });
        } else {
          const resp = await fetch(resolvedUrl);
          blob = await resp.blob();
        }
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++)
          binary += String.fromCharCode(bytes[i]);
        const b64 =
          typeof window !== "undefined"
            ? window.btoa(binary)
            : Buffer.from(bytes).toString("base64");
        const mime = blob.type || "image/jpeg";
        const format = mime.split("/")[1]?.toUpperCase() || "JPEG";
        const photoDataUrl = `data:${mime};base64,${b64}`;
        pdf.addImage(photoDataUrl, format, photoX, photoY, photoW, photoH);
      }
    } catch (e) {
      console.warn("Failed to load license photo for PDF", e);
      pdf.setFontSize(30);
      pdf.setTextColor(200, 200, 200);
      pdf.text("?", pageWidth / 2, photoY + photoH / 2 + 5, {
        align: "center",
      });
    }
  }

  // License No
  const textY = photoY + photoH + 12;
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(black.r, black.g, black.b);
  // Robustly find license number from various possible keys
  let rawLicenseNo =
    (license as any).license_number ||
    (license as any).licenseNumber ||
    (license as any).registrationNumber ||
    (license as any).regNumber ||
    (license as any).id ||
    "";
  // Helper to format numeric ids into LIC-YYYY-###### style
  const formatLicenseNo = (val: any) => {
    if (!val && String(val) !== "0") return "PENDING";
    const s = String(val);
    // If already matches LIC-YYYY-xxxx, return as-is
    if (/^LIC-\d{4}-\d{4,}$/.test(s.toUpperCase())) return s.toUpperCase();
    // If contains non-digit prefix, return as-is uppercased
    if (/[^0-9]/.test(s)) return s.toUpperCase();
    // Numeric id -> zero-pad to 6 digits and prefix with current year
    const year = (() => {
      try {
        const d = new Date(
          license.issueDate ||
            license.issued_at ||
            license.created_at ||
            Date.now(),
        );
        return d.getFullYear();
      } catch (e) {
        return new Date().getFullYear();
      }
    })();
    const padded = s.padStart(6, "0");
    return `LIC-${year}-${padded}`;
  };

  const licenseNo = formatLicenseNo(rawLicenseNo);
  pdf.text(`LICENSE NO.: ${licenseNo}`, pageWidth / 2, textY, {
    align: "center",
  });

  // --- Sub-Info (Permit Details / Grade / Position) - Now Prominent ---
  let subInfoText = "";
  let subInfoLabel = "";

  // 1. Check for Import/Export Permit Details
  const isImportExport =
    String(license.license_type || license.type || "")
      .toLowerCase()
      .includes("import") ||
    String(license.license_type || license.type || "")
      .toLowerCase()
      .includes("company_representative");

  const isPartnership =
    String(license.license_type || license.type || "")
      .toLowerCase()
      .includes("partnership") ||
    String(license.license_type || license.type || "")
      .toLowerCase()
      .includes("joint_venture") ||
    String(license.partnership_type || "").length > 0;

  if (isImportExport) {
    const d =
      license.data && typeof license.data === "object" ? license.data : {};
    // Prioritize subtype and permitDetails, then try raw application data
    const pd =
      license.subtype ||
      license.permitDetails ||
      d.permitDetails ||
      d.permit_details ||
      d.subtype;

    if (
      pd &&
      String(pd).trim() &&
      String(pd).toLowerCase() !== "license" &&
      String(pd).toLowerCase() !== "null"
    ) {
      subInfoLabel = "";
      subInfoText = String(pd).toUpperCase().replace(/-/g, " ");
    } else {
      // Last resort: check if category is actually a permit detail
      const cat = String(license.category || d.category || "").toLowerCase();
      if (cat.includes("importer") || cat.includes("exporter")) {
        subInfoLabel = "";
        subInfoText = cat.toUpperCase().replace(/-/g, " ");
      }
    }
  }

  // 2. Check for Partnership Details
  if (!subInfoText && isPartnership) {
    const pt = String(
      license.partnership_type || license.partnershipType || license.type || "",
    ).toLowerCase();
    subInfoLabel = "PARTNERSHIP: ";
    if (pt.includes("foreign")) subInfoText = "FOREIGN-LOCAL JV";
    else if (pt.includes("joint")) subInfoText = "JOINT VENTURE";
    else if (pt.includes("consortium")) subInfoText = "CONSORTIUM";
    else if (pt.includes("subcontract")) subInfoText = "SUBCONTRACT";
    else subInfoText = pt.toUpperCase().replace(/_/g, " ");
  }

  // 3. Check for Professional Position (if no permit details)
  if (!subInfoText) {
    const isProfessional = String(license.license_type || license.type || "")
      .toLowerCase()
      .includes("professional");
    if (isProfessional) {
      const d =
        license.data && typeof license.data === "object" ? license.data : {};
      const pos =
        license.position ??
        d.position ??
        d.currentPosition ??
        d.current_position;
      if (pos && String(pos).trim()) {
        subInfoLabel = "POSITION: ";
        subInfoText = String(pos).toUpperCase();
      }
    }
  }

  // 3. Check for Contractor Grade (if still no sub-info)
  if (!subInfoText) {
    const isContractor =
      String(license.license_type || license.type || "")
        .toLowerCase()
        .includes("contractor") ||
      String(license.license_type || license.type || "")
        .toLowerCase()
        .includes("profile");
    if (isContractor) {
      const d =
        license.data && typeof license.data === "object" ? license.data : {};
      const rawGrade = license.grade ?? d.grade ?? d.licenseType ?? d.category;
      if (rawGrade) {
        const rg = String(rawGrade).toLowerCase();
        subInfoLabel = "GRADE: ";
        if (rg.includes("grade-a") || rg.includes("grade a"))
          subInfoText = "Grade A";
        else if (rg.includes("grade-b") || rg.includes("grade b"))
          subInfoText = "Grade B";
        else if (rg.includes("grade-c") || rg.includes("grade c"))
          subInfoText = "Grade C";
        else if (rg.includes("specialized"))
          subInfoText = "Specialized Contractor";
        else subInfoText = String(rawGrade).toUpperCase();
      }
    }
  }
  // 4. Check for Vehicle Details
  if (!subInfoText) {
    const isVehicle =
      String(license.license_type || license.type || "")
        .toLowerCase()
        .includes("vehicle") ||
      (license.data && String(license.data.vehicleType || "").length > 0);
    if (isVehicle) {
      const vt = String(
        license.data?.vehicleType || license.subtype || license.grade || "",
      ).toUpperCase();
      if (vt) {
        subInfoLabel = "VEHICLE: ";
        subInfoText = vt;
      }
    }
  }

  // Render the Prominent Sub-Info
  if (subInfoText) {
    pdf.setFont("times", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(gold.r, gold.g, gold.b); // Gold for the category title
    pdf.text(`${subInfoLabel}${subInfoText}`, pageWidth / 2, textY + 15, {
      align: "center",
    });
  }

  // --- Holder Name (Now under Sub-Info) ---
  const toTitleCase = (s: string) => {
    return s
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ");
  };
  let holderRaw =
    (license as any).holder_full_name ||
    (license as any).holder_name ||
    (license as any).holderName ||
    (license as any).fullName ||
    (license as any).owner ||
    "";
  const holderDisplay = holderRaw ? String(holderRaw).trim() : "Unknown Holder";
  const finalHolder = /[a-z]/.test(holderRaw)
    ? holderDisplay
    : toTitleCase(holderDisplay);

  pdf.setFont("times", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(black.r, black.g, black.b);

  // Clean string to avoid rendering issues
  const cleanHolder = String(finalHolder).replace(/[^\x20-\x7E]/g, "");

  const holderNameY = subInfoText ? textY + 30 : textY + 15;
  pdf.text(cleanHolder, pageWidth / 2, holderNameY, { align: "center" });

  // Separator Line (Thin line under Name) - Moved higher and made shorter to avoid overlaps
  pdf.setDrawColor(gold.r, gold.g, gold.b);
  pdf.setLineWidth(0.3);
  const lineY = holderNameY + 6;
  pdf.line(margin + 50, lineY, pageWidth - margin - 50, lineY);

  // 5. License Information Section
  const infoY = lineY + 12;

  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(black.r, black.g, black.b);

  // Line 1: Type and Company
  const typeLabel = "License Type: ";
  let typeVal = String(license.type || "Standard");
  // Map internal types to display names
  if (typeVal === "profile" || typeVal === "contractor")
    typeVal = "CONTRACTOR LICENSE";
  else if (typeVal === "company_representative" || typeVal === "import-export")
    typeVal = "IMPORT/EXPORT LICENSE";
  else if (typeVal === "professional") typeVal = "PROFESSIONAL LICENSE";
  else typeVal = typeVal.toUpperCase().replace(/_/g, " ");

  const typeDisplay = typeVal.endsWith("LICENSE")
    ? typeVal
    : typeVal + " LICENSE";
  const finalTypeDisplay = typeDisplay.replace("LICENSE LICENSE", "LICENSE");

  const companyLabel = "Company: ";
  const companyVal =
    String(
      (license as any).companyName ||
        (license as any).company_name ||
        ((license as any).data
          ? (license as any).data.companyName ||
            (license as any).data.company_name
          : "") ||
        "",
    )
      .trim()
      .toUpperCase() || "N/A";

  // We want to center the whole line: "• License Type: ...    • Company: ..."
  const bullet = "•";
  const spacer = "      "; // space between items

  const line1Part1 = `${bullet} ${typeLabel}${finalTypeDisplay}`;
  const line1Part2 = `${bullet} ${companyLabel}${companyVal}`;
  const line1Full = `${line1Part1}${spacer}${line1Part2}`;

  pdf.text(line1Full, pageWidth / 2, infoY, { align: "center" });

  // Line 2: Category
  const row2Y = infoY + 8;
  const catLabel = "Category: ";
  let catVal = String(license.category || "General");
  if (catVal.toUpperCase() === "LICENSE" && subInfoText) {
    catVal = subInfoText;
  }
  const catText = `${bullet} ${catLabel}${catVal.toUpperCase()}`;

  pdf.text(catText, pageWidth / 2, row2Y, { align: "center" });

  // Status Badge (Active)
  const badgeY = row2Y + 8;
  const statusText = String(license.status || "Active").toUpperCase();

  if (statusText === "ACTIVE" || statusText === "APPROVED") {
    // Draw centered badge
    const badgeW = 25;
    const badgeH = 6;
    const badgeX = (pageWidth - badgeW) / 2;

    pdf.setFillColor(green.r, green.g, green.b);
    pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont("times", "bold");
    pdf.text(statusText, pageWidth / 2, badgeY + 4, { align: "center" });
  } else {
    pdf.setTextColor(black.r, black.g, black.b);
    pdf.text(statusText, pageWidth / 2, badgeY + 4, { align: "center" });
  }

  // 6. Dates Section
  const datesY = badgeY + 28;
  pdf.setFont("times", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(black.r, black.g, black.b);

  // Issued Date (Left)
  pdf.setFont("times", "normal");
  const parseDate = (val: any): Date | null => {
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };
  const baseIssueDate =
    parseDate((license as any).issueDate) ||
    parseDate((license as any).issued_date) ||
    parseDate((license as any).issuedAt) ||
    parseDate((license as any).created_at) ||
    new Date("2026-02-15T00:00:00Z");
  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const issueStr = formatDate(baseIssueDate);
  const issuedText = `Issued Date: ${issueStr}`;

  // Expiry Date (Right)
  pdf.setFont("times", "normal");
  const baseExpiryDate =
    parseDate((license as any).expiryDate) ||
    parseDate((license as any).expiry_date) ||
    new Date("2031-02-15T00:00:00Z");
  const expiryStr = formatDate(baseExpiryDate);
  const expiryText = `Expiry Date: ${expiryStr}`;
  const sealRForLayout = 22;
  const rightTextX = pageWidth - margin - sealRForLayout - 5;
  const expiryY = datesY + 7;

  // 7. Verification & Approval
  const bottomY = pageHeight - margin - 20;

  // QR Code (Left) - Generate if missing
  let qrDataUrl = license.qrDataUrl;
  if (!qrDataUrl) {
    try {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const displayNumber =
        license.license_number ||
        license.licenseNumber ||
        license.registrationNumber ||
        license.id ||
        "";
      const verificationUrl = `${baseUrl}/verify?licenseNumber=${encodeURIComponent(String(displayNumber))}`;
      const payload = {
        licenseId: String(license.id || ""),
        licenseNumber: String(displayNumber),
        holderName: holderDisplay,
        companyName: companyVal,
        type: typeVal,
        issueDate: issueStr,
        expiryDate: expiryStr,
        verificationUrl,
        generatedAt: new Date().toISOString(),
      };
      qrDataUrl = await generateQRDataURL(JSON.stringify(payload), {
        width: 300,
      });
    } catch (e) {
      console.warn("Failed to generate QR for PDF", e);
    }
  }

  if (qrDataUrl) {
    const qrSize = 35;
    const qrX = margin + 10;
    const qrY = bottomY - qrSize + 5;
    pdf.setFont("times", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(black.r, black.g, black.b);
    const dateX = qrX;
    const issuedYAboveQR = qrY - 8;
    const expiryYAboveQR = qrY - 2;
    pdf.text(issuedText, dateX, issuedYAboveQR);
    pdf.text(expiryText, dateX, expiryYAboveQR);
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
  } else {
    pdf.setFont("times", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(black.r, black.g, black.b);
    pdf.text(issuedText, margin + 15, datesY);
    pdf.text(expiryText, rightTextX, expiryY, { align: "right" });
  }

  // Signature (Center) - attempt to render provided signature image, else render stylized name
  const sigY = bottomY - 5;
  try {
    const signatureUrl =
      (license as any).signatureUrl ||
      (license as any).signature_image ||
      (license as any).signatureImage ||
      null;
    if (signatureUrl) {
      try {
        let blob: Blob;
        if (
          typeof signatureUrl === "string" &&
          (signatureUrl.startsWith(DJANGO_API_URL) || NEXT_PUBLIC_USE_PROXY)
        ) {
          blob = await djangoApiRequest<Blob>(signatureUrl, {
            responseType: "blob",
          });
        } else {
          const resp = await fetch(signatureUrl);
          blob = await resp.blob();
        }
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++)
          binary += String.fromCharCode(bytes[i]);
        const b64 =
          typeof window !== "undefined"
            ? window.btoa(binary)
            : Buffer.from(bytes).toString("base64");
        const mime = blob.type || "image/png";
        const sigDataUrl = `data:${mime};base64,${b64}`;
        const sigW = 60;
        const sigH = 20;
        pdf.addImage(
          sigDataUrl,
          "PNG",
          pageWidth / 2 - sigW / 2,
          sigY - 8,
          sigW,
          sigH,
        );
      } catch (e) {
        // fallback to line if signature image fails
        pdf.setDrawColor(black.r, black.g, black.b);
        pdf.setLineWidth(0.5);
        pdf.line(pageWidth / 2 - 30, sigY, pageWidth / 2 + 30, sigY);
      }
    } else {
      // No signature image provided - render a stylized name if supplied
      pdf.setDrawColor(black.r, black.g, black.b);
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth / 2 - 30, sigY, pageWidth / 2 + 30, sigY);
      const signerName =
        (license as any).authorizedName ||
        (license as any).signedBy ||
        "Authorized Signature";
      pdf.setFont("times", "italic");
      pdf.setFontSize(12);
      pdf.setTextColor(black.r, black.g, black.b);
      pdf.text(String(signerName), pageWidth / 2, sigY - 2, {
        align: "center",
      });
    }
  } catch (e) {
    // Ensure PDF generation continues even if signature fetch fails
    pdf.setDrawColor(black.r, black.g, black.b);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth / 2 - 30, sigY, pageWidth / 2 + 30, sigY);
    pdf.setFont("times", "italic");
    pdf.setFontSize(10);
    pdf.setTextColor(black.r, black.g, black.b);
    pdf.text("Authorized Signature", pageWidth / 2, sigY + 5, {
      align: "center",
    });
    pdf.setFont("times", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(grey.r, grey.g, grey.b);
    pdf.text("Registrar of Licenses", pageWidth / 2, sigY + 10, {
      align: "center",
    });
  }

  // Approved Seal (Right) - Sawtooth Edge
  const sealR = 22;
  const sealX = pageWidth - margin - sealR - 5;
  const sealY = bottomY - sealR + 5;

  // Gold Seal Body (Sawtooth)
  pdf.setFillColor(gold.r, gold.g, gold.b);

  // Draw sawtooth circle
  const teeth = 40;
  const angleStep = (Math.PI * 2) / teeth;
  const outerR = sealR;
  const innerR = sealR - 2;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const angle = i * (angleStep / 2);
    const r = i % 2 === 0 ? outerR : innerR;
    points.push({
      x: sealX + r * Math.cos(angle),
      y: sealY + r * Math.sin(angle),
    });
  }

  // Construct path manually
  // jsPDF doesn't have a direct polygon fill with points array easily accessible in all versions,
  // but we can use lines or just a circle for simplicity if complex path fails.
  // Let's stick to a circle with a dashed border to simulate sawtooth if path is complex,
  // or just draw the main circle and a second starburst.

  // Simpler approach for "Embossed Seal":
  // 1. Main Gold Circle
  pdf.circle(sealX, sealY, sealR - 1, "F");

  // 2. Outer decorative ring (dashed) to simulate sawtooth
  pdf.setDrawColor(gold.r, gold.g, gold.b);
  pdf.setLineWidth(1.5);
  pdf.setLineDashPattern([1, 1], 0); // Dotted
  pdf.circle(sealX, sealY, sealR, "S");
  pdf.setLineDashPattern([], 0); // Reset

  // 3. Inner rings
  pdf.setDrawColor(darkGold.r, darkGold.g, darkGold.b);
  pdf.setLineWidth(0.5);
  pdf.circle(sealX, sealY, sealR - 3, "S");
  pdf.circle(sealX, sealY, sealR - 5, "S");

  // Star decorations
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.text("★", sealX, sealY - 12, { align: "center" });
  pdf.text("★", sealX, sealY + 16, { align: "center" });

  // APPROVED text
  pdf.setFont("times", "bold");
  pdf.setFontSize(10);
  pdf.text("APPROVED", sealX, sealY + 1, { align: "center" });

  return pdf;
}

export async function generateReceiptPDF(payment: any) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;

  // Colors
  const darkBlue = { r: 13, g: 27, b: 62 };
  const limeGreen = { r: 141, g: 198, b: 63 };
  const lightGrey = { r: 245, g: 245, b: 245 };
  const textGrey = { r: 100, g: 100, b: 100 };

  // 1. Header Section
  pdf.setFillColor(darkBlue.r, darkBlue.g, darkBlue.b);
  pdf.rect(0, 0, pageWidth, 25, "F");

  // Logo Placeholder (Stylized "C" for Chapa)
  const logoX = 18;
  const logoY = 12.5;
  pdf.setFillColor(limeGreen.r, limeGreen.g, limeGreen.b);
  pdf.circle(logoX, logoY, 6, "F");
  pdf.setFillColor(darkBlue.r, darkBlue.g, darkBlue.b);
  pdf.circle(logoX + 1.5, logoY, 4.5, "F");
  pdf.setFillColor(limeGreen.r, limeGreen.g, limeGreen.b);
  pdf.rect(logoX + 1, logoY - 2, 5, 4, "F"); // This creates the "C" opening

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Chapa", 28, 14.5);

  // RECEIPT Title
  pdf.setTextColor(limeGreen.r, limeGreen.g, limeGreen.b);
  pdf.setFontSize(28);
  pdf.text("RECEIPT", pageWidth - margin - 5, 16, { align: "right" });

  // 2. Info Columns
  let yPos = 40;
  pdf.setFontSize(10);
  pdf.setTextColor(limeGreen.r, limeGreen.g, limeGreen.b);
  pdf.setFont("helvetica", "bold");
  pdf.text("Receipt From", margin, yPos);

  pdf.setTextColor(0, 0, 0);
  yPos += 7;
  pdf.text("Chapa Test", margin, yPos);
  pdf.setFont("helvetica", "normal");
  yPos += 5;
  pdf.text("TIN 007756####", margin, yPos);
  yPos += 5;
  pdf.text("Phone No. 8911", margin, yPos);
  yPos += 5;
  pdf.text("Address Bole Rwanda", margin, yPos);

  // Right column (Chapa details)
  let rightY = 40;
  pdf.setFont("helvetica", "bold");
  pdf.text("Chapa Financial Technologies S.C", pageWidth - margin, rightY, {
    align: "right",
  });
  pdf.setFont("helvetica", "normal");
  rightY += 5;
  pdf.text("TIN 0071406415", pageWidth - margin, rightY, { align: "right" });
  rightY += 5;
  pdf.text("VAT Reg. 18595770010", pageWidth - margin, rightY, {
    align: "right",
  });
  rightY += 5;
  pdf.text("Phone No. +251-960724272", pageWidth - margin, rightY, {
    align: "right",
  });
  rightY += 5;
  pdf.text("Website chapa.co", pageWidth - margin, rightY, { align: "right" });

  // 3. Payment Details Banner
  yPos = 75;
  pdf.setFillColor(limeGreen.r, limeGreen.g, limeGreen.b);
  pdf.rect(margin, yPos, pageWidth / 2, 10, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.text("PAYMENT DETAILS", margin + 5, yPos + 6.5);

  // Reference Code Box (Wider to fit long references)
  pdf.setFillColor(darkBlue.r, darkBlue.g, darkBlue.b);
  const refBoxW = 85;
  pdf.rect(pageWidth - margin - refBoxW, yPos, refBoxW, 10, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(8); // Smaller font for reference
  const displayRef = (payment.tx_ref || "REFERENCE").substring(0, 35);
  pdf.text(displayRef, pageWidth - margin - refBoxW / 2, yPos + 6.5, {
    align: "center",
  });

  // 4. Details Table (Removed Amharic labels as they cause corruption without custom font)
  yPos += 15;
  const tableData = [
    ["Payer Name", payment.payer_name || "Full name"],
    ["Phone Number", payment.phone_number || "25194176####"],
    ["Email Address", payment.email || "email"],
    ["Payment Method", payment.payment_method || "telebirr"],
    ["Status", "Paid"],
    [
      "Payment Date",
      payment.payment_date ||
        new Date().toLocaleDateString("en-GB").replace(/\//g, "-"),
    ],
    ["Payment Due", "Paid to Merchant via Payment Link"],
  ];

  tableData.forEach((row, i) => {
    if (i % 2 === 0) {
      pdf.setFillColor(lightGrey.r, lightGrey.g, lightGrey.b);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");
    }
    pdf.setTextColor(textGrey.r, textGrey.g, textGrey.b);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(row[0], margin + 5, yPos + 5.5);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(String(row[1]), pageWidth - margin - 5, yPos + 5.5, {
      align: "right",
    });

    yPos += 8;
  });

  // 5. References & Totals
  yPos += 15;
  pdf.setTextColor(limeGreen.r, limeGreen.g, limeGreen.b);
  pdf.setFontSize(11);
  pdf.text("References", margin, yPos);

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  yPos += 7;
  pdf.setFont("helvetica", "bold");
  pdf.text("Chapa:", margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.text(payment.tx_ref || "N/A", margin + 15, yPos);

  yPos += 5;
  pdf.setFont("helvetica", "bold");
  pdf.text("Bank:", margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.text(payment.bank_ref || "CGO3PAXUSH", margin + 15, yPos);

  // Totals (Right side)
  let totalY = yPos - 12;
  const totalAmount = parseFloat(payment.amount || "0");
  const subTotal = totalAmount / 1.025; // Reverse calculate subtotal if amount is total
  const charge = totalAmount - subTotal;

  const totalLines = [
    ["Sub Total", `${subTotal.toFixed(0)} ETB`],
    ["Charge", `${charge.toFixed(0)} ETB`],
    ["Total", `${totalAmount.toFixed(0)} ETB`],
  ];

  totalLines.forEach((line, i) => {
    pdf.setTextColor(textGrey.r, textGrey.g, textGrey.b);
    pdf.setFont("helvetica", i === 2 ? "bold" : "normal");
    pdf.setFontSize(10);
    pdf.text(line[0], pageWidth - margin - 45, totalY, { align: "right" });

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text(line[1], pageWidth - margin - 5, totalY, { align: "right" });
    totalY += 7;
  });

  // 6. Seal
  const sealSize = 45;
  const sealX = pageWidth / 2;
  const sealY = yPos + 5;
  const sealBlue = { r: 37, g: 99, b: 235 }; // blue-600

  // Main outer circle
  pdf.setDrawColor(sealBlue.r, sealBlue.g, sealBlue.b);
  pdf.setLineWidth(1.2); // border-4
  pdf.circle(sealX, sealY + sealSize / 2, sealSize / 2, "S");

  // Inner circle
  pdf.setLineWidth(0.6); // border-2
  pdf.circle(sealX, sealY + sealSize / 2, sealSize / 2 - 3.5, "S");

  // Text layers based on the provided React component structure
  pdf.setFont("helvetica", "bold");

  // Top text - CHAPA
  pdf.setFontSize(8);
  pdf.text("CHAPA", sealX, sealY + 12, { align: "center" });

  // Middle text - FINANCIAL
  pdf.setFontSize(6.5);
  pdf.text("FINANCIAL", sealX, sealY + 18, { align: "center" });

  // Bottom text - TECHNOLOGIES
  pdf.setFontSize(6.5);
  pdf.text("TECHNOLOGIES", sealX, sealY + 24, { align: "center" });

  // S.C. text at bottom
  pdf.setFontSize(6);
  pdf.text("S.C", sealX, sealY + sealSize - 8, { align: "center" });

  // Decorative dot at the top
  pdf.setFillColor(sealBlue.r, sealBlue.g, sealBlue.b);
  pdf.circle(sealX, sealY + 4, 0.5, "F");

  // 7. Footer
  pdf.setFillColor(darkBlue.r, darkBlue.g, darkBlue.b);
  pdf.rect(0, pageHeight - 15, pageWidth, 15, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.text("+251-960724272", margin + 10, pageHeight - 6);
  pdf.text("info@chapa.co", margin + 55, pageHeight - 6);

  pdf.setFont("helvetica", "bold");
  pdf.text("Thank You For Using Chapa", pageWidth - margin, pageHeight - 6, {
    align: "right",
  });

  return pdf;
}

export async function generateApplicationPDF(application: {
  id: string;
  type: string;
  applicantName: string;
  companyName: string;
  email: string;
  phone: string;
  submittedDate: string;
  status: string;
  details: any;
  documents: any[];
  data?: any;
  subtype?: string;
}) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageWidth, 40, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("APPLICATION REPORT", pageWidth / 2, 20, { align: "center" });

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  let yPosition = 55;

  // Application Details
  pdf.setFont(undefined as any, "bold");
  pdf.text("APPLICATION DETAILS", margin, yPosition);
  yPosition += 8;
  pdf.setFont(undefined as any, "normal");

  const appDetails = [
    ["Application ID:", application.id],
    ["Type:", application.type],
    ["Status:", application.status.toUpperCase()],
    ["Applicant Name:", application.applicantName],
    ["Company:", application.companyName],
    ["Email:", application.email],
    ["Phone:", application.phone],
    ["Submitted:", new Date(application.submittedDate).toLocaleDateString()],
  ];

  appDetails.forEach(([label, value]) => {
    pdf.setFont(undefined as any, "bold");
    pdf.text(label, margin, yPosition);
    pdf.setFont(undefined as any, "normal");
    pdf.text(String(value), margin + 55, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  // License Details
  pdf.setFont(undefined as any, "bold");
  pdf.text("LICENSE DETAILS", margin, yPosition);
  yPosition += 8;
  pdf.setFont(undefined as any, "normal");
  pdf.setFontSize(9);

  const details = application.details ?? application.data ?? {};
  const licenseType =
    details.licenseType ?? details.license_type ?? application.type ?? "";
  const businessType = details.businessType ?? details.business_type ?? "";
  const registrationNumber =
    details.registrationNumber ??
    details.registration_number ??
    details.regNumber ??
    "";
  const taxId = details.taxId ?? details.tax_id ?? details.tax ?? "";
  const yearsInBusiness =
    details.yearsInBusiness ?? details.years_in_business ?? details.years ?? "";
  const workScopes = Array.isArray(details.workScopes)
    ? details.workScopes.join(", ")
    : typeof details.workScopes === "string"
      ? details.workScopes
      : "";

  const licenseDetails = [
    ["License Type:", licenseType],
    ["Subtype:", details.subtype ?? application.subtype ?? ""],
    ["Business Type:", businessType],
    ["Registration Number:", registrationNumber],
    ["Tax ID:", taxId],
    ["Years in Business:", yearsInBusiness],
    ["Work Scopes:", workScopes],
  ];

  licenseDetails.forEach(([label, value]) => {
    if (value) {
      pdf.setFont(undefined as any, "bold");
      pdf.text(label, margin, yPosition);
      pdf.setFont(undefined as any, "normal");
      const maxWidth = pageWidth - margin - 55 - margin;
      const lines = pdf.splitTextToSize(String(value), maxWidth);
      pdf.text(lines, margin + 55, yPosition);
      yPosition += lines.length * 6 + 2;
    }
  });

  return pdf;
}

export async function generateReportPDF(config: {
  reportType: string;
  timeRange: string;
  data: any[];
  includeCharts: boolean;
  includeDetails: boolean;
  dashboard?: any;
}) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;

  // Colors
  const primary = { r: 30, g: 58, b: 138 }; // Dark blue
  const accent = { r: 59, g: 130, b: 246 }; // Brighter blue
  const grey = { r: 107, g: 114, b: 128 };
  const lightGrey = { r: 243, g: 244, b: 246 };

  // Helper for text wrapping and auto-paging
  let yPos = margin;
  const checkPage = (height: number) => {
    if (yPos + height > pageHeight - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // 1. Header with Logo placeholder and Title
  pdf.setFillColor(primary.r, primary.g, primary.b);
  pdf.rect(0, 0, pageWidth, 45, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  const reportTitle = (
    config.reportType.charAt(0).toUpperCase() +
    config.reportType.slice(1).replace(/([A-Z])/g, " $1")
  ).toUpperCase();
  pdf.text(`${reportTitle} REPORT`, pageWidth / 2, 20, { align: "center" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(`Construction License Management System (CLMS)`, pageWidth / 2, 28, {
    align: "center",
  });
  pdf.text(
    `Generated on: ${new Date().toLocaleDateString()} | Period: ${config.timeRange.toUpperCase()}`,
    pageWidth / 2,
    34,
    { align: "center" },
  );

  yPos = 55;

  // 2. Executive Summary
  pdf.setTextColor(primary.r, primary.g, primary.b);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Executive Summary", margin, yPos);
  yPos += 8;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  const summary =
    `This ${config.reportType} report provides a comprehensive analysis of system activity during the ${config.timeRange} period. ` +
    `A total of ${config.data.length} records were analyzed. This document contains detailed breakdowns, key performance metrics, and system-wide trends ` +
    `to assist in administrative decision-making and compliance monitoring.`;

  const summaryLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin);
  pdf.text(summaryLines, margin, yPos);
  yPos += summaryLines.length * 5 + 12;

  // 3. Key Metrics Grid
  pdf.setTextColor(primary.r, primary.g, primary.b);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("Key Metrics", margin, yPos);
  yPos += 8;

  const boxW = (pageWidth - 2 * margin - 10) / 3;
  const boxH = 25;

  const drawMetricBox = (
    x: number,
    y: number,
    label: string,
    value: string,
  ) => {
    pdf.setDrawColor(lightGrey.r, lightGrey.g, lightGrey.b);
    pdf.setFillColor(lightGrey.r, lightGrey.g, lightGrey.b);
    pdf.roundedRect(x, y, boxW, boxH, 2, 2, "F");

    pdf.setFontSize(9);
    pdf.setTextColor(grey.r, grey.g, grey.b);
    pdf.setFont("helvetica", "normal");
    pdf.text(label, x + boxW / 2, y + 8, { align: "center" });

    pdf.setFontSize(12);
    pdf.setTextColor(primary.r, primary.g, primary.b);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, x + boxW / 2, y + 18, { align: "center" });
  };

  drawMetricBox(margin, yPos, "Total Records", config.data.length.toString());
  drawMetricBox(margin + boxW + 5, yPos, "Report Format", "PDF Document");
  drawMetricBox(margin + (boxW + 5) * 2, yPos, "Status", "Official");

  yPos += boxH + 15;

  // 4. Detailed Data Table
  if (config.includeDetails && config.data.length > 0) {
    checkPage(20);
    pdf.setTextColor(primary.r, primary.g, primary.b);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Data Breakdown", margin, yPos);
    yPos += 8;

    const tableHeaders = [
      "ID",
      "Type",
      "Applicant",
      "Company",
      "Status",
      "Date",
    ];
    const colWidths = [12, 33, 40, 35, 30, 20]; // Total: 170mm (fits perfectly in 210mm A4 with 20mm margins)

    // Header Row
    pdf.setFillColor(primary.r, primary.g, primary.b);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");

    let curX = margin;
    tableHeaders.forEach((header, i) => {
      pdf.text(header, curX + 2, yPos + 5.5);
      curX += colWidths[i];
    });

    yPos += 8;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    // Data Rows (Limit to first 30 for readability, or use auto-paging)
    config.data.slice(0, 30).forEach((row, rowIndex) => {
      if (checkPage(7)) {
        // Redraw headers on new page
        pdf.setFillColor(primary.r, primary.g, primary.b);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        let hX = margin;
        tableHeaders.forEach((h, i) => {
          pdf.text(h, hX + 2, yPos + 5.5);
          hX += colWidths[i];
        });
        yPos += 8;
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
      }

      // Zebra striping
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 7, "F");
      }

      let rowX = margin;
      const formatDate = (dateVal: any) => {
        try {
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return "N/A";
          const dd = String(d.getDate()).padStart(2, "0");
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        } catch {
          return "N/A";
        }
      };

      const rowData = [
        String(row.id || "").substring(0, 8),
        String(row.type || "").substring(0, 25),
        String(row.applicantName || "").substring(0, 30),
        String(row.companyName || "").substring(0, 25),
        String(row.status || "")
          .toUpperCase()
          .replace(/_/g, " "),
        formatDate(row.submittedDate),
      ];

      rowData.forEach((val, i) => {
        pdf.text(val, rowX + 2, yPos + 4.5);
        rowX += colWidths[i];
      });
      yPos += 7;
    });

    if (config.data.length > 30) {
      pdf.setFontSize(8);
      pdf.setTextColor(grey.r, grey.g, grey.b);
      pdf.text(
        `... and ${config.data.length - 30} more records.`,
        margin,
        yPos + 5,
      );
      yPos += 10;
    }
  }

  // 5. Footer
  const totalPages = (pdf.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(lightGrey.r, lightGrey.g, lightGrey.b);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    pdf.setFontSize(8);
    pdf.setTextColor(grey.r, grey.g, grey.b);
    pdf.text(
      "Confidential Official Report - Oromia Construction Authority",
      margin,
      pageHeight - 10,
    );
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" },
    );
  }

  return pdf;
}

export async function generateVehicleCertificatePDF(vehicle: any) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const gold = { r: 212, g: 175, b: 55 };
  const dark = { r: 22, g: 27, b: 41 };
  const grey = { r: 120, g: 120, b: 120 };
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  pdf.setDrawColor(gold.r, gold.g, gold.b);
  pdf.setLineWidth(2);
  pdf.rect(8, 8, pageWidth - 16, pageHeight - 16);
  pdf.setLineWidth(1);
  pdf.rect(12, 12, pageWidth - 24, pageHeight - 24);
  // Very light watermark behind content
  pdf.setTextColor(235, 235, 235);
  pdf.setFont("times", "bold");
  pdf.setFontSize(28);
  pdf.text("CLMS OFFICIAL DOCUMENT", pageWidth / 2, pageHeight / 2, {
    align: "center",
  });
  // Reset text color for normal content
  pdf.setTextColor(dark.r, dark.g, dark.b);
  pdf.setFont("times", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(dark.r, dark.g, dark.b);
  pdf.text("Oromia Construction Authority", pageWidth / 2, 26, {
    align: "center",
  });
  pdf.setFont("times", "normal");
  pdf.setFontSize(12);
  pdf.text("Construction License Management System (CLMS)", pageWidth / 2, 34, {
    align: "center",
  });
  const v = vehicle?.data || {};
  const isHeavy = v.registrationCategory === "heavy-machinery";

  pdf.setFont("times", "bold");
  pdf.setFontSize(20);
  pdf.text(
    isHeavy
      ? "Heavy Machinery Registration"
      : "Vehicle Registration Certificate",
    pageWidth / 2,
    47,
    { align: "center" },
  );
  const certYear = new Date().getFullYear();
  const certSeq = String(vehicle?.id || "1")
    .toString()
    .padStart(5, "0");
  const certNo = isHeavy
    ? `CLMS-HM-${certYear}-${certSeq}`
    : `CLMS-VEH-${certYear}-${certSeq}`;
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(grey.r, grey.g, grey.b);
  pdf.text(`Certificate No: ${certNo}`, pageWidth / 2, 55, { align: "center" });
  pdf.setTextColor(dark.r, dark.g, dark.b);
  pdf.setLineWidth(0.5);
  pdf.line(25, 60, pageWidth - 25, 60);
  const leftX = 22;
  const rightX = pageWidth / 2 + 5;
  let y = 68;
  const toStr = (s: any, fallback = "N/A") => {
    if (s === null || s === undefined) return fallback;
    const t = String(s).trim();
    return t.length ? t : fallback;
  };
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.text("1. Vehicle Information", leftX, y);
  pdf.text("2. Contractor / Owner Information", rightX, y);
  y += 6;
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  const rowsLeft: [string, string][] = [
    ["Registration ID:", toStr(vehicle?.id)],
    ["Plate Number:", toStr(v.plateNumber)],
    ["Chassis Number:", toStr(v.chassisNumber)],
    ["Engine Number:", toStr(v.engineNumber)],
    ["Vehicle Type:", toStr(v.vehicleType)],
    ["Manufacturer:", toStr(v.manufacturer)],
    ["Model:", toStr(v.model)],
    ["Year of Manufacture:", toStr(v.year)],
  ];
  const rowsRight: [string, string][] = [
    ["Contractor Name:", toStr(v.ownerName)],
    ["Contractor License No:", toStr(v.ownerLicense)],
  ];
  const drawRows = (x: number, startY: number, rows: [string, string][]) => {
    let yy = startY;
    rows.forEach(([label, value]) => {
      pdf.setFont("times", "bold");
      pdf.text(label, x, yy);
      pdf.setFont("times", "normal");
      pdf.text(String(value), x + 45, yy);
      yy += 7;
    });
    return yy;
  };
  const yAfterLeft = drawRows(leftX, y, rowsLeft);
  const yAfterRight = drawRows(rightX, y, rowsRight);
  y = Math.max(yAfterLeft, yAfterRight) + 4;
  pdf.setLineWidth(0.5);
  pdf.line(25, y, pageWidth - 25, y);
  y += 8;
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.text("3. Registration Validity", leftX, y);
  y += 6;
  const issueDate =
    v.issueDate ||
    vehicle?.registeredAt ||
    vehicle?.created_at ||
    new Date().toISOString();
  const expiryDate = v.expiryDate || v.insuranceExpiry || "";
  const status = String(vehicle?.status || "pending").toLowerCase();
  const isActive = status === "active";
  pdf.setFont("times", "bold");
  pdf.setFontSize(11);
  const issueStr = `Issue Date:`;
  const expiryStr = `Expiry Date:`;
  // Left label
  pdf.text(issueStr, leftX, y);
  // Left value
  pdf.setFont("times", "normal");
  pdf.text(`${new Date(issueDate).toLocaleDateString()}`, leftX + 28, y);
  // Right label aligned right
  pdf.setFont("times", "bold");
  const validityRightX = pageWidth - 25;
  pdf.text(expiryStr, validityRightX - 35, y, { align: "left" });
  // Right value aligned right next to label
  pdf.setFont("times", "normal");
  const expiryDisplay = expiryDate
    ? new Date(expiryDate).toLocaleDateString()
    : "N/A";
  pdf.text(expiryDisplay, validityRightX - 35 + 28, y, { align: "left" });
  y += 8;
  if (isActive) {
    pdf.setFillColor(34, 197, 94);
    pdf.roundedRect(leftX, y - 6, 25, 7, 2, 2, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("times", "bold");
    pdf.setFontSize(10);
    pdf.text("ACTIVE", leftX + 12.5, y - 1.5, { align: "center" });
    pdf.setTextColor(dark.r, dark.g, dark.b);
  } else {
    pdf.setFont("times", "bold");
    pdf.text("Status: INACTIVE", leftX, y);
  }
  y += 8;
  pdf.setLineWidth(0.5);
  pdf.line(25, y, pageWidth - 25, y);
  y += 8;
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.text("4. Security & Verification", leftX, y);
  y += 6;
  const serial = `SN-${String(v.chassisNumber || vehicle?.id || certSeq)}`;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const verificationUrl = `${baseUrl}/dashboard/vehicles/${encodeURIComponent(String(vehicle?.id || certSeq))}/certificate`;
  const payload = {
    certificate_no: certNo,
    serial_no: serial,
    vehicle_id: String(vehicle?.id || ""),
    registration_number: toStr(v.registrationNumber),
    plate_number: toStr(v.plateNumber),
    chassis_number: toStr(v.chassisNumber),
    engine_number: toStr(v.engineNumber),
    vehicle_type: toStr(v.vehicleType),
    manufacturer: toStr(v.manufacturer),
    model: toStr(v.model),
    year: toStr(v.year),
    owner_name: toStr(v.ownerName),
    owner_license: toStr(v.ownerLicense),
    tin_number: toStr(v.tinNumber),
    address: toStr(v.address),
    issue_date: String(new Date(issueDate).toISOString()),
    expiry_date: expiryDate ? String(new Date(expiryDate).toISOString()) : "",
    status: isActive ? "active" : "inactive",
    verification_url: verificationUrl,
    generated_at: new Date().toISOString(),
  };
  let qrY = y + 5;
  try {
    const qrDataUrl = await generateQRDataURL(JSON.stringify(payload), {
      width: 120,
      margin: 1,
    });
    pdf.addImage(qrDataUrl, "PNG", leftX, qrY, 30, 30);
  } catch {}
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.text(`Certificate Serial Number: ${serial}`, leftX + 36, qrY + 10);
  try {
    const tryAddSignature = async (
      candidateUrl: string,
      mime: "PNG" | "JPEG" | "WEBP",
    ) => {
      const resp = await fetch(candidateUrl);
      if (!resp.ok) return false;
      const blob = await resp.blob();
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve) => {
        reader.onloadend = () => resolve(String(reader.result || ""));
        reader.readAsDataURL(blob);
      });
      if (!dataUrl) return false;
      const sigW = 18;
      const sigH = 6;
      pdf.addImage(dataUrl, mime, pageWidth - 86, qrY + 18, sigW, sigH);
      return true;
    };
    const manualDataUrl = (() => {
      try {
        if (typeof window !== "undefined") {
          const s = window.localStorage.getItem("clms_signature_dataurl");
          return s && s.startsWith("data:image/") ? s : null;
        }
      } catch {}
      return null;
    })();
    if (manualDataUrl) {
      const sigW = 18;
      const sigH = 6;
      const mime = manualDataUrl.includes("image/jpeg")
        ? "JPEG"
        : manualDataUrl.includes("image/webp")
          ? "WEBP"
          : "PNG";
      pdf.addImage(
        manualDataUrl,
        mime as any,
        pageWidth - 86,
        qrY + 18,
        sigW,
        sigH,
      );
    } else {
      const tried =
        (await tryAddSignature(`/signatures/authorized.png`, "PNG")) ||
        (await tryAddSignature(`/signatures/authorized.webp`, "WEBP")) ||
        (await tryAddSignature(`/signatures/authorized.jpg`, "JPEG")) ||
        (await tryAddSignature(`/authorized.png`, "PNG")) ||
        (await tryAddSignature(`/signature.png`, "PNG"));
      if (!tried) {
        pdf.text("Authorized Signature", pageWidth - 80, qrY + 25);
      }
    }
  } catch {
    pdf.text("Authorized Signature", pageWidth - 80, qrY + 25);
  }
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth - 120, qrY + 28, pageWidth - 40, qrY + 28);
  return pdf;
}

export async function generatePartnershipPDF(p: any) {
  const pdf = new jsPDF("l", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;

  const gold = { r: 201, g: 162, b: 77 };
  const navy = { r: 15, g: 42, b: 68 };
  const red = { r: 200, g: 40, b: 40 };
  const black = { r: 20, g: 20, b: 20 };

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setDrawColor(gold.r, gold.g, gold.b);
  pdf.setLineWidth(3);
  pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);
  pdf.setDrawColor(navy.r, navy.g, navy.b);
  pdf.setLineWidth(2);
  pdf.rect(
    margin + 5,
    margin + 5,
    pageWidth - (margin + 5) * 2,
    pageHeight - (margin + 5) * 2,
  );

  const headerY = margin + 18;
  pdf.setFont("times", "bold");
  pdf.setFontSize(30);
  pdf.setTextColor(navy.r, navy.g, navy.b);
  pdf.text("CONSTRUCTION PARTNERSHIP LICENSE", pageWidth / 2, headerY, {
    align: "center",
  });

  const ribbonY = headerY + 10;
  const ribbonW = 160;
  const ribbonH = 12;
  const ribbonX = pageWidth / 2 - ribbonW / 2;
  pdf.setFillColor(navy.r, navy.g, navy.b);
  pdf.rect(ribbonX, ribbonY, ribbonW, ribbonH, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.text(
    "CERTIFICATE OF PARTNERSHIP",
    pageWidth / 2,
    ribbonY + ribbonH - 3.5,
    { align: "center" },
  );

  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFont("times", "italic");
  pdf.setFontSize(12);
  pdf.text(
    "This certifies that the following partnership is legally registered and approved:",
    pageWidth / 2,
    ribbonY + ribbonH + 8,
    { align: "center" },
  );

  const blockY = ribbonY + ribbonH + 22;
  const colW = 75;
  const centerX = pageWidth / 2;

  const leftName = (p?.main_contractor?.name || "LOCAL BUILDER LTD.")
    .toString()
    .toUpperCase();
  const leftLic = p?.main_contractor?.license_number
    ? `License No. ${p.main_contractor.license_number}`
    : "License No. -";
  const rightName = (p?.partner_company?.name || "GLOBAL INFRASTRUCTURE INC.")
    .toString()
    .toUpperCase();
  const rightLic = p?.partner_company?.license_number
    ? `License No. ${p.partner_company.license_number}`
    : "License No. -";

  pdf.setFont("times", "bold");
  pdf.setFontSize(16);
  const lineSpacing = 5;
  const leftLines = pdf.splitTextToSize(leftName, colW - 6);
  const rightLines = pdf.splitTextToSize(rightName, colW - 6);
  pdf.text(leftLines, centerX - colW, blockY, { align: "center" });
  pdf.text(rightLines, centerX + colW, blockY, { align: "center" });
  pdf.setFont("times", "italic");
  pdf.setFontSize(11);
  const leftNameHeight =
    (Array.isArray(leftLines) ? leftLines.length : 1) * lineSpacing;
  const rightNameHeight =
    (Array.isArray(rightLines) ? rightLines.length : 1) * lineSpacing;
  pdf.text(`– ${leftLic} –`, centerX - colW, blockY + leftNameHeight + 2, {
    align: "center",
  });
  pdf.text(`– ${rightLic} –`, centerX + colW, blockY + rightNameHeight + 2, {
    align: "center",
  });

  // Handshake badge between companies
  const handshakeSize = 32;
  const handshakeX = centerX - handshakeSize / 2;
  const handshakeY = blockY - 12;
  try {
    const makeHandshakeIcon = async (size = 120) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      // Circle background
      ctx.fillStyle = "#c9a24d";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
      // Arms
      ctx.lineCap = "round";
      // Left sleeve
      ctx.fillStyle = "#0f2a44";
      ctx.fillRect(size * 0.15, size * 0.52, size * 0.18, size * 0.1);
      // Right sleeve
      ctx.fillRect(size * 0.67, size * 0.52, size * 0.18, size * 0.1);
      // Left hand
      ctx.fillStyle = "#f0caa0";
      ctx.beginPath();
      ctx.moveTo(size * 0.22, size * 0.52);
      ctx.quadraticCurveTo(size * 0.4, size * 0.45, size * 0.5, size * 0.52);
      ctx.lineTo(size * 0.46, size * 0.65);
      ctx.quadraticCurveTo(size * 0.36, size * 0.6, size * 0.22, size * 0.62);
      ctx.closePath();
      ctx.fill();
      // Right hand
      ctx.fillStyle = "#d8a779";
      ctx.beginPath();
      ctx.moveTo(size * 0.78, size * 0.52);
      ctx.quadraticCurveTo(size * 0.6, size * 0.45, size * 0.5, size * 0.52);
      ctx.lineTo(size * 0.54, size * 0.65);
      ctx.quadraticCurveTo(size * 0.64, size * 0.6, size * 0.78, size * 0.62);
      ctx.closePath();
      ctx.fill();
      // Outline for join
      ctx.strokeStyle = "#8c6a3a";
      ctx.lineWidth = Math.max(1, size * 0.02);
      ctx.beginPath();
      ctx.moveTo(size * 0.34, size * 0.56);
      ctx.quadraticCurveTo(size * 0.5, size * 0.53, size * 0.66, size * 0.56);
      ctx.stroke();
      return canvas.toDataURL("image/png");
    };
    const hs = await makeHandshakeIcon(140);
    pdf.addImage(
      hs,
      "PNG",
      handshakeX,
      handshakeY,
      handshakeSize,
      handshakeSize,
    );
    pdf.setDrawColor(navy.r, navy.g, navy.b);
    pdf.setLineWidth(1.2);
    pdf.circle(
      handshakeX + handshakeSize / 2,
      handshakeY + handshakeSize / 2,
      handshakeSize / 2,
      "S",
    );
  } catch {
    // Fallback: simple circle with text
    pdf.setDrawColor(gold.r, gold.g, gold.b);
    pdf.setLineWidth(0.6);
    pdf.circle(
      handshakeX + handshakeSize / 2,
      handshakeY + handshakeSize / 2,
      handshakeSize / 2,
      "S",
    );
    pdf.setFont("times", "bold");
    pdf.setTextColor(navy.r, navy.g, navy.b);
    pdf.setFontSize(10);
    pdf.text(
      "JV",
      handshakeX + handshakeSize / 2,
      handshakeY + handshakeSize / 2 + 3,
      { align: "center" },
    );
  }

  pdf.setFillColor(gold.r, gold.g, gold.b);
  const ribbon2Y = blockY + 14;
  const ribbon2W = 120;
  const ribbon2H = 8;
  pdf.rect(centerX - ribbon2W / 2, ribbon2Y, ribbon2W, ribbon2H, "F");
  pdf.setFont("times", "bold");
  pdf.setTextColor(255, 255, 255);
  const type = (p?.partnership_type || "Joint Venture")
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
  const mainShare =
    p?.ownership_ratio_main ??
    (p?.ownership_ratio ? 100 - Number(p.ownership_ratio) : 60);
  const partnerShare =
    p?.ownership_ratio_partner ??
    (p?.ownership_ratio ? Number(p.ownership_ratio) : 40);
  pdf.text(
    `${type} Partnership (${Number(mainShare)}% / ${Number(partnerShare)}%)`,
    centerX,
    ribbon2Y + ribbon2H - 2.5,
    { align: "center" },
  );

  const detailsY = ribbon2Y + ribbon2H + 16;
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFont("times", "normal");
  pdf.setFontSize(12);

  const idRaw = p?.id || p?.partnership_id || "PENDING";
  const issueDate = (() => {
    const s =
      p?.issued_date ||
      p?.start_date ||
      p?.updated_at ||
      new Date().toISOString();
    const d = new Date(s);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();
  const endDateStr = (() => {
    const s =
      p?.end_date ||
      p?.valid_until ||
      new Date(
        new Date().setFullYear(new Date().getFullYear() + 1),
      ).toISOString();
    const d = new Date(s);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();

  const formatCertNo = (val: any) => {
    const year = new Date(
      p?.issued_date || p?.updated_at || Date.now(),
    ).getFullYear();
    const s = String(val || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-6)
      .padStart(6, "0");
    return `CP-${year}-${s}`;
  };

  const gridX = margin + 26;
  const partnershipIdDisplay = String(idRaw || "").toLowerCase();
  pdf.text(`Partnership ID: ${partnershipIdDisplay}`, gridX, detailsY);
  pdf.text(`Valid Until: ${endDateStr}`, gridX, detailsY + 8);
  pdf.text(
    "Authorized for: Major Construction Projects, Import of Machinery, Project Vehicles Registration",
    gridX,
    detailsY + 16,
  );

  const bottomY = pageHeight - margin - 20;
  const qrSize = 36;
  const qrX = margin + 20;
  const qrY = bottomY - qrSize + 4;

  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const payload = {
      partnership_id: String(idRaw).toLowerCase(),
      companies: [leftName, rightName],
      type,
      ownership: { main: Number(mainShare), partner: Number(partnerShare) },
      valid_until: endDateStr,
      verificationUrl: `${baseUrl}/verify/partnership/${encodeURIComponent(String(idRaw).toLowerCase())}`,
    };
    const qrDataUrl = await generateQRDataURL(JSON.stringify(payload));
    pdf.setFont("times", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(black.r, black.g, black.b);
    pdf.text(`Issued Date: ${issueDate}`, qrX, qrY - 10);
    pdf.text(`Expiry Date: ${endDateStr}`, qrX, qrY - 4);
    pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
    pdf.setFont("times", "bold");
    pdf.setTextColor(navy.r, navy.g, navy.b);
    pdf.text("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 6, {
      align: "center",
    });
  } catch {}

  const footerH = 10;
  pdf.setDrawColor(red.r, red.g, red.b);
  pdf.setFillColor(255, 255, 255);
  const sealR = 16;
  const sealX = pageWidth / 2;
  const footerTopY = pageHeight - margin - footerH;
  const sealY = Math.min(bottomY - 2, footerTopY - sealR - 2);
  pdf.circle(sealX, sealY, sealR, "FD");
  pdf.setTextColor(red.r, red.g, red.b);
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.text("APPROVED", sealX, sealY + 4, { align: "center" });

  const rightX = pageWidth - margin - 60;
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.text("Approved by: Licensing Officer", rightX, bottomY - 8);
  pdf.text(`Issued Date: ${issueDate}`, rightX, bottomY);

  pdf.setFillColor(navy.r, navy.g, navy.b);
  pdf.rect(
    margin + 5,
    pageHeight - margin - footerH,
    pageWidth - (margin + 5) * 2,
    footerH,
    "F",
  );
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.text(
    "VALID & ACTIVE UNDER CLMS REGULATIONS",
    pageWidth / 2,
    pageHeight - margin - 3,
    { align: "center" },
  );

  return pdf;
}

export async function generatePaymentReceiptPDF(paymentData: any) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Chapa Brand Colors
  const chapaBlue = { r: 0, g: 104, b: 255 }; // Chapa Blue
  const chapaGreen = { r: 0, g: 191, b: 111 }; // Chapa Green
  const textDark = { r: 31, g: 41, b: 55 };
  const textGrey = { r: 107, g: 114, b: 128 };

  // Header Section
  pdf.setFillColor(249, 250, 251); // Light grey background for header
  pdf.rect(0, 0, pageWidth, 50, "F");

  // Stylized Chapa-like Logo (Text-based)
  pdf.setTextColor(chapaBlue.r, chapaBlue.g, chapaBlue.b);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.text("chapa", 20, 30);
  pdf.setFillColor(chapaGreen.r, chapaGreen.g, chapaGreen.b);
  pdf.circle(95, 23, 2, "F"); // Small dot after 'chapa'

  pdf.setTextColor(textGrey.r, textGrey.g, textGrey.b);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("OFFICIAL PAYMENT RECEIPT", pageWidth - 20, 28, { align: "right" });
  pdf.text(`Generated: ${date}`, pageWidth - 20, 34, { align: "right" });

  // Receipt Main Content
  let y = 70;

  // Status Badge
  pdf.setFillColor(220, 252, 231); // Green bg
  pdf.roundedRect(20, y - 5, 30, 8, 1, 1, "F");
  pdf.setTextColor(21, 128, 61); // Green text
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("SUCCESSFUL", 35, y + 0.5, { align: "center" });

  y += 15;

  // Transaction ID Header
  pdf.setTextColor(textGrey.r, textGrey.g, textGrey.b);
  pdf.setFontSize(9);
  pdf.text("TRANSACTION REFERENCE", 20, y);
  y += 6;
  pdf.setTextColor(textDark.r, textDark.g, textDark.b);
  pdf.setFontSize(12);
  pdf.setFont("courier", "bold");
  pdf.text(paymentData.tx_ref || "N/A", 20, y);

  y += 15;

  // Amount Large
  pdf.setTextColor(textGrey.r, textGrey.g, textGrey.b);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text("AMOUNT PAID", 20, y);
  y += 8;
  pdf.setTextColor(chapaBlue.r, chapaBlue.g, chapaBlue.b);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${paymentData.amount} ${paymentData.currency || "ETB"}`, 20, y);

  y += 20;

  // Info Grid (Two Columns)
  const col1X = 20;
  const col2X = pageWidth / 2 + 10;

  const drawField = (
    label: string,
    value: string,
    x: number,
    currY: number,
  ) => {
    pdf.setTextColor(textGrey.r, textGrey.g, textGrey.b);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(label, x, currY);
    pdf.setTextColor(textDark.r, textDark.g, textDark.b);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(value, x, currY + 6);
  };

  drawField(
    "PAYER NAME",
    `${paymentData.first_name || "N/A"} ${paymentData.last_name || ""}`,
    col1X,
    y,
  );
  drawField(
    "PAYMENT METHOD",
    (paymentData.payment_method || "Telebirr").toUpperCase(),
    col2X,
    y,
  );

  y += 20;

  drawField("EMAIL", paymentData.email || "N/A", col1X, y);
  drawField("DATE", date.split(" at ")[0], col2X, y);

  y += 25;

  // Itemized Details Table
  autoTable(pdf, {
    startY: y,
    head: [["DESCRIPTION", "UNIT PRICE", "TOTAL"]],
    body: [
      [
        "Construction License Processing Fee",
        `${paymentData.amount} ${paymentData.currency || "ETB"}`,
        `${paymentData.amount} ${paymentData.currency || "ETB"}`,
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [107, 114, 128],
      fontSize: 8,
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
    margin: { left: 20, right: 20 },
  });

  const finalY = (pdf as any).lastAutoTable?.finalY || y + 30;

  // Footer Message
  pdf.setTextColor(textGrey.r, textGrey.g, textGrey.b);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  const footerText =
    "This is an official transaction receipt generated for your payment through Chapa. This document serves as proof of payment for services rendered by the Construction Licensing Management System (CLMS).";
  const lines = pdf.splitTextToSize(footerText, pageWidth - 40);
  pdf.text(lines, 20, finalY);

  // Verification Seal (Bottom Center)
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.5);
  pdf.line(20, pageHeight - 40, pageWidth - 20, pageHeight - 40);

  pdf.setTextColor(chapaBlue.r, chapaBlue.g, chapaBlue.b);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("Securely processed by chapa.", pageWidth / 2, pageHeight - 25, {
    align: "center",
  });

  return pdf;
}
