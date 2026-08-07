import { router } from "expo-router";
import React, { useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import EnterpriseSurface from "../../../../components/enterprise/EnterpriseSurface";
import SectionHeader from "../../../../components/lexus/SectionHeader";
import StatusPill from "../../../../components/lexus/StatusPill";
import { C } from "../../../../components/lexus/theme";
import { useCalls } from "../../../../hooks/useCalls";
import { useWorkspaceProfile } from "../../../../hooks/useWorkspaceProfile";
import { formatTime } from "../../../../lib/adapters/calls";

export default function EnterpriseContacts() {
  const { calls } = useCalls();
  const { vocabulary } = useWorkspaceProfile();

  const contacts = useMemo(
    () =>
      calls.map((call) => ({
        id: call.callId,
        name: `Contact ${call.callId.slice(0, 6)}`,
        campaign: call.roomId,
        status: call.state,
        updatedAt: call.initiatedAt,
      })),
    [calls]
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionHeader
          title="Contacts"
          subtitle={`Brokerage ${vocabulary.leadsLabel.toLowerCase()} view across ${vocabulary.campaignsLabel.toLowerCase()}`}
        />

        {contacts.length === 0 ? (
          <EnterpriseSurface padded={true}>
            <Text style={styles.empty}>No contacts generated yet.</Text>
          </EnterpriseSurface>
        ) : (
          contacts.map((contact) => (
            <EnterpriseSurface key={contact.id} padded={true} style={{ marginBottom: 10 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.name}>{contact.name}</Text>
                <StatusPill
                  label={contact.status}
                  tone={contact.status === "failed" ? "danger" : contact.status === "completed" ? "success" : "info"}
                />
              </View>
              <Text style={styles.meta}>{`Campaign ${contact.campaign}`}</Text>
              <Text style={styles.meta}>{`Updated ${formatTime(contact.updatedAt)}`}</Text>
              <TouchableOpacity onPress={() => router.push(`/(protected)/enterprise/contacts/${encodeURIComponent(contact.id)}` as any)}>
                <Text style={styles.link}>Open detail</Text>
              </TouchableOpacity>
            </EnterpriseSurface>
          ))
        )}

        <View style={{ height: 70 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { color: C.text, fontSize: 15, fontWeight: "700" },
  meta: { color: C.textMuted, fontSize: 12, marginTop: 4 },
  link: { color: C.blue, fontSize: 12, fontWeight: "600", marginTop: 8 },
  empty: { color: C.textFaint, fontSize: 13 },
});
