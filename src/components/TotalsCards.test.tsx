import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { TotalsCards } from "./TotalsCards";

const ZERO_TOTALS = {
  activities: 0,
  distanceKm: 0,
  movingTimeSec: 0,
  elevationGainM: 0,
};

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(cleanup);

function renderTotalsCards(
  firstDate: Date | null,
  lastDate: Date | null,
  locale = "en"
) {
  return render(
    <I18nextProvider i18n={i18n}>
      <TotalsCards
        totals={ZERO_TOTALS}
        locale={locale}
        firstDate={firstDate}
        lastDate={lastDate}
      />
    </I18nextProvider>
  );
}

describe("TotalsCards — date range subtitle", () => {
  it("does not render the date range when both dates are null", () => {
    renderTotalsCards(null, null);
    // No dash separator should appear in a date-range subtitle
    expect(screen.queryByText(/–/)).toBeNull();
  });

  it("renders the date range when first and last differ", () => {
    const first = new Date("2020-01-15");
    const last = new Date("2024-06-20");
    renderTotalsCards(first, last);
    // The subtitle should include both dates joined by an en-dash
    const sub = screen.getByText(/–/);
    expect(sub).toBeTruthy();
  });

  it("renders a single month label when first and last are in the same month", () => {
    const first = new Date("2024-06-01");
    const last = new Date("2024-06-30");
    renderTotalsCards(first, last);
    // When first === last formatted month, show only one label (no dash)
    expect(screen.queryByText(/–/)).toBeNull();
  });
});
