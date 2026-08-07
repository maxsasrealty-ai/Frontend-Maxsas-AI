import {
    ApiEnvelope,
    LeadUploadPreviewRequest,
    LeadUploadPreviewResponse,
    ManualLeadPreviewRequest,
} from "../../shared/contracts";

import { apiClient } from "./client";

export async function previewLeadUpload(
  payload: LeadUploadPreviewRequest
): Promise<ApiEnvelope<LeadUploadPreviewResponse>> {
  return apiClient.post<LeadUploadPreviewRequest, LeadUploadPreviewResponse>(
    "/leads/upload/preview",
    payload
  );
}

export async function previewManualLead(
  payload: ManualLeadPreviewRequest
): Promise<ApiEnvelope<LeadUploadPreviewResponse>> {
  return apiClient.post<ManualLeadPreviewRequest, LeadUploadPreviewResponse>(
    "/leads/manual/preview",
    payload
  );
}