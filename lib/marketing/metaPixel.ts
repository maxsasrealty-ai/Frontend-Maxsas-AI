import { Platform } from 'react-native';

type PixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

type MetaWindow = Window & {
  fbq?: PixelFunction;
  _fbq?: PixelFunction;
};

const PIXEL_SCRIPT_ID = 'maxsas-meta-pixel';
const pixelId = process.env.EXPO_PUBLIC_META_PIXEL_ID?.trim() || '';
let initialized = false;
const pageViews = new Set<string>();
const viewContents = new Set<string>();

declare const window: MetaWindow;

export function isMetaPixelConfigured(): boolean {
  return Platform.OS === 'web' && Boolean(pixelId);
}

function ensurePixel(): PixelFunction | null {
  if (!isMetaPixelConfigured() || typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  const metaWindow = window;
  if (!metaWindow.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue?.push(args);
      }
    }) as PixelFunction;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    metaWindow.fbq = fbq;
    metaWindow._fbq = fbq;
  }

  const existingScript = document.getElementById(PIXEL_SCRIPT_ID);
  if (!existingScript) {
    if (!document.head) return null;

    const script = document.createElement('script');
    script.id = PIXEL_SCRIPT_ID;
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  if (!initialized) {
    metaWindow.fbq?.('init', pixelId);
    initialized = true;
  }

  return metaWindow.fbq || null;
}

export function trackMetaPageView(pathname: string): void {
  if (pageViews.has(pathname)) return;

  const fbq = ensurePixel();
  if (!fbq) return;

  pageViews.add(pathname);
  fbq('track', 'PageView');
}

export function trackMetaViewContent(parameters: Record<string, unknown>): void {
  const key = 'webinar-landing';
  if (viewContents.has(key)) return;

  const fbq = ensurePixel();
  if (!fbq) return;

  viewContents.add(key);
  fbq('track', 'ViewContent', parameters);
}

export function trackMetaInitiateCheckout(parameters: Record<string, unknown>): void {
  const fbq = ensurePixel();
  if (!fbq) return;

  fbq('track', 'InitiateCheckout', parameters);
}
