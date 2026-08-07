import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { C } from "../lexus/theme";
import EnterpriseSurface from "./EnterpriseSurface";

interface EnterpriseStatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

export default function EnterpriseStatCard({ label, value, hint }: EnterpriseStatCardProps) {
  return (
    <EnterpriseSurface style={styles.card} padded={true}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : <View style={styles.spacer} />}
    </EnterpriseSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 98,
  },
  value: {
    color: C.text,
    fontWeight: "700",
    fontSize: 23,
  },
  label: {
    color: C.textMuted,
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  hint: {
    color: C.textFaint,
    marginTop: 8,
    fontSize: 12,
  },
  spacer: {
    height: 22,
  },
});
