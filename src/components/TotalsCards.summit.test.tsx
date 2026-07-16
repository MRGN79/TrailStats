import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, type RenderResult } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { TotalsCards } from "./TotalsCards";
import { formatDistance, formatDuration, formatNumber } from "../lib/format";
import {
  EARTH_LAP_KM,
  EVEREST_M,
  MARATHON_KM,
  DAY_SEC,
} from "../lib/equivalence";
import type { Totals } from "../lib/types";

// --- requestAnimationFrame harness ---------------------------------------
// useCountUp drives a single rAF loop. We capture the scheduled callbacks so
// the test can step the animation deterministically (jsdom has no real frames).
let frameCbs: FrameRequestCallback[] = [];
const origRaf = window.requestAnimationFrame;
const origCaf = window.cancelAnimationFrame;

function installRaf() {
  frameCbs = [];
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    frameCbs.push(cb);
    return frameCbs.length;
  }) as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = (() => {}) as typeof window.cancelAnimationFrame;
}
function flush(ts: number) {
  const cbs = frameCbs;
  frameCbs = [];
  for (const cb of cbs) cb(ts);
}
function restoreRaf() {
  window.requestAnimationFrame = origRaf;
  window.cancelAnimationFrame = origCaf;
}

// --- matchMedia mock (reduced-motion) ------------------------------------
function mockMatchMedia(reduce: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduce && q.includes("reduce"),
    media: q,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  })) as unknown as typeof window.matchMedia;
}
function clearMatchMedia() {
  // jsdom ships no matchMedia; restore that absence so prefersReducedMotion()
  // falls back to "motion allowed".
  // @ts-expect-error deliberately removing the mock
  delete window.matchMedia;
}

function renderCards(totals: Totals, celebrateNonce = 0, locale = "en") {
  return render(
    <I18nextProvider i18n={i18n}>
      <TotalsCards
        totals={totals}
        locale={locale}
        firstDate={null}
        lastDate={null}
        revealIndex={1}
        celebrateNonce={celebrateNonce}
      />
    </I18nextProvider>
  );
}

/** The four hero cards render in a fixed order: activities, distance, time, elevation. */
function cards(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".card"));
}

const RICH: Totals = {
  activities: 250,
  distanceKm: MARATHON_KM * 34, // ≈ 34 marathons
  movingTimeSec: DAY_SEC * 5, // ≈ 5 days in motion
  elevationGainM: EVEREST_M * 3, // ≈ 3 Everests
};

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

beforeEach(async () => {
  clearMatchMedia();
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  restoreRaf();
  clearMatchMedia();
});

describe("TotalsCards — Summit reveal choreography (US-1 beat wiring)", () => {
  it("marks the section as a choreography beat with its beat index", () => {
    const { container } = renderCards(RICH, 0);
    const section = container.querySelector("section");
    expect(section?.className).toContain("summit-beat");
    expect((section as HTMLElement).style.getPropertyValue("--beat-index")).toBe("1");
  });

  it("tags the four hero figures as count-up targets, calories/HR excluded", () => {
    const rich: Totals = { ...RICH };
    const { container } = renderCards(rich, 0);
    const countupNodes = container.querySelectorAll("[data-countup][data-metric]");
    // activities, distance, time, elevation → exactly four.
    expect(countupNodes.length).toBe(4);
    const metrics = Array.from(countupNodes).map((n) => (n as HTMLElement).dataset.metric);
    expect(metrics.sort()).toEqual(["activities", "distance", "elevation", "movingTime"]);
  });
});

describe("TotalsCards — count-up (US-2, scenario a)", () => {
  it("counts from a hidden node and lands on the exact format.ts value", () => {
    mockMatchMedia(false); // motion allowed
    installRaf();
    const { container } = renderCards(RICH, 1, "en");

    // During the count the animated figure is aria-hidden and a screen-reader
    // node carries the final value (only the final figure is announced).
    const distanceCard = cards(container)[1];
    expect(distanceCard.querySelector(".value--countup [aria-hidden='true']")).toBeTruthy();
    expect(distanceCard.querySelector(".value--countup .sr-only")?.textContent).toContain(
      formatDistance(RICH.distanceKm, "en")
    );

    // Drive the loop to completion.
    flush(16);
    flush(100000);

    // Final frame restores the exact React markup: byte-identical to format.ts.
    const amount = distanceCard.querySelector<HTMLElement>("[data-countup-amount]");
    expect(amount?.textContent).toBe(formatDistance(RICH.distanceKm, "en"));
    // aria-hidden lifted and the sr-only helper removed once settled.
    expect(distanceCard.querySelector(".value--countup [aria-hidden='true']")).toBeNull();
    expect(distanceCard.querySelector(".value--countup .sr-only")).toBeNull();
  });

  it("count-up final values match format.ts for every hero figure", () => {
    mockMatchMedia(false);
    installRaf();
    const { container } = renderCards(RICH, 1, "en");
    flush(16);
    flush(100000);
    const [activities, distance, time, elevation] = cards(container).map((c) =>
      c.querySelector<HTMLElement>("[data-countup-amount]")
    );
    expect(activities?.textContent).toBe(formatNumber(RICH.activities, "en"));
    expect(distance?.textContent).toBe(formatDistance(RICH.distanceKm, "en"));
    expect(time?.textContent).toBe(formatDuration(RICH.movingTimeSec, "en"));
    expect(elevation?.textContent).toBe(formatNumber(RICH.elevationGainM, "en"));
  });
});

describe("TotalsCards — no count-up outside an active celebration (scenarios b & c)", () => {
  it("shows final values directly when celebrateNonce is 0 (cache restore / filter recalc)", () => {
    mockMatchMedia(false);
    installRaf();
    const { container } = renderCards(RICH, 0, "en");
    // No animation was scheduled at all.
    expect(frameCbs.length).toBe(0);
    const distanceCard = cards(container)[1];
    expect(distanceCard.querySelector(".value--countup .sr-only")).toBeNull();
    expect(distanceCard.querySelector(".value--countup [aria-hidden='true']")).toBeNull();
    const amount = distanceCard.querySelector<HTMLElement>("[data-countup-amount]");
    expect(amount?.textContent).toBe(formatDistance(RICH.distanceKm, "en"));
  });

  it("does NOT re-trigger the count-up loop when totals change but the nonce stays the same (CE-6, scenario c)", () => {
    mockMatchMedia(false);
    installRaf();
    // Initial celebration: count and settle.
    const view: RenderResult = renderCards(RICH, 1, "en");
    flush(16);
    flush(100000);
    expect(view.container.querySelector(".value--countup .sr-only")).toBeNull();

    // A filter recalculation: totals change, celebrateNonce unchanged (1).
    frameCbs = [];
    const recalculated: Totals = { ...RICH, distanceKm: MARATHON_KM * 12 };
    view.rerender(
      <I18nextProvider i18n={i18n}>
        <TotalsCards
          totals={recalculated}
          locale="en"
          firstDate={null}
          lastDate={null}
          revealIndex={1}
          celebrateNonce={1}
        />
      </I18nextProvider>
    );

    // The reveal "wow" (count loop) is correctly reserved to the initial reveal:
    // no new frame scheduled, no sr-only helper injected on a filter recalc.
    expect(frameCbs.length).toBe(0);
    expect(view.container.querySelector(".value--countup .sr-only")).toBeNull();
  });

  // CE-6: the count-up animates on a throwaway overlay layer, never on the
  // React-owned value node. After the celebration settles, the real node is
  // revealed unchanged, so a later re-render from a filter change
  // (celebrateNonce unchanged) updates the hero figure normally — it stays
  // consistent with the `.card__equiv` line below it instead of freezing at
  // the celebration-time value.
  it(
    "CE-6: hero figure updates to the recalculated value after a post-celebration filter change",
    () => {
      mockMatchMedia(false);
      installRaf();
      const view: RenderResult = renderCards(RICH, 1, "en");
      flush(16);
      flush(100000);

      const recalculated: Totals = { ...RICH, distanceKm: MARATHON_KM * 12 };
      view.rerender(
        <I18nextProvider i18n={i18n}>
          <TotalsCards
            totals={recalculated}
            locale="en"
            firstDate={null}
            lastDate={null}
            revealIndex={1}
            celebrateNonce={1}
          />
        </I18nextProvider>
      );

      const distanceCard = cards(view.container)[1];
      const amount = distanceCard.querySelector<HTMLElement>("[data-countup-amount]");
      expect(amount?.textContent).toBe(formatDistance(recalculated.distanceKm, "en"));
    }
  );
});

describe("TotalsCards — reduced motion (scenario d, CE-8)", () => {
  it("skips the count loop and shows final values directly", () => {
    mockMatchMedia(true); // prefers-reduced-motion: reduce
    installRaf();
    const { container } = renderCards(RICH, 1, "en");
    // Hook bailed before scheduling any frame.
    expect(frameCbs.length).toBe(0);
    const distanceCard = cards(container)[1];
    expect(distanceCard.querySelector(".value--countup .sr-only")).toBeNull();
    expect(distanceCard.querySelector(".value--countup [aria-hidden='true']")).toBeNull();
    const amount = distanceCard.querySelector<HTMLElement>("[data-countup-amount]");
    expect(amount?.textContent).toBe(formatDistance(RICH.distanceKm, "en"));
  });
});

describe("TotalsCards — zero values (CE-2, CE-3)", () => {
  const ZERO: Totals = { activities: 0, distanceKm: 0, movingTimeSec: 0, elevationGainM: 0 };

  it("shows 0 directly with no count animation even during a celebration", () => {
    mockMatchMedia(false);
    installRaf();
    const { container } = renderCards(ZERO, 1, "en");
    // No job is created for a zero metric → no frame scheduled, no sr helper.
    expect(frameCbs.length).toBe(0);
    for (const card of cards(container)) {
      expect(card.querySelector(".value--countup .sr-only")).toBeNull();
      expect(card.querySelector(".value--countup [aria-hidden='true']")).toBeNull();
    }
    expect(cards(container)[0].querySelector<HTMLElement>("[data-countup-amount]")?.textContent).toBe(
      formatNumber(0, "en")
    );
  });

  it("shows no equivalence for zero figures", () => {
    const { container } = renderCards(ZERO, 0, "en");
    expect(container.querySelectorAll(".card__equiv").length).toBe(0);
  });
});

describe("TotalsCards — human equivalences (US-6, CE-5)", () => {
  it("renders marathons / Everests / days-in-motion in EN, never for activities", async () => {
    await i18n.changeLanguage("en");
    const { container } = renderCards(RICH, 0, "en");
    const equivs = Array.from(container.querySelectorAll(".card__equiv")).map(
      (e) => e.textContent ?? ""
    );
    // Three hero figures have a natural equivalence; activities does not.
    expect(equivs.length).toBe(3);
    expect(equivs.some((t) => /34 marathons/.test(t))).toBe(true);
    expect(equivs.some((t) => /3 Everests climbed/.test(t))).toBe(true);
    expect(equivs.some((t) => /5 full days in motion/.test(t))).toBe(true);
    // The activities card (index 0) never carries an equivalence line.
    expect(cards(container)[0].querySelector(".card__equiv")).toBeNull();
  });

  it("uses singular forms at exactly one (EN)", async () => {
    await i18n.changeLanguage("en");
    const one: Totals = {
      activities: 10,
      distanceKm: MARATHON_KM, // 1 marathon
      movingTimeSec: DAY_SEC, // 1 day
      elevationGainM: EVEREST_M, // 1 Everest
    };
    const { container } = renderCards(one, 0, "en");
    const text = Array.from(container.querySelectorAll(".card__equiv"))
      .map((e) => e.textContent)
      .join(" | ");
    expect(text).toContain("1 marathon");
    expect(text).not.toContain("1 marathons");
    expect(text).toContain("1 Everest climbed");
    expect(text).toContain("1 full day in motion");
  });

  it("reformats equivalences to ES with the +30% expansion wording", async () => {
    await i18n.changeLanguage("es");
    const { container } = renderCards(RICH, 0, "es");
    const text = Array.from(container.querySelectorAll(".card__equiv"))
      .map((e) => e.textContent)
      .join(" | ");
    expect(text).toContain("maratones");
    expect(text).toContain("ascensos al Everest");
    expect(text).toContain("días completos en movimiento");
  });

  it("prefers laps around the Earth over marathons for huge distances", async () => {
    await i18n.changeLanguage("en");
    const huge: Totals = { ...RICH, distanceKm: EARTH_LAP_KM * 2 };
    const { container } = renderCards(huge, 0, "en");
    const text = Array.from(container.querySelectorAll(".card__equiv"))
      .map((e) => e.textContent)
      .join(" | ");
    expect(text).toContain("laps around the Earth");
    expect(text).not.toContain("marathons");
  });

  it("hides equivalences that would round below 1 (CE-5)", async () => {
    await i18n.changeLanguage("en");
    const small: Totals = {
      activities: 3,
      distanceKm: 21, // < 1 marathon
      movingTimeSec: 3600, // < 1 day
      elevationGainM: 500, // << 1 Everest
    };
    const { container } = renderCards(small, 0, "en");
    expect(container.querySelectorAll(".card__equiv").length).toBe(0);
  });
});
