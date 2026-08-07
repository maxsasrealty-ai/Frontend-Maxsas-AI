// Re-export LexusIcon component for consistent imports
// Metro bundler resolves .web.tsx and .native.tsx automatically at runtime.
// This file serves as the web-compatible fallback for non-Metro bundlers (e.g. Vercel/Node).
export { default, default as LexusIcon } from './Icon.web';






