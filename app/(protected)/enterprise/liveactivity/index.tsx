import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ETopBar } from '../../../../components/enterprise/ETopBar';
import { enterpriseTheme } from '../../../../themes/enterprise.theme';

export default function EnterpriseLiveActivity() {
  return (
    <View style={s.container}>
      <ETopBar 
        title="Live Activity" 
        subtitle="Real-time call and campaign monitor"
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.batchCard}>
          <View style={s.batchHeader}>
            <View>
              <Text style={s.batchTitle}>NRI Buyers Followup</Text>
              <Text style={s.muted}>Project: Oasis Villas</Text>
            </View>
            <View style={s.pulseBadge}>
              <View style={s.pulseDot} />
              <Text style={s.pulseText}>RUNNING</Text>
            </View>
          </View>
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>205</Text>
              <Text style={s.statLabel}>Completed</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>4</Text>
              <Text style={s.statLabel}>In Progress</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>241</Text>
              <Text style={s.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        <View style={s.tableCard}>
          <Text style={s.sectionTitle}>Live Calls</Text>
          <Text style={s.muted}>Reuses Lexus CallLogTable and SSE logic in production.</Text>
          <View style={s.mockTable}>
            <Text style={s.tableRow}>+91 98765 43210  |  Oasis Villas  |  02:45  |  Qualified</Text>
            <Text style={s.tableRow}>+91 91234 56789  |  Oasis Villas  |  01:12  |  Neutral</Text>
            <Text style={s.tableRow}>+91 99887 76655  |  Galaxy Heights |  --:--  |  Calling...</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: enterpriseTheme.bg },
  content: { padding: 24, gap: 24 },
  batchCard: { backgroundColor: enterpriseTheme.card, padding: 24, borderRadius: 8, borderWidth: 1, borderColor: enterpriseTheme.border },
  batchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  batchTitle: { color: enterpriseTheme.text, fontSize: 20, fontWeight: 'bold' },
  muted: { color: enterpriseTheme.muted, marginTop: 4 },
  pulseBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(58, 123, 213, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6, borderWidth: 1, borderColor: 'rgba(58, 123, 213, 0.3)' },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: enterpriseTheme.accent },
  pulseText: { color: enterpriseTheme.accent, fontWeight: 'bold', fontSize: 12 },
  statsRow: { flexDirection: 'row', gap: 40 },
  stat: { flex: 1 },
  statVal: { color: enterpriseTheme.text, fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: enterpriseTheme.muted, fontSize: 12, marginTop: 4 },
  tableCard: { backgroundColor: enterpriseTheme.surface, padding: 24, borderRadius: 8, borderWidth: 1, borderColor: enterpriseTheme.border },
  sectionTitle: { color: enterpriseTheme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  mockTable: { marginTop: 16, backgroundColor: enterpriseTheme.bg, padding: 16, borderRadius: 4, gap: 12 },
  tableRow: { color: enterpriseTheme.text, fontFamily: 'monospace' },
});
