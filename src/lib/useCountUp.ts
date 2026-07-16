import { useLayoutEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion, readTimingMs } from "./animationTokens";

export interface CountUpMetric {
  /** Final numeric target (raw units: count, km, seconds, meters…). */
  value: number;
  /** Formats an interpolated value in the active locale (same fns as the final render). */
  format: (n: number) => string;
  /** Screen-reader text with the final value, announced while the visual counts. */
  srText: string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

interface Job {
  amount: HTMLElement;
  savedHTML: string;
  format: (n: number) => string;
  value: number;
  hidden: HTMLElement[];
  srNode: HTMLElement;
  done: boolean;
}

/**
 * Count-up for the hero figures (US-2, ADR-003 §1 & §4).
 *
 * A single requestAnimationFrame loop writes `textContent` through the DOM —
 * never React state, so there is zero re-render per tick. The final frame
 * restores the exact React-rendered markup (integer + `.value__frac`) so the
 * displayed value is byte-identical to the non-animated render.
 *
 * Runs only when `celebrateNonce` changes to a positive value (active
 * processing or demo — CE-1). Restoration from cache (nonce 0) and filter
 * recalculations (nonce unchanged) never trigger a count. Under
 * `prefers-reduced-motion` the final value is shown directly (no loop).
 *
 * Accessibility: while counting, the visual number and its unit are
 * `aria-hidden` and a `.sr-only` node carries the final value, so the reader
 * only ever announces the final figure.
 */
export function useCountUp(
  containerRef: RefObject<HTMLElement | null>,
  metrics: Record<string, CountUpMetric>,
  celebrateNonce: number
): void {
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useLayoutEffect(() => {
    if (celebrateNonce <= 0) return;
    if (prefersReducedMotion()) return;
    const container = containerRef.current;
    if (!container) return;

    const duration = readTimingMs("--anim-countup-duration", 1100);
    const delay = readTimingMs("--anim-countup-delay", 120);
    if (duration <= 0) return;

    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-countup][data-metric]")
    );

    const jobs: Job[] = [];
    for (const node of nodes) {
      const metricKey = node.dataset.metric;
      const metric = metricKey ? metricsRef.current[metricKey] : undefined;
      if (!metric || metric.value <= 0) continue; // CE-3: 0 shows directly, no count

      const amount =
        node.querySelector<HTMLElement>("[data-countup-amount]") ?? node;
      const savedHTML = amount.innerHTML;

      const hidden: HTMLElement[] = [amount];
      const unit = node.querySelector<HTMLElement>(".unit");
      if (unit) hidden.push(unit);
      for (const el of hidden) el.setAttribute("aria-hidden", "true");

      const srNode = document.createElement("span");
      srNode.className = "sr-only";
      srNode.textContent = metric.srText;
      node.appendChild(srNode);

      amount.textContent = metric.format(0);
      jobs.push({
        amount,
        savedHTML,
        format: metric.format,
        value: metric.value,
        hidden,
        srNode,
        done: false,
      });
    }

    if (jobs.length === 0) return;

    const finalize = (job: Job) => {
      if (job.done) return;
      job.done = true;
      job.amount.innerHTML = job.savedHTML;
      for (const el of job.hidden) el.removeAttribute("aria-hidden");
      job.srNode.remove();
    };

    let raf = 0;
    let startTs = 0;
    const tick = (ts: number) => {
      if (startTs === 0) startTs = ts;
      const elapsed = ts - startTs;
      let allDone = true;
      for (const job of jobs) {
        if (job.done) continue;
        if (elapsed < delay) {
          allDone = false;
          continue;
        }
        const progress = Math.min(1, (elapsed - delay) / duration);
        if (progress >= 1) {
          finalize(job);
          continue;
        }
        allDone = false;
        job.amount.textContent = job.format(job.value * easeOutCubic(progress));
      }
      if (!allDone) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      for (const job of jobs) finalize(job);
    };
  }, [celebrateNonce, containerRef]);
}
