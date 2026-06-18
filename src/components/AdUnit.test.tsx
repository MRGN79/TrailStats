import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { AdUnit } from "./AdUnit";

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function renderUnit(props: Partial<Parameters<typeof AdUnit>[0]> & { slot: string; consent: boolean }) {
  const { container } = render(
    <I18nextProvider i18n={i18n}>
      <AdUnit {...props} />
    </I18nextProvider>
  );
  return container;
}

describe("AdUnit — null paths", () => {
  it("returns null when VITE_ADSENSE_PUBLISHER_ID is empty", () => {
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", "");
    const container = renderUnit({ slot: "1234567890", consent: true });
    expect(container.firstChild).toBeNull();
  });

  it("returns null when slot is empty even if publisher ID is set", () => {
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", "ca-pub-test");
    const container = renderUnit({ slot: "", consent: true });
    expect(container.firstChild).toBeNull();
  });

  it("returns null when consent is false even if publisher ID and slot are set", () => {
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", "ca-pub-test");
    const container = renderUnit({ slot: "1234567890", consent: false });
    expect(container.firstChild).toBeNull();
  });
});

describe("AdUnit — render path", () => {
  it("renders ins.adsbygoogle with correct data-ad-client and data-ad-slot", () => {
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", "ca-pub-test123");
    const container = renderUnit({ slot: "9876543210", consent: true });
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).not.toBeNull();
    expect(ins?.getAttribute("data-ad-client")).toBe("ca-pub-test123");
    expect(ins?.getAttribute("data-ad-slot")).toBe("9876543210");
  });

  it("defaults data-ad-format to auto", () => {
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", "ca-pub-test123");
    const container = renderUnit({ slot: "9876543210", consent: true });
    expect(container.querySelector("ins")?.getAttribute("data-ad-format")).toBe("auto");
  });

  it("passes custom format to ins element", () => {
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", "ca-pub-test123");
    const container = renderUnit({ slot: "9876543210", consent: true, format: "horizontal" });
    expect(container.querySelector("ins")?.getAttribute("data-ad-format")).toBe("horizontal");
  });

  it("wrapper has role=complementary and aria-label for screen readers", () => {
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", "ca-pub-test123");
    const container = renderUnit({ slot: "9876543210", consent: true });
    const wrapper = container.querySelector("[role='complementary']");
    expect(wrapper).not.toBeNull();
    expect(wrapper?.getAttribute("aria-label")).toBe("Advertisement");
  });

  it("applies extra className to wrapper", () => {
    vi.stubEnv("VITE_ADSENSE_PUBLISHER_ID", "ca-pub-test123");
    const container = renderUnit({ slot: "9876543210", consent: true, className: "ad-unit--between-sections" });
    expect(container.querySelector(".ad-unit--between-sections")).not.toBeNull();
  });
});

describe("ConsentBanner", () => {
  it("calls onAccept when accept button is clicked", async () => {
    const { ConsentBanner } = await import("./ConsentBanner");
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const user = userEvent.setup();
    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <ConsentBanner onAccept={onAccept} onReject={onReject} />
      </I18nextProvider>
    );
    await user.click(getByRole("button", { name: i18n.t("consent.accept") }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onReject).not.toHaveBeenCalled();
  });

  it("calls onReject when reject button is clicked", async () => {
    const { ConsentBanner } = await import("./ConsentBanner");
    const onAccept = vi.fn();
    const onReject = vi.fn();
    const user = userEvent.setup();
    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <ConsentBanner onAccept={onAccept} onReject={onReject} />
      </I18nextProvider>
    );
    await user.click(getByRole("button", { name: i18n.t("consent.reject") }));
    expect(onReject).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("is a dialog with accessible label", async () => {
    const { ConsentBanner } = await import("./ConsentBanner");
    const { getByRole } = render(
      <I18nextProvider i18n={i18n}>
        <ConsentBanner onAccept={vi.fn()} onReject={vi.fn()} />
      </I18nextProvider>
    );
    const dialog = getByRole("dialog");
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute("aria-label")).toBe(i18n.t("consent.ariaLabel"));
  });
});
