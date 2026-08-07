import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import EnterpriseSurface from "../../../../components/enterprise/EnterpriseSurface";
import LockedModuleCard from "../../../../components/lexus/locks/LockedModuleCard";
import StatusPill from "../../../../components/lexus/StatusPill";
import { C } from "../../../../components/lexus/theme";
import { useCallDetail } from "../../../../hooks/useCallDetail";
import { useCapabilities } from "../../../../hooks/useCapabilities";
import { useWorkspaceProfile } from "../../../../hooks/useWorkspaceProfile";
import { formatTime } from "../../../../lib/adapters/calls";

export default function EnterpriseContactDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const callId = typeof id === "string" ? decodeURIComponent(id) : "";

  const { detail, lead, transcript, isLoading, error } = useCallDetail(callId);
  const { can, upgradeLabel, premiumPlanLabel } = useCapabilities();
  const { vocabulary } = useWorkspaceProfile();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Detail</Text>
        </View>

        {isLoading && (
          <EnterpriseSurface padded={true}>
            <Text style={styles.meta}>Loading contact profile...</Text>
          </EnterpriseSurface>
        )}

        {!isLoading && error && (
          <EnterpriseSurface padded={true}>
            <Text style={styles.meta}>Failed to load contact profile: {error}</Text>
          </EnterpriseSurface>
        )}

        {!isLoading && !error && detail && (
          <>
            <EnterpriseSurface padded={true} style={{ marginBottom: 10 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.primary}>{lead?.fields.name || `Contact ${detail.callId.slice(0, 6)}`}</Text>
                <StatusPill label={detail.state} tone={detail.state === "failed" ? "danger" : detail.state === "completed" ? "success" : "info"} />
              </View>
              {/* Lead bucket prominently displayed */}
              <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                {detail.lead_bucket ? (
                  <StatusPill
                    label={detail.lead_bucket}
                    tone={
                      detail.lead_bucket === "Qualified"
                        ? "success"
                        : detail.lead_bucket === "Retry"
                        ? "warning"
                        : detail.lead_bucket === "Failed"
                        ? "danger"
                        : "neutral"
                    }
                  />
                ) : (
                  <StatusPill label="—" tone="neutral" />
                )}
                {detail.raw_call_outcome ? (
                  <StatusPill
                    label={detail.raw_call_outcome.length > 12 ? detail.raw_call_outcome.slice(0, 12) + "…" : detail.raw_call_outcome}
                    tone="neutral"
                    style={{ paddingHorizontal: 10 }}
                  />
                ) : null}
                {detail.raw_call_outcome && (
                  <Text
                    style={styles.meta}
                    onPress={() =>
                      Alert.alert(
                        "Raw Call Outcome",
                        `${detail.raw_call_outcome}${detail.raw_call_outcome_confidence ? `\nConfidence: ${detail.raw_call_outcome_confidence}` : ""}`
                      )
                    }
                  >
                    View raw outcome
                  </Text>
                )}
              </View>
              <Text style={styles.meta}>{`Phone: ${lead?.fields.phone || "-"}`}</Text>
              <Text style={styles.meta}>{`Campaign: ${detail.roomId}`}</Text>
              <Text style={styles.meta}>{`Last call: ${formatTime(detail.initiatedAt)}`}</Text>
              <Text style={styles.meta}>{`Turns: ${detail.transcriptTurns || 0}`}</Text>
            </EnterpriseSurface>

            <EnterpriseSurface padded={true} style={{ marginBottom: 10 }}>
              <Text style={styles.section}>Notes</Text>
              <Text style={styles.meta}>{lead?.fields.summary || "No extracted summary is available yet."}</Text>
            </EnterpriseSurface>

            <EnterpriseSurface padded={true} style={{ marginBottom: 10 }}>
              <Text style={styles.section}>{`${vocabulary.callsLabel} History`}</Text>
              <Text style={styles.meta}>{`Call ID ${detail.callId}`}</Text>
              <Text style={styles.meta}>{`Direction: ${detail.direction || "-"}`}</Text>
            </EnterpriseSurface>

            {!can("transcripts.full") ? (
              <LockedModuleCard
                title="Full Transcript"
                description={`Transcript review is available on ${premiumPlanLabel}.`}
                ctaLabel={upgradeLabel}
                onPress={() => router.push("/(protected)/enterprise/settings" as any)}
              />
            ) : (
              <EnterpriseSurface padded={true}>
                <Text style={styles.section}>Transcript</Text>
                {transcript.length === 0 ? (
                  <Text style={styles.meta}>No transcript records yet.</Text>
                ) : (
                  transcript.slice(0, 8).map((segment) => (
                    <View key={segment.id} style={styles.segment}>
                      <Text style={styles.segmentSpeaker}>{segment.speaker.toUpperCase()}</Text>
                      <Text style={styles.segmentText}>{segment.text}</Text>
                    </View>
                  ))
                )}
              </EnterpriseSurface>
            )}
          </>
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
  backIcon: { color: C.blue, fontSize: 24, marginTop: -2 },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: "700" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  primary: { color: C.text, fontSize: 16, fontWeight: "700" },
  section: { color: C.text, fontSize: 14, fontWeight: "700", marginBottom: 6 },
  meta: { color: C.textMuted, fontSize: 12, marginTop: 4 },
  segment: { marginTop: 8, borderTopWidth: 1, borderTopColor: "rgba(79,140,255,0.1)", paddingTop: 8 },
  segmentSpeaker: { color: C.blue, fontSize: 11, fontWeight: "700" },
  segmentText: { color: C.text, fontSize: 13, marginTop: 3 },
});
