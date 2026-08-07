
/**
 * PrivacyPolicyScreen.jsx
 * Maxsas Realty AI — Privacy Policy
 * Expo / React Native compatible (no external dependencies)
 */

import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
  bg:          "#040c18",
  bgDeep:      "#06122a",
  card:        "#0d1f38",
  cardDark:    "#0a1628",
  blue:        "#4F8CFF",
  green:       "#00D084",
  blueAlpha:   "rgba(79,140,255,0.10)",
  blueAlpha2:  "rgba(79,140,255,0.06)",
  blueBorder:  "rgba(79,140,255,0.22)",
  blueBorder2: "rgba(79,140,255,0.10)",
  greenAlpha:  "rgba(0,208,132,0.08)",
  greenBorder: "rgba(0,208,132,0.20)",
  text:        "#e8edf5",
  textMuted:   "rgba(232,237,245,0.60)",
  textFaint:   "rgba(232,237,245,0.35)",
  divider:     "rgba(79,140,255,0.10)",
};

// ── DATA ──────────────────────────────────────────────────────────────────────
const LAST_UPDATED = "June 1, 2025";

type PrivacySectionContent = {
  heading: string;
  body: string;
};

type PrivacySection = {
  id: string;
  icon: string;
  title: string;
  content: PrivacySectionContent[];
};

type ScreenNavigation = {
  goBack?: () => void;
};

const sections: PrivacySection[] = [
  {
    id: "01",
    icon: "🏠",
    title: "Information We Collect",
    content: [
      {
        heading: "Personal Information",
        body: "When you register or use our services, we collect information you provide directly, including your full name, email address, mobile number, company name, and billing details. This information is essential to create and manage your account.",
      },
      {
        heading: "Usage Data",
        body: "We automatically collect information about how you interact with Maxsas Realty AI, including call logs, lead qualification data, session durations, feature usage patterns, and device/browser identifiers.",
      },
      {
        heading: "Property & Lead Data",
        body: "Information you upload about property listings and prospective buyers (leads) is stored securely and used exclusively to operate the AI calling and qualification features on your behalf.",
      },
    ],
  },
  {
    id: "02",
    icon: "🔒",
    title: "How We Use Your Information",
    content: [
      {
        heading: "Service Delivery",
        body: "We use your information to operate, maintain, and improve the Maxsas Realty AI platform, including executing AI voice calls, generating qualification summaries, and delivering analytics.",
      },
      {
        heading: "Communications",
        body: "We may send you transactional messages (call reports, billing invoices, security alerts) and, with your consent, product updates and promotional content. You may opt out of marketing communications at any time.",
      },
      {
        heading: "AI Model Improvement",
        body: "Anonymised and aggregated call transcript data may be used to improve our AI models. We never use personally identifiable lead information for training without explicit consent.",
      },
    ],
  },
  {
    id: "03",
    icon: "🤝",
    title: "Information Sharing",
    content: [
      {
        heading: "We Do Not Sell Your Data",
        body: "Maxsas Realty AI does not sell, rent, or trade your personal data or your leads' data to third parties for their own marketing purposes.",
      },
      {
        heading: "Service Providers",
        body: "We share data with vetted sub-processors (cloud hosting, telephony providers, payment gateways) solely to operate the platform. All providers are bound by data processing agreements.",
      },
      {
        heading: "Legal Compliance",
        body: "We may disclose information when required by law, court order, or regulatory authority, or when necessary to protect the rights and safety of our users.",
      },
    ],
  },
  {
    id: "04",
    icon: "🛡️",
    title: "Data Security",
    content: [
      {
        heading: "Encryption",
        body: "All data in transit is encrypted using TLS 1.3. Data at rest is encrypted using AES-256. Call recordings and transcripts are stored in isolated, access-controlled environments.",
      },
      {
        heading: "Access Controls",
        body: "Access to production systems is restricted to authorised personnel via multi-factor authentication. We conduct regular security audits and penetration testing.",
      },
    ],
  },
  {
    id: "05",
    icon: "⚙️",
    title: "Your Rights",
    content: [
      {
        heading: "Access & Portability",
        body: "You may request a copy of all personal data we hold about you at any time. We will provide it in a machine-readable format within 30 days.",
      },
      {
        heading: "Correction & Deletion",
        body: "You may update inaccurate information via your account settings or request permanent deletion of your account and associated data by contacting support@maxsas.ai.",
      },
      {
        heading: "Opt-Out",
        body: "You may withdraw consent for marketing communications, AI model training, or analytics collection at any time without affecting your core service access.",
      },
    ],
  },
  {
    id: "06",
    icon: "🍪",
    title: "Cookies & Tracking",
    content: [
      {
        heading: "Essential Cookies",
        body: "We use strictly necessary cookies to authenticate sessions and maintain security. These cannot be disabled without affecting platform functionality.",
      },
      {
        heading: "Analytics",
        body: "With your consent, we use analytics cookies to understand how users navigate the platform. You can manage cookie preferences via your account settings or browser.",
      },
    ],
  },
  {
    id: "07",
    icon: "📧",
    title: "Contact & Updates",
    content: [
      {
        heading: "Data Protection Officer",
        body: "For any privacy-related queries, contact our DPO at privacy@maxsas.ai. We will respond within 5 business days.",
      },
      {
        heading: "Policy Changes",
        body: "We may update this policy periodically. Material changes will be communicated via email and an in-app notice at least 14 days before they take effect.",
      },
    ],
  },
];

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

const Header = ({ onBack }: { onBack: (() => void) | null }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}> 
      {/* Background glow */}
      <View style={styles.headerGlow} />

      {onBack && (
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.75}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}

      <View style={styles.headerBadge}>
        <Text style={styles.headerBadgeDot}>●</Text>
        <Text style={styles.headerBadgeText}>LEGAL DOCUMENT</Text>
      </View>

      <Text style={styles.pageTitle}>Privacy{"\n"}Policy</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Text style={styles.metaIcon}>📅</Text>
          <Text style={styles.metaText}>Last updated: {LAST_UPDATED}</Text>
        </View>
        <View style={[styles.metaBadge, { borderColor: C.greenBorder, backgroundColor: C.greenAlpha }]}>
          <Text style={styles.metaIcon}>🔒</Text>
          <Text style={[styles.metaText, { color: C.green }]}>GDPR Compliant</Text>
        </View>
      </View>

      <Text style={styles.headerIntro}>
        At <Text style={styles.brandName}>Maxsas Realty AI</Text>, your privacy is fundamental to how we build and operate our platform. This policy explains clearly what data we collect, why we collect it, and how you can control it.
      </Text>

      {/* Divider */}
      <View style={styles.headerDivider} />
    </Animated.View>
  );
};

const SectionCard = ({ section, index }: { section: PrivacySection; index: number }) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = index * 80;
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[styles.sectionCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
    >
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumWrap}>
          <Text style={styles.sectionNum}>{section.id}</Text>
        </View>
        <View style={styles.sectionIconWrap}>
          <Text style={styles.sectionIcon}>{section.icon}</Text>
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>

      <View style={styles.sectionDivider} />

      {/* Content items */}
      {section.content.map((item: PrivacySectionContent, i: number) => (
        <View key={i} style={styles.contentItem}>
          <View style={styles.contentBullet} />
          <View style={styles.contentBody}>
            <Text style={styles.contentHeading}>{item.heading}</Text>
            <Text style={styles.contentText}>{item.body}</Text>
          </View>
        </View>
      ))}
    </Animated.View>
  );
};

const Footer = () => (
  <View style={styles.footer}>
    <View style={styles.footerCard}>
      <Text style={styles.footerIcon}>🏠</Text>
      <Text style={styles.footerBrand}>Maxsas Realty AI</Text>
      <Text style={styles.footerSub}>AI Voice Calling Platform for Real Estate</Text>
      <View style={styles.footerLinks}>
        {["support@maxsas.ai", "privacy@maxsas.ai"].map((l) => (
          <View key={l} style={styles.footerLinkChip}>
            <Text style={styles.footerLinkText}>{l}</Text>
          </View>
        ))}
      </View>
      <View style={styles.footerActionRow}>
        <Pressable onPress={() => router.push("/(public)/terms")}>
          <Text style={styles.footerAction}>Terms</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(public)/account-deletion")}>
          <Text style={styles.footerAction}>Account deletion</Text>
        </Pressable>
      </View>
    </View>
    <Text style={styles.footerCopy}>© 2025 Maxsas Realty AI · All rights reserved · Made in India 🇮🇳</Text>
  </View>
);

// ── SCREEN ────────────────────────────────────────────────────────────────────
export default function PrivacyPolicyScreen({ navigation }: { navigation?: ScreenNavigation }) {
  const onBack = navigation?.goBack ? () => navigation.goBack?.() : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header onBack={onBack} />
        {sections.map((s, i) => (
          <SectionCard key={s.id} section={s} index={i} />
        ))}
        <Footer />
      </ScrollView>
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll:    { paddingBottom: 48 },

  // Header
  header:      { paddingHorizontal: 22, paddingTop: Platform.OS === "ios" ? 60 : 44, paddingBottom: 8, position: "relative" },
  headerGlow:  { position: "absolute", top: 0, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(79,140,255,0.05)" },

  backBtn:   { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
  backIcon:  { fontSize: 18, color: C.blue },
  backText:  { fontSize: 14, color: C.blue, fontWeight: "600" },

  headerBadge:     { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.blueAlpha, borderWidth: 1, borderColor: C.blueBorder, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 18 },
  headerBadgeDot:  { fontSize: 8, color: C.green },
  headerBadgeText: { fontSize: 11, color: C.textMuted, fontWeight: "700", letterSpacing: 1.5 },

  pageTitle: { fontSize: 46, fontWeight: "800", color: C.text, lineHeight: 52, letterSpacing: -1.2, marginBottom: 20 },

  metaRow:   { flexDirection: "row", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  metaBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.blueAlpha2, borderWidth: 1, borderColor: C.blueBorder2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  metaIcon:  { fontSize: 13 },
  metaText:  { fontSize: 12, color: C.textMuted, fontWeight: "500" },

  headerIntro:  { fontSize: 15, color: C.textMuted, lineHeight: 24, marginBottom: 28 },
  brandName:    { color: C.blue, fontWeight: "700" },
  headerDivider:{ height: 1, backgroundColor: C.divider, marginBottom: 28 },

  // Section cards
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.blueBorder2,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  sectionHeader:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionNumWrap: { backgroundColor: C.blueAlpha, borderWidth: 1, borderColor: C.blueBorder, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sectionNum:     { fontSize: 11, fontWeight: "800", color: C.blue, letterSpacing: 1 },
  sectionIconWrap:{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.blueAlpha2, borderWidth: 1, borderColor: C.blueBorder2, alignItems: "center", justifyContent: "center" },
  sectionIcon:    { fontSize: 16 },
  sectionTitle:   { flex: 1, fontSize: 16, fontWeight: "800", color: C.text, letterSpacing: -0.2 },
  sectionDivider: { height: 1, backgroundColor: C.divider, marginBottom: 16 },

  contentItem:    { flexDirection: "row", gap: 12, marginBottom: 16 },
  contentBullet:  { width: 3, borderRadius: 2, backgroundColor: C.blue, marginTop: 6, minHeight: 36, alignSelf: "stretch" },
  contentBody:    { flex: 1 },
  contentHeading: { fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 5, letterSpacing: 0.1 },
  contentText:    { fontSize: 13.5, color: C.textMuted, lineHeight: 21 },

  // Footer
  footer:        { paddingHorizontal: 22, paddingTop: 32 },
  footerCard:    { backgroundColor: C.cardDark, borderRadius: 18, borderWidth: 1, borderColor: C.blueBorder2, padding: 24, alignItems: "center", marginBottom: 20 },
  footerIcon:    { fontSize: 28, marginBottom: 8 },
  footerBrand:   { fontSize: 17, fontWeight: "800", color: C.text, marginBottom: 4 },
  footerSub:     { fontSize: 13, color: C.textFaint, marginBottom: 16 },
  footerLinks:   { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
  footerLinkChip:{ backgroundColor: C.blueAlpha, borderWidth: 1, borderColor: C.blueBorder, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  footerLinkText:{ fontSize: 11, color: C.blue, fontWeight: "600" },
  footerActionRow: { flexDirection: "row", gap: 16, marginTop: 14, flexWrap: "wrap", justifyContent: "center" },
  footerAction: { fontSize: 12, color: C.blue, fontWeight: "700" },
  footerCopy:    { fontSize: 11, color: C.textFaint, textAlign: "center" },
});
