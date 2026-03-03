"use client";

import jsPDF from "jspdf";
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

  let typeStr = (license.type || "PROFESSIONAL").toString();
  // Map internal types to display names
  if (typeStr === "Contractor License" || typeStr === "contractor")
    typeStr = "CONTRACTOR LICENSE";
  else if (typeStr === "Import-export License" || typeStr === "import-export")
    typeStr = "IMPORT/EXPORT LICENSE";
  else if (typeStr === "Professional License") typeStr = "PROFESSIONAL LICENSE";
  else typeStr = typeStr.toUpperCase().replace(/_/g, " ");

  if (!typeStr.endsWith(" LICENSE") && !typeStr.endsWith(" PERMIT")) {
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
        pdf.addImage(photoUrl, "JPEG", photoX, photoY, photoW, photoH);
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
        const photoDataUrl = `data:${mime};base64,${b64}`;
        pdf.addImage(photoDataUrl, "JPEG", photoX, photoY, photoW, photoH);
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

  // Professional Position (shown under LICENSE NO. for professional licenses)
  try {
    const isProfessional =
      String((license as any).type || "")
        .toLowerCase()
        .includes("professional") ||
      String((license as any).license_type || "")
        .toLowerCase()
        .includes("professional");
    if (isProfessional) {
      const d = ((license as any).data && typeof (license as any).data === "object") ? (license as any).data : {};
      const pos =
        (license as any).position ??
        d.position ??
        d.currentPosition ??
        d.current_position;
      if (pos && String(pos).trim()) {
        pdf.setFont("times", "bold");
        pdf.setFontSize(12);
        pdf.text(`POSITION: ${String(pos).toUpperCase()}`, pageWidth / 2, textY + 6, { align: "center" });
        pdf.setFont("times", "normal");
        pdf.setFontSize(11);
      }
    }
  } catch {}

  // Contractor Grade (shown under LICENSE NO. for contractor licenses)
  try {
    const isContractor =
      String((license as any).type || "")
        .toLowerCase()
        .includes("contractor") ||
      String((license as any).license_type || "")
        .toLowerCase()
        .includes("contractor");
    if (isContractor) {
      const rawGrade =
        (license as any).grade ??
        ((license as any).data ? (license as any).data.grade : undefined) ??
        (license as any).category ??
        ((license as any).data
          ? (license as any).data.licenseType ||
            (license as any).data.category
          : undefined);
      let gradeText = "";
      if (rawGrade) {
        const rg = String(rawGrade).toLowerCase();
        if (rg.includes("grade-a") || rg.includes("grade a")) gradeText = "Grade A";
        else if (rg.includes("grade-b") || rg.includes("grade b")) gradeText = "Grade B";
        else if (rg.includes("grade-c") || rg.includes("grade c")) gradeText = "Grade C";
        else if (rg.includes("specialized")) gradeText = "Specialized Contractor";
        else if (/grade\s*\d+/i.test(String(rawGrade))) gradeText = String(rawGrade);
        else gradeText = String(rawGrade);
      }
      if (gradeText) {
        pdf.setFont("times", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(black.r, black.g, black.b);
        pdf.text(`GRADE: ${gradeText}`, pageWidth / 2, textY + 8, { align: "center" });
      }
    }
  } catch {}

  // Holder Name - preserve original casing but fall back to title case
  const toTitleCase = (s: string) => {
    return s
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0]?.toUpperCase() + w.slice(1))
      .join(" ");
  };
  let holderRaw =
    (license as any).holderName ||
    (license as any).holder_name ||
    (license as any).name ||
    (license as any).applicantName ||
    (license as any).fullName ||
    (license as any).ownerFullName ||
    "";
  if (!holderRaw && (license as any).firstName)
    holderRaw = `${license.firstName || ""} ${license.lastName || ""}`.trim();
  const holderDisplay = holderRaw ? holderRaw.trim() : "Unknown Holder";
  const finalHolder = /[a-z]/.test(holderRaw)
    ? holderDisplay
    : toTitleCase(holderDisplay);
  pdf.setFont("times", "bold");
  pdf.setFontSize(24);
  const holderNameY = (() => {
    try {
      const isContractor =
        String((license as any).type || "").toLowerCase().includes("contractor") ||
        String((license as any).license_type || "").toLowerCase().includes("contractor");
      const isProfessional =
        String((license as any).type || "").toLowerCase().includes("professional") ||
        String((license as any).license_type || "").toLowerCase().includes("professional");
      if (!isContractor && !isProfessional) return textY + 12;
      const d = ((license as any).data && typeof (license as any).data === "object") ? (license as any).data : {};
      const rawGrade =
        (license as any).grade ??
        d.grade ??
        (license as any).category ??
        d.licenseType ??
        d.category;
      const rawPos =
        (license as any).position ??
        d.position ??
        d.currentPosition ??
        d.current_position;
      if (isContractor) return rawGrade ? textY + 20 : textY + 12;
      if (isProfessional) return rawPos ? textY + 20 : textY + 12;
      return textY + 12;
    } catch {
      return textY + 12;
    }
  })();
  pdf.text(String(finalHolder), pageWidth / 2, holderNameY, { align: "center" });

  // Separator Line
  pdf.setDrawColor(gold.r, gold.g, gold.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin + 20, textY + 20, pageWidth - margin - 20, textY + 20);

  // 5. License Information Section (Centered Bullet Layout to match image)
  const infoY = textY + 35;

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
  const catVal = String(license.category || "General").toUpperCase();
  const catText = `${bullet} ${catLabel}${catVal}`;

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

  // Separator Line 2
  pdf.setDrawColor(gold.r, gold.g, gold.b);
  pdf.line(margin + 20, badgeY + 15, pageWidth - margin - 20, badgeY + 15);

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

  // QR Code (Left)
  if (license.qrDataUrl) {
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
    pdf.addImage(license.qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
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
  const margin = 15;

  // Header
  pdf.setFillColor(37, 99, 235);
  pdf.rect(0, 0, pageWidth, 40, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  const reportTitle =
    config.reportType.charAt(0).toUpperCase() +
    config.reportType.slice(1).replace(/([A-Z])/g, " $1");
  pdf.text(reportTitle.toUpperCase() + " REPORT", pageWidth / 2, 15, {
    align: "center",
  });
  pdf.setFontSize(10);
  pdf.text(
    `Generated: ${new Date().toLocaleDateString()} | Period: ${config.timeRange}`,
    pageWidth / 2,
    28,
    {
      align: "center",
    },
  );

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  let yPosition = 55;

  // Executive Summary
  pdf.setFontSize(12);
  pdf.setFont(undefined as any, "bold");
  pdf.text("Executive Summary", margin, yPosition);
  yPosition += 8;
  pdf.setFont(undefined as any, "normal");
  pdf.setFontSize(9);

  const summary = `This report provides a comprehensive overview of ${config.reportType} for the ${config.timeRange} period. The data includes ${config.data.length} records analyzed for trends, patterns, and key metrics.`;
  const summaryLines = pdf.splitTextToSize(summary, pageWidth - 2 * margin);
  pdf.text(summaryLines, margin, yPosition);
  yPosition += summaryLines.length * 5 + 5;

  // Data Table
  if (config.includeDetails && config.data.length > 0) {
    pdf.setFontSize(11);
    pdf.setFont(undefined as any, "bold");
    pdf.text("Data Details", margin, yPosition);
    yPosition += 8;
    pdf.setFont(undefined as any, "normal");
    pdf.setFontSize(8);

    // Column headers
    const columns = Object.keys(config.data[0]);
    const columnWidth = (pageWidth - 2 * margin) / columns.length;

    // Header row
    pdf.setFillColor(37, 99, 235);
    pdf.setTextColor(255, 255, 255);
    columns.forEach((col, index) => {
      pdf.text(
        col.toUpperCase().substring(0, 15),
        margin + index * columnWidth + 2,
        yPosition,
      );
    });
    yPosition += 6;

    // Data rows
    pdf.setTextColor(0, 0, 0);
    config.data.slice(0, 10).forEach((row) => {
      columns.forEach((col, index) => {
        const value = String(row[col]).substring(0, 20);
        pdf.text(value, margin + index * columnWidth + 2, yPosition);
      });
      yPosition += 5;
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 15;
      }
    });
  }

  // Key Metrics
  yPosition += 5;
  pdf.setFont(undefined as any, "bold");
  pdf.setFontSize(11);
  pdf.text("Key Metrics", margin, yPosition);
  yPosition += 8;
  pdf.setFont(undefined as any, "normal");
  pdf.setFontSize(9);

  const metrics = [
    [`Total Records: ${config.data.length}`],
    [`Report Period: ${config.timeRange}`],
    [`Generated: ${new Date().toLocaleDateString()}`],
  ];

  metrics.forEach(([metric]) => {
    pdf.text(metric, margin, yPosition);
    yPosition += 6;
  });

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text(
    "Confidential - Construction License Management System",
    margin,
    285,
  );

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
  pdf.text("CLMS OFFICIAL DOCUMENT", pageWidth / 2, pageHeight / 2, { align: "center" });
  // Reset text color for normal content
  pdf.setTextColor(dark.r, dark.g, dark.b);
  pdf.setFont("times", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(dark.r, dark.g, dark.b);
  pdf.text("Oromia Construction Authority", pageWidth / 2, 26, { align: "center" });
  pdf.setFont("times", "normal");
  pdf.setFontSize(12);
  pdf.text("Construction License Management System (CLMS)", pageWidth / 2, 34, { align: "center" });
  pdf.setFont("times", "bold");
  pdf.setFontSize(20);
  pdf.text("Vehicle Registration Certificate", pageWidth / 2, 47, { align: "center" });
  const certYear = new Date().getFullYear();
  const certSeq = String(vehicle?.id || "1").toString().padStart(5, "0");
  const certNo = `CLMS-VEH-${certYear}-${certSeq}`;
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
  const v = vehicle?.data || {};
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
  const issueDate = v.issueDate || vehicle?.registeredAt || vehicle?.created_at || new Date().toISOString();
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
  const expiryDisplay = expiryDate ? new Date(expiryDate).toLocaleDateString() : "N/A";
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
    const qrDataUrl = await generateQRDataURL(JSON.stringify(payload), { width: 120, margin: 1 });
    pdf.addImage(qrDataUrl, "PNG", leftX, qrY, 30, 30);
  } catch {}
  pdf.setFont("times", "normal");
  pdf.setFontSize(11);
  pdf.text(`Certificate Serial Number: ${serial}`, leftX + 36, qrY + 10);
  try {
    const tryAddSignature = async (candidateUrl: string, mime: "PNG" | "JPEG" | "WEBP") => {
      const resp = await fetch(candidateUrl)
      if (!resp.ok) return false
      const blob = await resp.blob()
      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve) => {
        reader.onloadend = () => resolve(String(reader.result || ""))
        reader.readAsDataURL(blob)
      })
      if (!dataUrl) return false
      const sigW = 18
      const sigH = 6
      pdf.addImage(dataUrl, mime, pageWidth - 86, qrY + 18, sigW, sigH)
      return true
    }
    const manualDataUrl = (() => {
      try {
        if (typeof window !== "undefined") {
          const s = window.localStorage.getItem("clms_signature_dataurl")
          return s && s.startsWith("data:image/") ? s : null
        }
      } catch {}
      return null
    })()
    if (manualDataUrl) {
      const sigW = 18
      const sigH = 6
      const mime = manualDataUrl.includes("image/jpeg") ? "JPEG" : manualDataUrl.includes("image/webp") ? "WEBP" : "PNG"
      pdf.addImage(manualDataUrl, mime as any, pageWidth - 86, qrY + 18, sigW, sigH)
    } else {
      const tried =
        (await tryAddSignature(`/signatures/authorized.png`, "PNG")) ||
        (await tryAddSignature(`/signatures/authorized.webp`, "WEBP")) ||
        (await tryAddSignature(`/signatures/authorized.jpg`, "JPEG")) ||
        (await tryAddSignature(`/authorized.png`, "PNG")) ||
        (await tryAddSignature(`/signature.png`, "PNG"))
      if (!tried) {
        pdf.text("Authorized Signature", pageWidth - 80, qrY + 25)
      }
    }
  } catch {
    pdf.text("Authorized Signature", pageWidth - 80, qrY + 25)
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
  pdf.rect(margin + 5, margin + 5, pageWidth - (margin + 5) * 2, pageHeight - (margin + 5) * 2);

  const headerY = margin + 18;
  pdf.setFont("times", "bold");
  pdf.setFontSize(30);
  pdf.setTextColor(navy.r, navy.g, navy.b);
  pdf.text("CONSTRUCTION PARTNERSHIP LICENSE", pageWidth / 2, headerY, { align: "center" });

  const ribbonY = headerY + 10;
  const ribbonW = 160;
  const ribbonH = 12;
  const ribbonX = pageWidth / 2 - ribbonW / 2;
  pdf.setFillColor(navy.r, navy.g, navy.b);
  pdf.rect(ribbonX, ribbonY, ribbonW, ribbonH, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.text("CERTIFICATE OF PARTNERSHIP", pageWidth / 2, ribbonY + ribbonH - 3.5, { align: "center" });

  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFont("times", "italic");
  pdf.setFontSize(12);
  pdf.text("This certifies that the following partnership is legally registered and approved:", pageWidth / 2, ribbonY + ribbonH + 8, { align: "center" });

  const blockY = ribbonY + ribbonH + 22;
  const colW = 75;
  const centerX = pageWidth / 2;

  const leftName = (p?.main_contractor?.name || "LOCAL BUILDER LTD.").toString().toUpperCase();
  const leftLic = p?.main_contractor?.license_number ? `License No. ${p.main_contractor.license_number}` : "License No. -";
  const rightName = (p?.partner_company?.name || "GLOBAL INFRASTRUCTURE INC.").toString().toUpperCase();
  const rightLic = p?.partner_company?.license_number ? `License No. ${p.partner_company.license_number}` : "License No. -";

  pdf.setFont("times", "bold");
  pdf.setFontSize(16);
  const lineSpacing = 5;
  const leftLines = pdf.splitTextToSize(leftName, colW - 6);
  const rightLines = pdf.splitTextToSize(rightName, colW - 6);
  pdf.text(leftLines, centerX - colW, blockY, { align: "center" });
  pdf.text(rightLines, centerX + colW, blockY, { align: "center" });
  pdf.setFont("times", "italic");
  pdf.setFontSize(11);
  const leftNameHeight = (Array.isArray(leftLines) ? leftLines.length : 1) * lineSpacing;
  const rightNameHeight = (Array.isArray(rightLines) ? rightLines.length : 1) * lineSpacing;
  pdf.text(`– ${leftLic} –`, centerX - colW, blockY + leftNameHeight + 2, { align: "center" });
  pdf.text(`– ${rightLic} –`, centerX + colW, blockY + rightNameHeight + 2, { align: "center" });

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
      ctx.fillRect(size * 0.15, size * 0.52, size * 0.18, size * 0.10);
      // Right sleeve
      ctx.fillRect(size * 0.67, size * 0.52, size * 0.18, size * 0.10);
      // Left hand
      ctx.fillStyle = "#f0caa0";
      ctx.beginPath();
      ctx.moveTo(size * 0.22, size * 0.52);
      ctx.quadraticCurveTo(size * 0.40, size * 0.45, size * 0.50, size * 0.52);
      ctx.lineTo(size * 0.46, size * 0.65);
      ctx.quadraticCurveTo(size * 0.36, size * 0.60, size * 0.22, size * 0.62);
      ctx.closePath();
      ctx.fill();
      // Right hand
      ctx.fillStyle = "#d8a779";
      ctx.beginPath();
      ctx.moveTo(size * 0.78, size * 0.52);
      ctx.quadraticCurveTo(size * 0.60, size * 0.45, size * 0.50, size * 0.52);
      ctx.lineTo(size * 0.54, size * 0.65);
      ctx.quadraticCurveTo(size * 0.64, size * 0.60, size * 0.78, size * 0.62);
      ctx.closePath();
      ctx.fill();
      // Outline for join
      ctx.strokeStyle = "#8c6a3a";
      ctx.lineWidth = Math.max(1, size * 0.02);
      ctx.beginPath();
      ctx.moveTo(size * 0.34, size * 0.56);
      ctx.quadraticCurveTo(size * 0.50, size * 0.53, size * 0.66, size * 0.56);
      ctx.stroke();
      return canvas.toDataURL("image/png");
    };
    const hs = await makeHandshakeIcon(140);
    pdf.addImage(hs, "PNG", handshakeX, handshakeY, handshakeSize, handshakeSize);
    pdf.setDrawColor(navy.r, navy.g, navy.b);
    pdf.setLineWidth(1.2);
    pdf.circle(handshakeX + handshakeSize / 2, handshakeY + handshakeSize / 2, handshakeSize / 2, "S");
  } catch {
    // Fallback: simple circle with text
    pdf.setDrawColor(gold.r, gold.g, gold.b);
    pdf.setLineWidth(0.6);
    pdf.circle(handshakeX + handshakeSize / 2, handshakeY + handshakeSize / 2, handshakeSize / 2, "S");
    pdf.setFont("times", "bold");
    pdf.setTextColor(navy.r, navy.g, navy.b);
    pdf.setFontSize(10);
    pdf.text("JV", handshakeX + handshakeSize / 2, handshakeY + handshakeSize / 2 + 3, { align: "center" });
  }

  pdf.setFillColor(gold.r, gold.g, gold.b);
  const ribbon2Y = blockY + 14;
  const ribbon2W = 120;
  const ribbon2H = 8;
  pdf.rect(centerX - ribbon2W / 2, ribbon2Y, ribbon2W, ribbon2H, "F");
  pdf.setFont("times", "bold");
  pdf.setTextColor(255, 255, 255);
  const type = (p?.partnership_type || "Joint Venture").toString().replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  const mainShare = p?.ownership_ratio_main ?? (p?.ownership_ratio ? 100 - Number(p.ownership_ratio) : 60);
  const partnerShare = p?.ownership_ratio_partner ?? (p?.ownership_ratio ? Number(p.ownership_ratio) : 40);
  pdf.text(`${type} Partnership (${Number(mainShare)}% / ${Number(partnerShare)}%)`, centerX, ribbon2Y + ribbon2H - 2.5, { align: "center" });

  const detailsY = ribbon2Y + ribbon2H + 16;
  pdf.setTextColor(black.r, black.g, black.b);
  pdf.setFont("times", "normal");
  pdf.setFontSize(12);

  const idRaw = p?.id || p?.partnership_id || "PENDING";
  const issueDate = (() => {
    const s = p?.issued_date || p?.start_date || p?.updated_at || new Date().toISOString();
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  })();
  const endDateStr = (() => {
    const s = p?.end_date || p?.valid_until || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  })();

  const formatCertNo = (val: any) => {
    const year = new Date(p?.issued_date || p?.updated_at || Date.now()).getFullYear();
    const s = String(val || "").replace(/[^a-zA-Z0-9]/g, "").slice(-6).padStart(6, "0");
    return `CP-${year}-${s}`;
  };

  const gridX = margin + 26;
  const partnershipIdDisplay = String(idRaw || "").toLowerCase();
  pdf.text(`Partnership ID: ${partnershipIdDisplay}`, gridX, detailsY);
  pdf.text(`Valid Until: ${endDateStr}`, gridX, detailsY + 8);
  pdf.text("Authorized for: Major Construction Projects, Import of Machinery, Project Vehicles Registration", gridX, detailsY + 16);

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
    pdf.text("SCAN TO VERIFY", qrX + qrSize / 2, qrY + qrSize + 6, { align: "center" });
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
  pdf.rect(margin + 5, pageHeight - margin - footerH, pageWidth - (margin + 5) * 2, footerH, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("times", "bold");
  pdf.setFontSize(12);
  pdf.text("VALID & ACTIVE UNDER CLMS REGULATIONS", pageWidth / 2, pageHeight - margin - 3, { align: "center" });

  return pdf;
}
