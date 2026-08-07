
/**
 * RefundPolicyScreen.jsx
 * Maxsas Realty AI — Refund Policy
 * Expo / React Native compatible (no external dependencies)
 */

import React, { useEffect, useRef } from "react";
import {
	Animated,
	Platform,
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	TouchableOpacity,
	View
} from "react-native";

// const { width } = Dimensions.get("window");

// ── PALETTE ──────────────────────────────────────────────────────────────────
const C = {
	bg:          "#040c18",
	bgDeep:      "#06122a",
	card:        "#0d1f38",
	cardDark:    "#0a1628",
	blue:        "#4F8CFF",
	green:       "#00D084",
	amber:       "#F5A623",
	red:         "#FF6B6B",
	blueAlpha:   "rgba(79,140,255,0.10)",
	blueAlpha2:  "rgba(79,140,255,0.06)",
	blueBorder:  "rgba(79,140,255,0.22)",
	blueBorder2: "rgba(79,140,255,0.10)",
	greenAlpha:  "rgba(0,208,132,0.08)",
	greenBorder: "rgba(0,208,132,0.20)",
	amberAlpha:  "rgba(245,166,35,0.08)",
	amberBorder: "rgba(245,166,35,0.20)",
	redAlpha:    "rgba(255,107,107,0.08)",
	redBorder:   "rgba(255,107,107,0.20)",
	text:        "#e8edf5",
	textMuted:   "rgba(232,237,245,0.60)",
	textFaint:   "rgba(232,237,245,0.35)",
	divider:     "rgba(79,140,255,0.10)",
};

const LAST_UPDATED = "June 1, 2025";

// ── REFUND TIMELINE ──────────────────────────────────────────────────────────
const timeline = [
	{ day: "Day 0",    label: "Purchase",           icon: "💳", color: C.blue,  desc: "Subscription starts" },
	{ day: "Day 1–14", label: "Full Refund Zone",   icon: "✅", color: C.green, desc: "100% refund eligible" },
	{ day: "Day 15–30",label: "Partial Review",     icon: "⚠️", color: C.amber, desc: "Case-by-case review" },
	{ day: "Day 31+",  label: "No Refund",          icon: "❌", color: C.red,   desc: "Outside refund window" },
];

// ── ELIGIBILITY TABLE ────────────────────────────────────────────────────────
const eligibility = [
	{ scenario: "14-day free trial — no charge",           eligible: "N/A",  color: C.blue  },
	{ scenario: "Cancellation within 14 days of payment",  eligible: "✓ Full Refund", color: C.green },
	{ scenario: "Service downtime > 24 hrs (our fault)",   eligible: "✓ Pro-rated",   color: C.green },
	{ scenario: "Accidental duplicate charge",             eligible: "✓ Full Refund", color: C.green },
	{ scenario: "Cancelled after 14 days, service used",   eligible: "✗ Not eligible",color: C.red   },
	{ scenario: "Change of mind after 14 days",            eligible: "✗ Not eligible",color: C.red   },
	{ scenario: "AI call credits partially consumed",      eligible: "✗ Not eligible",color: C.red   },
];

// ── PROCESS STEPS ────────────────────────────────────────────────────────────
const processSteps = [
	{ num: "01", title: "Submit Request",   icon: "📧", desc: "Email billing@maxsas.ai with your registered email, order ID, and reason for refund." },
	{ num: "02", title: "Review (2 Days)",  icon: "🔍", desc: "Our billing team reviews your request within 2 business days and may ask for additional information." },
	{ num: "03", title: "Decision",         icon: "⚖️", desc: "You will receive a clear decision via email — approved, partial, or declined — with a full explanation." },
	{ num: "04", title: "Credit (5–7 Days)",icon: "💰", desc: "Approved refunds are credited to the original payment method within 5–7 business days." },
];

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

type FadeSlideProps = { children: React.ReactNode; delay?: number };
const FadeSlide = ({ children, delay = 0 }: FadeSlideProps) => {
	const fade  = useRef(new Animated.Value(0)).current;
	const slide = useRef(new Animated.Value(24)).current;
	useEffect(() => {
		Animated.parallel([
			Animated.timing(fade,  { toValue: 1, duration: 480, delay, useNativeDriver: true }),
			Animated.timing(slide, { toValue: 0, duration: 480, delay, useNativeDriver: true }),
		]).start();
		 
	}, [delay, fade, slide]);
	return (
		<Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
			{children}
		</Animated.View>
	);
};

type SectionLabelProps = { icon: string; text: string; color?: string; bg?: string; border?: string };
const SectionLabel = ({ icon, text, color = C.blue, bg, border }: SectionLabelProps) => (
	<View style={[styles.sectionLabel, { backgroundColor: bg || C.blueAlpha, borderColor: border || C.blueBorder }]}>
		<Text style={styles.sectionLabelIcon}>{icon}</Text>
		<Text style={[styles.sectionLabelText, { color }]}>{text}</Text>
	</View>
);

type HeaderProps = { onBack?: () => void };
const Header = ({ onBack }: HeaderProps) => {
	const fade = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
		 
	}, [fade]);
	return (
		<Animated.View style={[styles.header, { opacity: fade }]}> 
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
			<Text style={styles.pageTitle}>Refund{"\n"}Policy</Text>
			<View style={styles.metaRow}>
				<View style={styles.metaBadge}>
					<Text style={styles.metaIcon}>📅</Text>
					<Text style={styles.metaText}>Last updated: {LAST_UPDATED}</Text>
				</View>
				<View style={[styles.metaBadge, { backgroundColor: C.amberAlpha, borderColor: C.amberBorder }]}>
					<Text style={styles.metaIcon}>💳</Text>
					<Text style={[styles.metaText, { color: C.amber }]}>14-Day Guarantee</Text>
				</View>
			</View>
			<Text style={styles.headerIntro}>
				We stand behind <Text style={styles.brandName}>Maxsas Realty AI</Text>. If you are not satisfied within 14 days of your first payment, we will refund you — no questions asked. This policy explains exactly how our refund process works.
			</Text>
			<View style={styles.headerDivider} />
		</Animated.View>
	);
};

// ── SCREEN ────────────────────────────────────────────────────────────────────
type RefundPolicyScreenProps = { navigation?: { goBack?: () => void } };
export default function RefundPolicyScreen({ navigation }: RefundPolicyScreenProps) {
	const onBack = navigation?.goBack ? () => navigation.goBack?.() : undefined;

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" backgroundColor={C.bg} />
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<Header onBack={onBack} />

				{/* ── 14-DAY GUARANTEE HIGHLIGHT ── */}
				<FadeSlide delay={100}>
					<View style={styles.guaranteeCard}>
						<View style={styles.guaranteeIconWrap}>
							<Text style={{ fontSize: 36 }}>🛡️</Text>
						</View>
						<Text style={styles.guaranteeTitle}>14-Day Money-Back Guarantee</Text>
						<Text style={styles.guaranteeText}>
							Every paid plan comes with a full 14-day refund window. No partial deductions. No questions. If you change your mind, we&apos;ve got you.
						</Text>
						<View style={styles.guaranteeBadge}>
							<Text style={styles.guaranteeBadgeText}>✓ Free trial → ✓ Paid plan → ✓ 14-day refund window</Text>
						</View>
					</View>
				</FadeSlide>

				{/* ── TIMELINE ── */}
				<FadeSlide delay={180}>
					<View style={styles.block}>
						<SectionLabel icon="📅" text="REFUND TIMELINE" bg={C.blueAlpha} border={C.blueBorder} color={C.blue} />
						<Text style={styles.blockTitle}>When Can You Request a Refund?</Text>
						<View style={styles.timelineWrap}>
							{timeline.map((t, i) => (
								<View key={i} style={styles.timelineRow}>
									<View style={[styles.timelineDot, { backgroundColor: t.color, shadowColor: t.color }]} />
									{i < timeline.length - 1 && <View style={styles.timelineLine} />}
									<View style={[styles.timelineCard, { borderColor: t.color + "44", backgroundColor: t.color + "0A" }]}>
										<View style={styles.timelineCardTop}>
											<Text style={styles.timelineIcon}>{t.icon}</Text>
											<View>
												<Text style={[styles.timelineDay, { color: t.color }]}>{t.day}</Text>
												<Text style={styles.timelineLabel}>{t.label}</Text>
											</View>
										</View>
										<Text style={styles.timelineDesc}>{t.desc}</Text>
									</View>
								</View>
							))}
						</View>
					</View>
				</FadeSlide>

				{/* ── ELIGIBILITY TABLE ── */}
				<FadeSlide delay={260}>
					<View style={styles.block}>
						<SectionLabel icon="✅" text="ELIGIBILITY" bg={C.greenAlpha} border={C.greenBorder} color={C.green} />
						<Text style={styles.blockTitle}>What Qualifies for a Refund?</Text>
						{eligibility.map((e, i) => (
							<View key={i} style={[styles.eligibilityRow, i % 2 === 0 && styles.eligibilityRowAlt]}>
								<Text style={styles.eligibilityScenario}>{e.scenario}</Text>
								<View style={[styles.eligibilityBadge, { backgroundColor: e.color + "15", borderColor: e.color + "44" }]}>
									<Text style={[styles.eligibilityStatus, { color: e.color }]}>{e.eligible}</Text>
								</View>
							</View>
						))}
					</View>
				</FadeSlide>

				{/* ── PROCESS STEPS ── */}
				<FadeSlide delay={340}>
					<View style={styles.block}>
						<SectionLabel icon="⚙️" text="HOW TO REQUEST" bg={C.blueAlpha} border={C.blueBorder} color={C.blue} />
						<Text style={styles.blockTitle}>Refund Request Process</Text>
						<View style={styles.processWrap}>
							{processSteps.map((p, i) => (
								<View key={i} style={styles.processStep}>
									<View style={styles.processLeft}>
										<View style={styles.processNumWrap}>
											<Text style={styles.processNum}>{p.num}</Text>
										</View>
										{i < processSteps.length - 1 && <View style={styles.processConnector} />}
									</View>
									<View style={styles.processContent}>
										<View style={styles.processTitleRow}>
											<Text style={styles.processIcon}>{p.icon}</Text>
											<Text style={styles.processTitle}>{p.title}</Text>
										</View>
										<Text style={styles.processDesc}>{p.desc}</Text>
									</View>
								</View>
							))}
						</View>
					</View>
				</FadeSlide>

				{/* ── NON-REFUNDABLE NOTE ── */}
				<FadeSlide delay={420}>
					<View style={[styles.noteCard, { borderColor: C.redBorder, backgroundColor: C.redAlpha }]}>
						<Text style={styles.noteIcon}>⚠️</Text>
						<Text style={[styles.noteTitle, { color: C.red }]}>Non-Refundable Items</Text>
						{[
							"AI call credits already consumed or campaigns already launched",
							"Setup fees for custom Enterprise integrations",
							"Add-on telephony costs billed by our telecom partners",
							"Subscriptions cancelled after the 14-day refund window",
						].map((item, i) => (
							<View key={i} style={styles.noteItem}>
								<Text style={[styles.noteBullet, { color: C.red }]}>✗</Text>
								<Text style={styles.noteItemText}>{item}</Text>
							</View>
						))}
					</View>
				</FadeSlide>

				{/* ── CONTACT ── */}
				<FadeSlide delay={500}>
					<View style={styles.contactCard}>
						<Text style={styles.contactIcon}>💬</Text>
						<Text style={styles.contactTitle}>Need Help With a Refund?</Text>
						<Text style={styles.contactText}>
							Contact our billing team — we typically respond within 1 business day.
						</Text>
						<View style={styles.contactChips}>
							{["billing@maxsas.ai", "+91 98765 43210"].map((c) => (
								<View key={c} style={styles.contactChip}>
									<Text style={styles.contactChipText}>{c}</Text>
								</View>
							))}
						</View>
					</View>
				</FadeSlide>

				<Text style={styles.footerCopy}>© 2025 Maxsas Realty AI · All rights reserved · Made in India 🇮🇳</Text>
			</ScrollView>
		</View>
	);
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: C.bg },
	scroll:    { paddingBottom: 56 },

	header:       { paddingHorizontal: 22, paddingTop: Platform.OS === "ios" ? 60 : 44, paddingBottom: 8, position: "relative" },
	headerGlow:   { position: "absolute", top: 0, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: "rgba(245,166,35,0.04)" },
	backBtn:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
	backIcon:     { fontSize: 18, color: C.blue },
	backText:     { fontSize: 14, color: C.blue, fontWeight: "600" },
	headerBadge:  { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: C.blueAlpha, borderWidth: 1, borderColor: C.blueBorder, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 18 },
	headerBadgeDot:  { fontSize: 8, color: C.amber },
	headerBadgeText: { fontSize: 11, color: C.textMuted, fontWeight: "700", letterSpacing: 1.5 },
	pageTitle:    { fontSize: 46, fontWeight: "800", color: C.text, lineHeight: 52, letterSpacing: -1.2, marginBottom: 20 },
	metaRow:      { flexDirection: "row", gap: 10, marginBottom: 20, flexWrap: "wrap" },
	metaBadge:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: C.blueAlpha2, borderWidth: 1, borderColor: C.blueBorder2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
	metaIcon:     { fontSize: 13 },
	metaText:     { fontSize: 12, color: C.textMuted, fontWeight: "500" },
	headerIntro:  { fontSize: 15, color: C.textMuted, lineHeight: 24, marginBottom: 28 },
	brandName:    { color: C.blue, fontWeight: "700" },
	headerDivider:{ height: 1, backgroundColor: C.divider, marginBottom: 28 },

	// Section label
	sectionLabel:     { flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 10 },
	sectionLabelIcon: { fontSize: 12 },
	sectionLabelText: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },

	// Guarantee card
	guaranteeCard:    { marginHorizontal: 16, marginBottom: 20, backgroundColor: C.greenAlpha, borderWidth: 1, borderColor: C.greenBorder, borderRadius: 20, padding: 24, alignItems: "center" },
	guaranteeIconWrap:{ width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(0,208,132,0.12)", borderWidth: 1, borderColor: C.greenBorder, alignItems: "center", justifyContent: "center", marginBottom: 14 },
	guaranteeTitle:   { fontSize: 20, fontWeight: "800", color: C.text, marginBottom: 10, textAlign: "center" },
	guaranteeText:    { fontSize: 14, color: C.textMuted, lineHeight: 22, textAlign: "center", marginBottom: 16 },
	guaranteeBadge:   { backgroundColor: "rgba(0,208,132,0.12)", borderWidth: 1, borderColor: C.greenBorder, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
	guaranteeBadgeText:{ fontSize: 12, color: C.green, fontWeight: "600" },

	// Blocks
	block:      { marginHorizontal: 16, marginBottom: 20 },
	blockTitle: { fontSize: 20, fontWeight: "800", color: C.text, marginBottom: 16, letterSpacing: -0.3 },

	// Timeline
	timelineWrap: { gap: 0 },
	timelineRow:  { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 4 },
	timelineDot:  { width: 14, height: 14, borderRadius: 7, marginTop: 14, flexShrink: 0, shadowOpacity: 0.5, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
	timelineLine: { position: "absolute", left: 6, top: 28, width: 2, height: 28, backgroundColor: "rgba(79,140,255,0.15)" },
	timelineCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
	timelineCardTop:{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
	timelineIcon: { fontSize: 18 },
	timelineDay:  { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
	timelineLabel:{ fontSize: 13, fontWeight: "700", color: C.text },
	timelineDesc: { fontSize: 12, color: C.textMuted },

	// Eligibility
	eligibilityRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: C.divider, gap: 12 },
	eligibilityRowAlt: { backgroundColor: "rgba(79,140,255,0.03)", borderRadius: 8 },
	eligibilityScenario:{ flex: 1, fontSize: 13, color: C.textMuted, lineHeight: 18 },
	eligibilityBadge:  { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
	eligibilityStatus: { fontSize: 12, fontWeight: "700" },

	// Process
	processWrap:     { gap: 0 },
	processStep:     { flexDirection: "row", gap: 16, paddingBottom: 20 },
	processLeft:     { alignItems: "center", width: 36 },
	processNumWrap:  { width: 36, height: 36, borderRadius: 10, backgroundColor: C.blueAlpha, borderWidth: 1, borderColor: C.blueBorder, alignItems: "center", justifyContent: "center" },
	processNum:      { fontSize: 12, fontWeight: "800", color: C.blue, letterSpacing: 0.5 },
	processConnector:{ flex: 1, width: 2, backgroundColor: "rgba(79,140,255,0.15)", marginTop: 4 },
	processContent:  { flex: 1, paddingTop: 4 },
	processTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
	processIcon:     { fontSize: 16 },
	processTitle:    { fontSize: 15, fontWeight: "800", color: C.text },
	processDesc:     { fontSize: 13, color: C.textMuted, lineHeight: 20 },

	// Note card
	noteCard:  { marginHorizontal: 16, marginBottom: 20, borderWidth: 1, borderRadius: 18, padding: 20 },
	noteIcon:  { fontSize: 24, marginBottom: 10 },
	noteTitle: { fontSize: 15, fontWeight: "800", marginBottom: 12 },
	noteItem:  { flexDirection: "row", gap: 10, marginBottom: 8, alignItems: "flex-start" },
	noteBullet:{ fontSize: 13, fontWeight: "800", marginTop: 2 },
	noteItemText:{ flex: 1, fontSize: 13, color: C.textMuted, lineHeight: 19 },

	// Contact
	contactCard:  { marginHorizontal: 16, marginBottom: 32, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.blueBorder2, padding: 24, alignItems: "center" },
	contactIcon:  { fontSize: 28, marginBottom: 10 },
	contactTitle: { fontSize: 17, fontWeight: "800", color: C.text, marginBottom: 8 },
	contactText:  { fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 20, marginBottom: 16 },
	contactChips: { flexDirection: "row", gap: 10, flexWrap: "wrap", justifyContent: "center" },
	contactChip:  { backgroundColor: C.blueAlpha, borderWidth: 1, borderColor: C.blueBorder, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
	contactChipText:{ fontSize: 12, color: C.blue, fontWeight: "600" },

	footerCopy: { fontSize: 11, color: C.textFaint, textAlign: "center", paddingBottom: 8 },
});
