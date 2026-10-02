import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { LogBox, Platform, StyleSheet, Text, View } from 'react-native';
import SplashScreen from '../components/landing/SplashScreen';
import { getAppVersionLabel } from '../lib/app-version';
import { bootstrapAuthSession, subscribeAuthSession } from '../lib/auth/session';
import { trackMetaPageView } from '../lib/marketing/metaPixel';
import './global.css';

LogBox.ignoreLogs([
  'useNativeDriver',
  'box-shadow',
  'shadow*',
  'Warning: Invalid DOM property',
]);

export default function RootLayout() {
  const segments = useSegments();
  const pathname = usePathname();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const [showSplash, setShowSplash] = useState(true);
  const splashFinished = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    void bootstrapAuthSession().then((tenantId) => {
      if (!mounted) {
        return;
      }

      setIsAuthenticated(Boolean(tenantId));
      setIsReady(true);
    });

    const unsubscribe = subscribeAuthSession((user) => {
      if (!mounted) {
        return;
      }

      setIsAuthenticated(Boolean(user?.tenantId));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inProtectedGroup = segments[0] === '(protected)';
    const inPublicGroup = segments[0] === '(public)';

    if (!isAuthenticated && inProtectedGroup) {
      router.replace('/(public)/login');
      return;
    }

    if (isAuthenticated && inPublicGroup) {
      router.replace('/(protected)/lexus');
    }
  }, [isAuthenticated, isReady, segments]);

  useEffect(() => {
    if (!isReady || Platform.OS !== 'web') return;

    trackMetaPageView(pathname || '/');
  }, [isReady, pathname]);

  const handleSplashFinish = () => {
    if (splashFinished.current) return;

    splashFinished.current = true;
    setShowSplash(false);
  };

  if (!isReady || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#040c18' }} />;

  // Show splash screen on app startup (both new and logged-in users)
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <View style={styles.root}>
      {/* Force a purely dark document body on Web to prevent edges from flashing white */}
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: 'body { background-color: #02060d; overflow-x: hidden; }' }} />
      )}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#02060d' }, animation: 'fade' }} />
      <View pointerEvents="none" style={styles.versionBadgeWrap}>
        <View style={styles.versionBadge}>
          <View style={styles.versionDot} />
          <Text style={styles.versionBadgeText}>{getAppVersionLabel()}</Text>
        </View>
      </View>
      {showSplash && (
        <View style={styles.splashOverlay} pointerEvents="auto">
          <SplashScreen onFinish={handleSplashFinish} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#02060d',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  versionBadgeWrap: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    zIndex: 900,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(4, 12, 24, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(135, 190, 255, 0.22)',
  },
  versionDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#00d9ff',
  },
  versionBadgeText: {
    color: 'rgba(247, 250, 255, 0.72)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
