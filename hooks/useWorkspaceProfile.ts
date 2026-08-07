import { useCapabilities } from "./useCapabilities";

export function useWorkspaceProfile() {
  const {
    workspaceConfig,
    workspaceType,
    planLabel,
    vocabulary,
    branding,
    voiceAgentDisplay,
    inventoryAwareAi,
  } = useCapabilities();

  const tenantLabel = branding?.tenantDisplayName || branding?.workspaceLabel || "Your Workspace";

  return {
    workspaceConfig,
    workspaceType,
    planLabel,
    vocabulary,
    branding,
    tenantLabel,
    voiceAgentDisplay,
    inventoryAwareAi,
  };
}
