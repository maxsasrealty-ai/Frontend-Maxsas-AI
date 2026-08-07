import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { ETopBar } from '../../../../components/enterprise/ETopBar';
import { enterpriseTheme } from '../../../../themes/enterprise.theme';

export default function EnterpriseWallet() {
  return (
    <View style={s.container}>
      <ETopBar 
        title="Wallet & Billing" 
        subtitle="Manage balance and view consumption"
      />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.heroCard}>
          <Text style={s.heroLabel}>Available Balance</Text>
          <Text style={s.heroBalance}>₹ 4,500.00</Text>
          <View style={s.heroBreakdown}>
            <Text style={s.breakdownText}>Total Recharged: ₹ 20,000</Text>
            <Text style={s.breakdownText}>Locked (in-flight): ₹ 120</Text>
          </View>
          <View style={s.actions}>
            <Pressable style={s.btnPrimary}>
              <Text style={s.btnPrimaryText}>Recharge Wallet</Text>
            </Pressable>
            <Pressable style={s.btnSecondary}>
              <Text style={s.btnSecondaryText}>View Pricing</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.notice}>
          <Text style={s.noticeTitle}>Enterprise Plan Active</Text>
          <Text style={s.noticeText}>Limit: 120,000 min/month | Concurrency: 100 calls | Rate: ₹14/call</Text>
        </View>

        <View style={s.transactionsCard}>
          <Text style={s.sectionTitle}>Recent Transactions</Text>
          <Text style={s.muted}>Reuses Lexus wallet data logic in production.</Text>
          <View style={s.mockTable}>
            <View style={s.row}><Text style={s.rowText}>May 01</Text><Text style={s.rowText}>Recharge</Text><Text style={[s.rowText, {color: enterpriseTheme.green}]}>+ ₹5000</Text></View>
            <View style={s.row}><Text style={s.rowText}>Apr 28</Text><Text style={s.rowText}>Campaign: Weekend Launch</Text><Text style={[s.rowText, {color: enterpriseTheme.red}]}>- ₹2150</Text></View>
            <View style={s.row}><Text style={s.rowText}>Apr 15</Text><Text style={s.rowText}>Recharge</Text><Text style={[s.rowText, {color: enterpriseTheme.green}]}>+ ₹10000</Text></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: enterpriseTheme.bg },
  content: { padding: 24, gap: 24 },
  heroCard: { backgroundColor: '#13192b', padding: 32, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(58, 123, 213, 0.4)' },
  heroLabel: { color: enterpriseTheme.muted, fontSize: 16, marginBottom: 8 },
  heroBalance: { color: '#fff', fontSize: 48, fontWeight: 'bold', marginBottom: 24 },
  heroBreakdown: { flexDirection: 'row', gap: 24, marginBottom: 32 },
  breakdownText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 16 },
  btnPrimary: { backgroundColor: enterpriseTheme.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6 },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: enterpriseTheme.accent, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6 },
  btnSecondaryText: { color: enterpriseTheme.accent, fontWeight: 'bold', fontSize: 16 },
  notice: { backgroundColor: 'rgba(29, 184, 122, 0.1)', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(29, 184, 122, 0.3)' },
  noticeTitle: { color: enterpriseTheme.green, fontWeight: 'bold', marginBottom: 4 },
  noticeText: { color: enterpriseTheme.text },
  transactionsCard: { backgroundColor: enterpriseTheme.surface, padding: 24, borderRadius: 8, borderWidth: 1, borderColor: enterpriseTheme.border },
  sectionTitle: { color: enterpriseTheme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  muted: { color: enterpriseTheme.muted, marginBottom: 16 },
  mockTable: { gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: enterpriseTheme.border2, paddingBottom: 12 },
  rowText: { color: enterpriseTheme.text, flex: 1 },
});
