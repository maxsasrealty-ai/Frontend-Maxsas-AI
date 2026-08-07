import React from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useLexusTheme } from "../../context/LexusThemeContext";

export interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  radius?: number;
  variant?: "default" | "elevated" | "accent";
}

export default function GlassCard({
  children,
  style,
  padded = true,
  radius = 18,
  variant = "default",
}: GlassCardProps) {
  const { colors, isDark, plan } = useLexusTheme();
  const isPrestige = plan === "prestige";
  const isAccent = variant === "accent";
  const isElevated = variant === "elevated";
  const surfaceColor = isElevated ? colors.bgElevated : colors.cardSurface;
  const borderColor = isAccent ? colors.borderStrong : colors.border;
  const glowColor = isPrestige ? colors.blueGlow : colors.blueSoft;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: surfaceColor,
          borderColor: isPrestige && isDark ? "rgba(216, 180, 254, 0.2)" : borderColor,
          shadowColor: isPrestige ? colors.purple : colors.shadow,
          shadowOpacity: isPrestige ? (isDark ? 0.2 : 0.12) : (isDark ? 0.1 : 0.08),
        },
        isAccent && styles.accent,
        isAccent && { shadowColor: glowColor, borderColor },
        { borderRadius: radius },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 14,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
        backdropFilter: "blur(18px)",
      },
    }),
  },
  accent: {
    borderWidth: 1.5,
  },
  padded: {
    padding: 18,
  },
});
