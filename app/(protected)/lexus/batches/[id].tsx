import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import GlassCard from "../../../../components/lexus/GlassCard";
import PillButton from "../../../../components/lexus/PillButton";
import SectionHeader from "../../../../components/lexus/SectionHeader";
import StatusPill from "../../../../components/lexus/StatusPill";
import { LEXUS_FONTS, LexusIcon, LexusThemeColors } from "../../../../components/lexus/theme";
import { useLexusTheme } from "../../../../context/LexusThemeContext";
import { useCallDetail } from "../../../../hooks/useCallDetail";
import { useCalls } from "../../../../hooks/useCalls";
import { useCapabilities } from "../../../../hooks/useCapabilities";
import { useResponsive } from "../../../../hooks/useResponsive";
import { formatBatchName, formatTime } from "../../../../lib/adapters/calls";

const CONTACT_TABS = [
  { key: "pending", label: "Show Pending" },
  { key: "completed", label: "Show Completed" },
  { key: "failed", label: "Show Failed" },
] as const;

export default function LexusBatchDetail() {
  const { colors, isDark, plan } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const s = useMemo(() => createStyles(colors, isDark, isDesktop, plan), [colors, isDark, isDesktop, plan]);
  const bottomSpacer = isDesktop ? 112 : 72;

  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = typeof id === "string" ? decodeURIComponent(id) : "";
  const batchLabel = formatBatchName(roomId);

  const { calls, isLoading, isBootstrapping, error } = useCalls();
  const { can } = useCapabilities();
  const [tab, setTab] = useState<(typeof CONTACT_TABS)[number]["key"]>("pending");

  const batchCalls = useMemo(() => calls.filter((item) => item.roomId === roomId), [calls, roomId]);

  const batch = useMemo(() => {
    const completed = batchCalls.filter((item) => item.state === "completed").length;
    const failed = batchCalls.filter((item) => item.state === "failed").length;
    const pending = Math.max(batchCalls.length - completed - failed, 0);
    const progress = batchCalls.length ? Math.round((completed / batchCalls.length) * 100) : 0;

    const finished = completed + failed;

    return {
      id: roomId,
      // consider the batch finished when all contacts have reached a terminal state (completed or failed)
      status: batchCalls.length > 0 && finished === batchCalls.length ? "completed" : "running",
      createdAt: formatTime(batchCalls[0]?.initiatedAt),
      totalContacts: batchCalls.length,
      completed,
      pending,
      failed,
      progress,
      contacts: batchCalls,
    };
  }, [batchCalls, roomId]);

  const contacts = useMemo(() => {
    if (tab === "completed") {
      return batch.contacts.filter((item) => item.state === "completed");
    }
    if (tab === "failed") {
      return batch.contacts.filter((item) => item.state === "failed");
    }
    return batch.contacts.filter((item) => item.state !== "completed" && item.state !== "failed");
  }, [batch.contacts, tab]);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Live Monitor" subtitle="Real-time call progress" style={{ marginTop: 18 }} />

        {!can("calls.history") && (
          <GlassCard style={s.upgradeCard} padded={true} variant="elevated">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <LexusIcon name="Lock" color={colors.amber} size={18} />
              <Text style={s.upgradeText}>Batch insights are unavailable on your current plan.</Text>
            </View>
          </GlassCard>
        )}

        {can("calls.history") && (isLoading || isBootstrapping) && (
          <GlassCard style={s.loadingCard} padded={true} variant="elevated">
            <LexusIcon name="Loader" color={colors.textMuted} size={20} />
            <Text style={[s.emptyText, { marginTop: 10 }]}>Loading batch details...</Text>
          </GlassCard>
        )}

        {can("calls.history") && !isLoading && !isBootstrapping && error && (
          <GlassCard style={s.errorCard} padded={true} variant="elevated">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <LexusIcon name="AlertCircle" color={colors.red} size={18} />
              <Text style={[s.errorText, { flex: 1 }]}>Failed to load batch details</Text>
            </View>
          </GlassCard>
        )}

        {can("calls.history") && !isLoading && !isBootstrapping && !error && (
          <>
            <GlassCard style={s.heroCard} padded={true} variant="accent">
              <View style={s.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroLabel}>{batchLabel}</Text>
                  <Text style={s.heroStatus}>{batch.status === "completed" ? "✅ Completed" : "📞 In Progress"}</Text>
                </View>
                <StatusPill label={batch.status === "completed" ? "Done" : "Live"} tone={batch.status === "completed" ? "success" : "info"} />
              </View>
              <View style={s.heroDetail}>
                <View style={s.detailItem}>
                  <LexusIcon name="Users" color={colors.blue} size={14} />
                  <Text style={s.detailLabel}>{batch.totalContacts} contacts</Text>
                </View>
                <View style={s.detailItem}>
                  <LexusIcon name="Calendar" color={colors.textMuted} size={14} />
                  <Text style={s.detailLabel}>{batch.createdAt}</Text>
                </View>
              </View>
            </GlassCard>

            <SectionHeader title="Progress" />
            <GlassCard style={s.progressCard} padded={true} variant="elevated">
              <View style={s.progressHeader}>
                <Text style={s.progressLabel}>Completion</Text>
                <Text style={s.progressPercent}>{batch.progress}%</Text>
              </View>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${batch.progress}%` }]} />
              </View>
              <View style={s.progressStats}>
                <View style={s.progressStat}>
                  <LexusIcon name="CheckCircle2" color={colors.green} size={14} />
                  <Text style={s.progressStatText}>{batch.completed} completed</Text>
                </View>
                <View style={s.progressStat}>
                  <LexusIcon name="Clock" color={colors.amber} size={14} />
                  <Text style={s.progressStatText}>{batch.pending} pending</Text>
                </View>
                {batch.failed > 0 && (
                  <View style={s.progressStat}>
                    <LexusIcon name="X" color={colors.red} size={14} />
                    <Text style={s.progressStatText}>{batch.failed} failed</Text>
                  </View>
                )}
              </View>
            </GlassCard>

            <View style={s.statsRow}>
              <StatCard styles={s} icon="PhoneCall" label="Total" value={batch.totalContacts} />
              <StatCard styles={s} icon="CheckCircle2" label="Done" value={batch.completed} />
              <StatCard styles={s} icon="Clock" label="Wait" value={batch.pending} />
            </View>

            {batch.status === "completed" && (
              <PillButton
                title="View Results & Analytics"
                onPress={() => router.push(`/(protected)/lexus/completed/${encodeURIComponent(roomId)}` as any)}
                style={s.resultsButton}
              />
            )}

            <View style={s.contactsHeader}>
              <SectionHeader title={`${batch.totalContacts} Live Contact(s)`} subtitle="Track each contact in this batch" />
            </View>
            <View style={s.filterRow}>
              {CONTACT_TABS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[s.filterPill, tab === item.key && s.filterPillActive]}
                  onPress={() => setTab(item.key)}
                >
                  <Text style={[s.filterPillText, tab === item.key && s.filterPillTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {contacts.length === 0 ? (
              <GlassCard style={s.emptyCard} padded={true} variant="elevated">
                <LexusIcon name="Inbox" color={colors.textMuted} size={20} />
                <Text style={[s.emptyText, { marginTop: 10 }]}>No contacts in this state</Text>
              </GlassCard>
            ) : (
              contacts.map((call, index) => <LiveContactCard key={call.callId} call={call} index={index} styles={s} colors={colors} isDark={isDark} />)
            )}
          </>
        )}

        <View style={{ height: bottomSpacer }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  styles,
  icon,
  label,
  value,
}: {
  styles: ReturnType<typeof createStyles>;
  icon: any;
  label: string;
  value: number;
}) {
  const { colors } = useLexusTheme();
  return (
    <GlassCard style={styles.statCard} padded={false} variant="elevated">
      <View style={styles.statIconWrap}>
        <LexusIcon name={icon} color={colors.blue} size={16} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function LiveContactCard({
  call,
  index,
  styles,
  colors,
  isDark,
}: {
  call: any;
  index: number;
  styles: ReturnType<typeof createStyles>;
  colors: LexusThemeColors;
  isDark: boolean;
}) {
  const { detail, lead } = useCallDetail(call.callId);
  const mobile = lead?.fields?.phone || detail?.phoneNumber || "-";
  const stateIcon = call.state === "completed" ? "CheckCircle2" : call.state === "failed" ? "XCircle" : "Phone";

  return (
    <GlassCard style={styles.contactCard} padded={true} variant="elevated">
      <View style={styles.contactTopRow}>
        <View style={styles.contactIndexWrap}>
          <Text style={styles.contactIndexText}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactTitle}>{call.callId.slice(0, 12)}</Text>
          <Text style={styles.contactPhone}>{mobile}</Text>
        </View>
        <View style={{ gap: 8 }}>
          <LexusIcon name={stateIcon} color={call.state === "completed" ? colors.green : call.state === "failed" ? colors.red : colors.blue} size={18} />
        </View>
      </View>
      <View style={styles.contactMeta}>
        <Text style={styles.contactMetaText}>Updated {formatTime(call.initiatedAt)} • Retry: {index + 1}/3</Text>
      </View>
    </GlassCard>
  );
}

function createStyles(colors: LexusThemeColors, isDark: boolean, isDesktop: boolean, plan: string) {
  const isPrestige = plan === "prestige";
  const scale = isDesktop ? 0.88 : 1;
  const px = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: px(16), paddingBottom: px(32), paddingTop: px(18) },
    upgradeCard: {
      marginBottom: px(16),
      backgroundColor: isDark ? "rgba(245,166,35,0.08)" : "rgba(245,166,35,0.1)",
      borderColor: isDark ? "rgba(245,166,35,0.2)" : "rgba(245,166,35,0.2)",
    },
    upgradeText: { color: colors.amber, fontSize: px(13), fontFamily: LEXUS_FONTS.body, flex: 1 },
    loadingCard: { alignItems: "center", justifyContent: "center", paddingVertical: px(24), marginBottom: px(16) },
    errorCard: {
      marginBottom: px(16),
      backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.1)",
      borderColor: isDark ? "rgba(239,68,68,0.24)" : "rgba(239,68,68,0.2)",
    },
    errorText: { color: colors.red, fontSize: px(13), fontFamily: LEXUS_FONTS.body },
    emptyText: { color: colors.textMuted, fontSize: px(13), fontFamily: LEXUS_FONTS.body, textAlign: "center" },
    emptyCard: { alignItems: "center", justifyContent: "center", paddingVertical: px(32), marginBottom: px(16) },
    heroCard: {
      marginBottom: px(16),
      backgroundColor: isPrestige
        ? isDark
          ? "rgba(216,180,254,0.08)"
          : "rgba(216,180,254,0.12)"
        : isDark
        ? "#060f22"
        : "#0d1f53",
      borderColor: isPrestige ? isDark ? "rgba(216,180,254,0.2)" : "transparent" : "rgba(255,255,255,0.12)",
    },
    heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: px(12) },
    heroLabel: { color: isPrestige ? colors.purple : "#ffffff", fontSize: px(18), fontFamily: LEXUS_FONTS.displayMedium },
    heroStatus: { color: "rgba(255,255,255,0.7)", fontSize: px(12), fontFamily: LEXUS_FONTS.body, marginTop: px(4) },
    heroDetail: { flexDirection: "row", gap: px(14) },
    detailItem: { flexDirection: "row", alignItems: "center", gap: px(6) },
    detailLabel: { color: "rgba(255,255,255,0.7)", fontSize: px(11), fontFamily: LEXUS_FONTS.body },
    progressCard: { marginBottom: px(16) },
    progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: px(10) },
    progressLabel: { color: colors.textMuted, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
    progressPercent: { color: isPrestige ? colors.purple : colors.green, fontSize: px(18), fontFamily: LEXUS_FONTS.displayMedium },
    progressTrack: { height: px(8), borderRadius: px(4), backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(16,33,61,0.12)", overflow: "hidden", marginBottom: px(12) },
    progressFill: { height: px(8), borderRadius: px(4), backgroundColor: isPrestige ? colors.purple : colors.green },
    progressStats: { flexDirection: "row", gap: px(12) },
    progressStat: { flexDirection: "row", alignItems: "center", gap: px(6) },
    progressStatText: { color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.body },
    statsRow: { flexDirection: "row", gap: px(10), marginBottom: px(16) },
    statCard: { flex: 1, minHeight: px(100), alignItems: "center", justifyContent: "center" },
    statIconWrap: {
      width: px(32),
      height: px(32),
      borderRadius: px(16),
      backgroundColor: colors.blueSoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: px(6),
    },
    statValue: { color: colors.text, fontSize: px(18), fontFamily: LEXUS_FONTS.displayMedium, marginBottom: px(2) },
    statLabel: { color: colors.textMuted, fontSize: px(11), fontFamily: LEXUS_FONTS.body, textAlign: "center" },
    resultsButton: { marginBottom: px(16) },
    contactsHeader: { marginBottom: px(12) },
    filterRow: { flexDirection: "row", gap: px(8), marginBottom: px(14) },
    filterPill: {
      paddingHorizontal: px(12),
      height: px(34),
      borderRadius: px(17),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: isDark ? "rgba(148,163,184,0.2)" : "rgba(148,163,184,0.14)",
      backgroundColor: isDark ? "rgba(13,31,56,0.5)" : "rgba(79,140,255,0.08)",
    },
    filterPillActive: {
      backgroundColor: isPrestige ? colors.purple : colors.blue,
      borderColor: isPrestige ? colors.purple : colors.blue,
    },
    filterPillText: { color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    filterPillTextActive: { color: "#ffffff", fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    contactCard: { marginBottom: px(10), borderRadius: px(14) },
    contactTopRow: { flexDirection: "row", alignItems: "center", gap: px(10), marginBottom: px(8) },
    contactIndexWrap: {
      width: px(28),
      height: px(28),
      borderRadius: px(14),
      backgroundColor: colors.blue,
      alignItems: "center",
      justifyContent: "center",
    },
    contactIndexText: { color: "#ffffff", fontSize: px(12), fontFamily: LEXUS_FONTS.bodySemiBold },
    contactTitle: { color: colors.text, fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
    contactPhone: { color: colors.textMuted, fontSize: px(11), fontFamily: LEXUS_FONTS.body, marginTop: px(2) },
    contactMeta: { paddingTop: px(8), borderTopWidth: 1, borderTopColor: isDark ? "rgba(148,163,184,0.14)" : "rgba(16,33,61,0.1)" },
    contactMetaText: { color: colors.textFaint, fontSize: px(11), fontFamily: LEXUS_FONTS.body },
  });
}
