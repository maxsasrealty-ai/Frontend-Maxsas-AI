import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";

import { resolveApiBaseUrl } from "./base-url";

const originalEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const originalDev = (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;

describe("resolveApiBaseUrl", () => {
	beforeEach(() => {
		process.env.EXPO_PUBLIC_API_BASE_URL = "";
	});

	afterEach(() => {
		process.env.EXPO_PUBLIC_API_BASE_URL = originalEnv;
		Object.defineProperty(globalThis, "__DEV__", {
			value: originalDev,
			configurable: true,
			writable: true,
		});
		Object.defineProperty(globalThis, "window", {
			value: undefined,
			configurable: true,
			writable: true,
		});
	});

	it("uses the configured URL when provided", () => {
		Object.defineProperty(globalThis, "__DEV__", {
			value: false,
			configurable: true,
			writable: true,
		});
		process.env.EXPO_PUBLIC_API_BASE_URL = "https://api.example.com/api/";

		expect(resolveApiBaseUrl()).toBe("https://api.example.com/api");
	});

	it("falls back to same-origin api proxy when production env is insecure http", () => {
		Object.defineProperty(globalThis, "__DEV__", {
			value: false,
			configurable: true,
			writable: true,
		});
		Object.defineProperty(globalThis, "window", {
			value: { location: { origin: "https://maxsas.vercel.app/" } },
			configurable: true,
			writable: true,
		});
		process.env.EXPO_PUBLIC_API_BASE_URL = "http://134.209.157.41:4000/api";

		expect(resolveApiBaseUrl()).toBe("https://maxsas.vercel.app/api");
	});

	it("falls back to localhost in development", () => {
		Object.defineProperty(globalThis, "__DEV__", {
			value: true,
			configurable: true,
			writable: true,
		});

		expect(resolveApiBaseUrl()).toBe("http://localhost:4000/api");
	});

	it("falls back to same-origin api proxy in production web when env is missing", () => {
		Object.defineProperty(globalThis, "__DEV__", {
			value: false,
			configurable: true,
			writable: true,
		});
		Object.defineProperty(globalThis, "window", {
			value: { location: { origin: "https://maxsas.vercel.app/" } },
			configurable: true,
			writable: true,
		});

		expect(resolveApiBaseUrl()).toBe("https://maxsas.vercel.app/api");
	});
});