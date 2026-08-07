import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Easing,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from 'react-native';

// ─── Design tokens ────────────────────────────────────────────────────────────
const theme = {
  bg: '#04060f',
  bgCard: '#0a1220',
  bgSurface: '#0f1a2e',
  textPrimary: '#f0f4ff',
  textSecondary: 'rgba(240,244,255,0.70)',
  textMuted: 'rgba(240,244,255,0.55)',
  textSubtle: 'rgba(240,244,255,0.28)',
  border: 'rgba(255,255,255,0.07)',
  borderAccent: 'rgba(0,229,255,0.18)',
  cyan: '#00e5ff',
  violet: '#7c3aed',
  emerald: '#10b981',
};

// ─── Wave bar heights & colors ─────────────────────────────────────────────
const WAVE_BARS: { height: number; color: string }[] = [
  { height: 10, color: theme.cyan },
  { height: 18, color: theme.cyan },
  { height: 14, color: theme.emerald },
  { height: 28, color: theme.emerald },
  { height: 22, color: theme.cyan },
  { height: 38, color: theme.cyan },
  { height: 26, color: theme.emerald },
  { height: 16, color: theme.cyan },
  { height: 30, color: theme.emerald },
  { height: 20, color: theme.cyan },
  { height: 14, color: theme.cyan },
  { height: 24, color: theme.emerald },
  { height: 18, color: theme.cyan },
  { height: 32, color: theme.emerald },
  { height: 22, color: theme.cyan },
];

// ─── Feature pills ─────────────────────────────────────────────────────────
const PILLS = ['Voice calls', 'Fast setup'];

function GradientLayer({ colors, children, style }: { colors: string[]; children?: any; style?: any }) {
  if (Platform.OS === 'android') {
    return <View style={[style, { backgroundColor: colors[0] }]}>{children}</View>;
  }

  return (
    <LinearGradient colors={colors} style={style}>
      {children}
    </LinearGradient>
  );
}

// ─── Animated wave bar ────────────────────────────────────────────────────
function WaveBar({ height, color, delay }: { height: number; color: string; delay: number }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 550 + Math.random() * 700,
          delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.4,
          duration: 550 + Math.random() * 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        {
          height,
          backgroundColor: color,
          transform: [{ scaleY: anim }],
          transformOrigin: 'bottom',
        },
      ]}
    />
  );
}

// ─── Pulsing live dot ─────────────────────────────────────────────────────
function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={styles.pulseDotWrap}>
      <Animated.View style={[styles.pulseDotRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.pulseDot} />
    </View>
  );
}

// ─── Fade-up animated section ────────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const translateY = useRef(new Animated.Value(18)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── CTA Button ───────────────────────────────────────────────────────────
function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.primaryBtn, { transform: [{ scale }] }]}>
        <GradientLayer
          colors={['#00e5ff', '#7c3aed']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <GradientLayer
          colors={['rgba(255,255,255,0.14)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.primaryBtnLabel}>{label}</Text>
        <Text style={styles.primaryBtnArrow}>→</Text>
      </Animated.View>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.secondaryBtn, { transform: [{ scale }] }]}>
        <Text style={styles.secondaryBtnLabel}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────
export default function AndroidLandingScreen() {
  const { height } = useWindowDimensions();

  const paddingTop = useMemo(() => Math.max(20, height * 0.032), [height]);
  const paddingBottom = useMemo(() => Math.max(24, height * 0.03), [height]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.bg}
        translucent={Platform.OS === 'android'}
      />

      {/* Background gradient */}
      <GradientLayer
        colors={[theme.bg, '#050c1a', '#04060f']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Ambient orbs */}
      <View style={styles.orbTopLeft} />
      <View style={styles.orbBottomRight} />
      <View style={styles.orbMid} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop, paddingBottom }]}
      >
        {/* ── Brand row ── */}
        <FadeUp delay={0}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>M</Text>
            </View>
            <View style={styles.brandMeta}>
              <Text style={styles.brandName}>Maxsas Realty AI</Text>
              <Text style={styles.brandTag}>Lead qualification platform</Text>
            </View>
            <View style={styles.backPill}>
              <Text style={styles.backPillText}>Web version ↗</Text>
            </View>
          </View>
        </FadeUp>

        {/* ── Hero ── */}
        <FadeUp delay={80}>
          <View style={styles.hero}>
              <Text style={styles.eyebrow}>Mobile-first · AI Voice Agents</Text>
            <Text style={styles.headline}>
                {'Qualify leads\nbefore your team\n'}
                <Text style={styles.headlineAccent}>starts calling</Text>
            </Text>
            <Text style={styles.subline}>
                AI voice agents handle inbound enquiries so your team only sees qualified calls.
            </Text>
          </View>
        </FadeUp>

        {/* ── Live call card ── */}
        <FadeUp delay={150}>
          <View style={styles.liveCard}>
            <GradientLayer
              colors={['rgba(0,229,255,0.04)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
            />

            {/* Top row */}
            <View style={styles.liveTopRow}>
              <View>
                <Text style={styles.liveLabel}>LIVE AGENT CALL</Text>
                <Text style={styles.liveCaller}>Rahul Sharma</Text>
                <Text style={styles.liveDetail}>3BHK enquiry</Text>
              </View>
              <View style={styles.liveBadge}>
                <PulseDot />
                <Text style={styles.liveBadgeTime}>02:14</Text>
              </View>
            </View>

            {/* Waveform */}
            <View style={styles.waveRow}>
              {WAVE_BARS.map((bar, i) => (
                <WaveBar
                  key={i}
                  height={bar.height}
                  color={bar.color}
                  delay={i * 60}
                />
              ))}
            </View>

            {/* Quote */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>{'"What budget range are you considering?"'}</Text>
              <Text style={styles.quoteSpeaker}>Maxsas AI Agent</Text>
            </View>
          </View>
        </FadeUp>

        {/* ── Feature pills ── */}
        <FadeUp delay={210}>
          <View style={styles.pillsRow}>
            {PILLS.map((label) => (
              <View key={label} style={styles.pill}>
                <Text style={styles.pillDot}>·</Text>
                <Text style={styles.pillLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </FadeUp>

        {/* ── Stats ── */}
        {/* ── CTAs ── */}
        <FadeUp delay={280}>
          <View style={styles.ctas}>
            <PrimaryButton
              label="Get Started Free"
              onPress={() => router.push('/(public)/signup')}
            />
            <SecondaryButton
              label="Log In"
              onPress={() => router.push('/(public)/login')}
            />
          </View>
        </FadeUp>

        {/* ── Footer ── */}
        <FadeUp delay={340}>
          <Text style={styles.footerNote}>
            No credit card required · Secure onboarding
          </Text>
        </FadeUp>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 22,
  },

  // ── Orbs ──
  orbTopLeft: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(0,229,255,0.11)',
    opacity: 0.6,
    // blur not available natively; use a soft, large circle instead
  },
  orbBottomRight: {
    position: 'absolute',
    right: -80,
    bottom: -100,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(124,58,237,0.13)',
    opacity: 0.55,
  },
  orbMid: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.05)',
    opacity: 0.6,
  },

  // ── Brand row ──
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: theme.borderAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    color: theme.cyan,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -1,
  },
  brandMeta: {
    flex: 1,
  },
  brandName: {
    color: theme.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  brandTag: {
    color: theme.textMuted,
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  backPill: {
    backgroundColor: 'rgba(0,229,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  backPillText: {
    color: theme.cyan,
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Hero ──
  hero: {
    gap: 12,
  },
  eyebrow: {
    color: theme.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  headline: {
    color: theme.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  headlineAccent: {
    color: theme.cyan,
    // LinearGradient text not natively supported; cyan is a strong accent
  },
  subline: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '300',
    maxWidth: 300,
  },

  // ── Live call card ──
  liveCard: {
    backgroundColor: theme.bgCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
  },
  liveTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  liveLabel: {
    color: theme.textSubtle,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  liveCaller: {
    color: theme.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 5,
  },
  liveDetail: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 99,
    flexShrink: 0,
  },
  liveBadgeTime: {
    color: theme.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Pulse dot ──
  pulseDotWrap: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDotRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16,185,129,0.35)',
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.emerald,
  },

  // ── Waveform ──
  waveRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3.5,
    height: 40,
  },
  waveBar: {
    width: 5,
    borderRadius: 99,
    opacity: 0.88,
  },

  // ── Quote ──
  quoteBox: {
    backgroundColor: theme.bgSurface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  quoteText: {
    color: theme.textSecondary,
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  quoteSpeaker: {
    color: theme.cyan,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Pills ──
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 99,
  },
  pillDot: {
    color: theme.cyan,
    fontSize: 18,
    lineHeight: 16,
    marginTop: -2,
  },
  pillLabel: {
    color: theme.textPrimary,
    fontSize: 12.5,
    fontWeight: '500',
  },

  // ── CTAs ──
  ctas: {
    gap: 10,
  },
  primaryBtn: {
    minHeight: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.20)',
    shadowColor: theme.cyan,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  primaryBtnLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryBtnArrow: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryBtnLabel: {
    color: 'rgba(240,244,255,0.85)',
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Footer ──
  footerNote: {
    color: theme.textSubtle,
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 18,
    paddingBottom: 4,
  },
});