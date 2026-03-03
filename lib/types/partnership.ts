export type Company = {
  id: number
  name: string
  registration_number?: string | null
  license_number?: string | null
  license_expiry_date?: string | null
  country?: string | null
  status: "active" | "suspended"
}

export type PartnershipDocument = {
  id: number
  document_type: string
  file: string
  uploaded_at: string
}

export type Partnership = {
  id: string
  owner: string | number
  main_contractor: Company
  partner_company: Company
  partnership_type: "joint_venture" | "subcontract" | "foreign_local" | "consortium"
  ownership_ratio_main: number
  ownership_ratio_partner: number
  status:
    | "pending"
    | "awaiting_partner_approval"
    | "awaiting_government_review"
    | "approved"
    | "rejected"
    | "active"
    | "suspended"
    | "expired"
  start_date?: string | null
  end_date?: string | null
  qr_code?: string | null
  certificate_number?: string | null
  created_at: string
  updated_at: string
  documents?: PartnershipDocument[]
}
