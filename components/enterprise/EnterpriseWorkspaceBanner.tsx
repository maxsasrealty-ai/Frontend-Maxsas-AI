import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useWorkspaceProfile } from "../../hooks/useWorkspaceProfile";
import { C } from "../lexus/theme";
import EnterpriseSurface from "./EnterpriseSurface";

export default function EnterpriseWorkspaceBanner() {
  const { branding, planLabel, tenantLabel, voiceAgentDisplay } = useWorkspaceProfile();

  return (
    <EnterpriseSurface padded={true} style={styles.banner}>
      <View style={styles.topRow}>
        <View style={styles.logoSlot}>
          <Text style={styles.logoText}>LOGO</Text>
        </View>
        <Text style={styles.planPill}>{planLabel}</Text>
      </View>
      <Text style={styles.title}>{tenantLabel}</Text>
      <Text style={styles.subtitle}>{branding?.workspaceLabel || "Enterprise Workspace"}</Text>
      <Text style={styles.support}>{`Voice profile: ${voiceAgentDisplay?.defaultAgentLabel || "Enterprise AI Agent"}`}</Text>
    </EnterpriseSurface>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logoSlot: {
    height: 34,
    width: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(79,140,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(79,140,255,0.09)",
  },
  logoText: {
    color: C.blue,
    fontSize: 11,
    fontWeight: "700",
  },
  planPill: {
    color: C.blue,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: "rgba(79,140,255,0.14)",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  title: {
    color: C.text,
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    color: C.textMuted,
    marginTop: 2,
    fontSize: 13,
  },
  support: {
    color: C.textFaint,
    marginTop: 10,
    fontSize: 12,
  },
});
