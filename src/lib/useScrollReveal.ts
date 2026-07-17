import { useLayoutEffect, type RefObject } from "react";
import {
  prefersReducedMotion,
  readLengthPx,
  readTimingMs,
} from "./animationTokens";

/**
 * Reveals the below-the-fold sections (BestEfforts, RacePredictor, Eddington
 * and the Training section charts) as they scroll into view, instead of firing
 * them all at load. The above-fold beats are handled by the CSS choreography
 * (`.summit-choreo.is-revealing .summit-beat`); this covers everything under
 * the fold, which sits outside the 1.5s reveal budget.
 *
 * Runs only for an active celebration (CE-1): on cache restore (nonce 0) the
 * sections show immediately with no reveal. Timing and distance come from the
 * `--anim-*` tokens (single source of truth). Under `prefers-reduced-motion`
 * nothing is hidden — content is immediate and usable.
 *
 * Uses the same visual language as the beats (opacity + short translateY) with
 * an IntersectionObserver; only compositor properties are touched.
 */
export function useScrollReveal(
  containerRef: RefObject<HTMLElement | null>,
  celebrateNonce: number
): void {
  useLayoutEffect(() => {
    if (celebrateNonce <= 0) return;
    if (prefersReducedMotion()) return;
    const container = containerRef.current;
    if (!container) return;
    if (typeof IntersectionObserver !== "function") return;

    const duration = readTimingMs("--anim-reveal-duration", 480);
    const distance = readLengthPx("--anim-reveal-distance", 12);

    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("section:not(.summit-beat)")
    );
    if (sections.length === 0) return;

    const clearInline = (el: HTMLElement) => {
      el.style.removeProperty("opacity");
      el.style.removeProperty("transform");
      el.style.removeProperty("transition");
      el.style.removeProperty("will-change");
    };

    for (const el of sections) {
      el.style.opacity = "0";
      el.style.transform = `translateY(${distance}px)`;
      el.style.willChange = "opacity, transform";
    }

    const reveal = (el: HTMLElement) => {
      el.style.transition = `opacity ${duration}ms var(--anim-ease), transform ${duration}ms var(--anim-ease)`;
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      const onEnd = () => {
        clearInline(el);
        el.removeEventListener("transitionend", onEnd);
      };
      el.addEventListener("transitionend", onEnd);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    for (const el of sections) observer.observe(el);

    return () => {
      observer.disconnect();
      for (const el of sections) clearInline(el);
    };
  }, [celebrateNonce, containerRef]);
}
