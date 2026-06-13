import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { PaceZones } from "./PaceZones";
import { EddingtonCards } from "./EddingtonCards";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => cleanup());

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe("PaceZones — no-data state", () => {
  it("renders the section with the noData message when zones === null", () => {
    renderWithI18n(<PaceZones zones={null} locale="en" />);

    // The section heading still renders so the user keeps context.
    expect(
      screen.getByRole("heading", { name: i18n.t("stats.paceZones.title") })
    ).toBeTruthy();
    // The previously-unused noData copy is now shown.
    expect(screen.getByText(i18n.t("stats.paceZones.noData"))).toBeTruthy();
  });
});

describe("EddingtonCards — no-data state", () => {
  it("renders the section with the noData message when stats === []", () => {
    renderWithI18n(<EddingtonCards stats={[]} locale="en" />);

    expect(
      screen.getByRole("heading", { name: i18n.t("stats.eddington.title") })
    ).toBeTruthy();
    expect(screen.getByText(i18n.t("stats.eddington.noData"))).toBeTruthy();
  });
});
