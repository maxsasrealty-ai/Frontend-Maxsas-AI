import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    fetchAdminTenant,
    fetchAdminTenantCampaigns,
    fetchAdminTenantUsage,
    fetchAdminTenantWallet,
    updateAdminTenant,
} from "../../../../lib/api/admin";
import {
    PlanName,
    TenantAdminRecord,
    TenantUsageSummary,
    TenantWalletSummary,
    WorkspaceConfigOverrides,
} from "../../../../shared/contracts";

const PLAN_OPTIONS: PlanName[] = ["Lexus", "Prestige", "Enterprise"];

const PLAN_COLOR: Record<PlanName, string> = {
  Lexus: "#4F8CFF",
  Prestige: "#A78BFA",
  Enterprise: "#00D084",
};

// ─── Section components ───────────────────────────────────────────────────

function Divider() {
  return <View style={s.divider} />;
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

function WalletCard({ wallet }: { wallet: TenantWalletSummary }) {
  const lowBalance = wallet.balancePaise < 5_000;
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>💳 Wallet</Text>
      <View style={s.walletBalanceRow}>
        <Text style={[s.walletBig, lowBalance && { color: "#FF6B6B" }]}>
          {wallet.balanceFormatted}
        </Text>
        {lowBalance && (
          <View style={s.warnPill}>
            <Text style={s.warnPillText}>Low Balance</Text>
          </View>
        )}
      </View>
      <Divider />
      <FieldRow label="Transactions (recent)" value={String(wallet.recentTransactionCount)} />
      <FieldRow
        label="Total credited"
        value={`₹${(wallet.totalCreditPaise / 100).toLocaleString("en-IN")}`}
      />
      <FieldRow
        label="Total debited"
        value={`₹${(wallet.totalDebitPaise / 100).toLocaleString("en-IN")}`}
      />
      {wallet.lastProvider && (
        <>
          <Divider />
          <FieldRow label="Last Top-Up Provider" value={wallet.lastProvider === "mock" ? "Mock (Demo)" : wallet.lastProvider} />
        </>
      )}
    </View>
  );
}

function CampaignsCard({ campaigns }: { campaigns: any[] }) {
  if (campaigns.length === 0) {
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>📢 Campaigns</Text>
        <Text style={s.meta}>No campaigns found</Text>
      </View>
    );
  }

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>📢 Recent Campaigns</Text>
      {campaigns.slice(0, 5).map((camp, idx) => (
        <View key={camp.id || idx} style={{ marginTop: idx > 0 ? 8 : 4 }}>
          <Text style={{ color: "#E8EDF5", fontSize: 13, fontWeight: "600" }}>{camp.name || "Unnamed Campaign"}</Text>
          <Text style={{ color: "rgba(232,237,245,0.55)", fontSize: 11, marginTop: 2 }}>
            Status: {camp.status} • Calls: {camp.metrics?.completedCalls ?? 0}/{camp.metrics?.totalCalls ?? 0}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TransactionsCard({ transactions }: { transactions: import("../../../../shared/contracts").WalletTransactionItem[] }) {
  if (transactions.length === 0) {
    return (
      <View style={s.card}>
        <Text style={s.cardTitle}>💳 Recent Transactions</Text>
        <Text style={s.meta}>No recent ledger activity</Text>
      </View>
    );
  }

  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>💳 Ledger History</Text>
      {transactions.map((txn, idx) => (
        <View key={txn.id || idx} style={{ marginTop: idx > 0 ? 8 : 4 }}>
          <Text style={{ color: "#E8EDF5", fontSize: 13, fontWeight: "600" }}>
            {txn.type === "credit" ? "+" : "-"}{txn.amountFormatted} • {txn.description}
          </Text>
          <Text style={{ color: "rgba(232,237,245,0.55)", fontSize: 11, marginTop: 2 }}>
            Status: {txn.status} • {new Date(txn.createdAt).toLocaleString("en-IN")}
          </Text>
        </View>
      ))}
    </View>
  );
}

function UsageCard({ usage }: { usage: TenantUsageSummary }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>📊 Usage Summary</Text>
      <View style={s.usageGrid}>
        <View style={s.usageStat}>
          <Text style={s.usageValue}>{usage.callStats.totalCalls}</Text>
          <Text style={s.usageLabel}>Total Calls</Text>
        </View>
        <View style={s.usageStat}>
          <Text style={[s.usageValue, { color: "#00D084" }]}>{usage.callStats.activeCalls}</Text>
          <Text style={s.usageLabel}>Active</Text>
        </View>
        <View style={s.usageStat}>
          <Text style={s.usageValue}>{usage.callStats.completedCalls}</Text>
          <Text style={s.usageLabel}>Completed</Text>
        </View>
        <View style={s.usageStat}>
          <Text style={[s.usageValue, { color: "#FF6B6B" }]}>{usage.callStats.failedCalls}</Text>
          <Text style={s.usageLabel}>Failed</Text>
        </View>
      </View>
      <FieldRow label="Total minutes" value={`${usage.callStats.totalDurationMinutes} min`} />
      <Divider />
      <FieldRow label="Campaigns total" value={String(usage.campaignStats.totalCampaigns)} />
      <View style={s.campaignStatusRow}>
        {[
          { label: "Draft", value: usage.campaignStats.draft, color: "rgba(232,237,245,0.55)" },
          { label: "Queued", value: usage.campaignStats.queued, color: "#F5A623" },
          { label: "Active", value: usage.campaignStats.active, color: "#00D084" },
          { label: "Done", value: usage.campaignStats.completed, color: "#4F8CFF" },
          { label: "Archived", value: usage.campaignStats.archived, color: "rgba(232,237,245,0.35)" },
        ].map((item) => (
          <View key={item.label} style={s.campaignStatusItem}>
            <Text style={[s.campaignStatusValue, { color: item.color }]}>{item.value}</Text>
            <Text style={s.campaignStatusLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function AdminTenantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tenantId = useMemo(() => String(id || ""), [id]);

  const [tenant, setTenant] = useState<TenantAdminRecord | null>(null);
  const [usage, setUsage] = useState<TenantUsageSummary | null>(null);
  const [wallet, setWallet] = useState<TenantWalletSummary | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<PlanName>("Lexus");
  const [productLabel, setProductLabel] = useState("");
  const [workspaceLabel, setWorkspaceLabel] = useState("");
  const [tenantDisplayName, setTenantDisplayName] = useState("");
  const [leadsLabel, setLeadsLabel] = useState("");
  const [batchesLabel, setBatchesLabel] = useState("");
  const [callsLabel, setCallsLabel] = useState("");
  const [campaignsLabel, setCampaignsLabel] = useState("");
  const [assistantLabel, setAssistantLabel] = useState("");
  const [defaultAgentLabel, setDefaultAgentLabel] = useState("");

  function populateFromTenant(found: TenantAdminRecord) {
    setName(found.name || "");
    setPlan(found.planName);
    setProductLabel(found.workspaceConfig.branding.productLabel || "");
    setWorkspaceLabel(found.workspaceConfig.branding.workspaceLabel || "");
    setTenantDisplayName(found.workspaceConfig.branding.tenantDisplayName || "");
    setLeadsLabel(found.workspaceConfig.vocabulary.leadsLabel || "");
    setBatchesLabel(found.workspaceConfig.vocabulary.batchesLabel || "");
    setCallsLabel(found.workspaceConfig.vocabulary.callsLabel || "");
    setCampaignsLabel(found.workspaceConfig.vocabulary.campaignsLabel || "");
    setAssistantLabel(found.workspaceConfig.voiceAgentDisplay.assistantLabel || "");
    setDefaultAgentLabel(found.workspaceConfig.voiceAgentDisplay.defaultAgentLabel || "");
  }

  const loadTenant = useCallback(async () => {
    if (!tenantId) {
      return;
    }

    setLoading(true);
    setError(null);

    const [tenantRes, usageRes, walletRes, campaignsRes] = await Promise.all([
      fetchAdminTenant(tenantId),
      fetchAdminTenantUsage(tenantId),
      fetchAdminTenantWallet(tenantId),
      fetchAdminTenantCampaigns(tenantId),
    ]);

    if (!tenantRes.success) {
      setError(tenantRes.error.message);
      setLoading(false);
      return;
    }

    const found = tenantRes.data;
    setTenant(found);
    populateFromTenant(found);

    setUsage(usageRes.success ? usageRes.data : null);
    setWallet(walletRes.success ? walletRes.data : null);
    setCampaigns(campaignsRes.success ? campaignsRes.data : []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void loadTenant();
  }, [loadTenant]);

  const onSave = useCallback(async () => {
    if (!tenantId || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    const overrides: WorkspaceConfigOverrides = {
      branding: { productLabel, workspaceLabel, tenantDisplayName },
      vocabulary: { leadsLabel, batchesLabel, callsLabel, campaignsLabel },
      voiceAgentDisplay: { assistantLabel, defaultAgentLabel },
    };

    const response = await updateAdminTenant(tenantId, {
      name: name || undefined,
      planName: plan,
      workspaceConfigOverrides: overrides,
    });

    if (!response.success) {
      setError(response.error.message);
      setSaving(false);
      return;
    }

    setTenant(response.data);
    // Refresh wallet + usage too
    await loadTenant();
    setSaving(false);
  }, [
    assistantLabel, batchesLabel, callsLabel, campaignsLabel,
    defaultAgentLabel, leadsLabel, loadTenant, name, plan,
    productLabel, saving, tenantDisplayName, tenantId, workspaceLabel,
  ]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.headerRow}>
          <Pressable style={s.backButton} onPress={() => router.back()}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>
        </View>
        <Text style={s.title}>Tenant Settings</Text>
        <Text style={s.subtitle}>{tenantId}</Text>

        {loading ? (
          <ActivityIndicator color="#4F8CFF" style={{ marginTop: 32 }} />
        ) : tenant ? (
          <>
            {/* Workspace info read-only preview */}
            <View style={s.card}>
              <View style={s.workspaceBanner}>
                <Text style={s.workspaceBannerLabel}>
                  {tenant.workspaceConfig.workspaceType.toUpperCase()} WORKSPACE
                </Text>
                <View
                  style={[s.planPill, { backgroundColor: `${PLAN_COLOR[tenant.planName]}22`, borderColor: `${PLAN_COLOR[tenant.planName]}55` }]}
                >
                  <Text style={[s.planPillText, { color: PLAN_COLOR[tenant.planName] }]}>
                    {tenant.planName}
                  </Text>
                </View>
              </View>
              <FieldRow label="Created" value={new Date(tenant.createdAt).toLocaleDateString()} />
              <FieldRow label="Updated" value={new Date(tenant.updatedAt).toLocaleDateString()} />
            </View>

            {/* Wallet */}
            {wallet ? (
              <WalletCard wallet={wallet} />
            ) : (
              <View style={s.card}>
                <Text style={s.cardTitle}>💳 Wallet</Text>
                <Text style={s.meta}>Wallet data unavailable</Text>
              </View>
            )}

            {/* Usage */}
            {usage ? <UsageCard usage={usage} /> : (
              <View style={s.card}>
                <Text style={s.cardTitle}>📊 Usage Summary</Text>
                <Text style={s.meta}>Usage data unavailable</Text>
              </View>
            )}

            {/* Campaigns */}
            <CampaignsCard campaigns={campaigns} />

            {/* Wallet Ledger */}
            {wallet && wallet.recentTransactions && (
              <TransactionsCard transactions={wallet.recentTransactions} />
            )}

            {/* Plan & Branding */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Plan & Identity</Text>

              <Text style={s.fieldHint}>Tenant name</Text>
              <TextInput
                style={s.input}
                value={name}
                onChangeText={setName}
                placeholder="Tenant name"
                placeholderTextColor="rgba(232,237,245,0.4)"
              />

              <Text style={s.fieldHint}>Plan</Text>
              <View style={s.planRow}>
                {PLAN_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    style={[
                      s.planChip,
                      plan === option && { backgroundColor: `${PLAN_COLOR[option]}28`, borderColor: PLAN_COLOR[option] },
                    ]}
                    onPress={() => setPlan(option)}
                  >
                    <Text style={[s.planChipText, plan === option && { color: PLAN_COLOR[option] }]}>
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={s.fieldHint}>Branding overrides</Text>
              <TextInput style={s.input} value={productLabel} onChangeText={setProductLabel}
                placeholder="Product label (e.g. MAXSAS AI)" placeholderTextColor="rgba(232,237,245,0.4)" />
              <TextInput style={s.input} value={workspaceLabel} onChangeText={setWorkspaceLabel}
                placeholder="Workspace label" placeholderTextColor="rgba(232,237,245,0.4)" />
              <TextInput style={s.input} value={tenantDisplayName} onChangeText={setTenantDisplayName}
                placeholder="Display name" placeholderTextColor="rgba(232,237,245,0.4)" />
            </View>

            {/* Vocabulary */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Vocabulary Mapping</Text>
              <Text style={s.fieldHint}>Leave blank to use plan defaults</Text>
              <TextInput style={s.input} value={leadsLabel} onChangeText={setLeadsLabel}
                placeholder="Leads label" placeholderTextColor="rgba(232,237,245,0.4)" />
              <TextInput style={s.input} value={batchesLabel} onChangeText={setBatchesLabel}
                placeholder="Batches label" placeholderTextColor="rgba(232,237,245,0.4)" />
              <TextInput style={s.input} value={callsLabel} onChangeText={setCallsLabel}
                placeholder="Calls label" placeholderTextColor="rgba(232,237,245,0.4)" />
              <TextInput style={s.input} value={campaignsLabel} onChangeText={setCampaignsLabel}
                placeholder="Campaigns label" placeholderTextColor="rgba(232,237,245,0.4)" />
            </View>

            {/* Voice */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Voice Agent Labels</Text>
              <TextInput style={s.input} value={assistantLabel} onChangeText={setAssistantLabel}
                placeholder="Assistant label" placeholderTextColor="rgba(232,237,245,0.4)" />
              <TextInput style={s.input} value={defaultAgentLabel} onChangeText={setDefaultAgentLabel}
                placeholder="Default agent label" placeholderTextColor="rgba(232,237,245,0.4)" />
            </View>

            <Pressable style={[s.saveButton, saving && s.saveButtonDisabled]} onPress={onSave} disabled={saving}>
              <Text style={s.saveButtonText}>{saving ? "Saving..." : "Save Tenant Settings"}</Text>
            </Pressable>
          </>
        ) : (
          <Text style={s.error}>Tenant not found.</Text>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050d1a" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backButton: {
    borderWidth: 1, borderColor: "rgba(79,140,255,0.35)",
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: "flex-start",
  },
  backText: { color: "#AFC8FF", fontSize: 12, fontWeight: "600" },
  title: { color: "#E8EDF5", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "rgba(232,237,245,0.55)", fontSize: 12, marginBottom: 4 },

  card: {
    backgroundColor: "rgba(11,24,42,0.96)",
    borderWidth: 1, borderColor: "rgba(79,140,255,0.2)",
    borderRadius: 14, padding: 14, gap: 8,
  },
  cardTitle: { color: "#E8EDF5", fontSize: 16, fontWeight: "700", marginBottom: 2 },

  // Workspace banner
  workspaceBanner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  workspaceBannerLabel: {
    color: "rgba(232,237,245,0.55)", fontSize: 11, fontWeight: "800", letterSpacing: 0.8,
  },
  planPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  planPillText: { fontSize: 12, fontWeight: "700" },

  // Wallet
  walletBalanceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  walletBig: { color: "#E8EDF5", fontSize: 28, fontWeight: "800" },
  warnPill: { backgroundColor: "rgba(255,107,107,0.15)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  warnPillText: { color: "#FF6B6B", fontSize: 11, fontWeight: "700" },

  // Usage grid
  usageGrid: { flexDirection: "row", gap: 8, marginBottom: 8 },
  usageStat: {
    flex: 1, backgroundColor: "rgba(79,140,255,0.07)",
    borderRadius: 10, padding: 10, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(79,140,255,0.15)",
  },
  usageValue: { color: "#E8EDF5", fontSize: 18, fontWeight: "800" },
  usageLabel: { color: "rgba(232,237,245,0.55)", fontSize: 11, marginTop: 2 },

  // Campaign status row
  campaignStatusRow: { flexDirection: "row", gap: 6, marginTop: 6 },
  campaignStatusItem: { alignItems: "center", flex: 1 },
  campaignStatusValue: { fontSize: 16, fontWeight: "700" },
  campaignStatusLabel: { color: "rgba(232,237,245,0.45)", fontSize: 10, marginTop: 2 },

  // Fields
  fieldRow: { flexDirection: "row", justifyContent: "space-between" },
  fieldLabel: { color: "rgba(232,237,245,0.55)", fontSize: 13 },
  fieldValue: { color: "#E8EDF5", fontSize: 13, fontWeight: "600" },
  fieldHint: { color: "rgba(232,237,245,0.45)", fontSize: 11, marginTop: 4 },

  divider: { height: 1, backgroundColor: "rgba(79,140,255,0.15)", marginVertical: 4 },
  meta: { color: "rgba(232,237,245,0.55)", fontSize: 13 },

  // Form
  input: {
    backgroundColor: "rgba(79,140,255,0.08)", borderColor: "rgba(79,140,255,0.28)",
    borderWidth: 1, borderRadius: 10, color: "#E8EDF5",
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  planRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  planChip: {
    borderWidth: 1, borderColor: "rgba(79,140,255,0.22)",
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(79,140,255,0.08)",
  },
  planChipText: { color: "rgba(232,237,245,0.75)", fontSize: 12, fontWeight: "700" },

  // Save button
  saveButton: {
    backgroundColor: "#4F8CFF", borderRadius: 10,
    paddingVertical: 13, alignItems: "center", marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  error: { color: "#FF8B8B", fontSize: 13 },
});
