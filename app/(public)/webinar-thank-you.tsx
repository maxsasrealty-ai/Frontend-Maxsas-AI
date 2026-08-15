import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { resolveApiBaseUrl } from '../../lib/api/base-url';

type WebinarConfig = {
  title: string;
  subTitle: string;
  eventDate: string;
  eventTime: string;
  hostName: string;
  ticketPrice: number;
  zoomLink: string;
  whatsappGroupLink: string;
  status: 'OPEN' | 'SEATS_FULL' | 'COMPLETED';
};

const DEFAULT_WEBINAR_CONFIG: WebinarConfig = {
  title: 'Maxsas AI Voice Agent Workshop',
  subTitle: 'Live workshop on AI voice agents for real estate teams',
  eventDate: '2026-08-25T16:00:00+05:30',
  eventTime: '4:00 PM IST',
  hostName: 'Anubhav Chaudhary',
  ticketPrice: 19900,
  zoomLink: '',
  whatsappGroupLink: '',
  status: 'OPEN',
};

export default function WebinarThankYouScreen() {
  const apiBaseUrl = resolveApiBaseUrl();
  const [webinarConfig, setWebinarConfig] = useState<WebinarConfig>(DEFAULT_WEBINAR_CONFIG);

  useEffect(() => {
    let active = true;

    async function loadWebinarConfig() {
      try {
        const response = await fetch(`${apiBaseUrl}/webinar/config`);
        const payload = await response.json();
        if (!response.ok || payload?.success === false) {
          throw new Error(payload?.error?.message || 'Failed to load webinar config');
        }

        if (active && payload?.data) {
          setWebinarConfig({ ...DEFAULT_WEBINAR_CONFIG, ...payload.data });
        }
      } catch {
        if (active) {
          setWebinarConfig(DEFAULT_WEBINAR_CONFIG);
        }
      }
    }

    void loadWebinarConfig();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const ZOOM_WEBINAR_LINK = webinarConfig.zoomLink?.trim() || '';
  const WHATSAPP_GROUP_LINK = webinarConfig.whatsappGroupLink?.trim() || '';
  const GOOGLE_CALENDAR_LINK = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(webinarConfig.title)}&dates=20260825T103000Z/20260825T120000Z&details=${encodeURIComponent(webinarConfig.subTitle)}&location=Zoom`;

  const openLink = (url: string) => {
    if (!url) {
      Alert.alert('Link unavailable', 'This link has not been configured yet.');
      return;
    }

    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.iconBadge}>
          <Feather name="check-circle" size={48} color="#10B981" />
        </View>

        <Text style={styles.title}>You&apos;re Successfully Registered!</Text>
        <Text style={styles.subtitle}>
          A confirmation email & WhatsApp message with access details have been sent to you.
        </Text>

        <View style={styles.divider} />

        {/* Access Links Section */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionHeader}>NEXT STEPS</Text>

          <TouchableOpacity style={[styles.actionBtn, styles.whatsappBtn, !WHATSAPP_GROUP_LINK && styles.actionBtnDisabled]} onPress={() => openLink(WHATSAPP_GROUP_LINK)} disabled={!WHATSAPP_GROUP_LINK}>
            <Feather name="message-circle" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Join VIP WhatsApp Group</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.calendarBtn]} onPress={() => openLink(GOOGLE_CALENDAR_LINK)}>
            <Feather name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Add to Google Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.zoomBtn, !ZOOM_WEBINAR_LINK && styles.actionBtnDisabled]} onPress={() => openLink(ZOOM_WEBINAR_LINK)} disabled={!ZOOM_WEBINAR_LINK}>
            <Feather name="video" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Direct Zoom Webinar Link</Text>
          </TouchableOpacity>
        </View>

        {/* Event Details Card */}
        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Feather name="clock" size={16} color="#8FB8FF" />
            <Text style={styles.infoText}>{new Date(webinarConfig.eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })} · {webinarConfig.eventTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Feather name="user" size={16} color="#8FB8FF" />
            <Text style={styles.infoText}>Host: {webinarConfig.hostName} (Maxsas AI)</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')}>
          <Text style={styles.homeBtnText}>Return to Homepage</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06080F' },
  content: { padding: 20, maxWidth: 520, alignSelf: 'center', width: '100%', paddingTop: 60, paddingBottom: 40 },
  card: { backgroundColor: '#0E1220', borderRadius: 24, borderWidth: 1, borderColor: '#232A44', padding: 28, alignItems: 'center' },
  iconBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { color: '#F4F6FB', fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { color: '#8D96B3', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#232A44', width: '100%', marginVertical: 24 },
  actionSection: { width: '100%', gap: 12 },
  sectionHeader: { color: '#8FB8FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, width: '100%' },
  actionBtnDisabled: { opacity: 0.45 },
  whatsappBtn: { backgroundColor: '#25D366' },
  calendarBtn: { backgroundColor: '#3B6FFF' },
  zoomBtn: { backgroundColor: '#161B2E', borderWidth: 1, borderColor: '#232A44' },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  infoBox: { backgroundColor: '#161B2E', borderRadius: 16, padding: 16, width: '100%', marginTop: 20, gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { color: '#F4F6FB', fontSize: 13, fontWeight: '500' },
  homeBtn: { marginTop: 24 },
  homeBtnText: { color: '#8D96B3', fontSize: 14, fontWeight: '600' },
});