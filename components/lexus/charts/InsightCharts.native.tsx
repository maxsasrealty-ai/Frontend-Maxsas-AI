import React from "react";
import { Text, View } from "react-native";

import { useLexusTheme } from "../../../context/LexusThemeContext";
import { LEXUS_FONTS } from "../theme";

interface ChartPoint {
  label: string;
  value: number;
}

interface InsightChartsProps {
  areaData: ChartPoint[];
  barData: ChartPoint[];
  areaTitle?: string;
  barTitle?: string;
}

export default function InsightCharts({
  areaData,
  barData,
  areaTitle = "Lead Momentum",
  barTitle = "Outcome Split",
}: InsightChartsProps) {
  const { colors } = useLexusTheme();
  const maxArea = Math.max(1, ...areaData.map((item) => item.value));
  const maxBar = Math.max(1, ...barData.map((item) => item.value));

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
        <Text style={[styles.title, { color: colors.text }]}>{areaTitle}</Text>
        <View style={styles.barRow}>
          {areaData.map((item) => (
            <View key={item.label} style={styles.barItem}>
              <View
                style={{
                  height: `${Math.round((item.value / maxArea) * 100)}%`,
                  backgroundColor: colors.blue,
                  borderRadius: 6,
                }}
              />
            </View>
          ))}
        </View>
        <View style={styles.labelRow}>
          {areaData.map((item) => (
            <Text key={item.label} style={[styles.axisLabel, { color: colors.textFaint }]}>
              {item.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
        <Text style={[styles.title, { color: colors.text }]}>{barTitle}</Text>
        <View style={styles.barRow}>
          {barData.map((item) => (
            <View key={item.label} style={styles.barItem}>
              <View
                style={{
                  height: `${Math.round((item.value / maxBar) * 100)}%`,
                  backgroundColor: colors.purple,
                  borderRadius: 6,
                }}
              />
            </View>
          ))}
        </View>
        <View style={styles.labelRow}>
          {barData.map((item) => (
            <Text key={item.label} style={[styles.axisLabel, { color: colors.textFaint }]}>
              {item.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = {
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontFamily: LEXUS_FONTS.bodySemiBold,
    marginBottom: 8,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 140,
  },
  barItem: {
    flex: 1,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  axisLabel: {
    fontSize: 10,
    fontFamily: LEXUS_FONTS.bodyMedium,
    flex: 1,
    textAlign: "center",
  },
};
