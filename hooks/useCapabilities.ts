import { useCalls } from "./useCalls";

const FALLBACK_VOCABULARY = {
  leadsLabel: "Leads",
  batchesLabel: "Batches",
  callsLabel: "Calls",
  campaignsLabel: "Campaigns",
} as const;

export function useCapabilities() {
  const { capabilities, workspaceConfig } = useCalls();

  const can = (feature: keyof NonNullable<typeof capabilities>["features"]) => {
    return capabilities?.features[feature] === true;
  };

  const planTier = capabilities?.plan || "basic";
  const planLabel =
    workspaceConfig?.planName || (planTier === "basic" ? "Lexus" : planTier === "enterprise" ? "Enterprise" : "Prestige");

  const premiumPlanLabel = workspaceConfig?.workspaceType === "enterprise" ? "Enterprise" : "Prestige";

  const upgradeLabel =
    planLabel === "Lexus"
      ? `Upgrade to ${premiumPlanLabel}`
      : `Manage ${planLabel}`;

  return {
    capabilities,
    workspaceConfig,
    can,
    plan: planTier,
    planLabel,
    premiumPlanLabel,
    basePlanLabel: "Lexus",
    upgradeLabel,
    workspaceType: workspaceConfig?.workspaceType || "lexus",
    vocabulary: workspaceConfig?.vocabulary || FALLBACK_VOCABULARY,
    branding: workspaceConfig?.branding,
    voiceAgentDisplay: workspaceConfig?.voiceAgentDisplay,
    inventoryAwareAi: workspaceConfig?.inventoryAwareAi,
    limits: capabilities?.limits,
  };
}
