export type Chip = { label: string; text: string; color: string; icon?: string }
export type AlertChip = { message: string; color: string; icon?: string }

const PRIORITY_FIELDS: Record<
  string,
  {
    chips: Array<{
      key: string
      label: string
      type: "string" | "date" | "boolean" | "percentage" | "currency" | "number" | "phone"
      icon?: string
      color: string
      format?: "relative"
      copyable?: boolean
      trueText?: string
      falseText?: string
      currency?: string
      unit?: string
      decimals?: number
    }>
    alertChips: Array<{
      key: string
      condition: string
      message: string
      color: string
      icon?: string
    }>
  }
> = {
  nationalIdCopy: {
    chips: [
      { key: "idNumber", label: "ID Number", type: "string", icon: "🆔", color: "blue" },
      { key: "fullNameEnglish", label: "Name", type: "string", icon: "👤", color: "green" },
      { key: "expiryDate", label: "Expires", type: "date", icon: "⏰", color: "orange", format: "relative" },
      { key: "hasStamp", label: "Stamp", type: "boolean", icon: "🖊️", color: "purple", trueText: "Present", falseText: "Missing" },
      { key: "authenticityScore", label: "Authenticity", type: "percentage", icon: "✓", color: "teal" }
    ],
    alertChips: [
      { key: "expired", condition: "expiryDate < today", message: "EXPIRED", color: "red", icon: "⚠️" },
      { key: "lowAuthenticity", condition: "authenticityScore < 0.7", message: "SUSPICIOUS", color: "red", icon: "🔴" }
    ]
  },
  taxCertificate: {
    chips: [
      { key: "tin", label: "TIN", type: "string", icon: "🔢", color: "blue", copyable: true },
      { key: "businessName", label: "Business", type: "string", icon: "🏢", color: "green" },
      { key: "fiscalYear", label: "Fiscal Year", type: "string", icon: "📅", color: "orange" },
      { key: "taxOffice", label: "Tax Office", type: "string", icon: "🏛️", color: "purple" },
      { key: "hasStamp", label: "Stamp", type: "boolean", icon: "🖊️", color: "teal", trueText: "Present", falseText: "Missing" },
      { key: "vatRegistered", label: "VAT", type: "boolean", icon: "💰", color: "indigo", trueText: "Registered", falseText: "Not Registered" }
    ],
    alertChips: [
      { key: "tinInvalid", condition: "tin.length !== 10", message: "INVALID TIN", color: "red", icon: "❌" },
      { key: "expiredFiscalYear", condition: "fiscalYear < currentEFY-1", message: "OUTDATED FY", color: "orange", icon: "⚠️" },
      { key: "missingStamp", condition: "hasStamp === false", message: "NO STAMP", color: "red", icon: "🔴" }
    ]
  },
  companyRegistration: {
    chips: [
      { key: "registrationNumber", label: "Reg No", type: "string", icon: "📋", color: "blue", copyable: true },
      { key: "companyName", label: "Company", type: "string", icon: "🏢", color: "green" },
      { key: "capitalAmount", label: "Capital", type: "currency", icon: "💰", color: "orange", currency: "ETB" },
      { key: "expiryDate", label: "Expires", type: "date", icon: "⏰", color: "purple" },
      { key: "businessType", label: "Type", type: "string", icon: "📊", color: "teal" },
      { key: "validGrade", label: "Grade", type: "string", icon: "🏅", color: "indigo" }
    ],
    alertChips: [
      { key: "expired", condition: "expiryDate < today", message: "EXPIRED", color: "red", icon: "⚠️" },
      { key: "capitalInsufficient", condition: "capitalAmount < gradeRequirement", message: "INSUFFICIENT CAPITAL", color: "orange", icon: "💰" },
      { key: "invalidGrade", condition: "validGrade > 7 || validGrade < 1", message: "INVALID GRADE", color: "red", icon: "❌" }
    ]
  },
  experienceCertificate: {
    chips: [
      { key: "clientName", label: "Client", type: "string", icon: "👥", color: "blue" },
      { key: "projectValue", label: "Value", type: "currency", icon: "💰", color: "green", currency: "ETB" },
      { key: "projectDuration", label: "Duration", type: "string", icon: "⏱️", color: "orange" },
      { key: "contactPhone", label: "Contact", type: "phone", icon: "📞", color: "purple" },
      { key: "hasStamp", label: "Stamp", type: "boolean", icon: "🖊️", color: "teal" },
      { key: "hasLetterhead", label: "Letterhead", type: "boolean", icon: "📄", color: "indigo" }
    ],
    alertChips: [
      { key: "missingStamp", condition: "hasStamp === false", message: "NO STAMP", color: "red", icon: "🔴" },
      { key: "missingLetterhead", condition: "hasLetterhead === false", message: "NO LETTERHEAD", color: "orange", icon: "📄" },
      { key: "invalidPhone", condition: "!phonePattern.test(contactPhone)", message: "INVALID PHONE", color: "orange", icon: "📞" }
    ]
  },
  financialStatement: {
    chips: [
      { key: "tin", label: "TIN", type: "string", icon: "🔢", color: "blue", copyable: true },
      { key: "fiscalYear", label: "FY", type: "string", icon: "📅", color: "green" },
      { key: "netWorth", label: "Net Worth", type: "currency", icon: "💰", color: "orange", currency: "ETB" },
      { key: "annualRevenue", label: "Revenue", type: "currency", icon: "📈", color: "purple", currency: "ETB" },
      { key: "currentRatio", label: "Current Ratio", type: "number", icon: "⚖️", color: "teal", decimals: 2 },
      { key: "auditFirm", label: "Auditor", type: "string", icon: "👨‍⚖️", color: "indigo" },
      { key: "auditorName", label: "Lead Auditor", type: "string", icon: "👤", color: "blue" },
      { key: "auditorLicense", label: "Auditor License", type: "string", icon: "🆔", color: "green" }
    ],
    alertChips: [
      { key: "negativeNetWorth", condition: "netWorth < 0", message: "NEGATIVE NET WORTH", color: "red", icon: "⚠️" },
      { key: "lowLiquidity", condition: "currentRatio < 1.2", message: "LOW LIQUIDITY", color: "orange", icon: "💧" },
      { key: "unqualifiedOpinion", condition: "auditOpinion !== 'Unqualified'", message: "QUALIFIED OPINION", color: "orange", icon: "📊" }
    ]
  },
  companyPhoto: {
    chips: [
      { key: "hasText", label: "Has Text", type: "boolean", icon: "🔤", color: "blue" },
      { key: "extractedText", label: "Logo Text", type: "string", icon: "🏷️", color: "green" },
      { key: "resolution", label: "Resolution", type: "number", icon: "📷", color: "orange", unit: "DPI" },
      { key: "isProfessional", label: "Quality", type: "boolean", icon: "✨", color: "purple", trueText: "Professional", falseText: "Poor" }
    ],
    alertChips: [
      { key: "lowResolution", condition: "resolution < 150", message: "LOW RES", color: "orange", icon: "📷" },
      { key: "poorQuality", condition: "isProfessional === false", message: "POOR QUALITY", color: "orange", icon: "⚠️" }
    ]
  },
  customsLicense: {
    chips: [
      { key: "licenseNumber", label: "License No", type: "string", icon: "📋", color: "blue", copyable: true },
      { key: "licenseType", label: "Type", type: "string", icon: "🏷️", color: "green" },
      { key: "licenseHolder", label: "Holder", type: "string", icon: "👤", color: "orange" },
      { key: "expiryDate", label: "Expires", type: "date", icon: "⏰", color: "purple" },
      { key: "customsOffice", label: "Office", type: "string", icon: "🏛️", color: "teal" },
      { key: "hasStamp", label: "Stamp", type: "boolean", icon: "🖊️", color: "indigo" }
    ],
    alertChips: [
      { key: "expired", condition: "expiryDate < today", message: "EXPIRED", color: "red", icon: "⚠️" },
      { key: "expiringSoon", condition: "expiryDate < addDays(today, 30)", message: "EXPIRING SOON", color: "orange", icon: "⏰" },
      { key: "missingStamp", condition: "hasStamp === false", message: "NO STAMP", color: "red", icon: "🔴" }
    ]
  },
  itemSpecifications: {
    chips: [
      { key: "items[0].description", label: "Primary Item", type: "string", icon: "📦", color: "blue" },
      { key: "items.length", label: "Item Count", type: "number", icon: "🔢", color: "green" },
      { key: "items[0].countryOfOrigin", label: "Origin", type: "string", icon: "🌍", color: "orange" },
      { key: "manufacturerName", label: "Manufacturer", type: "string", icon: "🏭", color: "purple" },
      { key: "hasRestrictedItems", label: "Restricted", type: "boolean", icon: "⚠️", color: "red" }
    ],
    alertChips: [
      { key: "restrictedItems", condition: "hasRestrictedItems === true", message: "RESTRICTED ITEMS", color: "red", icon: "🚫" },
      { key: "missingHsCode", condition: "items.some(i => !i.hsCode)", message: "MISSING HS CODE", color: "orange", icon: "🔢" }
    ]
  },
  proformaInvoice: {
    chips: [
      { key: "invoiceNumber", label: "Invoice No", type: "string", icon: "🧾", color: "blue", copyable: true },
      { key: "supplierName", label: "Supplier", type: "string", icon: "🏭", color: "green" },
      { key: "totalFOBValue", label: "FOB Value", type: "currency", icon: "💰", color: "orange", currency: "USD" },
      { key: "validityDate", label: "Valid Until", type: "date", icon: "⏰", color: "purple" },
      { key: "incoterms", label: "Incoterms", type: "string", icon: "🚢", color: "teal" },
      { key: "hasSignature", label: "Signed", type: "boolean", icon: "✍️", color: "indigo" }
    ],
    alertChips: [
      { key: "expired", condition: "validityDate < today", message: "EXPIRED", color: "red", icon: "⚠️" },
      { key: "missingSignature", condition: "hasSignature === false", message: "UNSIGNED", color: "red", icon: "✍️" },
      { key: "highValue", condition: "totalFOBValue > 500000", message: "HIGH VALUE", color: "orange", icon: "💰" }
    ]
  },
  degreeCertificate: {
    chips: [
      { key: "fullName", label: "Name", type: "string", icon: "👤", color: "blue" },
      { key: "degreeTitle", label: "Degree", type: "string", icon: "🎓", color: "green" },
      { key: "fieldOfStudy", label: "Field", type: "string", icon: "🔬", color: "orange" },
      { key: "institutionName", label: "Institution", type: "string", icon: "🏛️", color: "purple" },
      { key: "graduationDate", label: "Graduated", type: "date", icon: "📅", color: "teal" },
      { key: "isForeign", label: "Origin", type: "boolean", icon: "🌍", color: "indigo", trueText: "Foreign", falseText: "Local" }
    ],
    alertChips: [
      { key: "futureDate", condition: "graduationDate > today", message: "FUTURE DATE", color: "red", icon: "⚠️" },
      { key: "foreignNoEquivalence", condition: "isForeign === true && hasEquivalence === false", message: "NO EQUIVALENCE", color: "orange", icon: "🌍" },
      { key: "missingStamp", condition: "hasInstitutionStamp === false", message: "NO STAMP", color: "orange", icon: "🖊️" }
    ]
  },
  transcripts: {
    chips: [
      { key: "studentName", label: "Name", type: "string", icon: "👤", color: "blue" },
      { key: "institutionName", label: "Institution", type: "string", icon: "🏛️", color: "green" },
      { key: "cgpa", label: "CGPA", type: "number", icon: "📊", color: "orange", decimals: 2 },
      { key: "totalCredits", label: "Credits", type: "number", icon: "📚", color: "purple" },
      { key: "graduationStatus", label: "Status", type: "string", icon: "✅", color: "teal" }
    ],
    alertChips: [
      { key: "lowCGPA", condition: "cgpa < 2.0", message: "LOW CGPA", color: "orange", icon: "⚠️" },
      { key: "incomplete", condition: "graduationStatus !== 'Graduated'", message: "NOT GRADUATED", color: "orange", icon: "📚" }
    ]
  },
  experienceLetter: {
    chips: [
      { key: "employeeName", label: "Name", type: "string", icon: "👤", color: "blue" },
      { key: "position", label: "Position", type: "string", icon: "💼", color: "green" },
      { key: "totalExperienceYears", label: "Experience", type: "number", icon: "⏱️", color: "orange", unit: "years" },
      { key: "employerName", label: "Employer", type: "string", icon: "🏢", color: "purple" },
      { key: "employerTin", label: "Employer TIN", type: "string", icon: "🔢", color: "teal" },
      { key: "hasStamp", label: "Stamp", type: "boolean", icon: "🖊️", color: "indigo" }
    ],
    alertChips: [
      { key: "missingStamp", condition: "hasStamp === false", message: "NO STAMP", color: "red", icon: "🔴" },
      { key: "invalidTin", condition: "employerTin && employerTin.length !== 10", message: "INVALID TIN", color: "orange", icon: "🔢" },
      { key: "shortExperience", condition: "totalExperienceYears < 2", message: "LOW EXPERIENCE", color: "orange", icon: "⏱️" }
    ]
  },
  previousLicense: {
    chips: [
      { key: "licenseNumber", label: "License No", type: "string", icon: "📋", color: "blue", copyable: true },
      { key: "licenseType", label: "Type", type: "string", icon: "🏷️", color: "green" },
      { key: "licenseHolder", label: "Holder", type: "string", icon: "👤", color: "orange" },
      { key: "expiryDate", label: "Expired", type: "date", icon: "⏰", color: "purple" },
      { key: "status", label: "Status", type: "string", icon: "⚡", color: "teal" }
    ],
    alertChips: [
      { key: "suspended", condition: "status === 'Suspended' || status === 'Revoked'", message: "SUSPENDED", color: "red", icon: "🚫" },
      { key: "expired", condition: "status === 'Expired'", message: "EXPIRED", color: "orange", icon: "⚠️" }
    ]
  },
  partnershipAgreement: {
    chips: [
      { key: "agreementNumber", label: "Agreement No", type: "string", icon: "📄", color: "blue", copyable: true },
      { key: "partners.length", label: "Partners", type: "number", icon: "👥", color: "green" },
      { key: "totalCapital", label: "Total Capital", type: "currency", icon: "💰", color: "orange", currency: "ETB" },
      { key: "hasForeignPartner", label: "Foreign Partner", type: "boolean", icon: "🌍", color: "purple" },
      { key: "isNotarized", label: "Notarized", type: "boolean", icon: "⚖️", color: "teal" },
      { key: "leadingPartner", label: "Lead Partner", type: "string", icon: "👑", color: "indigo" }
    ],
    alertChips: [
      { key: "sharesNotSumTo100", condition: "profitSharingRatio.sum !== 100", message: "INVALID SHARES", color: "red", icon: "⚠️" },
      { key: "notNotarized", condition: "isNotarized === false", message: "NOT NOTARIZED", color: "red", icon: "⚖️" },
      { key: "foreignShareExceeds", condition: "foreignSharePercentage > 49", message: "FOREIGN >49%", color: "orange", icon: "🌍" }
    ]
  },
  partnersLicenses: {
    chips: [
      { key: "partnerLicenses.length", label: "Partner Licenses", type: "number", icon: "📋", color: "blue" },
      { key: "allLicensesValid", label: "All Valid", type: "boolean", icon: "✅", color: "green" },
      { key: "expiringCount", label: "Expiring Soon", type: "number", icon: "⏰", color: "orange" }
    ],
    alertChips: [
      { key: "missingLicenses", condition: "allLicensesValid === false", message: "INVALID LICENSE(S)", color: "red", icon: "❌" },
      { key: "expiredLicense", condition: "partnerLicenses.some(l => l.status === 'Expired')", message: "EXPIRED LICENSE", color: "red", icon: "⚠️" }
    ]
  },
  projectContract: {
    chips: [
      { key: "contractNumber", label: "Contract No", type: "string", icon: "📋", color: "blue", copyable: true },
      { key: "clientName", label: "Client", type: "string", icon: "👥", color: "green" },
      { key: "projectValue", label: "Value", type: "currency", icon: "💰", color: "orange", currency: "ETB" },
      { key: "projectDuration", label: "Duration", type: "string", icon: "⏱️", color: "purple" },
      { key: "ppdaCompliant", label: "PPDA", type: "boolean", icon: "⚖️", color: "teal", trueText: "Compliant", falseText: "Non-Compliant" }
    ],
    alertChips: [
      { key: "missingSignature", condition: "hasContractorSignature === false", message: "UNSIGNED", color: "red", icon: "✍️" },
      { key: "ppdaNonCompliant", condition: "ppdaCompliant === false", message: "PPDA ISSUE", color: "orange", icon: "⚖️" }
    ]
  },
  financialGuarantee: {
    chips: [
      { key: "guaranteeNumber", label: "Guarantee No", type: "string", icon: "📋", color: "blue", copyable: true },
      { key: "issuingBank", label: "Bank", type: "string", icon: "🏦", color: "green" },
      { key: "guaranteeAmount", label: "Amount", type: "currency", icon: "💰", color: "orange", currency: "ETB" },
      { key: "expiryDate", label: "Expires", type: "date", icon: "⏰", color: "purple" },
      { key: "guaranteeType", label: "Type", type: "string", icon: "🏷️", color: "teal" }
    ],
    alertChips: [
      { key: "expired", condition: "expiryDate < today", message: "EXPIRED", color: "red", icon: "⚠️" },
      { key: "expiringSoon", condition: "expiryDate < addDays(today, 30)", message: "EXPIRING SOON", color: "orange", icon: "⏰" },
      { key: "missingBankSeal", condition: "hasBankSeal === false", message: "NO BANK SEAL", color: "red", icon: "🖊️" }
    ]
  },
  registration: {
    chips: [
      { key: "plateNumber", label: "Plate", type: "string", icon: "🚗", color: "blue", copyable: true },
      { key: "region", label: "Region", type: "string", icon: "📍", color: "green" },
      { key: "ownerName", label: "Owner", type: "string", icon: "👤", color: "orange" },
      { key: "make", label: "Make", type: "string", icon: "🏭", color: "purple" },
      { key: "year", label: "Year", type: "number", icon: "📅", color: "teal" },
      { key: "registrationType", label: "Type", type: "string", icon: "🏷️", color: "indigo" }
    ],
    alertChips: [
      { key: "invalidPlate", condition: "!platePattern.test(plateNumber)", message: "INVALID PLATE", color: "red", icon: "🚫" },
      { key: "commercialUsePrivate", condition: "registrationType === 'Private' && commercialUse", message: "COMMERCIAL USE", color: "orange", icon: "⚠️" },
      { key: "ownerMismatch", condition: "ownerName !== companyName", message: "OWNER MISMATCH", color: "orange", icon: "👤" }
    ]
  },
  insurance: {
    chips: [
      { key: "policyNumber", label: "Policy No", type: "string", icon: "📋", color: "blue", copyable: true },
      { key: "insurerName", label: "Insurer", type: "string", icon: "🏦", color: "green" },
      { key: "vehiclePlate", label: "Plate", type: "string", icon: "🚗", color: "orange" },
      { key: "coverageType", label: "Coverage", type: "string", icon: "🛡️", color: "purple" },
      { key: "endDate", label: "Expires", type: "date", icon: "⏰", color: "teal" },
      { key: "daysRemaining", label: "Days Left", type: "number", icon: "📆", color: "indigo", unit: "days" }
    ],
    alertChips: [
      { key: "expired", condition: "endDate < today", message: "EXPIRED", color: "red", icon: "⚠️" },
      { key: "expiringSoon", condition: "daysRemaining < 30", message: "EXPIRING SOON", color: "orange", icon: "⏰" },
      { key: "plateMismatch", condition: "vehiclePlate !== registration.plateNumber", message: "PLATE MISMATCH", color: "red", icon: "🚗" }
    ]
  },
  inspection: {
    chips: [
      { key: "certificateNumber", label: "Cert No", type: "string", icon: "📋", color: "blue", copyable: true },
      { key: "inspectionCenter", label: "Center", type: "string", icon: "🔧", color: "green" },
      { key: "vehiclePlate", label: "Plate", type: "string", icon: "🚗", color: "orange" },
      { key: "expiryDate", label: "Valid Until", type: "date", icon: "⏰", color: "purple" },
      { key: "result", label: "Result", type: "string", icon: "✅", color: "teal" }
    ],
    alertChips: [
      { key: "failed", condition: "result === 'Fail'", message: "FAILED", color: "red", icon: "❌" },
      { key: "expired", condition: "expiryDate < today", message: "EXPIRED", color: "red", icon: "⚠️" },
      { key: "expiringSoon", condition: "expiryDate < addDays(today, 30)", message: "EXPIRING SOON", color: "orange", icon: "⏰" }
    ]
  },
  ownership: {
    chips: [
      { key: "documentType", label: "Document Type", type: "string", icon: "📄", color: "blue" },
      { key: "ownerName", label: "Owner", type: "string", icon: "👤", color: "green" },
      { key: "ownerTin", label: "Owner TIN", type: "string", icon: "🔢", color: "orange", copyable: true },
      { key: "purchaseDate", label: "Purchase Date", type: "date", icon: "📅", color: "purple" },
      { key: "isLeased", label: "Leased", type: "boolean", icon: "📝", color: "teal" }
    ],
    alertChips: [
      { key: "tinMismatch", condition: "ownerTin !== companyTin", message: "TIN MISMATCH", color: "red", icon: "🔢" },
      { key: "leaseExpiring", condition: "isLeased && leaseEndDate < addDays(today, 90)", message: "LEASE ENDING", color: "orange", icon: "📝" },
      { key: "missingSignature", condition: "hasSellerSignature === false", message: "UNSIGNED", color: "orange", icon: "✍️" }
    ]
  }
}

function toDate(v: any): Date | null {
  if (!v) return null
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? null : d
}

function relativeDateText(d: Date): string {
  const diffMs = d.getTime() - Date.now()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "today"
  if (diffDays > 0) return `${diffDays}d`
  return `${Math.abs(diffDays)}d ago`
}

function efyFromGregorian(now: Date): number {
  return now.getFullYear() - 7
}

function parseEFY(s: any): number | null {
  if (!s) return null
  const m = String(s).match(/(\d{4})\s*EFY/i)
  if (m) return parseInt(m[1], 10)
  const n = String(s).match(/(\d{4})/)
  return n ? parseInt(n[1], 10) : null
}

function gradeRequirementETB(grade: any): number | null {
  const m = String(grade || "").match(/(\d+)/)
  const g = m ? parseInt(m[1], 10) : NaN
  if (isNaN(g)) return null
  const map: Record<number, number> = {
    1: 5000000,
    2: 4000000,
    3: 3000000,
    4: 2000000,
    5: 1000000,
    6: 500000,
    7: 50000
  }
  return map[g] ?? null
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  r.setDate(r.getDate() + n)
  return r
}

const phonePattern = /^\+251[0-9]{9}$/
const platePattern = /^(AA|OR|AM|SN|DR|TG|AF|BG|GB|ET)[- ]?[0-9]{1,5}[A-Z]?$/

function deepGet(obj: any, path: string): any {
  if (!obj || !path) return undefined
  const parts = path.replace(/\]/g, "").split(/\.|\[/)
  let cur = obj
  for (const p of parts) {
    if (p === "") continue
    if (p === "length" && Array.isArray(cur)) {
      cur = cur.length
      continue
    }
    cur = cur?.[p]
    if (cur === undefined || cur === null) break
  }
  return cur
}

function valueForKey(docType: string, obj: any, key: string): any {
  const ent = obj?.extractedEntities || {}
  // Financial statement highlights fallback
  const fin = obj?.financialHighlights || {}
  if (key === "authenticityScore") {
    const a = obj?.authenticityIndicators?.overallAuthenticityScore
    const c = obj?.confidenceScore
    return typeof a === "number" ? a : typeof c === "number" ? c : null
  }
  if (key === "vatRegistered") {
    const reg = ent?.registrationType
    const vat = ent?.vatNumber
    return reg === "VAT Registered" || !!vat
  }
  if (key === "hasRestrictedItems") {
    const items = ent?.items || []
    return Array.isArray(items) ? items.some((i: any) => i?.isRestricted === true) : false
  }
  if (key === "items.some(i => !i.hsCode)") {
    const items = ent?.items || []
    return Array.isArray(items) ? items.some((i: any) => !i?.hsCode) : false
  }
  if (key === "netWorth") return ent?.netWorth ?? fin?.netWorth ?? null
  if (key === "annualRevenue") return ent?.annualRevenue ?? fin?.annualRevenue ?? null
  if (key === "currentRatio") return fin?.currentRatio ?? null
  if (key === "auditOpinion") return ent?.auditOpinion ?? obj?.auditOpinion ?? null
  // Nested path resolution
  const v = deepGet(ent, key)
  return v !== undefined ? v : ent[key]
}

function evaluateAlert(docType: string, obj: any, key: string): boolean {
  const ent = obj?.extractedEntities || {}
  if (docType === "nationalIdCopy" && key === "expired") {
    const d = toDate(ent?.expiryDate)
    return !!(d && d.getTime() < Date.now())
  }
  if (docType === "nationalIdCopy" && key === "lowAuthenticity") {
    const s = valueForKey(docType, obj, "authenticityScore")
    return typeof s === "number" ? s < 0.7 : false
  }
  if (docType === "taxCertificate" && key === "tinInvalid") {
    const tin = String(ent?.tin || "")
    return tin.length !== 10
  }
  if (docType === "taxCertificate" && key === "expiredFiscalYear") {
    const fy = parseEFY(ent?.fiscalYear)
    const cur = efyFromGregorian(new Date())
    return fy !== null ? fy < cur - 1 : false
  }
  if (docType === "taxCertificate" && key === "missingStamp") {
    return ent?.hasStamp === false
  }
  if (docType === "companyRegistration" && key === "expired") {
    const d = toDate(ent?.expiryDate)
    return !!(d && d.getTime() < Date.now())
  }
  if (docType === "companyRegistration" && key === "capitalInsufficient") {
    const req = gradeRequirementETB(ent?.validGrade)
    const cap = typeof ent?.capitalAmount === "number" ? ent.capitalAmount : null
    return req !== null && cap !== null ? cap < req : false
  }
  if (docType === "companyRegistration" && key === "invalidGrade") {
    const m = String(ent?.validGrade || "").match(/(\d+)/)
    const g = m ? parseInt(m[1], 10) : NaN
    return isNaN(g) || g < 1 || g > 7
  }
  if (docType === "experienceCertificate" && key === "missingStamp") return ent?.hasStamp === false
  if (docType === "experienceCertificate" && key === "missingLetterhead") return ent?.hasLetterhead === false
  if (docType === "experienceCertificate" && key === "invalidPhone") {
    const p = String(ent?.contactPhone || "")
    return !phonePattern.test(p)
  }
  if (docType === "financialStatement" && key === "negativeNetWorth") {
    const nw = valueForKey(docType, obj, "netWorth")
    return typeof nw === "number" ? nw < 0 : false
  }
  if (docType === "financialStatement" && key === "lowLiquidity") {
    const cr = valueForKey(docType, obj, "currentRatio")
    return typeof cr === "number" ? cr < 1.2 : false
  }
  if (docType === "financialStatement" && key === "unqualifiedOpinion") {
    const op = valueForKey(docType, obj, "auditOpinion")
    return typeof op === "string" ? op !== "Unqualified" : false
  }
  if (docType === "companyPhoto" && key === "lowResolution") return (ent?.resolution ?? 0) < 150
  if (docType === "companyPhoto" && key === "poorQuality") return ent?.isProfessional === false
  if (docType === "customsLicense" && key === "expired") {
    const d = toDate(ent?.expiryDate)
    return !!(d && d.getTime() < Date.now())
  }
  if (docType === "customsLicense" && key === "expiringSoon") {
    const d = toDate(ent?.expiryDate)
    return !!(d && d.getTime() < addDays(new Date(), 30).getTime())
  }
  if (docType === "customsLicense" && key === "missingStamp") return ent?.hasStamp === false
  if (docType === "itemSpecifications" && key === "restrictedItems") {
    const items = ent?.items || []
    return Array.isArray(items) ? items.some((i: any) => i?.isRestricted === true) : false
  }
  if (docType === "itemSpecifications" && key === "missingHsCode") {
    const items = ent?.items || []
    return Array.isArray(items) ? items.some((i: any) => !i?.hsCode) : false
  }
  if (docType === "proformaInvoice" && key === "expired") {
    const d = toDate(ent?.validityDate)
    return !!(d && d.getTime() < Date.now())
  }
  if (docType === "proformaInvoice" && key === "missingSignature") return ent?.hasSignature === false
  if (docType === "proformaInvoice" && key === "highValue") return (ent?.totalFOBValue ?? 0) > 500000
  if (docType === "degreeCertificate" && key === "futureDate") {
    const d = toDate(ent?.graduationDate)
    return !!(d && d.getTime() > Date.now())
  }
  if (docType === "degreeCertificate" && key === "foreignNoEquivalence") {
    return ent?.isForeign === true && ent?.hasEquivalence === false
  }
  if (docType === "degreeCertificate" && key === "missingStamp") return ent?.hasInstitutionStamp === false
  if (docType === "transcripts" && key === "lowCGPA") return (ent?.cgpa ?? 0) < 2.0
  if (docType === "transcripts" && key === "incomplete") return ent?.graduationStatus !== "Graduated"
  if (docType === "experienceLetter" && key === "invalidTin") {
    const t = String(ent?.employerTin || "")
    return !!t && t.length !== 10
  }
  if (docType === "experienceLetter" && key === "shortExperience") return (ent?.totalExperienceYears ?? 0) < 2
  if (docType === "previousLicense" && key === "suspended") return ent?.status === "Suspended" || ent?.status === "Revoked"
  if (docType === "previousLicense" && key === "expired") return ent?.status === "Expired"
  if (docType === "partnershipAgreement" && key === "sharesNotSumTo100") {
    const partners = ent?.partners || []
    const sum = Array.isArray(partners) ? partners.reduce((a: number, p: any) => a + (Number(p?.sharePercentage) || 0), 0) : 0
    return Math.round(sum) !== 100
  }
  if (docType === "partnershipAgreement" && key === "notNotarized") return ent?.isNotarized === false
  if (docType === "partnershipAgreement" && key === "foreignShareExceeds") return (ent?.foreignSharePercentage ?? 0) > 49
  if (docType === "partnersLicenses" && key === "missingLicenses") return ent?.allLicensesValid === false
  if (docType === "partnersLicenses" && key === "expiredLicense") {
    const pls = ent?.partnerLicenses || []
    return Array.isArray(pls) ? pls.some((l: any) => l?.status === "Expired") : false
  }
  if (docType === "projectContract" && key === "missingSignature") return ent?.hasContractorSignature === false
  if (docType === "projectContract" && key === "ppdaNonCompliant") return ent?.ppdaCompliant === false
  if (docType === "financialGuarantee" && key === "expired") {
    const d = toDate(ent?.expiryDate)
    return !!(d && d.getTime() < Date.now())
  }
  if (docType === "financialGuarantee" && key === "expiringSoon") {
    const d = toDate(ent?.expiryDate)
    return !!(d && d.getTime() < addDays(new Date(), 30).getTime())
  }
  if (docType === "financialGuarantee" && key === "missingBankSeal") return ent?.hasBankSeal === false
  if (docType === "registration" && key === "invalidPlate") {
    const p = String(ent?.plateNumber || "")
    return !platePattern.test(p)
  }
  if (docType === "insurance" && key === "expired") {
    const d = toDate(ent?.endDate)
    return !!(d && d.getTime() < Date.now())
  }
  if (docType === "insurance" && key === "expiringSoon") return (ent?.daysRemaining ?? 9999) < 30
  if (docType === "inspection" && key === "failed") return ent?.result === "Fail"
  if (docType === "inspection" && key === "expired") {
    const d = toDate(ent?.expiryDate)
    return !!(d && d.getTime() < Date.now())
  }
  if (docType === "inspection" && key === "expiringSoon") {
    const d = toDate(ent?.expiryDate)
    return !!(d && d.getTime() < addDays(new Date(), 30).getTime())
  }
  if (docType === "ownership" && key === "leaseExpiring") {
    if (!ent?.isLeased) return false
    const d = toDate(ent?.leaseEndDate)
    return !!(d && d.getTime() < addDays(new Date(), 90).getTime())
  }
  if (docType === "ownership" && key === "missingSignature") return ent?.hasSellerSignature === false
  return false
}

export function computePriorityChips(documentType: string, obj: any): { primary: Chip[]; alerts: AlertChip[] } {
  const conf = PRIORITY_FIELDS[documentType]
  if (!conf) return { primary: [], alerts: [] }
  const primary: Chip[] = []
  for (const c of conf.chips) {
    const v = valueForKey(documentType, obj, c.key)
    if (v === undefined || v === null || v === "") continue
    let text = ""
    if (c.type === "string") text = String(v)
    else if (c.type === "boolean") text = v ? String(c.trueText || "Yes") : String(c.falseText || "No")
    else if (c.type === "percentage") text = `${Math.round(Number(v) * 100)}%`
    else if (c.type === "currency") text = `${c.currency || ""} ${Number(v).toLocaleString()}`
    else if (c.type === "date") {
      const d = toDate(v)
      text = d ? (c.format === "relative" ? relativeDateText(d) : d.toLocaleDateString()) : ""
    } else if (c.type === "number") {
      const num = Number(v)
      if (!isNaN(num)) {
        const dec = c.decimals ?? 0
        const base = dec > 0 ? num.toFixed(dec) : Math.round(num).toString()
        text = c.unit ? `${base} ${c.unit}` : base
      }
    } else if (c.type === "phone") {
      text = String(v)
    }
    if (!text) continue
    primary.push({ label: c.label, text, color: c.color, icon: c.icon })
  }
  const alerts: AlertChip[] = []
  for (const a of conf.alertChips) {
    if (evaluateAlert(documentType, obj, a.key)) alerts.push({ message: a.message, color: a.color, icon: a.icon })
  }
  return { primary, alerts }
}
