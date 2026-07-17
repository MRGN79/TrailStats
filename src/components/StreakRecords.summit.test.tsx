import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { StreakRecords } from "./StreakRecords";
import type { PeriodRecords, StreakStats } from "../lib/types";

function renderStreak(streak: StreakStats, records: PeriodRecords, locale = "en") {
  return render(
    <I18nextProvider i18n={i18n}>
      <StreakRecords streak={streak} records={records} locale={locale} revealIndex={2} />
    </I18nextProvider>
  );
}

/** Cards render in order: current streak, longest streak, [best week], [best month]. */
function cards(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(".card"));
}

const RICH_RECORDS: PeriodRecords = {
  bestWeek: { key: "2026-W10", label: "Mar 2–8, 2026", distanceKm: 85 },
  bestMonth: { key: "2026-03", label: "March 2026", distanceKm: 260 },
};

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => cleanup());

describe("StreakRecords — beat wiring (US-1)", () => {
  it("marks the section as a choreography beat with its index", () => {
    const streak: StreakStats = {
      current: 4,
      longest: 6,
      longestStart: null,
      longestEnd: null,
      isCurrentLongest: true,
    };
    const { container } = renderStreak(streak, RICH_RECORDS);
    const section = container.querySelector("section");
    expect(section?.className).toContain("summit-beat");
    expect((section as HTMLElement).style.getPropertyValue("--beat-index")).toBe("2");
  });
});

describe("StreakRecords — achievement halo (US-3)", () => {
  it("applies the alpenglow achievement treatment to a substantial longest active streak (>= 2 weeks)", () => {
    const streak: StreakStats = {
      current: 5,
      longest: 5,
      longestStart: "2026-01-05",
      longestEnd: "2026-02-08",
      isCurrentLongest: true,
    };
    const { container } = renderStreak(streak, RICH_RECORDS);
    const longestCard = cards(container)[1];
    expect(longestCard.className).toContain("card--achievement");
    // A real (not decorative) accessible name marks it as an achievement to SR.
    const srName = longestCard.querySelector(".sr-only");
    expect(srName?.textContent).toBe(
      i18n.t("summit.a11y.achievement", { label: i18n.t("stats.streak.longest") })
    );
  });

  it("applies the achievement treatment to best week and best month with real distance", () => {
    const streak: StreakStats = {
      current: 3,
      longest: 5,
      longestStart: "2026-01-05",
      longestEnd: "2026-02-08",
      isCurrentLongest: false,
    };
    const { container } = renderStreak(streak, RICH_RECORDS);
    const achievementCards = container.querySelectorAll(".card--achievement");
    // best week + best month (longest is not current → no halo on it).
    expect(achievementCards.length).toBe(2);
  });
});

describe("StreakRecords — dignified degradation (CE-4)", () => {
  it("does NOT halo a longest active streak of a single week (tenue accent instead)", () => {
    const streak: StreakStats = {
      current: 1,
      longest: 1,
      longestStart: "2026-01-05",
      longestEnd: "2026-01-11",
      isCurrentLongest: true,
    };
    const { container } = renderStreak(streak, { bestWeek: null, bestMonth: null });
    const longestCard = cards(container)[1];
    expect(longestCard.className).not.toContain("card--achievement");
    // Keeps the existing lighter accent, not the celebratory halo.
    expect(longestCard.className).toContain("card--longest-active");
    expect(longestCard.querySelector(".sr-only")).toBeNull();
  });

  it("does NOT halo anything when the streak is 0 and there are no records", () => {
    const streak: StreakStats = {
      current: 0,
      longest: 0,
      longestStart: null,
      longestEnd: null,
      isCurrentLongest: false,
    };
    const { container } = renderStreak(streak, { bestWeek: null, bestMonth: null });
    expect(container.querySelectorAll(".card--achievement").length).toBe(0);
    expect(container.querySelectorAll(".sr-only").length).toBe(0);
    // Only the two streak cards render (no records → no record cards).
    expect(cards(container).length).toBe(2);
  });

  it("does NOT halo a best week whose distance is 0", () => {
    const streak: StreakStats = {
      current: 2,
      longest: 2,
      longestStart: "2026-01-05",
      longestEnd: "2026-01-18",
      isCurrentLongest: false,
    };
    const records: PeriodRecords = {
      bestWeek: { key: "w", label: "week", distanceKm: 0 },
      bestMonth: null,
    };
    const { container } = renderStreak(streak, records);
    for (const card of cards(container)) {
      expect(card.className).not.toContain("card--achievement");
    }
  });
});

describe("StreakRecords — i18n (achievement name in ES)", () => {
  it("renders the achievement accessible name in Spanish", async () => {
    await i18n.changeLanguage("es");
    const streak: StreakStats = {
      current: 4,
      longest: 4,
      longestStart: "2026-01-05",
      longestEnd: "2026-02-01",
      isCurrentLongest: true,
    };
    const { container } = renderStreak(streak, RICH_RECORDS, "es");
    const srName = container.querySelector(".card--achievement .sr-only");
    expect(srName?.textContent).toContain("Logro");
  });
});
