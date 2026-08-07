import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEXUS_FONTS, LexusGlyph } from '../../../components/lexus/theme';
import { CallsProvider } from '../../../context/CallsContext';
import { EarlyAccessProvider } from '../../../context/EarlyAccessContext';
import { LexusThemeProvider, useLexusTheme } from '../../../context/LexusThemeContext';

const TAB_LABEL_STYLE = {
  fontSize: Platform.OS === 'web' ? 11 : 10,
  fontWeight: '700' as const,
  marginTop: 2,
  fontFamily: LEXUS_FONTS.bodySemiBold,
};

function LexusTabs() {
  const { colors, isDark } = useLexusTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        sceneStyle: { backgroundColor: colors.bg },
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 18 : (insets.bottom ? insets.bottom + 12 : 12),
          alignSelf: 'center',
          width: Platform.OS === 'web' ? '100%' : 'auto',
          maxWidth: Platform.OS === 'web' ? 1120 : 900,
          marginHorizontal: Platform.OS === 'web' ? 'auto' : 16,
          left: Platform.OS === 'web' ? 20 : 16,
          right: Platform.OS === 'web' ? 20 : 16,
          height: Platform.OS === 'web' ? 68 : (74 + (insets.bottom ? insets.bottom : 0)),
          borderRadius: Platform.OS === 'web' ? 22 : 26,
          paddingTop: Platform.OS === 'web' ? 10 : 8,
          paddingBottom: Platform.OS === 'web' ? 10 : (8 + (insets.bottom ? insets.bottom : 0)),
          paddingHorizontal: Platform.OS === 'web' ? 10 : 8,
          justifyContent: 'space-between',
          overflow: 'hidden',
          backgroundColor: isDark ? 'rgba(6, 13, 27, 0.94)' : 'rgba(255,255,255,0.96)',
          borderWidth: 1,
          borderColor: colors.borderStrong,
          shadowColor: colors.blueGlow,
          shadowOpacity: isDark ? 0.4 : 0.18,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 12,
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          borderRadius: Platform.OS === 'web' ? 16 : 18,
          marginHorizontal: 0,
          marginVertical: 2,
          paddingVertical: Platform.OS === 'web' ? 4 : 6,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          ...TAB_LABEL_STYLE,
          textAlign: 'center',
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.textFaint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <LexusGlyph name="Home" color={color} size={Platform.OS === 'web' ? 18 : 20} />
            </View>
          ),
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="leads-upload"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <LexusGlyph name="UploadCloud" color={color} size={Platform.OS === 'web' ? 18 : 20} />
            </View>
          ),
          tabBarLabel: 'Upload',
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <LexusGlyph name="Wallet" color={color} size={Platform.OS === 'web' ? 18 : 20} />
            </View>
          ),
          tabBarLabel: 'Wallet',
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <LexusGlyph name="BarChart3" color={color} size={Platform.OS === 'web' ? 18 : 20} />
            </View>
          ),
          tabBarLabel: 'Reports',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <LexusGlyph name="UserCircle" color={color} size={Platform.OS === 'web' ? 18 : 20} />
            </View>
          ),
          tabBarLabel: 'Profile',
        }}
      />
      <Tabs.Screen name="wallet/checkout" options={{ href: null }} />
      <Tabs.Screen name="call/[id]" options={{ href: null }} />
      <Tabs.Screen name="batches/index" options={{ href: null }} />
      <Tabs.Screen name="batches/[id]" options={{ href: null }} />
      <Tabs.Screen name="completed/index" options={{ href: null }} />
      <Tabs.Screen name="completed/[id]" options={{ href: null }} />
      <Tabs.Screen name="usage-ledger" options={{ href: null }} />
      <Tabs.Screen name="usage-ledger/[batchId]" options={{ href: null }} />
      <Tabs.Screen name="transaction-history" options={{ href: null }} />
    </Tabs>
  );
}

export default function LexusLayout() {
  return (
    <LexusThemeProvider>
      <EarlyAccessProvider>
        <CallsProvider>
          <WebFrame>
            <LexusTabs />
          </WebFrame>
        </CallsProvider>
      </EarlyAccessProvider>
    </LexusThemeProvider>
  );
}

function WebFrame({ children }: { children: React.ReactNode }) {
  const { colors } = useLexusTheme();

  return (
    <View style={[s.webWrapper, { backgroundColor: colors.bgSoft, borderColor: colors.border }]}> 
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  webWrapper: {
    flex: 1,
    ...(Platform.OS === 'web'
      ? {
          alignSelf: 'center',
          width: '100%',
          maxWidth: 1120,
          borderLeftWidth: 1,
          borderRightWidth: 1,
        }
      : {}),
  },
});
