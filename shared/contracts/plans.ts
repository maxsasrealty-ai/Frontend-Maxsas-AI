export type PlanKey = "basic" | "pro" | "enterprise";

export type CapabilityKey =
  | "calls.live"
  | "calls.history"
  | "transcripts.partial"
  | "transcripts.full"
  | "recordings.playback"
  | "analytics.basic"
  | "analytics.advanced"
  | "crm.sync"
  | "whiteLabel.branding";

export interface PlanCapabilities {
  plan: PlanKey;
  features: Record<CapabilityKey, boolean>;
  limits: {
    maxConcurrentCalls: number;
    monthlyCallMinutes: number;
    retentionDays: number;
  };
}

export interface CapabilityCheckInput {
  plan: PlanKey;
  capability: CapabilityKey;
}
