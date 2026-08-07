import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ETopBar } from '../../../../components/enterprise/ETopBar';
import { enterpriseTheme } from '../../../../themes/enterprise.theme';

export default function EnterpriseTeam() {
  return (
    <View style={s.container}>
      <ETopBar 
        title="Team & Access" 
        subtitle="Manage operators, agents, and access control"
      />
      <View style={s.placeholder}>
        <Text style={s.icon}>👥</Text>
        <Text style={s.title}>Team Management Coming Soon</Text>
        <Text style={s.desc}>This surface will allow brokers to invite team members, assign project-level access, and view activity audits per agent.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: enterpriseTheme.bg },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon: { fontSize: 64, marginBottom: 24 },
  title: { color: enterpriseTheme.text, fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  desc: { color: enterpriseTheme.muted, textAlign: 'center', maxWidth: 400, lineHeight: 22 },
});
