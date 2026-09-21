const LOCAL_API_BASE_URL = "http://localhost:4000/api";
const DEPLOYED_API_BASE_URL = "https://backend-maxsas-ai.onrender.com/api";

export function resolveApiBaseUrl(fallback = __DEV__ ? LOCAL_API_BASE_URL : DEPLOYED_API_BASE_URL): string {
	const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

	if (configured) {
		return configured.replace(/\/$/, "");
	}

	return fallback.replace(/\/$/, "");
}

export function resolveBackendOrigin(): string {
	return resolveApiBaseUrl().replace(/\/api\/?$/, "");
}

