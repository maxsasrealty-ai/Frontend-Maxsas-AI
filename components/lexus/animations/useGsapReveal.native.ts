import { useEffect } from "react";

interface RevealOptions {
  y?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
}

export function useGsapReveal<T>(_: React.RefObject<T>, __: RevealOptions = {}) {
  useEffect(() => {
    // GSAP is web-only; native uses static layout for now.
  }, []);
}
