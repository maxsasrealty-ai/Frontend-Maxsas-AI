import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PlatformPage() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Platform</Text>
      <Text style={styles.subtitle}>Platform overview and features placeholder page.</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.push('/')}>
          <Text style={styles.link}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#04060f' },
  title: { fontSize: 26, color: '#f0f4ff', fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#8892a4', textAlign: 'center', marginBottom: 18 },
  actions: { marginTop: 12 },
  link: { color: '#00d4ff', fontWeight: '700' },
});
