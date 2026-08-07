export type PhoneStatus = "valid" | "invalid" | "ambiguous";

export interface LeadUploadPreviewItem {
  rowIndex: number;
  name: string | null;
  email: string | null;
  company: string | null;
  rawPhone: string | null;
  extractedDigits: string | null;
  normalizedPhone10d: string | null;
  normalizedPhoneE164: string | null;
  phoneStatus: PhoneStatus;
  invalidReason?: string;
  score: number;
  sourceColumns: string[];
  cleanedRow: Record<string, unknown>;
}

export interface LeadUploadRejectedItem {
  rowIndex: number;
  rawPhone: string | null;
  reason: string;
}

export interface LeadUploadPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  preview: LeadUploadPreviewItem[];
  rejected: LeadUploadRejectedItem[];
}

export interface LeadUploadPreviewRequest {
  fileName?: string;
  mimeType?: string;
  fileBase64?: string;
  csvText?: string;
  rows?: Array<Record<string, unknown>>;
}

export interface ManualLeadPreviewRequest {
  name?: string;
  phone?: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
  source?: string;
  extra?: Record<string, unknown>;
}
