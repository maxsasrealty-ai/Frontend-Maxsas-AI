import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { landingTheme } from '../../themes/landing.theme';
import AndroidLandingScreen from './AndroidLandingScreen';

type MenuState = 'closed' | 'open';

const heroTranscript = [
  '🤖 Connecting to lead: Rahul Sharma...',
  '🤖 "Hello Rahul, calling regarding your 3BHK inquiry in Whitefield."',
  '👤 "Yes, I am looking for a property around 80 Lakhs budget."',
  '🤖 "Noted! Scheduling a site visit for this weekend."',
];

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

function useResponsiveColumns(width: number) {
  if (width >= 1120) return { isDesktop: true, isTablet: false, isMobile: false };
  if (width >= 768) return { isDesktop: false, isTablet: true, isMobile: false };
  return { isDesktop: false, isTablet: false, isMobile: true };
}

function PulsingDot({ color = '#00d4ff' }: { color?: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 0.8, duration: 600, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, [pulseAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.pulsingDot,
        { backgroundColor: color, transform: [{ scale: pulseAnim }], opacity: opacityAnim },
      ]}
    />
  );
}

function SectionHeader({ eyebrow, title, subtitle, centered = false }: { eyebrow: string; title: string; subtitle: string; centered?: boolean }) {
  return (
    <View style={[styles.sectionHeader, centered && styles.centeredHeader]}>
      <View style={styles.eyebrowBadge}>
        <PulsingDot color={landingTheme.colors.cyan} />
        <Text style={styles.eyebrow}>{eyebrow}</Text>
      </View>
      <Text style={[styles.sectionTitle, centered && styles.centeredText]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, centered && styles.centeredText]}>{subtitle}</Text>
    </View>
  );
}

function GlassCard({ children, style, accentColor }: { children: React.ReactNode; style?: object; accentColor?: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleMouseEnter = () => {
    Animated.spring(scaleAnim, { toValue: 1.015, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  const handleMouseLeave = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const webProps = Platform.OS === 'web' ? { onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave } : {};

  return (
    <Animated.View
      style={[
        styles.glassCard,
        accentColor ? { borderColor: `${accentColor}40` } : null,
        style,
        { transform: [{ scale: scaleAnim }] },
      ]}
      {...webProps}
    >
      <View style={styles.glassCardInner} />
      {children}
    </Animated.View>
  );
}

function ScrollRevealView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const [isVisible, setIsVisible] = useState(false);

  const handleLayout = () => {
    if (!isVisible) {
      setIsVisible(true);
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start();
    }
  };

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} onLayout={handleLayout}>
      {children}
    </Animated.View>
  );
}

function GradientButton({ label, onPress, compact = false, ghost = false }: { label: string; onPress: () => void; compact?: boolean; ghost?: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.buttonWrap, compact && styles.buttonCompact]}
      >
        {ghost ? (
          <View style={[styles.ghostButton, compact && styles.ghostButtonCompact]}>
            <Text style={styles.ghostButtonText}>{label}</Text>
          </View>
        ) : (
          <GradientLayer colors={landingTheme.gradients.brand} style={[styles.primaryButton, compact && styles.primaryButtonCompact]}>
            <Text style={styles.primaryButtonText}>{label}</Text>
          </GradientLayer>
        )}
      </Pressable>
    </Animated.View>
  );
}

function Waveform() {
  const bars = useMemo(() => [0.4, 0.9, 0.6, 1.0, 0.5, 0.8, 0.4], []);
  const animatedBars = useRef(bars.map(() => new Animated.Value(0.4))).current;

  useEffect(() => {
    const loops = animatedBars.map((bar, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: bars[index], duration: 450, delay: index * 60, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(bar, { toValue: 0.3, duration: 450, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
    });
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [animatedBars, bars]);

  return (
    <View style={styles.waveRow}>
      {animatedBars.map((bar, index) => (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            { transform: [{ scaleY: bar }], backgroundColor: index % 2 === 0 ? landingTheme.colors.cyan : landingTheme.colors.violet },
          ]}
        />
      ))}
    </View>
  );
}

function LiveCallWidget() {
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLineIdx((prev) => (prev + 1) % heroTranscript.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <GlassCard style={styles.widgetShell} accentColor={landingTheme.colors.cyan}>
      <View style={styles.widgetHeader}>
        <View style={styles.liveBadge}>
          <PulsingDot color={landingTheme.colors.cyan} />
          <Text style={styles.liveBadgeText}>LIVE REAL ESTATE AI CALL</Text>
        </View>
        <Waveform />
        <Text style={styles.timerText}>01:42</Text>
      </View>

      <View style={styles.infoGrid}>
        {[
          ['Lead', 'Rahul Sharma'],
          ['Budget', '₹ 80 Lakhs'],
          ['Locality', 'Whitefield'],
          ['Intent', 'Hot Lead 🔥'],
        ].map(([label, value]) => (
          <View key={label} style={styles.infoCell}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={[styles.infoValue, label === 'Intent' && { color: landingTheme.colors.rose }]}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.transcriptBox}>
        <Text style={styles.transcriptTitle}>AI AGENT TRANSCRIPT</Text>
        <Text style={styles.transcriptText}>{heroTranscript[lineIdx]}</Text>
      </View>

      <View style={styles.widgetFooter}>
        <View style={styles.hotLeadPill}>
          <Feather name="check-circle" size={12} color={landingTheme.colors.emerald} />
          <Text style={styles.hotLeadText}>Auto-Synced to CRM</Text>
        </View>
        <Text style={styles.followUpText}>Follow-up in 2 hrs</Text>
      </View>
    </GlassCard>
  );
}

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const { isDesktop, isTablet } = useResponsiveColumns(width);
  const [menuState, setMenuState] = useState<MenuState>('closed');
  const [isAnnual, setIsAnnual] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [previewMode, setPreviewMode] = useState<'web' | 'android'>('web');

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});

  const isAndroidPreview = Platform.OS === 'web' && previewMode === 'android';

  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setScrolled(scrollY > 30);
  };

  const previewToggle = Platform.OS === 'web' ? (
    <TouchableOpacity onPress={() => setPreviewMode((cur) => (cur === 'web' ? 'android' : 'web'))} style={styles.previewToggle}>
      <Text style={styles.previewToggleLabel}>{previewMode === 'web' ? '📱 Mobile Preview' : '💻 Web Preview'}</Text>
    </TouchableOpacity>
  ) : null;

  if (isAndroidPreview) {
    return (
      <View style={{ flex: 1 }}>
        <AndroidLandingScreen />
        {previewToggle}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      {previewToggle}

      <View style={styles.backgroundBase}>
        <GradientLayer colors={['#060913', '#0c1222', '#060913']} style={StyleSheet.absoluteFill} />

        {/* Floating Glowing Orbs */}
        <View style={styles.heroGlowLeft} />
        <View style={styles.heroGlowRight} />

        {/* Navigation Bar */}
        <View style={[styles.navWrap, scrolled && styles.navScrolled]}>
          <View style={styles.navInner}>
            <TouchableOpacity onPress={() => router.push('/')} style={styles.brandWrap}>
              <View style={styles.brandMark}>
                <Image source={require('../../assets/images/maxsas-logo.png')} style={styles.brandLogo} />
              </View>
              <View>
                <Text style={styles.brandTitle}>Maxsas Realty AI</Text>
                <Text style={styles.brandSubtitle}>Automated Real Estate Calling</Text>
              </View>
            </TouchableOpacity>

            {isDesktop ? (
              <View style={styles.desktopNav}>
                {landingTheme.navLinks.map((link) => (
                  <TouchableOpacity key={link.label} onPress={() => router.push(`/${link.target}`)}>
                    <Text style={styles.navLink}>{link.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {isDesktop ? (
              <View style={styles.navActionsDesktop}>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
                <GradientButton label="Start Free Trial" onPress={() => router.push('/signup')} compact />
              </View>
            ) : (
              <TouchableOpacity style={styles.menuButton} onPress={() => setMenuState((cur) => (cur === 'open' ? 'closed' : 'open'))}>
                <Feather name={menuState === 'open' ? 'x' : 'menu'} size={22} color={landingTheme.colors.textPrimary} />
              </TouchableOpacity>
            )}
          </View>

          {menuState === 'open' ? (
            <View style={styles.mobileMenu}>
              {landingTheme.navLinks.map((link) => (
                <TouchableOpacity key={link.label} style={styles.mobileMenuItem} onPress={() => router.push(`/${link.target}`)}>
                  <Text style={styles.mobileMenuText}>{link.label}</Text>
                </TouchableOpacity>
              ))}
              <GradientButton label="Start Free Trial" onPress={() => router.push('/signup')} />
            </View>
          ) : null}
        </View>

        {/* Main Body */}
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16} contentContainerStyle={styles.scrollContent}>
          <View style={styles.pageShell}>

            {/* HERO SECTION */}
            <ScrollRevealView delay={0}>
              <View style={[styles.heroSection, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                <View style={styles.heroCopy}>
                  <View style={styles.heroBadge}>
                    <PulsingDot color={landingTheme.colors.cyan} />
                    <Text style={styles.heroBadgeText}>Next-Gen Voice AI for Property</Text>
                  </View>

                  <Text style={styles.heroTitle}>
                    Convert Cold Property Leads into <Text style={styles.heroGradientText}>Qualified Buyers</Text> 24/7
                  </Text>

                  <Text style={styles.heroSubtext}>
                    Maxsas AI Voice Agents call your Facebook & Portal leads within 30 seconds, capture intent, budget, locality, and auto-book site visits.
                  </Text>

                  <View style={styles.heroActions}>
                    <GradientButton label="Try AI Demo Now" onPress={() => router.push('/demo')} />
                    <GradientButton label="Watch Video" onPress={() => router.push('/demo')} ghost />
                  </View>

                  <View style={styles.heroProofRow}>
                    {landingTheme.heroProof.map((item, idx) => (
                      <View key={item} style={styles.heroProofItem}>
                        <Feather name="check" size={14} color={landingTheme.colors.cyan} />
                        <Text style={styles.heroProofText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.heroVisual}>
                  <LiveCallWidget />
                </View>
              </View>
            </ScrollRevealView>

            {/* METRICS / STATS STRIP */}
            <ScrollRevealView delay={100}>
              <GlassCard style={styles.statsStrip} accentColor={landingTheme.colors.cyan}>
                <View style={[styles.statsGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                  {landingTheme.stats.map((stat) => (
                    <View key={stat.label} style={styles.statCard}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </ScrollRevealView>

            {/* HOW IT WORKS */}
            <ScrollRevealView delay={150}>
              <View style={styles.sectionBlock}>
                <SectionHeader eyebrow="AUTOMATED FLOW" title="3 Steps to Scale Your Sales Pipeline" subtitle="Zero manual calling. Your sales team receives ready-to-close prospects." />
                <View style={[styles.stepsGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                  {landingTheme.steps.map((step, index) => (
                    <GlassCard key={step.title} style={styles.stepCard} accentColor={index === 1 ? landingTheme.colors.cyan : landingTheme.colors.violet}>
                      <Text style={styles.stepIndex}>0{index + 1}</Text>
                      <View style={styles.stepIconWrap}>
                        <Feather name={step.icon as keyof typeof Feather.glyphMap} size={24} color={landingTheme.colors.cyan} />
                      </View>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepText}>{step.description}</Text>
                    </GlassCard>
                  ))}
                </View>
              </View>
            </ScrollRevealView>

            {/* PLATFORM FEATURES */}
            <ScrollRevealView delay={200}>
              <View style={styles.sectionBlock}>
                <SectionHeader eyebrow="BUILT FOR REAL ESTATE" title="Engineered for Indian Realty Markets" subtitle="Multi-lingual support with regional dialect handling & CRM integration." />
                <View style={[styles.featuresGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                  {landingTheme.features.map((feature) => (
                    <GlassCard key={feature.title} style={styles.featureCard} accentColor={feature.accent}>
                      <View style={[styles.featureIcon, { backgroundColor: `${feature.accent}18` }]}>
                        <Feather name={feature.icon as keyof typeof Feather.glyphMap} size={24} color={feature.accent} />
                      </View>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureText}>{feature.description}</Text>
                    </GlassCard>
                  ))}
                </View>
              </View>
            </ScrollRevealView>

            {/* PRICING SECTION */}
            <ScrollRevealView delay={250}>
              <View style={styles.sectionBlock}>
                <SectionHeader eyebrow="TRANSPARENT PLANS" title="Flexible Plans for Solo Agents to Developers" subtitle="Scale up your calling bandwidth as your marketing campaigns grow." centered />
                
                <View style={styles.pricingToggleRow}>
                  <TouchableOpacity onPress={() => setIsAnnual(false)} style={[styles.toggleBtn, !isAnnual && styles.toggleBtnActive]}>
                    <Text style={[styles.toggleText, !isAnnual && styles.toggleTextActive]}>Monthly</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsAnnual(true)} style={[styles.toggleBtn, isAnnual && styles.toggleBtnActive]}>
                    <Text style={[styles.toggleText, isAnnual && styles.toggleTextActive]}>Annual (Save 20%)</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.pricingGrid, { flexDirection: isDesktop ? 'row' : 'column' }]}>
                  {landingTheme.pricing.map((tier) => (
                    <GlassCard key={tier.name} style={[styles.pricingCard, tier.featured && styles.pricingFeatured]} accentColor={tier.featured ? landingTheme.colors.cyan : landingTheme.colors.border}>
                      {tier.featured && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                        </View>
                      )}
                      <Text style={styles.pricingName}>{tier.name}</Text>
                      <Text style={styles.pricingPrice}>{tier.price}<Text style={styles.pricingCadence}>{tier.cadence}</Text></Text>
                      <View style={styles.pricingDivider} />
                      {[tier.calls, tier.languages, tier.crm, tier.agents, tier.support].map((item) => (
                        <View key={item} style={styles.pricingRow}>
                          <Feather name="check-circle" size={16} color={landingTheme.colors.emerald} />
                          <Text style={styles.pricingRowText}>{item}</Text>
                        </View>
                      ))}
                      <View style={{ marginTop: 24 }}>
                        <GradientButton label={tier.cta} onPress={() => router.push('/signup')} ghost={!tier.featured} />
                      </View>
                    </GlassCard>
                  ))}
                </View>
              </View>
            </ScrollRevealView>

            {/* CALL TO ACTION */}
            <ScrollRevealView delay={300}>
              <View style={styles.bottomCta}>
                <GradientLayer colors={['rgba(0,212,255,0.12)', 'rgba(124,58,237,0.15)']} style={StyleSheet.absoluteFill} />
                <Text style={styles.bottomCtaTitle}>Ready to Automate Your Realty Lead Qualifications?</Text>
                <Text style={styles.bottomCtaSub}>Start your 14-day free trial now. Setup takes less than 5 minutes.</Text>
                <View style={styles.ctaBtnRow}>
                  <GradientButton label="Get Started For Free" onPress={() => router.push('/signup')} />
                  <GradientButton label="Book Personal Demo" onPress={() => router.push('/demo')} ghost />
                </View>
              </View>
            </ScrollRevealView>

            {/* FOOTER */}
            <View style={styles.footer}>
              <View style={styles.brandWrap}>
                <Image source={require('../../assets/images/maxsas-logo.png')} style={styles.brandLogo} />
                <Text style={styles.brandTitle}>Maxsas Realty AI</Text>
              </View>
              <Text style={styles.footerText}>© {new Date().getFullYear()} Maxsas Realty AI. Built for High-Converting Real Estate Teams.</Text>
            </View>

          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#060913' },
  backgroundBase: { flex: 1, backgroundColor: '#060913', position: 'relative' },
  scrollContent: { paddingBottom: 60 },
  pageShell: { width: '100%', maxWidth: 1200, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10 },
  
  // Glassmorphism Card Style
  glassCard: {
    backgroundColor: 'rgba(13, 20, 36, 0.75)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  glassCardInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },

  // Glow Orbs
  heroGlowLeft: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    left: -100,
    top: 0,
    backgroundColor: 'rgba(0,212,255,0.1)',
  },
  heroGlowRight: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    right: -100,
    top: 150,
    backgroundColor: 'rgba(124,58,237,0.12)',
  },

  // Navbar
  navWrap: { top: 0, zIndex: 100, paddingHorizontal: 20, paddingVertical: 14 },
  navScrolled: { backgroundColor: 'rgba(6,9,19,0.92)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  navInner: { width: '100%', maxWidth: 1200, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,212,255,0.08)' },
  brandLogo: { width: 26, height: 26, resizeMode: 'contain' },
  brandTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  brandSubtitle: { color: landingTheme.colors.textSecondary, fontSize: 11 },
  desktopNav: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  navActionsDesktop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  navLink: { color: landingTheme.colors.textSecondary, fontSize: 14, fontWeight: '500' },
  loginLink: { color: landingTheme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
  menuButton: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  mobileMenu: { marginTop: 12, gap: 12, padding: 16, borderRadius: 16, backgroundColor: '#0d1424', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  mobileMenuItem: { paddingVertical: 8 },
  mobileMenuText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  previewToggle: { position: 'absolute', top: 12, right: 12, zIndex: 999, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(0,212,255,0.15)', borderWidth: 1, borderColor: landingTheme.colors.cyan },
  previewToggleLabel: { color: landingTheme.colors.cyan, fontSize: 12, fontWeight: '700' },

  // Hero
  heroSection: { gap: 32, alignItems: 'center', paddingTop: 28, paddingBottom: 32 },
  heroCopy: { flex: 1, gap: 18 },
  heroVisual: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', backgroundColor: 'rgba(0,212,255,0.08)', paddingHorizontal: 12, paddingVertical: 6 },
  heroBadgeText: { color: landingTheme.colors.cyan, fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#ffffff', fontSize: 38, lineHeight: 46, fontWeight: '800', letterSpacing: -0.5 },
  heroGradientText: { color: landingTheme.colors.cyan },
  heroSubtext: { color: landingTheme.colors.textSecondary, fontSize: 15, lineHeight: 24, maxWidth: 520 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 6 },
  heroProofRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginTop: 8 },
  heroProofItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroProofText: { color: landingTheme.colors.textMuted, fontSize: 13 },

  // Widget
  widgetShell: { width: '100%', maxWidth: 460, backgroundColor: 'rgba(12, 18, 34, 0.9)', borderWidth: 1, borderColor: 'rgba(0, 212, 255, 0.25)' },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,212,255,0.1)' },
  liveBadgeText: { color: landingTheme.colors.cyan, fontSize: 10, fontWeight: '800' },
  timerText: { color: landingTheme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 18 },
  waveBar: { width: 4, borderRadius: 2, height: 18 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  infoCell: { flex: 1, minWidth: '45%', padding: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)' },
  infoLabel: { color: landingTheme.colors.textMuted, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 2 },
  transcriptBox: { padding: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  transcriptTitle: { color: landingTheme.colors.cyan, fontSize: 10, fontWeight: '800', marginBottom: 4 },
  transcriptText: { color: landingTheme.colors.textSecondary, fontSize: 13, lineHeight: 18 },
  widgetFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hotLeadPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hotLeadText: { color: landingTheme.colors.emerald, fontSize: 12, fontWeight: '700' },
  followUpText: { color: landingTheme.colors.amber, fontSize: 12, fontWeight: '600' },

  // Buttons
  buttonWrap: { borderRadius: 12, overflow: 'hidden' },
  buttonCompact: { borderRadius: 10 },
  primaryButton: { paddingHorizontal: 22, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButtonCompact: { paddingHorizontal: 16, paddingVertical: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  ghostButton: { paddingHorizontal: 22, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,212,255,0.3)', borderRadius: 12, backgroundColor: 'rgba(0,212,255,0.05)' },
  ghostButtonCompact: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  ghostButtonText: { color: landingTheme.colors.cyan, fontSize: 14, fontWeight: '700' },

  // Stats
  statsStrip: { marginTop: 10, paddingVertical: 20 },
  statsGrid: { gap: 20, justifyContent: 'space-around' },
  statCard: { alignItems: 'center' },
  statValue: { color: landingTheme.colors.cyan, fontSize: 28, fontWeight: '800' },
  statLabel: { color: landingTheme.colors.textSecondary, fontSize: 13, marginTop: 2 },

  // Sections
  sectionBlock: { paddingTop: 60 },
  sectionHeader: { marginBottom: 24, gap: 8 },
  centeredHeader: { alignItems: 'center' },
  eyebrowBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyebrow: { color: landingTheme.colors.cyan, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  sectionTitle: { color: '#ffffff', fontSize: 26, fontWeight: '800', lineHeight: 32 },
  sectionSubtitle: { color: landingTheme.colors.textSecondary, fontSize: 15, lineHeight: 22, maxWidth: 600 },
  centeredText: { textAlign: 'center' },

  // Grids
  stepsGrid: { gap: 16 },
  stepCard: { flex: 1 },
  stepIndex: { color: landingTheme.colors.textMuted, fontSize: 12, fontWeight: '800' },
  stepIconWrap: { width: 42, height: 42, borderRadius: 10, backgroundColor: 'rgba(0,212,255,0.1)', alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  stepTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  stepText: { color: landingTheme.colors.textSecondary, fontSize: 13, lineHeight: 20 },

  featuresGrid: { gap: 16 },
  featureCard: { flex: 1 },
  featureIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  featureTitle: { color: '#ffffff', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  featureText: { color: landingTheme.colors.textSecondary, fontSize: 13, lineHeight: 20 },

  // Pricing
  pricingToggleRow: { flexDirection: 'row', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 30, marginBottom: 24 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  toggleBtnActive: { backgroundColor: landingTheme.colors.cyan },
  toggleText: { color: landingTheme.colors.textSecondary, fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: '#060913' },
  pricingGrid: { gap: 16 },
  pricingCard: { flex: 1, backgroundColor: 'rgba(13, 20, 36, 0.85)' },
  pricingFeatured: { borderColor: landingTheme.colors.cyan, backgroundColor: 'rgba(0, 212, 255, 0.05)' },
  popularBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: landingTheme.colors.cyan },
  popularBadgeText: { color: '#060913', fontSize: 9, fontWeight: '800' },
  pricingName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  pricingPrice: { color: '#fff', fontSize: 30, fontWeight: '800', marginVertical: 8 },
  pricingCadence: { color: landingTheme.colors.textSecondary, fontSize: 13, fontWeight: '500' },
  pricingDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 16 },
  pricingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  pricingRowText: { color: landingTheme.colors.textSecondary, fontSize: 13 },

  // CTA
  bottomCta: { marginTop: 60, padding: 36, borderRadius: 24, alignItems: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,212,255,0.2)' },
  bottomCtaTitle: { color: '#fff', fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  bottomCtaSub: { color: landingTheme.colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  ctaBtnRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },

  // Footer
  footer: { marginTop: 60, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', alignItems: 'center', gap: 12 },
  footerText: { color: landingTheme.colors.textMuted, fontSize: 12, textAlign: 'center' },
  pulsingDot: { width: 8, height: 8, borderRadius: 4 },
});