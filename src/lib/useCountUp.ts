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
  overlay: HTMLElement;
  format: (n: number) => string;
  value: number;
  ariaHidden: HTMLElement[];
  srNode: HTMLElement;
  done: boolean;
}

/**
 * Count-up for the hero figures (US-2, ADR-003 §1 & §4).
 *
 * The animation runs on a throwaway overlay node that React never owns: a
 * single requestAnimationFrame loop writes `textContent` to that overlay only,
 * so there is zero re-render per tick AND the real value node stays entirely
 * under React's control. The real node is merely hidden (inline `display`)
 * while the overlay counts, then revealed when the loop settles — so the
 * displayed value is always exactly what React rendered from `totals`. A later
 * re-render (e.g. a filter recalculation) updates the hero figure normally,
 * because no imperative code ever detached React's node.
 *
 * Runs only when `celebrateNonce` changes to a positive value (active
 * processing or demo — CE-1). Restoration from cache (nonce 0) and filter
 * recalculations (nonce unchanged) never trigger a count. Under
 * `prefers-reduced-motion` the final value is shown directly (no loop).
 *
 * Accessibility: while counting, the real value node is hidden, the overlay is
 * `aria-hidden`, the unit is `aria-hidden`, and a `.sr-only` node carries the
 * final value, so the reader only ever announces the final figure.
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

      // Overlay layer: React never tracks this node, so the real value node
      // (amount) keeps its React-owned children untouched and always reflects
      // the latest `totals`. The count animates here and is removed on settle.
      const overlay = document.createElement("span");
      overlay.className = "value__amount";
      overlay.setAttribute("aria-hidden", "true");
      overlay.textContent = metric.format(0);
      amount.parentNode?.insertBefore(overlay, amount);
      amount.style.display = "none";

      const ariaHidden: HTMLElement[] = [];
      const unit = node.querySelector<HTMLElement>(".unit");
      if (unit) {
        unit.setAttribute("aria-hidden", "true");
        ariaHidden.push(unit);
      }

      const srNode = document.createElement("span");
      srNode.className = "sr-only";
      srNode.textContent = metric.srText;
      node.appendChild(srNode);

      jobs.push({
        amount,
        overlay,
        format: metric.format,
        value: metric.value,
        ariaHidden,
        srNode,
        done: false,
      });
    }

    if (jobs.length === 0) return;

    const finalize = (job: Job) => {
      if (job.done) return;
      job.done = true;
      job.overlay.remove();
      job.amount.style.display = "";
      for (const el of job.ariaHidden) el.removeAttribute("aria-hidden");
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
        job.overlay.textContent = job.format(job.value * easeOutCubic(progress));
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
