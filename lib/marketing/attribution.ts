export type WebinarAttribution = {
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

const STORAGE_KEY = 'maxsas_webinar_attribution';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function clean(value: unknown): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? normalized : undefined;
}

function readCookie(name: string): string | undefined {
  if (!isBrowser()) return undefined;

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!cookie) return undefined;

  try {
    return clean(decodeURIComponent(cookie.slice(prefix.length)));
  } catch {
    return undefined;
  }
}

function writeCookie(name: string, value: string): void {
  if (!isBrowser()) return;

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

function readStored(): WebinarAttribution {
  if (!isBrowser()) return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed as WebinarAttribution : {};
  } catch {
    return {};
  }
}

function persist(attribution: WebinarAttribution): void {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Attribution remains available from the current URL/cookies.
  }
}

export function captureWebinarAttribution(): WebinarAttribution {
  if (!isBrowser()) return {};

  const stored = readStored();
  const query = new URLSearchParams(window.location.search);
  const fbclid = clean(query.get('fbclid')) || clean(stored.fbclid);
  const fbp = readCookie('_fbp') || clean(stored.fbp);
  const existingFbc = readCookie('_fbc') || clean(stored.fbc);
  const fbc = existingFbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);
  const attribution: WebinarAttribution = {
    fbclid,
    fbp,
    fbc,
    utmSource: clean(query.get('utm_source')) || clean(stored.utmSource),
    utmMedium: clean(query.get('utm_medium')) || clean(stored.utmMedium),
    utmCampaign: clean(query.get('utm_campaign')) || clean(stored.utmCampaign),
    utmContent: clean(query.get('utm_content')) || clean(stored.utmContent),
    utmTerm: clean(query.get('utm_term')) || clean(stored.utmTerm),
  };

  if (attribution.fbc && !existingFbc) writeCookie('_fbc', attribution.fbc);
  persist(attribution);
  return attribution;
}

export function getWebinarAttribution(): WebinarAttribution {
  return captureWebinarAttribution();
}
