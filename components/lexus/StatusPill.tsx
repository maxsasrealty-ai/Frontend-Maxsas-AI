import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { useLexusTheme } from "../../context/LexusThemeContext";
import { LEXUS_FONTS } from "./theme";

export interface StatusPillProps {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
  style?: StyleProp<ViewStyle>;
}

export default function StatusPill({
  label,
  tone = "neutral",
  style,
}: StatusPillProps) {
  const { colors, isDark, plan } = useLexusTheme();
  const isPrestige = plan === "prestige";

  const getThemeColors = () => {
    switch (tone) {
      case "success":
        return { 
          bg: isDark ? (isPrestige ? "rgba(0, 208, 132, 0.2)" : "rgba(0, 208, 132, 0.15)") : "rgba(0, 168, 107, 0.14)", 
          text: colors.green,
          border: isPrestige ? "rgba(0, 208, 132, 0.3)" : "transparent"
        };
      case "warning":
        return { 
          bg: isDark ? (isPrestige ? "rgba(245, 166, 35, 0.2)" : "rgba(245, 166, 35, 0.15)") : "rgba(224, 154, 45, 0.14)", 
          text: colors.amber,
          border: isPrestige ? "rgba(245, 166, 35, 0.3)" : "transparent"
        };
      case "danger":
        return { 
          bg: isDark ? (isPrestige ? "rgba(255, 107, 107, 0.2)" : "rgba(255, 107, 107, 0.15)") : "rgba(224, 85, 85, 0.14)", 
          text: colors.red,
          border: isPrestige ? "rgba(255, 107, 107, 0.3)" : "transparent"
        };
      case "info":
        return { 
          bg: isDark ? (isPrestige ? "rgba(107, 91, 255, 0.2)" : "rgba(79, 140, 255, 0.15)") : "rgba(79, 140, 255, 0.12)", 
          text: colors.blue,
          border: isPrestige ? "rgba(107, 91, 255, 0.3)" : "transparent"
        };
      case "neutral":
      default:
        return { 
          bg: isDark ? "rgba(232, 237, 245, 0.10)" : "rgba(16,33,61,0.08)", 
          text: colors.textMuted,
          border: isPrestige && isDark ? "rgba(232, 237, 245, 0.15)" : "transparent"
        };
    }
  };

  const toneColors = getThemeColors();

  return (
    <View style={[styles.pill, { backgroundColor: toneColors.bg, borderWidth: isPrestige ? 1 : 0, borderColor: toneColors.border }, style]}>
      <Text style={[styles.label, { color: toneColors.text }, isPrestige && { fontWeight: "800", letterSpacing: 0.6 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontWeight: "700",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: LEXUS_FONTS.bodySemiBold,
  },
});
