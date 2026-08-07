import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ETopBar } from '../../../../components/enterprise/ETopBar';
import { enterpriseTheme } from '../../../../themes/enterprise.theme';

export default function EnterpriseProfile() {
  return (
    <View style={s.container}>
      <ETopBar 
        title="Profile & Settings" 
        subtitle="Manage your enterprise account"
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <View style={s.profileHeader}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>M</Text>
            </View>
            <View>
              <Text style={s.name}>Maxsas Realty Team</Text>
              <Text style={s.email}>admin@maxsasrealty.com</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeText}>ENTERPRISE</Text>
            </View>
          </View>
          
          <View style={s.notice}>
            <Text style={s.noticeText}>Admin-provisioned · not self-serve</Text>
            <Text style={s.noticeDesc}>Enterprise configuration must be performed by your Maxsas account administrator.</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>API Keys & Integrations</Text>
        <View style={s.card}>
          <Text style={s.muted}>CRM and webhook integrations configuration will appear here.</Text>
          <Pressable style={s.btnSecondary}>
            <Text style={s.btnSecondaryText}>Generate API Key</Text>
          </Pressable>
        </View>

        <Pressable style={s.btnLogout}>
          <Text style={s.btnLogoutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: enterpriseTheme.bg },
  content: { padding: 24, gap: 24 },
  card: { backgroundColor: enterpriseTheme.card, padding: 24, borderRadius: 8, borderWidth: 1, borderColor: enterpriseTheme.border, gap: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: enterpriseTheme.surface, borderWidth: 1, borderColor: enterpriseTheme.border2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: enterpriseTheme.text, fontSize: 24, fontWeight: 'bold' },
  name: { color: enterpriseTheme.text, fontSize: 20, fontWeight: 'bold' },
  email: { color: enterpriseTheme.muted },
  badge: { marginLeft: 'auto', backgroundColor: 'rgba(58, 123, 213, 0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(58, 123, 213, 0.4)' },
  badgeText: { color: enterpriseTheme.accent, fontWeight: 'bold', fontSize: 12 },
  notice: { backgroundColor: enterpriseTheme.surface, padding: 16, borderRadius: 8, marginTop: 8 },
  noticeText: { color: enterpriseTheme.text, fontWeight: 'bold', marginBottom: 4 },
  noticeDesc: { color: enterpriseTheme.muted, fontSize: 13 },
  sectionTitle: { color: enterpriseTheme.text, fontSize: 18, fontWeight: 'bold' },
  muted: { color: enterpriseTheme.muted },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: enterpriseTheme.border2, paddingVertical: 12, borderRadius: 6, alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 24, marginTop: 8 },
  btnSecondaryText: { color: enterpriseTheme.text, fontWeight: '500' },
  btnLogout: { backgroundColor: 'transparent', borderWidth: 1, borderColor: enterpriseTheme.red, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  btnLogoutText: { color: enterpriseTheme.red, fontWeight: 'bold', fontSize: 16 },
});
