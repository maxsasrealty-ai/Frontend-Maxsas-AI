import { CapabilityKey } from "./plans";

export type PlanName = "Lexus" | "Prestige" | "Enterprise";
export type WorkspaceType = "lexus" | "enterprise";

export interface WorkspaceVocabulary {
  leadsLabel: string;
  batchesLabel: string;
  callsLabel: string;
  campaignsLabel: string;
}

export interface WorkspaceBrandingSettings {
  productLabel: string;
  workspaceLabel: string;
  tenantDisplayName?: string;
}

export interface VoiceAgentDisplaySettings {
  assistantLabel: string;
  defaultAgentLabel: string;
}

export interface InventoryAwareAiFlags {
  inventoryAwareQualification: boolean;
  inventoryAwarePrompting: boolean;
}

export interface WorkspaceTenantConfig {
  planName: PlanName;
  workspaceType: WorkspaceType;
  vocabulary: WorkspaceVocabulary;
  branding: WorkspaceBrandingSettings;
  voiceAgentDisplay: VoiceAgentDisplaySettings;
  inventoryAwareAi: InventoryAwareAiFlags;
  capabilityFlags: Record<CapabilityKey, boolean>;
}