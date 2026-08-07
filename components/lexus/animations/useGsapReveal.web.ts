import { gsap } from "gsap";
import { useEffect } from "react";

interface RevealOptions {
  y?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
}

export function useGsapReveal<T>(
  ref: React.RefObject<T>,
  options: RevealOptions = {}
) {
  useEffect(() => {
    if (!ref.current) return;

    const {
      y = 24,
      opacity = 0,
      duration = 0.7,
      delay = 0,
    } = options;

    gsap.from(ref.current as any, {
      y,
      opacity,
      duration,
      delay,
      ease: "power3.out",
    });
  }, [ref, options]);
}
