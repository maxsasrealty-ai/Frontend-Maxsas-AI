import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import GlassCard from "../../../../components/lexus/GlassCard";
import StatusPill from "../../../../components/lexus/StatusPill";
import { LEXUS_FONTS, LexusIcon, LexusThemeColors } from "../../../../components/lexus/theme";
import { useLexusTheme } from "../../../../context/LexusThemeContext";
import { useCallDetail } from "../../../../hooks/useCallDetail";
import { useCapabilities } from "../../../../hooks/useCapabilities";
import { useResponsive } from "../../../../hooks/useResponsive";
import { formatTime, statusTone } from "../../../../lib/adapters/calls";

export default function LexusLeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const callId = typeof id === "string" ? decodeURIComponent(id) : "";
  const { colors, isDark, plan } = useLexusTheme();
  const { isDesktop } = useResponsive();
  const s = useMemo(() => createCallDetailStyles(colors, isDark, isDesktop, plan), [colors, isDark, isDesktop, plan]);

  const { detail, lead, transcript, isLoading, error } = useCallDetail(callId);
  const { can, upgradeLabel, premiumPlanLabel } = useCapabilities();

  const renderExtractedField = (label: string, value: string | undefined | null) => {
    const isUnknown = !value || value.trim().toLowerCase() === "unknown" || value.trim().toLowerCase() === "n/a" || value.trim() === "";
    
    return (
      <View key={label} style={[s.extractedField, !isUnknown && s.extractedFieldHighlight]}>
        <Text style={s.extractedFieldLabel}>{label}</Text>
        <Text style={[
          s.extractedFieldValue, 
          isUnknown && s.extractedFieldValueUnknown,
          !isUnknown && s.extractedFieldValueHighlight
        ]}>
          {isUnknown ? "Not Captured" : value}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <LinearGradient colors={[colors.bg, "#0B1526"]} style={StyleSheet.absoluteFillObject} />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <LexusIcon name="ChevronLeft" color={colors.blue} size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Lead Details</Text>
            <Text style={s.headerSubtitle}>ID: {callId.slice(0, 8)}...</Text>
          </View>
        </View>

        {isLoading && (
          <GlassCard padded style={s.centered} variant="elevated">
            <ActivityIndicator color={colors.blue} style={{ marginBottom: 10 }} />
            <Text style={s.meta}>Analyzing lead data...</Text>
          </GlassCard>
        )}

        {!isLoading && error && (
          <GlassCard padded style={[s.centered, s.errorCard]} variant="elevated">
            <LexusIcon name="AlertCircle" color={colors.red} size={20} />
            <Text style={[s.errorText, { marginTop: 10 }]}>Failed to load lead profile</Text>
          </GlassCard>
        )}

        {!isLoading && !error && detail && (
          <View style={s.content}>
            {/* Caller Profile Card */}
            <GlassCard padded variant="elevated" style={s.card}>
              <View style={s.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={s.primaryText}>{lead?.fields.name || `Lead ${detail.callId.slice(0, 6)}`}</Text>
                  <View style={s.pillRow}>
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
                      <StatusPill label="Uncategorized" tone="neutral" />
                    )}
                  </View>
                </View>
                <StatusPill label={detail.state} tone={statusTone(detail.state)} />
              </View>

              <View style={s.divider} />
              
              <View style={s.infoGrid}>
                <View style={s.infoItem}>
                  <View style={s.infoIconWrap}>
                    <LexusIcon name="Phone" color={colors.blue} size={14} />
                  </View>
                  <Text style={s.infoLabel}>Phone</Text>
                  <Text style={s.infoValue}>{lead?.fields.phone || detail.roomId || "-"}</Text>
                </View>
                <View style={s.infoItem}>
                  <View style={s.infoIconWrap}>
                    <LexusIcon name="Calendar" color={colors.blue} size={14} />
                  </View>
                  <Text style={s.infoLabel}>Date</Text>
                  <Text style={s.infoValue}>{formatTime(detail.initiatedAt)}</Text>
                </View>
                <View style={s.infoItem}>
                  <View style={s.infoIconWrap}>
                    <LexusIcon name="Radio" color={colors.blue} size={14} />
                  </View>
                  <Text style={s.infoLabel}>Direction</Text>
                  <Text style={s.infoValue}>{detail.direction?.toUpperCase() || "-"}</Text>
                </View>
                <View style={s.infoItem}>
                  <View style={s.infoIconWrap}>
                    <LexusIcon name="MessageCircle" color={colors.blue} size={14} />
                  </View>
                  <Text style={s.infoLabel}>Turns</Text>
                  <Text style={s.infoValue}>{detail.transcriptTurns || 0}</Text>
                </View>
              </View>
            </GlassCard>

            {/* AI Summary & Lead Data Card */}
            <GlassCard padded variant="elevated" style={s.card}>
              <View style={s.sectionHeaderRow}>
                <View style={s.glowDot} />
                <Text style={s.sectionTitle}>Extracted Data</Text>
              </View>

              <View style={s.extractedFieldsContainer}>
                {renderExtractedField("Property Type", lead?.fields?.propertyType || lead?.raw_data?.property_type)}
                {renderExtractedField("Location", lead?.fields?.preferredLocation || lead?.raw_data?.preferred_location)}
                {renderExtractedField("Budget", lead?.fields?.budgetRange || lead?.raw_data?.budget_range)}
                {renderExtractedField("Timeline", lead?.fields?.timeline || lead?.raw_data?.purchase_timeline)}
                {lead?.confidence !== undefined && lead?.confidence !== null && renderExtractedField("Confidence", typeof lead.confidence === "number" ? `${Math.round(lead.confidence * 100)}%` : JSON.stringify(lead.confidence))}
                {lead?.fields && Object.entries(lead.fields).map(([k, v]) => {
                  if (!["name", "phone", "summary", "propertyType", "preferredLocation", "budgetRange", "timeline"].includes(k) && typeof v === "string" && v.trim() !== "") {
                    return renderExtractedField(k.replace(/_/g, " "), v);
                  }
                  return null;
                })}
              </View>

              {(lead?.fields?.summary || lead?.raw_data?.transcript_summary) ? (
                <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
                  <Text style={s.infoLabel}>AI Summary</Text>
                  <Text style={s.summaryText}>{lead?.fields?.summary || lead?.raw_data?.transcript_summary}</Text>
                </View>
              ) : null}
            </GlassCard>

            {/* Full Transcript Card */}
            <GlassCard padded variant="elevated" style={[s.card, { overflow: 'hidden' }]}>
              <View style={s.sectionHeaderRow}>
                <View style={[s.glowDot, { backgroundColor: colors.green }]} />
                <Text style={s.sectionTitle}>
                  Transcript {!can("transcripts.full") && <Text style={{ color: colors.amber, fontSize: 12 }}> (Limited)</Text>}
                </Text>
              </View>
              
              <View style={s.transcriptContainer}>
                {transcript.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 24 }}>
                    <LexusIcon name="MessageCircle" color={colors.textMuted} size={20} />
                    <Text style={[s.meta, { marginTop: 10 }]}>No transcript available</Text>
                  </View>
                ) : (
                  (!can("transcripts.full") ? transcript.slice(0, 4) : transcript).map((segment, index) => {
                    const isAgent = segment.speaker.toLowerCase() === "agent";
                    return (
                      <View key={segment.id || index} style={[s.bubbleWrapper, isAgent ? s.bubbleRight : s.bubbleLeft]}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          {!isAgent && <LexusIcon name="User" color={colors.textFaint} size={12} />}
                          {isAgent && <LexusIcon name="Zap" color={colors.blue} size={12} />}
                          <Text style={s.speakerName}>{isAgent ? "Lexus AI" : "Client"}</Text>
                        </View>
                        <View style={[s.bubble, isAgent ? s.bubbleAgent : s.bubbleUser]}>
                          <Text style={s.bubbleText}>{segment.text}</Text>
                        </View>
                      </View>
                    );
                  })
                )}

                {!can("transcripts.full") && transcript.length > 0 && (
                  <View style={s.premiumOverlay}>
                    <LinearGradient
                      colors={['transparent', 'rgba(11, 21, 38, 0.95)', 'rgba(11, 21, 38, 1)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={s.premiumOverlayContent}>
                      <LexusIcon name="Lock" color={colors.amber} size={24} />
                      <Text style={s.premiumOverlayTitle}>Unlock Full Transcript</Text>
                      <Text style={s.premiumOverlayDesc}>Read the complete conversation by upgrading to {premiumPlanLabel}.</Text>
                      <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push("/(protected)/lexus/settings" as any)}>
                        <Text style={s.upgradeBtnText}>{upgradeLabel}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createCallDetailStyles(colors: LexusThemeColors, isDark: boolean, isDesktop: boolean, plan: string) {
  const isPrestige = plan === "prestige";
  const scale = isDesktop ? 0.88 : 1;
  const px = (value: number) => Math.round(value * scale);

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: px(16), paddingTop: px(16), paddingBottom: px(40) },
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: px(24), paddingHorizontal: px(4) },
    backBtn: {
      width: px(40),
      height: px(40),
      borderRadius: px(20),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(79, 140, 255, 0.1)" : "rgba(79, 140, 255, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(79, 140, 255, 0.2)",
      marginRight: px(16),
    },
    headerTitle: { color: colors.text, fontSize: px(22), fontFamily: LEXUS_FONTS.displayMedium, letterSpacing: 0.5 },
    headerSubtitle: { color: colors.textMuted, fontSize: px(13), marginTop: px(2), fontFamily: LEXUS_FONTS.body },
    centered: { alignItems: "center", justifyContent: "center", paddingVertical: px(40) },
    errorCard: { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.1)", borderColor: isDark ? "rgba(239,68,68,0.24)" : "rgba(239,68,68,0.2)" },
    errorText: { color: colors.red, fontSize: px(14), fontFamily: LEXUS_FONTS.body, textAlign: "center" },
    content: { gap: px(16) },
    card: { borderRadius: px(14) },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: px(12) },
    primaryText: { color: "#FFFFFF", fontSize: px(20), fontFamily: LEXUS_FONTS.displayMedium },
    pillRow: { marginTop: px(8), flexDirection: "row", alignItems: "center", gap: px(8), flexWrap: "wrap" },
    divider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: px(16) },
    infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: px(12) },
    infoItem: { width: "45%" },
    infoIconWrap: { width: px(24), height: px(24), borderRadius: px(8), backgroundColor: colors.blueSoft, alignItems: "center", justifyContent: "center", marginBottom: px(6) },
    infoLabel: { color: colors.textFaint, fontSize: px(10), fontFamily: LEXUS_FONTS.bodySemiBold, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: px(4) },
    infoValue: { color: colors.textMuted, fontSize: px(13), fontFamily: LEXUS_FONTS.body },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: px(16), gap: px(10) },
    glowDot: { width: px(8), height: px(8), borderRadius: px(4), backgroundColor: colors.blue },
    sectionTitle: { color: colors.text, fontSize: px(16), fontFamily: LEXUS_FONTS.bodySemiBold, letterSpacing: 0.5 },
    summaryText: { color: colors.textMuted, fontSize: px(14), fontFamily: LEXUS_FONTS.body, lineHeight: px(22) },
    meta: { color: colors.textMuted, fontSize: px(14), fontFamily: LEXUS_FONTS.body },
    extractedFieldsContainer: { flexDirection: "row", flexWrap: "wrap", gap: px(12), marginTop: px(8) },
    extractedField: { width: "45%", backgroundColor: "rgba(255,255,255,0.03)", padding: px(12), borderRadius: px(8), borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
    extractedFieldHighlight: { backgroundColor: "rgba(0, 208, 132, 0.08)", borderColor: "rgba(0, 208, 132, 0.3)" },
    extractedFieldLabel: { color: colors.textFaint, fontSize: px(10), fontFamily: LEXUS_FONTS.bodySemiBold, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: px(4) },
    extractedFieldValue: { color: "#FFFFFF", fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold, textTransform: "capitalize" },
    extractedFieldValueUnknown: { color: colors.textMuted, fontStyle: "italic", fontFamily: LEXUS_FONTS.body },
    extractedFieldValueHighlight: { color: colors.green },
    transcriptContainer: { gap: px(12), marginTop: px(8) },
    bubbleWrapper: { maxWidth: "85%", marginBottom: px(8) },
    bubbleLeft: { alignSelf: "flex-start" },
    bubbleRight: { alignSelf: "flex-end" },
    speakerName: { fontSize: px(11), fontFamily: LEXUS_FONTS.bodySemiBold, color: colors.textFaint, paddingHorizontal: px(4) },
    bubble: { paddingHorizontal: px(14), paddingVertical: px(10), borderRadius: px(12) },
    bubbleUser: { backgroundColor: "rgba(255, 255, 255, 0.05)", borderBottomLeftRadius: px(4), borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
    bubbleAgent: { backgroundColor: "rgba(79, 140, 255, 0.15)", borderBottomRightRadius: px(4), borderWidth: 1, borderColor: "rgba(79, 140, 255, 0.25)" },
    bubbleText: { color: "#E2E8F0", fontSize: px(13), fontFamily: LEXUS_FONTS.body, lineHeight: px(18) },
    premiumOverlay: { position: 'absolute', bottom: -20, left: -20, right: -20, height: px(180), justifyContent: 'flex-end', alignItems: 'center', paddingBottom: px(30), zIndex: 10 },
    premiumOverlayContent: { alignItems: 'center', paddingHorizontal: px(20) },
    premiumOverlayTitle: { color: '#FFF', fontSize: px(16), fontFamily: LEXUS_FONTS.displayMedium, marginBottom: px(6), marginTop: px(8) },
    premiumOverlayDesc: { color: colors.textMuted, fontSize: px(12), fontFamily: LEXUS_FONTS.body, textAlign: 'center', marginBottom: px(12), maxWidth: '80%' },
    upgradeBtn: { backgroundColor: colors.blue, paddingHorizontal: px(24), paddingVertical: px(10), borderRadius: px(20) },
    upgradeBtnText: { color: '#FFF', fontSize: px(13), fontFamily: LEXUS_FONTS.bodySemiBold },
  });
}
