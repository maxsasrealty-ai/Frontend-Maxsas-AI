import React from "react";
import {
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle
} from "react-native";
import { useLexusTheme } from "../../context/LexusThemeContext";
import { LEXUS_FONTS } from "./theme";

export interface PillButtonProps {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  icon?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export default function PillButton({
  title,
  onPress,
  variant = "primary",
  icon,
  style,
  disabled = false,
}: PillButtonProps) {
  const { colors, isDark, plan } = useLexusTheme();

  const getVariantStyles = () => {
    const isPrestige = plan === "prestige";

    switch (variant) {
      case "primary":
        return {
          container: [
            { backgroundColor: colors.blue, borderWidth: 1, borderColor: colors.blue },
            isPrestige && isDark && {
              shadowColor: colors.blue,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 8,
              borderColor: "rgba(216, 180, 254, 0.4)", // Subtly richer border for prestige
            },
            isPrestige && !isDark && {
              shadowColor: colors.blue,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 5,
            }
          ],
          text: [
            { color: "#fff" },
            isPrestige && { fontWeight: "800", letterSpacing: 0.8 }
          ],
        };
      case "secondary":
        return {
          container: { backgroundColor: isDark ? "rgba(79,140,255,0.13)" : "rgba(79,140,255,0.10)", borderWidth: 1, borderColor: "transparent" },
          text: { color: colors.blue, ...(isPrestige && { fontWeight: "700" }) },
        };
      case "danger":
        return {
          container: { backgroundColor: colors.red, borderWidth: 1, borderColor: colors.red },
          text: { color: "#fff" },
        };
      case "ghost":
        return {
          container: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
          text: { color: colors.text },
        };
      default:
        return {
          container: { backgroundColor: colors.blue, borderWidth: 1, borderColor: colors.blue },
          text: { color: "#fff" },
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={[styles.button, vStyles.container, disabled && styles.disabledButton, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {icon && <Text style={[styles.icon, vStyles.text]}>{icon}</Text>}
      <Text style={[styles.title, vStyles.text]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    minWidth: 88,
    height: 48,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  disabledButton: {
    opacity: 0.55,
  },
  title: {
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
    fontFamily: LEXUS_FONTS.bodySemiBold,
  },
  icon: {
    fontSize: 18,
    marginRight: 8,
  },
});
