import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { RacePredictor } from "./RacePredictor";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(async () => {
  cleanup();
  await i18n.changeLanguage("en");
});

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe("RacePredictor — no predictions (Fix 3)", () => {
  // CA-7: no efforts at all -> the section stays hidden.
  it("renders nothing when there are no efforts", () => {
    const { container } = renderWithI18n(
      <RacePredictor predictions={[]} baseBucket={null} hasEfforts={false} locale="en" />
    );
    expect(container.firstChild).toBeNull();
  });

  // CA-8: efforts exist but none are predictable (e.g. only 42K) -> show the
  // heading plus the noData message instead of vanishing.
  it("renders the heading and noData message when efforts exist but none are predictable", () => {
    renderWithI18n(
      <RacePredictor predictions={[]} baseBucket={null} hasEfforts={true} locale="en" />
    );

    expect(
      screen.getByRole("heading", { name: i18n.t("stats.racePredictor.title") })
    ).toBeTruthy();
    expect(screen.getByText(i18n.t("stats.racePredictor.noData"))).toBeTruthy();
  });

  // i18n: the same no-data state renders the Spanish copy after a language switch.
  it("renders the Spanish noData copy when the language is ES", async () => {
    await i18n.changeLanguage("es");
    renderWithI18n(
      <RacePredictor predictions={[]} baseBucket={null} hasEfforts={true} locale="es" />
    );

    expect(
      screen.getByRole("heading", { name: i18n.t("stats.racePredictor.title") })
    ).toBeTruthy();
    expect(screen.getByText(i18n.t("stats.racePredictor.noData"))).toBeTruthy();
    // Guard against an untranslated key leaking the raw path to the UI.
    expect(screen.queryByText("stats.racePredictor.noData")).toBeNull();
  });
});
