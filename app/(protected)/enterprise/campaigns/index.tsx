import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ETopBar } from '../../../../components/enterprise/ETopBar';
import { enterpriseTheme } from '../../../../themes/enterprise.theme';

const MOCK_CAMPAIGNS = [
  { id: '1', name: 'Weekend Launch', project: 'Galaxy Heights', contacts: 1200, progress: 100, status: 'Completed' },
  { id: '2', name: 'NRI Buyers Followup', project: 'Oasis Villas', contacts: 450, progress: 45, status: 'Running' },
  { id: '3', name: 'Q3 Leads Reactivation', project: 'Galaxy Heights', contacts: 800, progress: 0, status: 'Draft' },
];

export default function EnterpriseCampaigns() {
  const [tab, setTab] = useState('All');

  return (
    <View style={s.container}>
      <ETopBar 
        title="Campaigns" 
        subtitle="Project-linked call campaigns (Reuses Lexus Calling foundations)"
      />
      <View style={s.tabRow}>
        {['All Campaigns', 'Upload', 'Batch History'].map(t => (
          <Pressable key={t} onPress={() => setTab(t)} style={[s.tab, tab === t && s.tabActive]}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {tab === 'All Campaigns' || tab === 'All' ? (
          <View style={s.list}>
            {MOCK_CAMPAIGNS.map(c => (
              <View key={c.id} style={s.row}>
                <View style={s.colMain}>
                  <Text style={s.campaignName}>{c.name}</Text>
                  <Text style={s.muted}>Project: {c.project} • {c.contacts} contacts</Text>
                </View>
                <View style={s.colProgress}>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${c.progress}%`, backgroundColor: c.status === 'Running' ? enterpriseTheme.accent : enterpriseTheme.green }]} />
                  </View>
                  <Text style={s.progressText}>{c.progress}%</Text>
                </View>
                <View style={s.colStatus}>
                  <Text style={[s.statusText, { color: c.status === 'Running' ? enterpriseTheme.accent : c.status === 'Completed' ? enterpriseTheme.green : enterpriseTheme.muted }]}>{c.status}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.placeholderCard}>
            <Text style={s.placeholderText}>{tab} screen reuses logic from Lexus UI.</Text>
            <Text style={s.placeholderMuted}>Project linkage logic to be wired via backend updates.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: enterpriseTheme.bg },
  tabRow: { flexDirection: 'row', paddingHorizontal: 24, borderBottomWidth: 1, borderColor: enterpriseTheme.border, backgroundColor: enterpriseTheme.surface },
  tab: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 2, borderColor: 'transparent' },
  tabActive: { borderColor: enterpriseTheme.accent },
  tabText: { color: enterpriseTheme.muted, fontWeight: '500' },
  tabTextActive: { color: enterpriseTheme.accent, fontWeight: 'bold' },
  content: { padding: 24 },
  list: { gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: enterpriseTheme.card, padding: 20, borderRadius: 8, borderWidth: 1, borderColor: enterpriseTheme.border },
  colMain: { flex: 2 },
  campaignName: { color: enterpriseTheme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  muted: { color: enterpriseTheme.muted, fontSize: 14 },
  colProgress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressBg: { flex: 1, height: 6, backgroundColor: enterpriseTheme.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressText: { color: enterpriseTheme.muted, width: 40, textAlign: 'right' },
  colStatus: { flex: 0.5, alignItems: 'flex-end' },
  statusText: { fontWeight: 'bold' },
  placeholderCard: { padding: 40, backgroundColor: enterpriseTheme.card, borderRadius: 8, borderWidth: 1, borderColor: enterpriseTheme.border, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: enterpriseTheme.text, fontSize: 16, marginBottom: 8 },
  placeholderMuted: { color: enterpriseTheme.muted }
});
