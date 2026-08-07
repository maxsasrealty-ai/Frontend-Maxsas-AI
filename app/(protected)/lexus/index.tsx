import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import { useGsapReveal } from "../../../components/lexus/animations";
import { InsightCharts } from "../../../components/lexus/charts";
import GlassCard from "../../../components/lexus/GlassCard";
import PillButton from "../../../components/lexus/PillButton";
import SectionHeader from "../../../components/lexus/SectionHeader";
import StatusPill from "../../../components/lexus/StatusPill";
import { LEXUS_FONTS, LexusIcon, LexusThemeColors } from "../../../components/lexus/theme";
import { useEarlyAccess } from "../../../context/EarlyAccessContext";
import { useLexusTheme } from "../../../context/LexusThemeContext";
import { useCalls } from "../../../hooks/useCalls";
import { useResponsive } from "../../../hooks/useResponsive";
import { formatBatchName, groupCallsByRoom } from "../../../lib/adapters/calls";
import { connectionLabel } from "../../../lib/adapters/liveEvents";
import { requestMicrophonePermission } from "../../../lib/compliance/androidPermissions";

export default function LexusHome() {
  const { colors, isDark, plan } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const s = useMemo(() => createStyles(colors, isDark, isDesktop, plan), [colors, isDark, isDesktop, plan]);
  const heroRef = useRef<View>(null);
  const cardRef = useRef<View>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoPhone, setDemoPhone] = useState("");

  useGsapReveal(heroRef, { y: 32, delay: 0.05 });
  useGsapReveal(cardRef, { y: 24, delay: 0.18 });

  const { calls, liveConnectionState, initiateCall } = useCalls();
  const { demoCallUsed, isDemoCallAvailable, markDemoCallUsed } = useEarlyAccess();

  const handleDemoLockedPress = () => {
    Alert.alert(
      demoCallUsed ? "Demo already used" : "Early access",
      demoCallUsed
        ? "You already used your one early-access demo call. Full features activate in July."
        : "We are in beta testing right now. Please wait until July for full access, or use the demo call once from this screen.",
      [{ text: "OK" }]
    );
  };

  const handleOpenDemoModal = () => {
    if (!isDemoCallAvailable) {
      handleDemoLockedPress();
      return;
    }

    setDemoModalOpen(true);
  };

  const handleStartDemoCall = async () => {
    if (!isDemoCallAvailable) {
      handleDemoLockedPress();
      return;
    }

    const digits = demoPhone.replace(/\D/g, "").slice(0, 10);
    if (digits.length !== 10) {
      Alert.alert("Enter mobile number", "Please enter a valid 10-digit mobile number to start the demo call.");
      return;
    }

    const microphoneGranted = await requestMicrophonePermission(
      "Enable microphone for demo call",
      "Maxsas AI needs microphone access to place the one-time demo call from this device.",
      "Without microphone access, the demo call cannot be started from this screen."
    );

    if (!microphoneGranted) {
      Alert.alert("Permission required", "Microphone access was denied, so the demo call was cancelled.");
      return;
    }

    const roomId = `demo-call-${Date.now()}`;
    const callId = await initiateCall({
      roomId,
      phoneNumber: `+91${digits}`,
      agentName: "maxsas-voice-agent-prod",
      direction: "outbound",
    });

    if (!callId) {
      Alert.alert("Demo call failed", "We could not start the demo call. Please try again once the backend is ready.");
      return;
    }

    await markDemoCallUsed();
    setDemoModalOpen(false);
    setDemoPhone("");
    router.push(`/(protected)/lexus/batches/${encodeURIComponent(roomId)}` as any);
  };

  const grouped = useMemo(() => {
    return groupCallsByRoom(calls)
      .map((room) => {
        const status =
          room.inProgress > 0
            ? "running"
            : room.completed > 0 && room.failed === 0
            ? "completed"
            : room.total === 0
            ? "draft"
            : "awaiting";

        return {
          id: room.roomId,
          label: formatBatchName(room.roomId),
          status,
          contacts: room.total,
          updatedAt: room.latestAt,
          running: room.inProgress,
          completed: room.completed,
          failed: room.failed,
          pending: Math.max(room.total - room.completed - room.failed, 0),
        };
      })
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [calls]);

  const runningBatches = grouped.filter((batch) => batch.status === "running").length;
  const completedBatches = grouped.filter((batch) => batch.status === "completed").length;
  const awaitingBatches = grouped.filter((batch) => batch.status === "awaiting" || batch.status === "draft").length;
  const failedBatches = grouped.reduce((sum, item) => sum + item.failed, 0);
  const liveMonitorTarget = useMemo(() => {
    const running = grouped.find((batch) => batch.status === "running");
    return running?.id || grouped[0]?.id || null;
  }, [grouped]);

  const trendData = useMemo(() => {
    const now = new Date();
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        value: 0,
      };
    });

    const bucketMap = new Map(buckets.map((item) => [item.key, item]));
    calls.forEach((call) => {
      const initiated = new Date(call.initiatedAt);
      const key = initiated.toISOString().slice(0, 10);
      const bucket = bucketMap.get(key);
      if (bucket) bucket.value += 1;
    });

    return buckets.map(({ label, value }) => ({ label, value }));
  }, [calls]);

  const outcomeData = useMemo(
    () => [
      { label: "Done", value: completedBatches },
      { label: "Run", value: runningBatches },
      { label: "Wait", value: awaitingBatches },
      { label: "Fail", value: failedBatches },
    ],
    [awaitingBatches, completedBatches, failedBatches, runningBatches]
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View ref={heroRef} style={s.heroWrap}>
          <View style={s.heroGlow} />
          <View style={s.heroTopRow}>
            <View style={s.avatarRing}>
              <View style={s.avatarInner}>
                <Image source={require("../../../assets/images/maxsas-logo.png")} style={s.avatarImage} resizeMode="contain" />
              </View>
            </View>
            <View style={s.heroTextStack}>
              <Text style={s.heroKicker}>AI COMMAND CENTER</Text>
              <Text style={s.heroTitle}>Maxsas AI</Text>
              <Text style={s.heroSubtitle}>Your AI lead strategist is ready.</Text>
              <View style={s.heroPillRow}>
                <StatusPill label={plan === "prestige" ? "Prestige" : "Lexus"} tone="info" />
                <StatusPill label="Live" tone="success" />
              </View>
            </View>
          </View>
          <View style={s.heroActions}>
            <PillButton
              title={demoCallUsed ? "Demo used" : "Start Demo"}
              style={s.heroPrimary}
              variant={demoCallUsed ? "ghost" : "primary"}
              onPress={handleOpenDemoModal}
            />
            <PillButton
              title="Live Monitor"
              variant="secondary"
              onPress={() => {
                if (liveMonitorTarget) {
                  router.push(`/(protected)/lexus/batches/${encodeURIComponent(liveMonitorTarget)}` as any);
                  return;
                }

                router.push("/(protected)/lexus/calls" as any);
              }}
            />
            <PillButton title="Wallet" variant="ghost" onPress={() => router.push("/(protected)/lexus/wallet" as any)} />
          </View>
        </View>

        <GlassCard style={s.liveCard} padded={false} variant="accent">
          <View style={s.liveRow}>
            <LexusIcon name="Radio" color={colors.green} size={16} />
            <Text style={s.liveText}>{connectionLabel(liveConnectionState)}</Text>
          </View>
        </GlassCard>

        <View ref={cardRef}>
          <SectionHeader title="Command Center" subtitle="Today" />

          <GlassCard style={s.ctaCard} padded={false} variant="elevated">
            <View style={s.ctaIcon}>
              <LexusIcon name="Mic2" color={colors.blue} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>Try AI Demo Call</Text>
              <Text style={s.ctaSubtitle}>{demoCallUsed ? "Your one demo call was already used." : "Experience how it works in seconds"}</Text>
            </View>
            <PillButton
              title={demoCallUsed ? "Locked" : "Start"}
              style={s.ctaButton}
              variant={demoCallUsed ? "ghost" : "primary"}
              onPress={handleOpenDemoModal}
            />
          </GlassCard>

          <SectionHeader title="Live Activity" subtitle="Rolling status across batches" />
          <View style={s.gridRow}>
            <StatTile styles={s} label="In Progress" icon="PhoneCall" value={runningBatches} />
            <StatTile styles={s} label="Pending" icon="Clock" value={awaitingBatches} />
          </View>
          <View style={s.gridRow}>
            <StatTile styles={s} label="Completed" icon="CheckCircle2" value={completedBatches} />
            <StatTile styles={s} label="Failed" icon="XCircle" value={failedBatches} />
          </View>

          <SectionHeader title="Insights" subtitle="Momentum and outcomes" />
          <InsightCharts areaData={trendData} barData={outcomeData} />

          <SectionHeader title="Wallet Overview" subtitle="Track your AI spend" />
          <GlassCard style={s.walletCard} variant="accent">
            <View style={s.walletTop}>
              <Text style={s.walletTitle}>AI Wallet Balance</Text>
              <StatusPill label="Live" tone="success" />
            </View>
            <Text style={s.walletValue}>₹{(calls.length * 1060.27).toLocaleString("en-IN", { maximumFractionDigits: 1 })}</Text>
            <Text style={s.walletMeta}>Total: ₹{(calls.length * 1060.27).toLocaleString("en-IN", { maximumFractionDigits: 1 })}    Locked: ₹0</Text>
            <View style={s.walletActions}>
              <PillButton title="Recharge" variant="secondary" style={s.rechargeButton} onPress={() => router.push("/(protected)/lexus/wallet" as any)} />
              <TouchableOpacity onPress={() => router.push("/(protected)/lexus/wallet" as any)}>
                <Text style={s.walletLink}>View Details</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <Modal animationType="fade" transparent visible={demoModalOpen} onRequestClose={() => setDemoModalOpen(false)}>
        <View style={s.modalBackdrop}>
          <GlassCard style={s.modalSheet} padded={false} variant="elevated">
            <View style={s.modalHeader}>
              <View style={s.modalIconWrap}>
                <LexusIcon name="PhoneCall" color={colors.blue} size={20} />
              </View>
              <Text style={s.modalTitle}>One-time demo call</Text>
              <Text style={s.modalSubtitle}>
                {isDemoCallAvailable
                  ? "Enter a mobile number to place your single early-access demo call."
                  : "You already used the demo access. Full features activate in July."}
              </Text>
            </View>

            <View style={s.modalFieldGroup}>
              <Text style={s.modalLabel}>Mobile Number</Text>
              <TextInput
                style={s.modalInput}
                value={demoPhone}
                onChangeText={(value) => setDemoPhone(value.replace(/\D/g, "").slice(0, 10))}
                keyboardType="phone-pad"
                placeholder="9876543210"
                placeholderTextColor={colors.textFaint}
                maxLength={10}
              />
            </View>

            <View style={s.modalActions}>
              <PillButton title="Cancel" variant="ghost" style={s.modalButton} onPress={() => setDemoModalOpen(false)} />
              <PillButton title="Start Call" style={s.modalButton} onPress={handleStartDemoCall} />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatTile({
  styles,
  label,
  icon,
  value,
  compact = false,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  icon: Parameters<typeof LexusIcon>[0]["name"];
  value: number;
  compact?: boolean;
}) {
  const { colors } = useLexusTheme();

  return (
    <GlassCard style={[styles.statTile, compact && styles.statTileCompact]} padded={false} variant="elevated">
      <View style={styles.statIconWrap}>
        <LexusIcon name={icon} color={colors.blue} size={18} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function createStyles(colors: LexusThemeColors, isDark: boolean, isDesktop: boolean, plan: string) {
  const isPrestige = plan === "prestige";
  const scale = isDesktop ? 0.88 : 1;
  const px = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: px(16), paddingTop: px(18), paddingBottom: px(32) },
    heroWrap: { marginBottom: px(16) },
    heroGlow: {
      position: "absolute",
      top: px(-40),
      right: px(-40),
      width: px(200),
      height: px(200),
      borderRadius: px(100),
      backgroundColor: isDark ? "rgba(107,91,255,0.12)" : "rgba(107,91,255,0.08)",
    },
    heroTopRow: { flexDirection: isDesktop ? "row" : "column", alignItems: "center", gap: px(18) },
    heroTextStack: { flex: 1, alignItems: isDesktop ? "flex-start" : "center" },
    heroKicker: {
      color: colors.textFaint,
      fontSize: px(11),
      fontFamily: LEXUS_FONTS.bodySemiBold,
      letterSpacing: 1.2,
      marginBottom: px(6),
    },
    heroTitle: {
      color: colors.text,
      fontSize: px(32),
      fontFamily: LEXUS_FONTS.display,
      marginBottom: px(4),
      textAlign: isDesktop ? "left" : "center",
    },
    heroSubtitle: {
      color: colors.textMuted,
      fontSize: px(14),
      fontFamily: LEXUS_FONTS.body,
      textAlign: isDesktop ? "left" : "center",
      marginBottom: px(10),
    },
    heroPillRow: { flexDirection: "row", gap: px(8), flexWrap: "wrap" },
    heroActions: { flexDirection: isDesktop ? "row" : "column", gap: px(10), marginTop: px(12) },
    heroPrimary: {
      minWidth: px(160),
    },
    avatarRing: {
      width: px(110),
      height: px(110),
      borderRadius: px(55),
      backgroundColor: isPrestige ? (isDark ? "rgba(216, 180, 254, 0.15)" : "rgba(216, 180, 254, 0.5)") : (isDark ? "rgba(245,236,210,0.12)" : "rgba(245,236,210,0.7)"),
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInner: {
      width: px(78),
      height: px(78),
      borderRadius: px(39),
      backgroundColor: 'transparent',
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#ffffff", fontSize: px(34), fontFamily: LEXUS_FONTS.display },
    avatarImage: {
      width: px(60),
      height: px(60),
      borderRadius: px(30),
    },
    liveCard: {
      marginBottom: px(14),
      minHeight: px(44),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(0,208,132,0.12)" : "rgba(0,208,132,0.14)",
      borderColor: isDark ? "rgba(0,208,132,0.24)" : "rgba(0,168,107,0.2)",
    },
    liveRow: { flexDirection: "row", alignItems: "center", gap: px(8) },
    liveText: { color: colors.green, fontSize: px(13), fontFamily: LEXUS_FONTS.bodyMedium },
    ctaCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: px(14),
      paddingHorizontal: px(12),
      marginBottom: px(16),
      borderColor: colors.border,
      backgroundColor: isDark ? colors.bgElevated : colors.bgCard,
    },
    ctaIcon: {
      width: px(36),
      height: px(36),
      borderRadius: px(18),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blueSoft,
      marginRight: px(10),
    },
    ctaTitle: { color: colors.text, fontSize: px(16), fontFamily: LEXUS_FONTS.bodySemiBold },
    ctaSubtitle: { color: colors.textMuted, fontSize: px(12), marginTop: px(2), fontFamily: LEXUS_FONTS.body },
    ctaButton: { height: px(38), paddingHorizontal: px(16) },
    gridRow: { flexDirection: "row", gap: px(12), marginBottom: px(12) },
    statTile: {
      flex: 1,
      minHeight: px(110),
      borderRadius: px(14),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: px(8),
    },
    statTileCompact: {
      minHeight: px(96),
    },
    statIconWrap: {
      width: px(32),
      height: px(32),
      borderRadius: px(16),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blueSoft,
      marginBottom: px(6),
    },
    statValue: { color: colors.text, fontSize: px(30), fontFamily: LEXUS_FONTS.displayMedium, marginBottom: px(2) },
    statLabel: { color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.bodyMedium },
    walletCard: {
      marginBottom: px(16),
      backgroundColor: isPrestige ? (isDark ? "#060f22" : colors.blue) : "#0d1f53",
      borderColor: isPrestige ? (isDark ? colors.purple : "transparent") : "rgba(255,255,255,0.12)",
    },
    walletTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: px(10) },
    walletTitle: { color: "#ffffff", fontSize: px(18), fontFamily: LEXUS_FONTS.bodySemiBold },
    walletValue: { color: "#ffffff", fontSize: px(40), fontFamily: LEXUS_FONTS.display },
    walletMeta: { color: "rgba(255,255,255,0.72)", fontSize: px(12), marginBottom: px(14), fontFamily: LEXUS_FONTS.body },
    walletActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rechargeButton: {
      minWidth: px(126),
      backgroundColor: "rgba(255,255,255,0.92)",
      borderColor: "rgba(255,255,255,0.92)",
    },
    walletLink: { color: "#ffffff", fontSize: px(14), fontFamily: LEXUS_FONTS.bodySemiBold },
    modalBackdrop: {
      flex: 1,
      backgroundColor: isDark ? "rgba(4,12,24,0.76)" : "rgba(13,31,56,0.6)",
      justifyContent: "center",
      paddingHorizontal: px(20),
    },
    modalSheet: {
      padding: px(20),
      borderRadius: px(24),
      borderColor: colors.borderStrong,
    },
    modalHeader: {
      alignItems: "center",
      marginBottom: px(16),
    },
    modalIconWrap: {
      width: px(52),
      height: px(52),
      borderRadius: px(26),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.blueSoft,
      marginBottom: px(12),
    },
    modalTitle: {
      color: colors.text,
      fontSize: px(20),
      fontFamily: LEXUS_FONTS.displayMedium,
      textAlign: "center",
      marginBottom: px(6),
    },
    modalSubtitle: {
      color: colors.textMuted,
      fontSize: px(13),
      fontFamily: LEXUS_FONTS.body,
      textAlign: "center",
      lineHeight: px(20),
    },
    modalFieldGroup: {
      marginBottom: px(16),
    },
    modalLabel: {
      color: colors.textMuted,
      fontFamily: LEXUS_FONTS.bodySemiBold,
      marginBottom: px(8),
      fontSize: px(12),
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    modalInput: {
      height: px(50),
      borderRadius: px(16),
      borderWidth: 1,
      borderColor: colors.borderStrong,
      backgroundColor: isDark ? "rgba(13,31,56,0.85)" : colors.bgElevated,
      color: colors.text,
      paddingHorizontal: px(14),
      fontSize: px(15),
      fontFamily: LEXUS_FONTS.body,
    },
    modalActions: {
      flexDirection: "row",
      gap: px(10),
    },
    modalButton: {
      flex: 1,
    },
  });
}
