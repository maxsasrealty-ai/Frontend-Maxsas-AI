import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import EnterpriseSurface from "../../../../components/enterprise/EnterpriseSurface";
import SectionHeader from "../../../../components/lexus/SectionHeader";
import StatusPill from "../../../../components/lexus/StatusPill";
import { C } from "../../../../components/lexus/theme";

const TEAM_PREVIEW = [
  { id: "tm-1", name: "Acquisition Team", activeAgents: 6, callsToday: 92 },
  { id: "tm-2", name: "Prime Inventory Team", activeAgents: 4, callsToday: 57 },
  { id: "tm-3", name: "Broker Follow-up Team", activeAgents: 8, callsToday: 118 },
];

export default function EnterpriseTeams() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Teams" subtitle="Agent groups and performance lanes" />

        {TEAM_PREVIEW.map((team) => (
          <EnterpriseSurface key={team.id} padded={true} style={{ marginBottom: 10 }}>
            <View style={styles.rowBetween}>
              <Text style={styles.name}>{team.name}</Text>
              <StatusPill label="Preview" tone="info" />
            </View>
            <Text style={styles.meta}>{`${team.activeAgents} active agents`}</Text>
            <Text style={styles.meta}>{`${team.callsToday} calls today`}</Text>
          </EnterpriseSurface>
        ))}

        <EnterpriseSurface padded={true}>
          <Text style={styles.name}>Enterprise team controls</Text>
          <Text style={styles.meta}>Team assignment, permissions and agent routing are intentionally deferred to admin provisioning phase.</Text>
        </EnterpriseSurface>

        <View style={{ height: 70 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: C.text, fontSize: 15, fontWeight: "700" },
  meta: { color: C.textMuted, fontSize: 12, marginTop: 5 },
});
