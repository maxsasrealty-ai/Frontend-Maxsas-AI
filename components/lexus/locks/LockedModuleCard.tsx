import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useLexusTheme } from "../../../context/LexusThemeContext";
import GlassCard from "../GlassCard";
import PillButton from "../PillButton";
import { LEXUS_FONTS } from "../theme";

interface LockedModuleCardProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onPress?: () => void;
}

export default function LockedModuleCard({
  title,
  description,
  ctaLabel = "Upgrade plan",
  onPress,
}: LockedModuleCardProps) {
  const { colors, isDark } = useLexusTheme();

  return (
    <GlassCard
      style={[
        styles.card,
        {
          borderColor: colors.borderStrong,
          backgroundColor: isDark ? "rgba(13,31,56,0.85)" : colors.bgElevated,
        },
      ]}
      padded={true}
      variant="accent"
    >
      <View style={styles.row}>
        <Text style={[styles.lock, { color: colors.amber }]}>LOCKED</Text>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text>
      <PillButton title={ctaLabel} variant="secondary" onPress={onPress} style={{ marginTop: 10 }} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: "rgba(79,140,255,0.35)",
    backgroundColor: "rgba(13,31,56,0.85)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  lock: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginRight: 8,
    fontFamily: LEXUS_FONTS.bodyBold,
  },
  title: {
    fontWeight: "700",
    fontSize: 15,
    fontFamily: LEXUS_FONTS.displayMedium,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: LEXUS_FONTS.body,
  },
});
