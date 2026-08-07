import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ETopBar } from '../../../../components/enterprise/ETopBar';
import { enterpriseTheme } from '../../../../themes/enterprise.theme';

const MOCK_PROJECTS = [
  { id: '1', name: 'Galaxy Heights', location: 'Noida Ext.', type: 'Residential', status: 'Active', inventoryCount: 150, startingPrice: '₹85 L', campaignCount: 2, qualifiedCalls: 45 },
  { id: '2', name: 'Oasis Villas', location: 'Greater Noida', type: 'Villas', status: 'Active', inventoryCount: 30, startingPrice: '₹2.5 Cr', campaignCount: 1, qualifiedCalls: 12 },
  { id: '3', name: 'Tech Park Towers', location: 'Gurugram', type: 'Commercial', status: 'Coming Soon', inventoryCount: 200, startingPrice: '₹1.2 Cr', campaignCount: 0, qualifiedCalls: 0 },
];

export default function EnterpriseProjects() {
  return (
    <View style={s.container}>
      <ETopBar 
        title="Projects & Inventory" 
        subtitle="Manage real-estate projects as calling context containers"
        rightElement={
          <Pressable style={s.addButton}>
            <Text style={s.addButtonText}>+ Add Project</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.grid}>
          {MOCK_PROJECTS.map(p => (
            <View key={p.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.cardTitle}>{p.name}</Text>
                <View style={[s.badge, p.status === 'Active' ? s.badgeActive : s.badgeInactive]}>
                  <Text style={[s.badgeText, p.status === 'Active' ? s.badgeTextActive : s.badgeTextInactive]}>{p.status}</Text>
                </View>
              </View>
              <Text style={s.location}>{p.location} • {p.type}</Text>
              
              <View style={s.statsRow}>
                <View>
                  <Text style={s.statLabel}>Inventory</Text>
                  <Text style={s.statVal}>{p.inventoryCount}</Text>
                </View>
                <View>
                  <Text style={s.statLabel}>Starting at</Text>
                  <Text style={s.statVal}>{p.startingPrice}</Text>
                </View>
                <View>
                  <Text style={s.statLabel}>Campaigns</Text>
                  <Text style={s.statVal}>{p.campaignCount}</Text>
                </View>
                <View>
                  <Text style={s.statLabel}>Qualified Calls</Text>
                  <Text style={s.statVal}>{p.qualifiedCalls}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: enterpriseTheme.bg },
  content: { padding: 24 },
  addButton: {
    backgroundColor: enterpriseTheme.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: {
    backgroundColor: enterpriseTheme.card,
    borderWidth: 1,
    borderColor: enterpriseTheme.border,
    borderRadius: 8,
    padding: 20,
    minWidth: 320,
    flex: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: enterpriseTheme.text, fontSize: 18, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  badgeActive: { backgroundColor: 'rgba(29, 184, 122, 0.1)', borderColor: 'rgba(29, 184, 122, 0.3)' },
  badgeInactive: { backgroundColor: 'rgba(139, 144, 164, 0.1)', borderColor: 'rgba(139, 144, 164, 0.3)' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextActive: { color: enterpriseTheme.green },
  badgeTextInactive: { color: enterpriseTheme.muted },
  location: { color: enterpriseTheme.muted, marginTop: 4, marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: enterpriseTheme.border2, paddingTop: 16 },
  statLabel: { color: enterpriseTheme.muted, fontSize: 12, marginBottom: 4 },
  statVal: { color: enterpriseTheme.text, fontSize: 16, fontWeight: 'bold' },
});
