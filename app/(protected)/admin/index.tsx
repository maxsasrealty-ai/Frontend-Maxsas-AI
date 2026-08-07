import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { createAdminTenant, fetchAdminTenants, fetchAdminUsers } from "../../../lib/api/admin";
import { resolveApiBaseUrl } from "../../../lib/api/base-url";
import { AdminUserRecord, PlanName, TenantAdminRecord } from "../../../shared/contracts";

const PLAN_OPTIONS: PlanName[] = ["Lexus", "Prestige", "Enterprise"];

// ─── Plan badge colors ────────────────────────────────────────────────────

const PLAN_COLOR: Record<PlanName, string> = {
  Lexus: "#4F8CFF",
  Prestige: "#A78BFA",
  Enterprise: "#00D084",
};

function getAdminConsoleUrl(): string {
  const configured = resolveApiBaseUrl();
  const backendBase = configured.replace(/\/api\/?$/, "");
  return `${backendBase}/admin`;
}

// TenantList moved to app/(protected)/admin/tenants/index.tsx

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function AdminTenantsScreen() {
  const [tenants, setTenants] = useState<TenantAdminRecord[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newTenantId, setNewTenantId] = useState("");
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantPlan, setNewTenantPlan] = useState<PlanName>("Lexus");

  const loadTenants = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await fetchAdminTenants();
    if (!response.success) {
      setError(response.error.message);
      setLoading(false);
      return;
    }

    setTenants(response.data);
    setLoading(false);
  }, []);

  const loadRecentUsers = useCallback(async () => {
    const response = await fetchAdminUsers(8);
    if (!response.success) {
      return;
    }

    setRecentUsers(response.data);
  }, []);

  useEffect(() => {
    void loadTenants();
    void loadRecentUsers();
  }, [loadRecentUsers, loadTenants]);

  const canCreate = useMemo(() => newTenantId.trim().length > 0, [newTenantId]);
  const adminConsoleUrl = useMemo(() => getAdminConsoleUrl(), []);

  const onCreateTenant = useCallback(async () => {
    if (!canCreate || submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await createAdminTenant({
      id: newTenantId.trim(),
      name: newTenantName.trim() || undefined,
      planName: newTenantPlan,
    });

    if (!response.success) {
      setError(response.error.message);
      setSubmitting(false);
      return;
    }

    setNewTenantId("");
    setNewTenantName("");
    await loadTenants();
    setSubmitting(false);
  }, [canCreate, loadTenants, newTenantId, newTenantName, newTenantPlan, submitting]);

  const onOpenAdminConsole = useCallback(async () => {
    const supported = await Linking.canOpenURL(adminConsoleUrl);
    if (supported) {
      await Linking.openURL(adminConsoleUrl);
      return;
    }
    setError(`Unable to open admin console: ${adminConsoleUrl}`);
  }, [adminConsoleUrl]);

  // Derived stats
  const lexusCount = tenants.filter((t) => t.workspaceConfig.workspaceType === "lexus").length;
  const enterpriseCount = tenants.filter((t) => t.workspaceConfig.workspaceType === "enterprise").length;
  const lowBalanceCount = tenants.filter((t) => t.walletBalancePaise < 5_000).length;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Dashboard</Text>
        <Text style={s.subtitle}>System status and workspace provisioning</Text>

        {/* System at-a-glance */}
        {!loading && tenants.length > 0 && (
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{tenants.length}</Text>
              <Text style={s.statLabel}>Tenants</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: "#4F8CFF" }]}>{lexusCount}</Text>
              <Text style={s.statLabel}>Lexus</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: "#00D084" }]}>{enterpriseCount}</Text>
              <Text style={s.statLabel}>Enterprise</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statValue, { color: lowBalanceCount > 0 ? "#FF8B8B" : "#E8EDF5" }]}>
                {lowBalanceCount}
              </Text>
              <Text style={s.statLabel}>Low Wallet</Text>
            </View>
          </View>
        )}

        <View style={s.consoleCard}>
          <Text style={s.cardTitle}>Admin Console</Text>
          <Text style={s.consoleHint}>Trigger calls, monitor lifecycle, and inspect transcript data.</Text>
          <Pressable style={s.consoleButton} onPress={onOpenAdminConsole}>
            <Text style={s.consoleButtonText}>Open Admin Console</Text>
          </Pressable>
          <View style={s.quickRow}>
            <Pressable style={s.quickButton} onPress={() => router.push("/(protected)/admin/live-events" as never)}> 
              <Text style={s.quickButtonText}>Live Feed</Text>
            </Pressable>
            <Pressable style={s.quickButton} onPress={() => router.push("/(protected)/admin/live-events/recent" as never)}> 
              <Text style={s.quickButtonText}>DB Events</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.card}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.cardTitle}>Recent Signups</Text>
            <Pressable onPress={() => void loadRecentUsers()}>
              <Text style={s.refreshText}>Refresh</Text>
            </Pressable>
          </View>

          {recentUsers.length === 0 ? (
            <Text style={s.empty}>No signup users found yet.</Text>
          ) : (
            recentUsers.map((user) => (
              <View key={user.id} style={s.userRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.userName}>{user.fullName}</Text>
                  <Text style={s.userMeta}>{user.email}</Text>
                  <Text style={s.userMeta}>Tenant: {user.tenantName || user.tenantId}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Create Tenant */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Provision Tenant</Text>

          <TextInput
            style={s.input}
            value={newTenantId}
            onChangeText={setNewTenantId}
            placeholder="Tenant ID (e.g. acme-corp)"
            placeholderTextColor="rgba(232,237,245,0.4)"
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            value={newTenantName}
            onChangeText={setNewTenantName}
            placeholder="Display name (optional)"
            placeholderTextColor="rgba(232,237,245,0.4)"
          />

          <View style={s.planRow}>
            {PLAN_OPTIONS.map((plan) => (
              <Pressable
                key={plan}
                style={[
                  s.planChip,
                  newTenantPlan === plan && { backgroundColor: `${PLAN_COLOR[plan]}28`, borderColor: PLAN_COLOR[plan] },
                ]}
                onPress={() => setNewTenantPlan(plan)}
              >
                <Text
                  style={[
                    s.planChipText,
                    newTenantPlan === plan && { color: PLAN_COLOR[plan] },
                  ]}
                >
                  {plan}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[s.button, (!canCreate || submitting) && s.buttonDisabled]}
            onPress={onCreateTenant}
            disabled={!canCreate || submitting}
          >
            <Text style={s.buttonText}>{submitting ? "Creating..." : "Create Workspace"}</Text>
          </Pressable>
        </View>

        <Pressable style={s.viewAllButton} onPress={() => router.replace('/(protected)/admin/tenants')}>
          <Text style={s.viewAllText}>View All Tenants →</Text>
        </Pressable>

        {error ? <Text style={s.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050d1a" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  title: { color: "#E8EDF5", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "rgba(232,237,245,0.7)", fontSize: 13, marginBottom: 4 },

  // Stats
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  statBox: {
    flex: 1, backgroundColor: "rgba(11,24,42,0.96)",
    borderWidth: 1, borderColor: "rgba(79,140,255,0.2)",
    borderRadius: 12, padding: 10, alignItems: "center",
  },
  statValue: { color: "#E8EDF5", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "rgba(232,237,245,0.55)", fontSize: 11, marginTop: 2 },

  // Card
  card: {
    backgroundColor: "rgba(11,24,42,0.96)",
    borderWidth: 1, borderColor: "rgba(79,140,255,0.2)",
    borderRadius: 14, padding: 14, gap: 10,
  },
  cardTitle: { color: "#E8EDF5", fontSize: 16, fontWeight: "700" },

  consoleCard: {
    backgroundColor: "rgba(11,24,42,0.96)",
    borderWidth: 1,
    borderColor: "rgba(79,140,255,0.2)",
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  consoleHint: { color: "rgba(232,237,245,0.7)", fontSize: 12 },
  consoleButton: {
    marginTop: 2,
    backgroundColor: "rgba(79,140,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(79,140,255,0.5)",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  consoleButtonText: { color: "#AFC8FF", fontWeight: "700", fontSize: 13 },
  quickRow: { flexDirection: "row", gap: 8 },
  quickButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(79,140,255,0.32)",
    borderRadius: 9,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "rgba(79,140,255,0.08)",
  },
  quickButtonText: { color: "#D4E2FF", fontWeight: "700", fontSize: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  refreshText: {
    color: "#AFC8FF",
    fontSize: 12,
    fontWeight: "700",
  },
  userRow: {
    borderWidth: 1,
    borderColor: "rgba(79,140,255,0.2)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(79,140,255,0.05)",
  },
  userName: { color: "#E8EDF5", fontSize: 13, fontWeight: "700" },
  userMeta: { color: "rgba(232,237,245,0.68)", fontSize: 12, marginTop: 2 },

  // Form
  input: {
    backgroundColor: "rgba(79,140,255,0.08)", borderColor: "rgba(79,140,255,0.28)",
    borderWidth: 1, borderRadius: 10, color: "#E8EDF5",
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  planRow: { flexDirection: "row", gap: 8 },
  planChip: {
    borderWidth: 1, borderColor: "rgba(79,140,255,0.22)",
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(79,140,255,0.08)",
  },
  planChipText: { color: "rgba(232,237,245,0.75)", fontSize: 12, fontWeight: "700" },
  button: {
    marginTop: 4, backgroundColor: "#4F8CFF",
    borderRadius: 10, paddingVertical: 11, alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "700" },

  viewAllButton: {
    backgroundColor: "rgba(79,140,255,0.1)",
    borderWidth: 1, borderColor: "rgba(79,140,255,0.4)",
    borderRadius: 10, paddingVertical: 14, alignItems: "center",
    marginTop: 8
  },
  viewAllText: { color: "#4F8CFF", fontWeight: "700", fontSize: 15 },

  empty: { color: "rgba(232,237,245,0.55)", fontSize: 13 },
  error: { color: "#FF8B8B", fontSize: 13 },
});
