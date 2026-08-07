import { router, Slot, usePathname } from "expo-router";
import React from "react";
import { Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function AdminLayout() {
  const pathname = usePathname();
  const isTenants = pathname.includes("/admin/tenants");
  const isLiveFeed = pathname.includes("/admin/live-events") && !pathname.includes("/admin/live-events/recent");
  const isDbEvents = pathname.includes("/admin/live-events/recent");
  const isDashboard = !isTenants && !isLiveFeed && !isDbEvents;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.navRow}>
        <Text style={s.title}>Admin</Text>
        <View style={s.pillGroup}>
          <Pressable 
            style={[s.pill, isDashboard && s.pillActive]} 
            onPress={() => router.replace("/(protected)/admin")}
          >
            <Text style={[s.pillText, isDashboard && s.pillTextActive]}>Dashboard</Text>
          </Pressable>
          <Pressable 
            style={[s.pill, isTenants && s.pillActive]} 
            onPress={() => router.replace("/(protected)/admin/tenants")}
          >
            <Text style={[s.pillText, isTenants && s.pillTextActive]}>Tenants</Text>
          </Pressable>
          <Pressable
            style={[s.pill, isLiveFeed && s.pillActive]}
            onPress={() => router.replace("/(protected)/admin/live-events")}
          >
            <Text style={[s.pillText, isLiveFeed && s.pillTextActive]}>Live Feed</Text>
          </Pressable>
          <Pressable
            style={[s.pill, isDbEvents && s.pillActive]}
            onPress={() => router.replace("/(protected)/admin/live-events/recent")}
          >
            <Text style={[s.pillText, isDbEvents && s.pillTextActive]}>DB Events</Text>
          </Pressable>
        </View>
        <Pressable 
          style={s.exitPill} 
          onPress={() => router.replace("/(protected)/lexus")}
        >
          <Text style={s.exitPillText}>Exit Admin</Text>
        </Pressable>
      </View>
      <View style={s.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#050d1a" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(79,140,255,0.2)",
    backgroundColor: "rgba(11,24,42,0.96)",
    ...(Platform.OS === "web" ? { position: "sticky", top: 0, zIndex: 10 } : {})
  },
  title: { color: "#E8EDF5", fontSize: 16, fontWeight: "800" },
  pillGroup: { flexDirection: "row", gap: 8 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
  },
  pillActive: { backgroundColor: "rgba(79,140,255,0.15)" },
  pillText: { color: "rgba(232,237,245,0.55)", fontSize: 13, fontWeight: "700" },
  pillTextActive: { color: "#4F8CFF" },
  exitPill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
    borderWidth: 1, borderColor: "rgba(255,107,107,0.3)"
  },
  exitPillText: { color: "#FF6B6B", fontSize: 11, fontWeight: "600" },
  content: { flex: 1 }
});
