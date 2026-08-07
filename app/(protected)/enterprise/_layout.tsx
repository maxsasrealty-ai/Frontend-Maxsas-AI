import { Slot, Redirect } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { CallsProvider } from "../../../context/CallsContext";
import { RailNav } from "../../../components/enterprise/RailNav";
import { enterpriseTheme } from "../../../themes/enterprise.theme";

// Mock user plan for frontend UI development phase
const mockUser = {
  plan: 'enterprise'
};

export default function EnterpriseLayout() {
  if (mockUser.plan !== 'enterprise') {
    return <Redirect href="/(protected)/lexus/" />;
  }

  return (
    <CallsProvider>
      <View style={s.layout}>
        {Platform.OS === 'web' && <RailNav />}
        
        <View style={s.content}>
          <Slot />
        </View>
      </View>
    </CallsProvider>
  );
}

const s = StyleSheet.create({
  layout: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    backgroundColor: enterpriseTheme.bg,
  },
  content: {
    flex: 1,
    backgroundColor: enterpriseTheme.bg,
    // Add scrollview inside screens, not here, to allow sticky headers
  },
});
