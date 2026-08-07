import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { getAppVersionLabel } from '../../lib/app-version';

const LOGO = require('../../assets/images/maxsas-logo.png');
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const theme = {
  bg: '#020C1B',
  bgMid: '#04122A',
  cyan: '#00D9FF',
  cobalt: '#0078FF',
  violet: '#6030FF',
  textPrimary: '#F7FAFF',
  textMuted: 'rgba(247,250,255,0.58)',
  textSubtle: 'rgba(247,250,255,0.32)',
};

function GradientBackdrop({ colors, style }: { colors: string[]; style?: any }) {
  if (Platform.OS === 'android') {
    return <View style={[style, { backgroundColor: colors[0] }]} />;
  }

  return <LinearGradient colors={colors} style={style} />;
}

function FloatingParticle({ top, left, size, delay, duration }: { top: number; left: number; size: number; delay: number; duration: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(translateY, {
            toValue: -18,
            duration,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.34,
            duration: duration * 0.55,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.12,
            duration: duration * 0.45,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [delay, duration, opacity, translateY]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(120,210,255,0.85)',
        opacity,
        transform: [{ translateY }],
        shadowColor: theme.cyan,
        shadowOpacity: 0.8,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

function MeshGrid() {
  const lines = Array.from({ length: 12 }, (_, index) => index);
  return (
    <View pointerEvents="none" style={styles.meshWrap}>
      {lines.map((index) => (
        <View
          key={`h-${index}`}
          style={[
            styles.meshLine,
            {
              top: (SCREEN_HEIGHT / 12) * index,
              opacity: index % 2 === 0 ? 0.1 : 0.06,
            },
          ]}
        />
      ))}
      {lines.map((index) => (
        <View
          key={`v-${index}`}
          style={[
            styles.meshLineVertical,
            {
              left: (SCREEN_WIDTH / 10) * index,
              opacity: index % 2 === 0 ? 0.08 : 0.05,
            },
          ]}
        />
      ))}
    </View>
  );
}

function AudioWave() {
  const bars = [18, 36, 28, 42, 24, 52, 30, 64, 36, 48, 28, 58, 22, 44, 18];
  return (
    <View style={styles.waveWrap}>
      {bars.map((barHeight, index) => (
        <View
          key={`wave-${index}`}
          style={[
            styles.waveBar,
            {
              height: barHeight,
              opacity: 0.45 + (index % 4) * 0.12,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── Pulsing ring behind logo ────────────────────────────────────────────────
function PulseRing({ delay = 0, size = 160 }: { delay?: number; size?: number }) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 1800,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.85,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1800,
            delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity, delay]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: theme.cyan,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Main splash screen ──────────────────────────────────────────────────────
export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  // Logo entrance
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoGlow = useRef(new Animated.Value(0.35)).current;
  const haloScale = useRef(new Animated.Value(0.95)).current;

  // Name entrance (delayed)
  const nameTranslateY = useRef(new Animated.Value(14)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;

  // Tagline entrance (further delayed)
  const tagTranslateY = useRef(new Animated.Value(10)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  // Bottom bar entrance
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(16)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const finishCalled = useRef(false);
  const timeoutIds = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const schedule = (callback: () => void, delay: number) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutIds.current.push(timeoutId);
    return timeoutId;
  };

  useEffect(() => {
    finishCalled.current = false;

    // 1. Logo pop in
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoGlow, {
            toValue: 0.65,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(logoGlow, {
            toValue: 0.35,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start(),
      Animated.loop(
        Animated.sequence([
          Animated.timing(haloScale, {
            toValue: 1.08,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(haloScale, {
            toValue: 0.95,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start(),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Name slides up
    schedule(() => {
      Animated.parallel([
        Animated.timing(nameTranslateY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(nameOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 320);

    // 3. Tagline
    schedule(() => {
      Animated.parallel([
        Animated.timing(tagTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 560);

    // 4. Bottom info
    schedule(() => {
      Animated.timing(bottomOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 820);

    schedule(() => {
      Animated.parallel([
        Animated.timing(cardTranslateY, {
          toValue: 0,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 680);

    // 5. Navigate to landing after 2.8s
    schedule(() => {
      if (!finishCalled.current) {
        finishCalled.current = true;
        onFinish();
      }
    }, 2800);

    return () => {
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
    };
  }, [logoScale, logoOpacity, nameTranslateY, nameOpacity, tagTranslateY, tagOpacity, bottomOpacity, onFinish]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.bg}
        translucent={Platform.OS === 'android'}
      />

      {/* Deep space background */}
      <GradientBackdrop
        colors={[theme.bg, '#03101f', theme.bgMid, '#010713']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.vignette} />
      <MeshGrid />

      {/* Ambient glow blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobRight} />
      <View style={styles.blobBottom} />

      <FloatingParticle top={140} left={48} size={3} delay={0} duration={3600} />
      <FloatingParticle top={180} left={SCREEN_WIDTH - 72} size={2} delay={600} duration={4300} />
      <FloatingParticle top={SCREEN_HEIGHT * 0.24} left={SCREEN_WIDTH * 0.18} size={2.5} delay={300} duration={3900} />
      <FloatingParticle top={SCREEN_HEIGHT * 0.36} left={SCREEN_WIDTH * 0.78} size={3.5} delay={900} duration={3400} />
      <FloatingParticle top={SCREEN_HEIGHT * 0.62} left={SCREEN_WIDTH * 0.12} size={2} delay={1200} duration={4200} />

      {/* ── Center content ── */}
      <View style={styles.center}>
        <View style={styles.heroStack}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.logoGlowHalo,
              { opacity: logoGlow, transform: [{ scale: haloScale }] },
            ]}
          />

          {/* Pulse rings behind logo */}
          <View style={styles.ringWrap}>
            <View style={styles.ringShadow} />
            <PulseRing size={172} delay={0} />
            <PulseRing size={244} delay={550} />
            <PulseRing size={314} delay={1100} />
            <PulseRing size={384} delay={1650} />

            {/* Logo */}
            <Animated.View
              style={[
                styles.logoWrap,
                { opacity: logoOpacity, transform: [{ scale: logoScale }] },
              ]}
            >
              <View style={styles.logoInnerGlow} />
              <Image
                source={LOGO}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.frostCard,
              {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslateY }],
              },
            ]}
          >
            <Animated.View
              style={{
                opacity: nameOpacity,
                transform: [{ translateY: nameTranslateY }],
                alignItems: 'center',
              }}
            >
              <Text style={styles.companyName}>MAXSAS AI</Text>
            </Animated.View>

            <Animated.View
              style={{
                opacity: tagOpacity,
                transform: [{ translateY: tagTranslateY }],
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <Text style={styles.tagline}>Intelligent Real Estate · Voice AI</Text>
            </Animated.View>

            <View style={styles.cardDivider} />

            <Text style={styles.featureText}>Premium voice-led property intelligence</Text>
          </Animated.View>
        </View>

        <View style={styles.waveSection}>
          <AudioWave />
        </View>
      </View>

      {/* ── Bottom bar ── */}
      <Animated.View style={[styles.bottomBar, { opacity: bottomOpacity }]}>
        <Text style={styles.versionText}>{getAppVersionLabel()} · © {new Date().getFullYear()} Maxsas Technologies Pvt. Ltd.</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1,7,18,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 44,
    shadowOffset: { width: 0, height: 0 },
  },

  meshWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },

  meshLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(135,190,255,0.18)',
  },

  meshLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(135,190,255,0.14)',
  },

  blobTop: {
    position: 'absolute',
    top: -100,
    left: -80,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: 'rgba(0,217,255,0.14)',
    shadowColor: theme.cyan,
    shadowOpacity: 0.18,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  blobRight: {
    position: 'absolute',
    top: 64,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(96,48,255,0.18)',
    shadowColor: theme.violet,
    shadowOpacity: 0.2,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
  blobBottom: {
    position: 'absolute',
    bottom: -120,
    left: -70,
    width: 340,
    height: 340,
    borderRadius: 999,
    backgroundColor: 'rgba(0,120,255,0.10)',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  heroStack: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },

  logoGlowHalo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(0,120,255,0.16)',
    shadowColor: theme.cobalt,
    shadowOpacity: 0.32,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
  },

  ringWrap: {
    width: 390,
    height: 390,
    alignItems: 'center',
    justifyContent: 'center',
  },

  ringShadow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: 'rgba(0,120,255,0.18)',
    shadowColor: theme.cyan,
    shadowOpacity: 0.35,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },

  logoWrap: {
    width: 132,
    height: 132,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },

  logoInnerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,120,255,0.08)',
  },

  logo: {
    width: 104,
    height: 104,
  },

  frostCard: {
    marginTop: 28,
    paddingVertical: 18,
    paddingHorizontal: 26,
    borderRadius: 28,
    backgroundColor: 'rgba(10,18,34,0.50)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOpacity: 0.38,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
    minWidth: 300,
    alignItems: 'center',
  },

  companyName: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textPrimary,
    letterSpacing: 7,
    textAlign: 'center',
  },

  tagline: {
    fontSize: 12,
    fontWeight: '400',
    color: theme.textMuted,
    letterSpacing: 1.9,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  cardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
    marginBottom: 12,
  },

  featureText: {
    fontSize: 12,
    color: 'rgba(247,250,255,0.68)',
    letterSpacing: 0.7,
    textAlign: 'center',
  },

  waveSection: {
    marginTop: 22,
    width: '100%',
    alignItems: 'center',
  },

  waveWrap: {
    height: 70,
    width: 240,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },

  waveBar: {
    width: 8,
    borderRadius: 999,
    backgroundColor: theme.cyan,
    shadowColor: theme.cyan,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },

  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
    paddingHorizontal: 20,
    minHeight: 40,
  },

  versionText: {
    fontSize: 11,
    color: theme.textSubtle,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
