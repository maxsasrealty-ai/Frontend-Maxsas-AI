# Maxsas Realty AI - System Instructions & Architecture

This globally accessible `instruction.md` file defines the standard operating procedures, architectural boundaries, and design systems for all future features, screens, and edits in the Maxsas Realty AI codebase. It acts as the context boundary for AI agents to prevent regressions and generic UI code.

**As an AI assistant, you MUST read and follow these rules when editing or creating any new Enterpise/Diamond tier pages, dashboards, or shared components.**

---

## 🏗️ 1. Architecture: Web vs Mobile (Expo Router)

We are using **React Native with Expo Router** deployed on both Web and Mobile platforms.

### The Problem with Unified Code
Complex premium web layouts (like split-screens, heavy CSS keyframe animations, and hover states) struggle in unified `.tsx` files because React Native mobile components do not natively support CSS properties like `boxShadow`, `backgroundImage: linear-gradient`, or `:hover`.

### The Rule
For highly complex UI screens (like the Landing Page, Login/Signup, or advanced Dashboard visualizations), **ALWAYS split the files by platform extensions:**
- `[screen].web.tsx` -> For web only. You are allowed to use `div`, injected `<style>` grids, CSS Keyframes (`@keyframes`), and Web-specific inline attributes (`backgroundImage`).
- `[screen].native.tsx` -> For iOS/Android. Strictly use `StyleSheet.create`, native `Animated`, and fallback solid colors instead of advanced CSS.
- `[screen].tsx` -> Use only if the UI is extremely simple and easily compatible across all platforms natively.

---

## 🎨 2. The Design System (Premium AI SaaS)

Do **NOT** use generic styling, plain white backgrounds, or default System fonts for the web frontend.
Maxsas Realty AI utilizes a **Deep Blue/Green Glassmorphism** aesthetic.

### Typography
- **Headings/Display**: `'Syne', sans-serif` (Weights: 400, 600, 700, 800)
- **Body/Inputs**: `'DM Sans', sans-serif` (Weights: 400, 500, 600)
*Always load these via `<link>` injected headers on web, or map them correctly in native wrappers.*

### Color Palette (The "C" Object)
Always map your component styles to these core variables:
```javascript
const C = {
  bg: "#040c18",                 // Core background
  bgDeep: "#050914",             // Darker background
  card: "#0d1f38",               // Raised elements
  cardDark: "#0a1628",           // Depressed/Inner elements
  blue: "#4F8CFF",               // Primary brand accent
  green: "#00D084",              // Success / Conversion accent
  blueAlpha: "rgba(79,140,255,0.15)",
  blueBorder: "rgba(79,140,255,0.25)",
  textPrimary: "#e8edf5",
  textMuted: "rgba(232,237,245,0.55)",
  textFaint: "rgba(232,237,245,0.35)",
  white: "#ffffff",
};
```

### Visual Directives for Web
1. **Margins & Spacing**: Web versions must use `maxWidth: 1240` (or `1024`, `1100`) with `alignSelf: 'center'` to prevent the UI from stretching endlessly on large monitors. Add generous padding (`paddingVertical: 120` for sections, `paddingHorizontal: 40`).
2. **Gradients**: Make heavy use of `backgroundImage: 'linear-gradient(...)'` for buttons, cards, and text (`WebkitBackgroundClip: 'text'`).
3. **Glassmorphism**: Elements should have translucent backgrounds (`rgba(79,140,255,0.1)`), blurred backdrops if possible, and thin colored borders (`borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'`).
4. **Interactive Hover**: Inject `.hover-card { transition: transform 0.3s } .hover-card:hover { transform: translateY(-4px) }` globally and use `className="hover-card"` instead of React state-based hover events to keep the DOM light.

---

## 🧩 3. Responsiveness

Always import and use the custom responsive hook when defining layout structures:
```typescript
import { useResponsive } from "../../hooks/useResponsive";
// ...
const { isDesktop, isTablet, isMobile } = useResponsive();
```
- If `isDesktop` is true, flex direction is usually `'row'`, otherwise `'column'`.
- Never hardcode fixed enormous heights/widths that break on mobile screens. Use `flex: 1` or percentage-based widths where absolute sizes fail.

---

## 🚀 4. Workflow for New Features

Whenever you are asked to create a new page:
1. Identify if it requires a `.web.tsx` override for premium styling.
2. Build the visual skeleton mapping to the `C` color object.
3. Keep the components pure, functional, and devoid of unnecessary re-renders.
4. Ensure text uses `Syne` for titles and `DM Sans` for paragraphs.
5. Validate typography hierarchies (h1 > h2 > h3).
