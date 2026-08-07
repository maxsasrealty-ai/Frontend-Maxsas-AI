import React from "react";
import { Text, View } from "react-native";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

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

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}> 
        <Text style={[styles.title, { color: colors.text }]}>{areaTitle}</Text>
        <View style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="lexusArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.blue} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={colors.blue} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colors.border} strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: colors.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(8, 19, 38, 0.95)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                }}
                labelStyle={{ color: colors.textFaint }}
                itemStyle={{ color: colors.text }}
              />
              <Area type="monotone" dataKey="value" stroke={colors.blue} strokeWidth={2} fill="url(#lexusArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </View>
      </View>

      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.bgElevated }]}>
        <Text style={[styles.title, { color: colors.text }]}>{barTitle}</Text>
        <View style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid stroke={colors.border} strokeDasharray="3 6" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: colors.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: colors.textFaint, fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(8, 19, 38, 0.95)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: 10,
                }}
                labelStyle={{ color: colors.textFaint }}
                itemStyle={{ color: colors.text }}
              />
              <Bar dataKey="value" fill={colors.purple} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
};
