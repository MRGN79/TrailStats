import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { CacheBanner } from "./CacheBanner";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => cleanup());

function renderBanner(overrides: Partial<Parameters<typeof CacheBanner>[0]> = {}) {
  const onLoadAnother = vi.fn();
  const onDismiss = vi.fn();
  const props = {
    activityCount: 42,
    latestDate: new Date("2026-03-15T12:00:00Z"),
    locale: "en",
    onLoadAnother,
    onDismiss,
    ...overrides,
  };
  render(
    <I18nextProvider i18n={i18n}>
      <CacheBanner {...props} />
    </I18nextProvider>
  );
  return { onLoadAnother, onDismiss };
}

describe("CacheBanner", () => {
  it("renders the activity count and the formatted latest date (EN)", () => {
    renderBanner({ activityCount: 42, latestDate: new Date("2026-03-15T12:00:00Z"), locale: "en" });

    const banner = screen.getByRole("status");
    const text = banner.textContent ?? "";
    // Count is interpolated into the banner text.
    expect(text).toContain("42");
    // EN medium date format, e.g. "Mar 15, 2026".
    const expected = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
      new Date("2026-03-15T12:00:00Z")
    );
    expect(text).toContain(expected);
    expect(text).toContain("saved activities");
  });

  it("formats the date and copy according to the active locale (ES)", async () => {
    await i18n.changeLanguage("es");
    try {
      renderBanner({ activityCount: 7, latestDate: new Date("2026-03-15T12:00:00Z"), locale: "es" });
      const text = screen.getByRole("status").textContent ?? "";
      const expected = new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(
        new Date("2026-03-15T12:00:00Z")
      );
      expect(text).toContain(expected);
      expect(text).toContain("7");
      // ES banner copy proves no missing key / fallback to EN.
      expect(text).toContain("actividades guardadas");
    } finally {
      await i18n.changeLanguage("en");
    }
  });

  it("calls onDismiss exactly once when the × button is clicked", async () => {
    const user = userEvent.setup();
    const { onDismiss, onLoadAnother } = renderBanner();
    await user.click(screen.getByRole("button", { name: i18n.t("cache.dismiss") }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onLoadAnother).not.toHaveBeenCalled();
  });

  it("calls onLoadAnother exactly once when the load-another button is clicked", async () => {
    const user = userEvent.setup();
    const { onLoadAnother, onDismiss } = renderBanner();
    await user.click(screen.getByRole("button", { name: i18n.t("upload.loadAnother") }));
    expect(onLoadAnother).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("exposes a polite live region via role=status for screen readers", () => {
    renderBanner();
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("renders a count of 1 (singular boundary) without crashing", () => {
    renderBanner({ activityCount: 1 });
    expect(screen.getByRole("status").textContent).toContain("1");
  });
});
