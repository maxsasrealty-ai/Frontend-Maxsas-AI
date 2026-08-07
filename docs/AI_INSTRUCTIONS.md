# MAXSAS REALTY AI - DEVELOPMENT INSTRUCTIONS
*(Mandatory Guidelines for AI Coding Assistants & Developers)*

> **CRITICAL RULE FOR AI:** Always read these instructions before proposing or creating new screens, modifying layouts, or integrating new plans (like Enterprise/Diamond plans). Do NOT reinvent approaches that have already been standardized here.

## 1. Cross-Platform UI & Layout Architecture (Web vs. Native)

Maxsas Realty AI uses a **single codebase** via Expo Router but strictly demands dual-layout functionality. We optimize for high-conversion marketing/SaaS layouts on Web, while retaining highly performant, single-column native layouts on iOS/Android.

*   **Responsive Framework**: 
    *   Do NOT use standard CSS media queries to fix React Native styles.
    *   ALWAYS use the centralized custom hook `import { useResponsive } from "hooks/useResponsive";`. Use the variables `isDesktop`, `isTablet`, and `isMobile` to conditionally render split-panels (like in the Auth screens).
*   **Platform Splitting (.web.tsx vs .native.tsx)**:
    *   If a page relies heavily on web-only Marketing DOM (like landing pages), explicitly split the files into `index.web.tsx` and `index.native.tsx`. 
    *   If using dual extension files, you MUST leave an empty extensionless fallback (`index.tsx`) mapped to native to prevent Metro Bundler routing configuration crashes.
*   **Web SaaS Dashboard Enclosure**:
    *   When building inner Dashboard layouts (like the Lexus interface or future Enterprise tiers), the Web version **must not stretch infinitely across the screen**.
    *   Always wrap `Tabs` or `Stack` layouts with `Platform.OS === 'web'` constraints: `maxWidth: 1024, alignSelf: 'center', width: '100%'`. This guarantees the inner dashboards look like a premium Desktop SaaS on web browsers while staying full-fluid-width on iOS/Android.

## 2. Global Design System & Theming

Do **NOT** invent random new colors or use hardcoded RGBs across new features. The application relies on a premium, dark-mode, glassmorphic aesthetic tailored for AI. 

*   **Core Palette to Reuse**:
    *   **Background (Global)**: `#040c18`
    *   **Background (Cards)**: `#0d1f38`
    *   **Primary Accent (Blue)**: `#4F8CFF`
    *   **Success Accent (Green)**: `#00D084`
    *   **Borders / Accents**: `rgba(79,140,255,0.20)`
*   **Aesthetics**: Apply subtle blur/glass matching on web, maintain rounded aggressive border-radii (e.g., `borderRadius: 22` for cards, `12` for buttons). 
*   **Typography**: Prioritize bold, clean System/Sans-Serif typography without unnecessarily loading external custom TTFs unless dictated by the branding file.

## 3. Expo Routing & Security (Auth Guards)

*   **File-Based Routing Only**: Utilize strictly `expo-router`'s `<Tabs>` or `<Stack>`. Never manually implement older React Navigation configs.
*   **Namespace Segregation**:
    *   `app/(public)`: Logged-out endpoints (Splash, Marketing Web, Login, Signup).
    *   `app/(protected)`: High-value dashboard sections (Lexus, Enterprise, Settings).
*   **Route Navigation**: Always append 'as any' type assertion onto deep link pushes during early TypeScript prototyping if strict mode throws exceptions (e.g. `router.push('/(protected)/lexus' as any);`).

## 4. LiveKit AI Voice Agent Protocol

*   **External Server Execution**: The Voice STT/TTS (Sarvam/Cartesia/Llama) executes entirely remotely on an external DigitalOcean Ubuntu Docker deployment via LiveKit (IP: `157.245.108.130:7880`).
*   **UI Integration**: The Expo Frontend only acts as a thin WebRTC client displaying AI processing states. Do NOT attempt to build heavy LLM processing pipelines via JS directly in the frontend files.

## 5. Premium Tiers (Diamond / Enterprise Upgrades)

When designing screens iterating on leads/campaigns:
*   Always assume a **Feature-Gating** capability natively exists.
*   Basic users should see locked features (e.g., Audio Playback or Full Transcript) obscured by UI overlays referencing instant upgrade CTAs. 
*   Never remove locked UI components dynamically; instead, block interaction with them via overlay views prompting upgrades.
