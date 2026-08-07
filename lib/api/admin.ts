import {
  AdminUserRecord,
  ApiEnvelope,
  CreateTenantAdminInput,
  TenantAdminRecord,
  TenantUsageSummary,
  TenantWalletSummary,
  UpdateTenantAdminInput,
} from "../../shared/contracts";

import { resolveApiBaseUrl } from "./base-url";
import { apiClient } from "./client";


// Always use dev-admin-key for local/dev; update for prod as needed
const ADMIN_KEY = "dev-admin-key";

function adminHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${ADMIN_KEY}`,
  };
}

export interface AdminLiveEventItem {
  streamEventId: string;
  occurredAt: string;
  stage: "received" | "invalid_json" | "validation_failed" | "persisted" | "duplicate" | "error";
  dbUpdated: boolean;
  eventId?: string;
  tenantId?: string;
  callId?: string;
  roomId?: string;
  eventType?: string;
  message?: string;
  rawBody?: unknown;
  normalizedBody?: unknown;
}

export interface AdminRecentDbEventItem {
  eventId: string;
  tenantId: string;
  callId: string;
  eventType: string;
  occurredAt: string;
  createdAt: string;
  dbUpdated: true;
  payload: unknown;
  rawEnvelope: unknown;
}

function resolveAdminApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export function buildAdminLiveEventsStreamUrl(): string {
  const base = resolveAdminApiBaseUrl();
  return `${base}/admin/live-events/stream?adminKey=${encodeURIComponent(ADMIN_KEY)}`;
}

export async function fetchAdminTenants(): Promise<ApiEnvelope<TenantAdminRecord[]>> {
  return apiClient.get<TenantAdminRecord[]>("/admin/tenants", adminHeaders());
}

export async function fetchAdminTenant(
  tenantId: string
): Promise<ApiEnvelope<TenantAdminRecord>> {
  return apiClient.get<TenantAdminRecord>(
    `/admin/tenants/${encodeURIComponent(tenantId)}`,
    adminHeaders()
  );
}

export async function createAdminTenant(
  payload: CreateTenantAdminInput
): Promise<ApiEnvelope<TenantAdminRecord>> {
  return apiClient.post<CreateTenantAdminInput, TenantAdminRecord>(
    "/admin/tenants",
    payload,
    adminHeaders()
  );
}

export async function updateAdminTenant(
  tenantId: string,
  payload: UpdateTenantAdminInput
): Promise<ApiEnvelope<TenantAdminRecord>> {
  return apiClient.patch<UpdateTenantAdminInput, TenantAdminRecord>(
    `/admin/tenants/${encodeURIComponent(tenantId)}`,
    payload,
    adminHeaders()
  );
}

export async function fetchAdminTenantUsage(
  tenantId: string
): Promise<ApiEnvelope<TenantUsageSummary>> {
  return apiClient.get<TenantUsageSummary>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/usage`,
    adminHeaders()
  );
}

export async function fetchAdminTenantWallet(
  tenantId: string
): Promise<ApiEnvelope<TenantWalletSummary>> {
  return apiClient.get<TenantWalletSummary>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/wallet`,
    adminHeaders()
  );
}

export async function fetchAdminTenantCampaigns(
  tenantId: string,
  page = 1,
  pageSize = 10
): Promise<ApiEnvelope<any[]>> {
  // We specify any for now or use the appropriate Campaign item type if available
  return apiClient.get<any[]>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/campaigns?page=${page}&pageSize=${pageSize}`,
    adminHeaders()
  );
}

export async function fetchAdminLiveRecentEvents(
  limit = 60
): Promise<ApiEnvelope<AdminRecentDbEventItem[]>> {
  return apiClient.get<AdminRecentDbEventItem[]>(
    `/admin/live-events/recent?limit=${Math.max(1, Math.min(limit, 200))}`,
    adminHeaders()
  );
}

export async function fetchAdminUsers(
  limit = 20,
  query?: string
): Promise<ApiEnvelope<AdminUserRecord[]>> {
  const normalizedLimit = Math.max(1, Math.min(limit, 200));
  const queryPart = query?.trim() ? `&query=${encodeURIComponent(query.trim())}` : "";

  return apiClient.get<AdminUserRecord[]>(
    `/admin/users?limit=${normalizedLimit}${queryPart}`,
    adminHeaders()
  );
}
