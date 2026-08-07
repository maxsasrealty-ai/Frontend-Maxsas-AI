export function resolveApiBaseUrl(fallback = "http://localhost:4000/api"): string {
	const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
	const hasBrowserOrigin = typeof window !== "undefined" && Boolean(window.location?.origin);
	const sameOriginApiBase = hasBrowserOrigin
		? `${window.location.origin.replace(/\/$/, "")}/api`
		: "";

	if (configured) {
		if (!__DEV__ && configured.startsWith("http://") && hasBrowserOrigin) {
			return sameOriginApiBase;
		}

		return configured.replace(/\/$/, "");
	}

	if (__DEV__) {
		return fallback.replace(/\/$/, "");
	}

	if (hasBrowserOrigin) {
		return sameOriginApiBase;
	}

	return "";
}

