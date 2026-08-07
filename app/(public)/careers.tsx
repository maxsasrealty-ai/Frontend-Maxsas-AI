import { router } from 'expo-router';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function CareersPage() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Careers</Text>
      <Text style={styles.subtitle}>Open roles and hiring info placeholder page.</Text>
      <TouchableOpacity onPress={() => router.push('/contact')} style={{ marginTop: 12 }}>
        <Text style={styles.link}>Contact Recruitment</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/')} style={{ marginTop: 12 }}>
        <Text style={styles.link}>Back to Home</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#04060f' },
  title: { fontSize: 26, color: '#f0f4ff', fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#8892a4', textAlign: 'center', marginBottom: 18 },
  link: { color: '#00d4ff', fontWeight: '700' },
});
