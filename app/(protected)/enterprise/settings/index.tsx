import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";

import EnterpriseSurface from "../../../../components/enterprise/EnterpriseSurface";
import SectionHeader from "../../../../components/lexus/SectionHeader";
import { C } from "../../../../components/lexus/theme";
import { useWorkspaceProfile } from "../../../../hooks/useWorkspaceProfile";

export default function EnterpriseSettings() {
  const { workspaceConfig, branding, voiceAgentDisplay, inventoryAwareAi, vocabulary } = useWorkspaceProfile();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Settings" subtitle="Workspace configuration preview" />

        <EnterpriseSurface padded={true} style={{ marginBottom: 10 }}>
          <Text style={styles.title}>Branding</Text>
          <Text style={styles.meta}>{`Product: ${branding?.productLabel || "MAXSAS AI"}`}</Text>
          <Text style={styles.meta}>{`Workspace: ${branding?.workspaceLabel || "Enterprise Workspace"}`}</Text>
          <Text style={styles.meta}>{`Tenant: ${branding?.tenantDisplayName || "Not set"}`}</Text>
        </EnterpriseSurface>

        <EnterpriseSurface padded={true} style={{ marginBottom: 10 }}>
          <Text style={styles.title}>Voice Agent Settings</Text>
          <Text style={styles.meta}>{`Assistant label: ${voiceAgentDisplay?.assistantLabel || "Voice AI"}`}</Text>
          <Text style={styles.meta}>{`Default agent label: ${voiceAgentDisplay?.defaultAgentLabel || "Enterprise AI Agent"}`}</Text>
        </EnterpriseSurface>

        <EnterpriseSurface padded={true} style={{ marginBottom: 10 }}>
          <Text style={styles.title}>Vocabulary</Text>
          <Text style={styles.meta}>{`Campaigns label: ${vocabulary.campaignsLabel}`}</Text>
          <Text style={styles.meta}>{`Calls label: ${vocabulary.callsLabel}`}</Text>
          <Text style={styles.meta}>{`Contacts model source: ${vocabulary.leadsLabel}`}</Text>
        </EnterpriseSurface>

        <EnterpriseSurface padded={true} style={{ marginBottom: 10 }}>
          <Text style={styles.title}>Inventory Connection</Text>
          <Text style={styles.meta}>{`Inventory-aware qualification: ${inventoryAwareAi?.inventoryAwareQualification ? "enabled" : "disabled"}`}</Text>
          <Text style={styles.meta}>{`Inventory-aware prompting: ${inventoryAwareAi?.inventoryAwarePrompting ? "enabled" : "disabled"}`}</Text>
          <Text style={styles.meta}>Full inventory management UI is intentionally deferred.</Text>
        </EnterpriseSurface>

        <EnterpriseSurface padded={true}>
          <Text style={styles.title}>Raw Workspace Config</Text>
          <Text style={styles.json}>{JSON.stringify(workspaceConfig, null, 2)}</Text>
        </EnterpriseSurface>

        <Text style={styles.footer}>This settings page is preview-only until admin provisioning surfaces are added.</Text>

        <Text style={{ height: 70 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30 },
  title: { color: C.text, fontSize: 15, fontWeight: "700", marginBottom: 6 },
  meta: { color: C.textMuted, fontSize: 12, marginTop: 4 },
  json: {
    color: C.textFaint,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
    fontFamily: "monospace",
  },
  footer: {
    color: C.textFaint,
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
  },
});
