const LOCAL_API_BASE_URL = "http://localhost:4000/api";
const DEPLOYED_API_BASE_URL = "http://135.125.222.22:4000/api";
const DEPLOYED_WEB_API_BASE_URL = "/api";

export function resolveApiBaseUrl(fallback = __DEV__ ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL): string {
	const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
	const isProductionWeb = !__DEV__ && typeof window !== "undefined";

	if (isProductionWeb) {
		return DEPLOYED_WEB_API_BASE_URL;
	}

	if (configured) {
		return configured.replace(/\/$/, "");
	}

	return fallback.replace(/\/$/, "");
}

export function resolveBackendOrigin(): string {
	return resolveApiBaseUrl().replace(/\/api\/?$/, "");
}

