import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

const C = {
  bg: "#040c18",
  card: "#0d1f38",
  blue: "#4F8CFF",
  textPrimary: "#e8edf5",
  textMuted: "rgba(232,237,245,0.65)",
  white: "#ffffff",
};

export default function LegalPageShell({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Navbar Minimal */}
      <View style={{ height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}>
        <TouchableOpacity onPress={() => router.push('/')} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.blue, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>🏠</Text>
          </View>
          <Text style={{ color: C.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>Maxsas AI</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={{ color: C.textMuted, fontSize: 15, fontWeight: '500' }}>&larr; Back to Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingVertical: 80, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: 800, paddingHorizontal: 24 }}>
          <View style={{ marginBottom: 40, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', paddingBottom: 40 }}>
            <Text style={{ color: C.blue, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>LEGAL</Text>
            <Text style={{ color: C.white, fontSize: 40, fontWeight: '800', letterSpacing: -1 }}>{title}</Text>
          </View>
          
          <View style={{ gap: 24 }}>
            {children}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Typography Helpers
export const LegalH2 = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ color: C.white, fontSize: 22, fontWeight: '700', marginTop: 32, marginBottom: 8 }}>{children}</Text>
);

export const LegalP = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ color: C.textMuted, fontSize: 16, lineHeight: 26 }}>{children}</Text>
);

export const LegalBullet = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', gap: 12, paddingRight: 24 }}>
    <Text style={{ color: C.blue, fontSize: 16, lineHeight: 26 }}>•</Text>
    <Text style={{ color: C.textMuted, fontSize: 16, lineHeight: 26, flex: 1 }}>{children}</Text>
  </View>
);
