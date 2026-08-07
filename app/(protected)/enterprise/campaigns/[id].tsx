import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import EnterpriseSurface from "../../../../components/enterprise/EnterpriseSurface";
import LiveStageStrip from "../../../../components/lexus/live/LiveStageStrip";
import PillButton from "../../../../components/lexus/PillButton";
import StatusPill from "../../../../components/lexus/StatusPill";
import { C } from "../../../../components/lexus/theme";
import { useCalls } from "../../../../hooks/useCalls";
import { useWorkspaceProfile } from "../../../../hooks/useWorkspaceProfile";
import { formatTime } from "../../../../lib/adapters/calls";

export default function EnterpriseCampaignDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaignId = typeof id === "string" ? decodeURIComponent(id) : "";
  const { calls, liveByCallId } = useCalls();
  const { vocabulary } = useWorkspaceProfile();

  const campaignCalls = useMemo(() => calls.filter((item) => item.roomId === campaignId), [calls, campaignId]);
  const completed = campaignCalls.filter((c) => c.state === "completed").length;
  const failed = campaignCalls.filter((c) => c.state === "failed").length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{`Campaign ${campaignId}`}</Text>
        </View>

        <EnterpriseSurface padded={true} style={{ marginBottom: 12 }}>
          <Text style={styles.meta}>{`${campaignCalls.length} ${vocabulary.callsLabel.toLowerCase()} in this campaign`}</Text>
          <Text style={styles.meta}>{`${completed} completed • ${failed} failed`}</Text>
          <Text style={styles.meta}>Performance, contacts and AI outcomes are computed from the same shared call pipeline.</Text>
        </EnterpriseSurface>

        <EnterpriseSurface padded={true} style={{ marginBottom: 12 }}>
          <Text style={styles.section}>Performance</Text>
          <Text style={styles.meta}>{`Conversion proxy: ${campaignCalls.length ? Math.round((completed / campaignCalls.length) * 100) : 0}%`}</Text>
          <Text style={styles.meta}>{`Need follow-up: ${Math.max(campaignCalls.length - completed - failed, 0)}`}</Text>
        </EnterpriseSurface>

        <Text style={styles.section}>Calls</Text>
        {campaignCalls.length === 0 ? (
          <EnterpriseSurface padded={true}>
            <Text style={styles.meta}>No calls found for this campaign yet.</Text>
          </EnterpriseSurface>
        ) : (
          campaignCalls.map((call) => (
            <EnterpriseSurface key={call.callId} padded={true} style={{ marginBottom: 10 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.callId}>{call.callId.slice(0, 12)}</Text>
                <StatusPill label={call.state} tone={call.state === "failed" ? "danger" : call.state === "completed" ? "success" : "info"} />
              </View>
              <Text style={styles.meta}>{formatTime(call.initiatedAt)}</Text>
              {liveByCallId[call.callId] && <LiveStageStrip snapshot={liveByCallId[call.callId]} />}
              <View style={{ marginTop: 8 }}>
                <PillButton title="Open Contact" variant="ghost" onPress={() => router.push(`/(protected)/enterprise/contacts/${encodeURIComponent(call.callId)}` as any)} />
              </View>
            </EnterpriseSurface>
          ))
        )}

        <View style={{ height: 70 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 10,
  },
  backText: { color: C.blue, fontSize: 24, marginTop: -2 },
  headerTitle: { color: C.text, fontWeight: "700", fontSize: 18 },
  section: { color: C.text, fontWeight: "700", fontSize: 15, marginBottom: 6 },
  meta: { color: C.textMuted, fontSize: 12, marginBottom: 4 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  callId: { color: C.text, fontWeight: "600", fontSize: 14 },
});
