import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { enterpriseTheme } from '../../themes/enterprise.theme';

interface Props {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export function ETopBar({ title, subtitle, rightElement }: Props) {
  return (
    <View style={s.container}>
      <View>
        <Text style={s.title}>{title}</Text>
        {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: enterpriseTheme.border,
    backgroundColor: enterpriseTheme.surface,
  },
  title: {
    color: enterpriseTheme.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: enterpriseTheme.muted,
    fontSize: 14,
    marginTop: 4,
  },
});
