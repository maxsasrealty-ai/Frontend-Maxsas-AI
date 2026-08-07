import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ETopBar } from '../../../../components/enterprise/ETopBar';
import { enterpriseTheme } from '../../../../themes/enterprise.theme';

const MOCK_SCRIPTS = [
  { id: '1', name: 'Real Estate Pro v2', tags: ['Residential', 'Qualification'], active: true, provisionedDate: '2026-05-01' },
  { id: '2', name: 'Luxury Villas Edition', tags: ['Premium', 'Soft Pitch'], active: false, provisionedDate: '2026-04-15' },
];

export default function EnterpriseAIScripts() {
  return (
    <View style={s.container}>
      <ETopBar 
        title="AI Scripts" 
        subtitle="Admin-provisioned voice agent behaviors and scripts"
      />
      <View style={s.banner}>
        <Text style={s.bannerText}>Read-Only Mode: Script configuration must be performed by your Maxsas account administrator.</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>Active Voice Behavior Profile</Text>
        <View style={s.activeProfileCard}>
          <Text style={s.cardTitle}>Real Estate Pro v2</Text>
          <Text style={s.muted}>Language: English, Hindi | Tone: Professional | Model: gpt-4o-realtime</Text>
          <View style={s.behaviorFlags}>
            <Text style={s.flag}>✓ Qualification Check</Text>
            <Text style={s.flag}>✓ Site Visit Ask</Text>
            <Text style={s.flag}>✓ Basic Price Disclosure</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Available Script Packs</Text>
        <View style={s.grid}>
          {MOCK_SCRIPTS.map(s => (
            <View key={s.id} style={[styles.card, s.active ? styles.cardActive : styles.cardInactive]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{s.name}</Text>
                {s.active && <Text style={styles.activeBadge}>ACTIVE</Text>}
              </View>
              <Text style={styles.muted}>Provisioned: {s.provisionedDate}</Text>
              <View style={styles.tags}>
                {s.tags.map(t => <Text key={t} style={styles.tag}>{t}</Text>)}
              </View>
              {!s.active && (
                <Pressable style={styles.reqBtn}>
                  <Text style={styles.reqBtnText}>Request Activation</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: enterpriseTheme.bg },
  content: { padding: 24, gap: 24 },
  banner: { backgroundColor: 'rgba(58, 123, 213, 0.1)', padding: 16, borderBottomWidth: 1, borderColor: 'rgba(58, 123, 213, 0.2)' },
  bannerText: { color: enterpriseTheme.accent, textAlign: 'center', fontWeight: '500' },
  sectionTitle: { color: enterpriseTheme.text, fontSize: 18, fontWeight: 'bold' },
  activeProfileCard: { backgroundColor: enterpriseTheme.card, padding: 24, borderRadius: 8, borderWidth: 1, borderColor: enterpriseTheme.accent, borderLeftWidth: 4 },
  cardTitle: { color: enterpriseTheme.text, fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  muted: { color: enterpriseTheme.muted, marginBottom: 16 },
  behaviorFlags: { flexDirection: 'row', gap: 16 },
  flag: { color: enterpriseTheme.green, fontWeight: '500' },
  grid: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
});

const styles = StyleSheet.create({
  card: { padding: 24, borderRadius: 8, borderWidth: 1, minWidth: 300, flex: 1 },
  cardActive: { backgroundColor: enterpriseTheme.card, borderColor: enterpriseTheme.border },
  cardInactive: { backgroundColor: enterpriseTheme.card2, borderColor: enterpriseTheme.border, opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: enterpriseTheme.text, fontSize: 18, fontWeight: 'bold' },
  activeBadge: { color: enterpriseTheme.green, fontSize: 12, fontWeight: 'bold', backgroundColor: 'rgba(29, 184, 122, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  muted: { color: enterpriseTheme.muted, marginBottom: 16, fontSize: 14 },
  tags: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tag: { color: enterpriseTheme.text, backgroundColor: enterpriseTheme.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12 },
  reqBtn: { backgroundColor: enterpriseTheme.surface, padding: 12, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: enterpriseTheme.border },
  reqBtnText: { color: enterpriseTheme.text, fontWeight: '500' }
});
