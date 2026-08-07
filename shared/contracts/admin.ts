import { WalletTransactionItem } from "./payment";
import { PlanName, WorkspaceTenantConfig } from "./workspace";

export interface TenantAdminRecord {
  id: string;
  name?: string | null;
  planName: PlanName;
  workspaceConfig: WorkspaceTenantConfig;
  walletBalancePaise: number;
  walletBalanceFormatted: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantWalletSummary {
  tenantId: string;
  balancePaise: number;
  balanceFormatted: string;
  recentTransactionCount: number;
  totalCreditPaise: number;
  totalDebitPaise: number;
  lastProvider?: string | null;
  recentTransactions: WalletTransactionItem[];
}

export interface CreateTenantAdminInput {
  id: string;
  name?: string;
  planName?: PlanName;
  workspaceConfigOverrides?: WorkspaceConfigOverrides;
}

export interface UpdateTenantAdminInput {
  name?: string;
  planName?: PlanName;
  workspaceConfigOverrides?: WorkspaceConfigOverrides;
}

export interface WorkspaceConfigOverrides {
  branding?: Partial<WorkspaceTenantConfig["branding"]>;
  vocabulary?: Partial<WorkspaceTenantConfig["vocabulary"]>;
  voiceAgentDisplay?: Partial<WorkspaceTenantConfig["voiceAgentDisplay"]>;
}

export interface TenantUsageSummary {
  tenantId: string;
  callStats: {
    totalCalls: number;
    activeCalls: number;
    completedCalls: number;
    failedCalls: number;
    totalDurationMinutes: number;
  };
  campaignStats: {
    totalCampaigns: number;
    draft: number;
    queued: number;
    active: number;
    completed: number;
    archived: number;
  };
}

export interface AdminUserRecord {
  id: string;
  email: string;
  fullName: string;
  tenantId: string;
  tenantName?: string | null;
  createdAt: string;
}
