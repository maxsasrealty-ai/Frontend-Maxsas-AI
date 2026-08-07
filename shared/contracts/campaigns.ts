export type CampaignStatus = "draft" | "queued" | "active" | "completed" | "archived";

export interface CampaignRecord {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  status?: CampaignStatus;
  callIds?: string[];
  contacts?: Array<{
    name?: string;
    phone?: string;
    notes?: string;
    sourceCallId?: string;
  }>;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string | null;
  status?: CampaignStatus;
  addCallIds?: string[];
  removeCallIds?: string[];
}

export interface CampaignCallRecord {
  campaignId: string;
  callId: string;
  tenantId: string;
  createdAt: string;
}

export interface CampaignContactRecord {
  id: string;
  campaignId: string;
  tenantId: string;
  sourceCallId?: string | null;
  name?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignRealtimeEvent {
  streamEventId: string;
  tenantId: string;
  campaignId: string;
  eventType:
    | "campaign_created"
    | "campaign_updated"
    | "campaign_deleted"
    | "campaign_calls_added"
    | "campaign_calls_removed"
    | "campaign_contacts_changed";
  occurredAt: string;
  payload: Record<string, unknown>;
}