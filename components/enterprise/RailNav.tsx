import { Link, usePathname } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useWorkspaceProfile } from '../../hooks/useWorkspaceProfile';
import { enterpriseTheme } from '../../themes/enterprise.theme';

const NAV_ITEMS = [
  { name: 'Home', path: '/(protected)/enterprise', icon: '🏠' },
  { name: 'Projects', path: '/(protected)/enterprise/projects', icon: '🏢' },
  { name: 'AI Scripts', path: '/(protected)/enterprise/aiscripts', icon: '🤖' },
  { name: 'Campaigns', path: '/(protected)/enterprise/campaigns', icon: '🎯' },
  { name: 'Live Activity', path: '/(protected)/enterprise/liveactivity', icon: '⚡' },
  { name: 'Wallet & Billing', path: '/(protected)/enterprise/wallet', icon: '💳' },
  { name: 'Team', path: '/(protected)/enterprise/team', icon: '👥' },
  { name: 'Profile & Settings', path: '/(protected)/enterprise/profile', icon: '⚙️' },
];

export function RailNav() {
  const pathname = usePathname();
  const { tenantLabel } = useWorkspaceProfile();

  return (
    <View style={s.container}>
      <View style={s.logoContainer}>
        <Text style={s.logoText}>{tenantLabel}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>ENTERPRISE</Text>
        </View>
      </View>

      <View style={s.navGroup}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === '/(protected)/enterprise' 
            ? pathname === '/(protected)/enterprise' || pathname === '/(protected)/enterprise/' 
            : pathname.startsWith(item.path);

          return (
            <Link href={item.path as any} asChild key={item.path}>
              <Pressable style={StyleSheet.flatten([s.navItem, isActive && s.navItemActive])}>
                <Text style={s.icon}>{item.icon}</Text>
                <Text style={[s.navText, isActive && s.navTextActive]}>{item.name}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    width: enterpriseTheme.railWidth,
    backgroundColor: enterpriseTheme.surface,
    borderRightWidth: 1,
    borderColor: enterpriseTheme.border,
    paddingTop: Platform.OS === 'web' ? 24 : 48,
    paddingHorizontal: 16,
    flex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: 'rgba(58, 123, 213, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(58, 123, 213, 0.4)',
  },
  badgeText: {
    color: enterpriseTheme.accent,
    fontSize: 10,
    fontWeight: 'bold',
  },
  navGroup: {
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: enterpriseTheme.card,
    borderWidth: 1,
    borderColor: enterpriseTheme.border2,
  },
  icon: {
    fontSize: 18,
  },
  navText: {
    color: enterpriseTheme.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  navTextActive: {
    color: enterpriseTheme.text,
    fontWeight: 'bold',
  },
});
