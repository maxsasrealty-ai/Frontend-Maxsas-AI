import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ETopBar } from '../../../components/enterprise/ETopBar';
import EnterpriseWorkspaceBanner from '../../../components/enterprise/EnterpriseWorkspaceBanner';
import { useWorkspaceProfile } from '../../../hooks/useWorkspaceProfile';
import { enterpriseTheme } from '../../../themes/enterprise.theme';

export default function EnterpriseHome() {
  const { tenantLabel, branding } = useWorkspaceProfile();

  return (
    <View style={s.container}>
      <ETopBar 
        title={tenantLabel}
        subtitle={branding?.workspaceLabel || "Real-time visibility into your team and campaigns"}
      />
      
      <ScrollView contentContainerStyle={s.content}>
        <EnterpriseWorkspaceBanner />

        {/* Agent Status Strip */}
        <View style={s.statusStrip}>
          <View style={s.statusItem}>
            <View style={[s.statusDot, { backgroundColor: enterpriseTheme.green }]} />
            <Text style={s.statusText}>Agent: Provisioned & Ready</Text>
          </View>
          <Text style={s.statusMuted}>Model: gpt-4o-realtime-preview | Profile: Real Estate Pro v2</Text>
        </View>

        {/* Stat Tiles */}
        <View style={s.statsGrid}>
          <View style={s.statTile}>
            <Text style={s.statLabel}>Active Projects</Text>
            <Text style={s.statValue}>3</Text>
          </View>
          <View style={s.statTile}>
            <Text style={s.statLabel}>Campaigns Ready</Text>
            <Text style={s.statValue}>1</Text>
          </View>
          <View style={s.statTile}>
            <Text style={s.statLabel}>Calls Today</Text>
            <Text style={s.statValue}>124</Text>
          </View>
          <View style={s.statTile}>
            <Text style={s.statLabel}>Wallet Balance</Text>
            <Text style={s.statValue}>₹4,500</Text>
          </View>
        </View>

        {/* Two Column Layout for Feed / Projects */}
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Recent Activity</Text>
            <View style={s.card}>
              <Text style={s.mutedText}>10:45 AM - Campaign &apos;Weekend Launch&apos; completed.</Text>
              <Text style={s.mutedText}>09:30 AM - New project &apos;Galaxy Heights&apos; added.</Text>
              <Text style={s.mutedText}>09:00 AM - Wallet recharged with ₹5000.</Text>
            </View>
          </View>
          <View style={s.col}>
            <Text style={s.sectionTitle}>Active Projects Preview</Text>
            <View style={s.card}>
              <View style={s.projectRow}>
                <Text style={s.text}>Galaxy Heights</Text>
                <Text style={s.mutedText}>45 Qualified Calls</Text>
              </View>
              <View style={s.projectRow}>
                <Text style={s.text}>Oasis Villas</Text>
                <Text style={s.mutedText}>12 Qualified Calls</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: enterpriseTheme.bg,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  statusStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: enterpriseTheme.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: enterpriseTheme.border,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    color: enterpriseTheme.text,
    fontWeight: '600',
  },
  statusMuted: {
    color: enterpriseTheme.muted,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: enterpriseTheme.card,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: enterpriseTheme.border,
  },
  statLabel: {
    color: enterpriseTheme.muted,
    marginBottom: 8,
    fontSize: 14,
  },
  statValue: {
    color: enterpriseTheme.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 24,
  },
  col: {
    flex: 1,
    gap: 16,
  },
  sectionTitle: {
    color: enterpriseTheme.text,
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    backgroundColor: enterpriseTheme.card,
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: enterpriseTheme.border,
    gap: 12,
  },
  mutedText: {
    color: enterpriseTheme.muted,
  },
  text: {
    color: enterpriseTheme.text,
    fontWeight: '500',
  },
  projectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: enterpriseTheme.border2,
  }
});
