import React from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

import GlassCard from "../lexus/GlassCard";

interface EnterpriseSurfaceProps {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export default function EnterpriseSurface({ children, style, padded = true }: EnterpriseSurfaceProps) {
  return (
    <GlassCard padded={padded} radius={14} style={[styles.surface, style]}>
      {children}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderColor: "rgba(79,140,255,0.28)",
    backgroundColor: "rgba(8,20,36,0.95)",
  },
});
