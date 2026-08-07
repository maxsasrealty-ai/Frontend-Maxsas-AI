import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { fetchAdminTenants } from "../../../../lib/api/admin";
import { PlanName, TenantAdminRecord } from "../../../../shared/contracts";

const PLAN_COLOR: Record<PlanName, string> = {
  Lexus: "#4F8CFF",
  Prestige: "#A78BFA",
  Enterprise: "#00D084",
};

const WORKSPACE_COLOR: Record<string, string> = {
  lexus: "#4F8CFF",
  enterprise: "#00D084",
};

// ─── Tenant Row ────────────────────────────────────────────────────────────

function TenantRow({ tenant }: { tenant: TenantAdminRecord }) {
  const planColor = PLAN_COLOR[tenant.planName] ?? "#4F8CFF";
  const wsColor = WORKSPACE_COLOR[tenant.workspaceConfig.workspaceType] ?? "#4F8CFF";
  const lowBalance = tenant.walletBalancePaise < 5_000; // <₹50 warning

  return (
    <Pressable
      style={s.row}
      onPress={() => router.push(`/(protected)/admin/tenants/${tenant.id}` as never)}
    >
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{tenant.name || tenant.id}</Text>
        <Text style={s.rowMeta}>{tenant.id}</Text>
        <View style={s.rowBadgeRow}>
          {/* Workspace type badge */}
          <View style={[s.badge, { borderColor: `${wsColor}55`, backgroundColor: `${wsColor}18` }]}>
            <Text style={[s.badgeText, { color: wsColor }]}>
              {tenant.workspaceConfig.workspaceType.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={s.rowRight}>
        {/* Plan pill */}
        <View style={[s.planPill, { backgroundColor: `${planColor}22`, borderColor: `${planColor}55` }]}>
          <Text style={[s.planPillText, { color: planColor }]}>{tenant.planName}</Text>
        </View>
        {/* Wallet balance */}
        <Text style={[s.walletBalance, lowBalance && s.walletBalanceLow]}>
          {tenant.walletBalanceFormatted}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function AdminTenantsListScreen() {
  const [tenants, setTenants] = useState<TenantAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>Workspaces</Text>
            <Text style={s.subtitle}>All provisioned tenants</Text>
          </View>
          <Pressable style={s.refreshButton} onPress={loadTenants}>
            <Text style={s.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        <View style={s.listContainer}>
          {loading ? (
            <ActivityIndicator color="#4F8CFF" style={{ marginTop: 40 }} />
          ) : tenants.length === 0 ? (
            <Text style={s.empty}>No tenants provisioned yet.</Text>
          ) : (
            tenants.map((tenant) => <TenantRow key={tenant.id} tenant={tenant} />)
          )}
        </View>

        {error ? <Text style={s.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050d1a" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "#E8EDF5", fontSize: 24, fontWeight: "800" },
  subtitle: { color: "rgba(232,237,245,0.7)", fontSize: 13, marginTop: 2 },
  refreshButton: {
    borderWidth: 1, borderColor: "rgba(79,140,255,0.3)",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  refreshText: { color: "#AFC8FF", fontSize: 13, fontWeight: "600" },
  
  listContainer: { gap: 10, marginTop: 8 },
  row: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(11,24,42,0.96)",
    borderWidth: 1, borderColor: "rgba(79,140,255,0.16)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  rowTitle: { color: "#E8EDF5", fontSize: 15, fontWeight: "700" },
  rowMeta: { color: "rgba(232,237,245,0.55)", fontSize: 12, marginTop: 1 },
  rowBadgeRow: { flexDirection: "row", marginTop: 6, gap: 6 },
  badge: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  rowRight: { alignItems: "flex-end", gap: 8, minWidth: 80 },
  planPill: {
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  planPillText: { fontSize: 11, fontWeight: "700" },
  walletBalance: { color: "#E8EDF5", fontSize: 14, fontWeight: "700" },
  walletBalanceLow: { color: "#FF6B6B" },

  empty: { color: "rgba(232,237,245,0.55)", fontSize: 14, textAlign: "center", marginTop: 40 },
  error: { color: "#FF8B8B", fontSize: 13, textAlign: "center", marginTop: 20 },
});
